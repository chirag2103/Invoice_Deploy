/**
 * `{ timestamps: true }` was just added to several models. Existing documents
 * have no `createdAt`/`updatedAt` — backfill both so nothing reads as `null`.
 * Uses the document's own business date when available (more meaningful for
 * historical records than the migration run time), otherwise the timestamp
 * embedded in the Mongo ObjectId.
 */
const TARGETS = [
  { collection: 'invoices', dateField: 'date' },
  { collection: 'quotations', dateField: 'date' },
  { collection: 'proformainvoices', dateField: 'date' },
  { collection: 'purchaseorders', dateField: 'date' },
  { collection: 'challans', dateField: 'challanDate' },
  { collection: 'payments', dateField: 'date' },
  { collection: 'purchasepayments', dateField: 'date' },
  { collection: 'customers', dateField: null },
];

export const up = async (db) => {
  for (const { collection, dateField } of TARGETS) {
    const cursor = db
      .collection(collection)
      .find({ createdAt: { $exists: false } });

    const docs = await cursor.toArray();
    let updated = 0;

    for (const doc of docs) {
      const businessDate = dateField ? doc[dateField] : null;
      const timestamp =
        businessDate && !Number.isNaN(new Date(businessDate).getTime())
          ? new Date(businessDate)
          : doc._id.getTimestamp();

      await db.collection(collection).updateOne(
        { _id: doc._id },
        { $set: { createdAt: timestamp, updatedAt: timestamp } }
      );
      updated += 1;
    }

    console.log(
      `[migration] ${collection}: backfilled timestamps on ${updated} doc(s)`
    );
  }
};

export const down = async () => {
  // Irreversible by design — see 20260924000002-backfill-financial-year.js.
};
