import { getFinancialYearInfo } from '../utils/financialYear.js';

/**
 * Legacy documents created before financial-year numbering was added have no
 * `financialYearStart`/`financialYearLabel`. Backfill both from their date
 * field so they show up in FY filters and the FY-scoped indexes.
 *
 * Additive only — never touches numbering, totals, or any other field.
 *
 * Some collections have pre-existing duplicate documents sharing the same
 * number (identical content, created seconds apart — almost certainly
 * accidental duplicate submissions, not this migration's concern to resolve).
 * Backfilling those would violate the `{user, financialYearStart, <no>}`
 * unique index. Rather than abort the whole migration on the first such
 * collision, each document is backfilled independently: a doc that would
 * collide is left untouched and reported in a manual-review list at the end,
 * everything else proceeds normally.
 */
const TARGETS = [
  { collection: 'invoices', dateField: 'date', numberField: 'invoiceNo' },
  { collection: 'quotations', dateField: 'date', numberField: 'quoteNo' },
  {
    collection: 'proformainvoices',
    dateField: 'date',
    numberField: 'proformaNo',
  },
  { collection: 'purchaseorders', dateField: 'date', numberField: 'poNo' },
  { collection: 'challans', dateField: 'challanDate', numberField: 'challanNo' },
];

export const up = async (db) => {
  const needsReview = [];

  for (const { collection, dateField, numberField } of TARGETS) {
    const cursor = db.collection(collection).find({
      $or: [
        { financialYearLabel: { $exists: false } },
        { financialYearLabel: null },
        { financialYearLabel: '' },
      ],
    });

    const docs = await cursor.toArray();
    let updated = 0;
    let skipped = 0;

    for (const doc of docs) {
      const dateValue = doc[dateField];
      if (!dateValue) continue; // nothing to derive from

      const { financialYearStart, financialYearLabel } =
        getFinancialYearInfo(dateValue);

      const collision = await db.collection(collection).findOne({
        _id: { $ne: doc._id },
        user: doc.user,
        financialYearStart,
        [numberField]: doc[numberField],
      });

      if (collision) {
        skipped += 1;
        needsReview.push({
          collection,
          id: doc._id.toString(),
          collidesWith: collision._id.toString(),
          user: doc.user?.toString(),
          [numberField]: doc[numberField],
          wouldBeFinancialYearLabel: financialYearLabel,
        });
        continue;
      }

      await db
        .collection(collection)
        .updateOne(
          { _id: doc._id },
          { $set: { financialYearStart, financialYearLabel } }
        );
      updated += 1;
    }

    console.log(
      `[migration] ${collection}: backfilled FY on ${updated} doc(s)` +
        (skipped ? `, skipped ${skipped} (numbering collision)` : '')
    );
  }

  if (needsReview.length) {
    console.warn(
      `\n[migration] MANUAL REVIEW NEEDED — ${needsReview.length} document(s) ` +
        `left without a financial year because backfilling would collide with ` +
        `another document that already has the same number for that year ` +
        `(most look like accidental duplicate submissions). Not modified:\n` +
        JSON.stringify(needsReview, null, 2)
    );
  }
};

export const down = async () => {
  // Intentionally irreversible: we can't tell which financialYearLabel values
  // were backfilled vs. originally present. Backfilling was additive/safe;
  // no rollback needed.
};
