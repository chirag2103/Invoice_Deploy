/**
 * Creates the indexes added in the Phase 2 scalability pass. Idempotent —
 * `createIndex` is a no-op if an identical index already exists.
 *
 * In production `autoIndex` is disabled (config/database.js), so these must
 * be created explicitly rather than relying on Mongoose building them lazily
 * on first connect.
 */

const INDEX_PLAN = [
  { collection: 'invoices', keys: { user: 1, date: -1 } },
  { collection: 'invoices', keys: { user: 1, customer: 1, date: 1 } },
  { collection: 'quotations', keys: { user: 1, date: -1 } },
  { collection: 'proformainvoices', keys: { user: 1, date: -1 } },
  { collection: 'proformainvoices', keys: { user: 1, customer: 1, date: 1 } },
  { collection: 'purchaseorders', keys: { user: 1, date: -1 } },
  { collection: 'purchaseorders', keys: { user: 1, seller: 1, date: 1 } },
  { collection: 'challans', keys: { user: 1, challanDate: -1 } },
  {
    collection: 'challans',
    keys: { user: 1, customer: 1, challanDate: 1 },
  },
  { collection: 'payments', keys: { user: 1, date: 1 } },
  { collection: 'payments', keys: { user: 1, customer: 1, date: 1 } },
  { collection: 'purchasepayments', keys: { user: 1, date: 1 } },
  { collection: 'purchasepayments', keys: { user: 1, seller: 1, date: 1 } },
  { collection: 'purchaseinvoices_new', keys: { user: 1, date: -1 } },
  {
    collection: 'purchaseinvoices_new',
    keys: { user: 1, seller: 1, date: 1 },
  },
  { collection: 'customers', keys: { user: 1, name: 1 } },
];

export const up = async (db) => {
  for (const { collection, keys } of INDEX_PLAN) {
    await db.collection(collection).createIndex(keys);
  }
};

export const down = async (db) => {
  for (const { collection, keys } of INDEX_PLAN) {
    try {
      await db.collection(collection).dropIndex(keys);
    } catch (err) {
      // Index may not exist (e.g. collection never had any documents) — fine.
      if (err.codeName !== 'IndexNotFound') {
        throw err;
      }
    }
  }
};
