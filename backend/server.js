import config from './config/index.js';
import connectDb from './config/database.js';
import app from './app.js';

process.on('uncaughtException', (err) => {
  // eslint-disable-next-line no-console
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

let server;

const start = async () => {
  await connectDb();

  server = app.listen(config.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on port ${config.PORT} (${config.NODE_ENV})`);
  });
};

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start server:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  // eslint-disable-next-line no-console
  console.error('Unhandled Rejection:', reason);
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

const shutdown = (signal) => {
  // eslint-disable-next-line no-console
  console.log(`${signal} received, shutting down gracefully`);
  if (server) {
    server.close(() => process.exit(0));
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
