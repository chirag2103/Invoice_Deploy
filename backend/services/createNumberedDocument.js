import withTransaction from '../utils/withTransaction.js';
import { getNextDocumentNumber } from '../utils/financialYear.js';

/**
 * Allocate the next document number and create the document in a single
 * transaction, so a failed insert never burns a number. Retries on a
 * duplicate-key race against the per-user/FY unique index.
 *
 * @param {object}   opts
 * @param {import('mongoose').Model} opts.Model
 * @param {string}   opts.userId
 * @param {string}   opts.documentType   one of the DocumentSequence enum values
 * @param {Date|string} opts.dateInput   document date (drives the financial year)
 * @param {(args: { numbering: object }) => object} opts.buildDoc
 *        returns the plain object to insert (server-owned fields already set)
 */
export const createNumberedDocument = async ({
  Model,
  userId,
  documentType,
  dateInput,
  buildDoc,
}) => {
  const MAX_ATTEMPTS = 3;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      return await withTransaction(async (session) => {
        const numbering = await getNextDocumentNumber(
          userId,
          documentType,
          dateInput,
          session
        );
        const payload = buildDoc({ numbering });
        const [created] = await Model.create([payload], { session });
        return created;
      });
    } catch (err) {
      if (err && err.code === 11000 && attempt < MAX_ATTEMPTS) {
        continue;
      }
      throw err;
    }
  }

  throw new Error('Unable to allocate a document number, please retry.');
};

export default createNumberedDocument;
