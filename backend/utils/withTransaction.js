import mongoose from 'mongoose';
import config from '../config/index.js';

/**
 * Run `fn(session)` inside a MongoDB transaction when sessions are available
 * (replica set / Atlas). On a bare local mongod, fall back to running `fn(null)`
 * with no transaction so development still works.
 *
 * `session.withTransaction` already retries `TransientTransactionError` /
 * `UnknownTransactionCommitResult` internally.
 */
export const withTransaction = async (fn) => {
  if (!config.sessionsEnabled) {
    return fn(null);
  }

  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
};

export default withTransaction;
