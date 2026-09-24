import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { z } from 'zod';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load config.env relative to this file (not the process CWD) so the app can be
// started from any directory.
dotenv.config({ path: path.join(__dirname, 'config.env') });

const numeric = (fallback) =>
  z
    .preprocess(
      (v) => (v === undefined || v === '' ? fallback : Number(v)),
      z.number()
    )
    .optional();

const schema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: numeric(4000),
  MONGOURI: z.string().min(1, 'MONGOURI is required'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  JWT_EXPIRE: z.string().default('5d'),
  COOKIE_EXPIRE: numeric(5),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  // Comma-separated allow-list of browser origins permitted to call the API.
  // When unset, the API reflects the request origin (permissive) and logs a
  // warning — set this in production to lock CORS down.
  CORS_ORIGINS: z.string().optional(),
  SMPT_HOST: z.string().optional(),
  SMPT_PORT: numeric(465),
  SMPT_SERVICE: z.string().optional(),
  SMPT_MAIL: z.string().optional(),
  SMPT_PASSWORD: z.string().optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
    .join('\n');
  // eslint-disable-next-line no-console
  console.error(`\nInvalid environment configuration:\n${issues}\n`);
  process.exit(1);
}

const config = parsed.data;

config.isProd = config.NODE_ENV === 'production';
config.isTest = config.NODE_ENV === 'test';

config.corsOrigins = config.CORS_ORIGINS
  ? config.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
  : null;

// Transactions require a replica set / mongos. Atlas provides one; a bare local
// mongod does not. Default on in production, overridable via SESSIONS_ENABLED.
config.sessionsEnabled =
  process.env.SESSIONS_ENABLED !== undefined
    ? process.env.SESSIONS_ENABLED === 'true'
    : config.isProd;

if (!config.isTest && config.JWT_SECRET.length < 32) {
  // eslint-disable-next-line no-console
  console.warn(
    '[config] JWT_SECRET is shorter than 32 characters — rotate it to a long random value.'
  );
}

if (!config.corsOrigins && config.isProd) {
  // eslint-disable-next-line no-console
  console.warn(
    '[config] CORS_ORIGINS is not set — CORS is permissive. Set it to your frontend origin(s) in production.'
  );
}

export default config;
