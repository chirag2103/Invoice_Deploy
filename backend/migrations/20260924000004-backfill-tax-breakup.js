import computeDocumentTotals from '../services/documentTotals.js';

/**
 * `taxBreakup` (CGST/SGST/IGST/round-off) is a new field, added after Phase 1
 * started recomputing it server-side on every create/update. Historical
 * documents saved before that change have no `taxBreakup`.
 *
 * This migration ONLY adds the new field — it recomputes totals from the
 * document's own stored line items purely to populate `taxBreakup`, and NEVER
 * writes to `invoiceTotal` / `grandTotal`. Any document whose recomputed
 * grand total differs from what's already stored by more than ₹1 is logged
 * to the console as a variance for a human to review manually; it is not
 * auto-corrected.
 */
const TARGETS = [
  { collection: 'invoices', productsField: 'invoiceProducts' },
  { collection: 'quotations', productsField: 'quotationProducts' },
  { collection: 'proformainvoices', productsField: 'proformaProducts' },
  { collection: 'purchaseorders', productsField: 'poProducts' },
];

export const up = async (db) => {
  const variances = [];

  for (const { collection, productsField } of TARGETS) {
    const cursor = db.collection(collection).find({ taxBreakup: { $exists: false } });
    const docs = await cursor.toArray();
    let updated = 0;

    for (const doc of docs) {
      const totals = computeDocumentTotals({
        products: doc[productsField] || [],
        invoiceDiscount: doc.invoiceDiscount || 0,
        gst: doc.gst || 0,
        gstType: doc.gstType || 'intraState',
      });

      const storedGrandTotal = Number(doc.grandTotal) || 0;
      const variance = Math.abs(storedGrandTotal - totals.grandTotal);
      if (variance > 1) {
        variances.push({
          collection,
          id: doc._id.toString(),
          stored: storedGrandTotal,
          recomputed: totals.grandTotal,
          variance,
        });
      }

      await db
        .collection(collection)
        .updateOne({ _id: doc._id }, { $set: { taxBreakup: totals.taxBreakup } });
      updated += 1;
    }

    console.log(`[migration] ${collection}: added taxBreakup on ${updated} doc(s)`);
  }

  if (variances.length) {
    console.warn(
      `\n[migration] VARIANCE REPORT — ${variances.length} document(s) where the ` +
        `stored grandTotal differs from a fresh recompute by more than ₹1. ` +
        `Neither field was changed; review manually:\n` +
        JSON.stringify(variances, null, 2)
    );
  }
};

export const down = async (db) => {
  for (const { collection } of TARGETS) {
    await db.collection(collection).updateMany({}, { $unset: { taxBreakup: '' } });
  }
};
