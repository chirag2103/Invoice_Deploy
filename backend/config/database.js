import mongoose from 'mongoose';
import config from './index.js';

mongoose.set('strictQuery', true);

const CONNECT_OPTIONS = {
  serverSelectionTimeoutMS: 10_000,
  socketTimeoutMS: 45_000,
  maxPoolSize: 20,
  minPoolSize: 2,
  // Building indexes automatically is convenient in dev but risky under load in
  // production — there indexes are applied explicitly (migrations / syncIndexes).
  autoIndex: !config.isProd,
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const connectDb = async ({ retries = 5, delayMs = 3000 } = {}) => {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const conn = await mongoose.connect(config.MONGOURI, CONNECT_OPTIONS);
      // eslint-disable-next-line no-console
      console.log(`MongoDB connected: ${conn.connection.host}`);

      mongoose.connection.on('error', (err) => {
        // eslint-disable-next-line no-console
        console.error('[mongo] connection error:', err.message);
      });
      mongoose.connection.on('disconnected', () => {
        // eslint-disable-next-line no-console
        console.warn('[mongo] disconnected');
      });

      return conn;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(
        `[mongo] connection attempt ${attempt}/${retries} failed: ${err.message}`
      );
      if (attempt === retries) {
        throw err;
      }
      await wait(delayMs);
    }
  }
};

export default connectDb;
