import dotenv from 'dotenv';
import cluster from 'cluster';
import os from 'os';
import connectDb from './config/database.js';
import app from './app.js';

// Load env vars before anything else
dotenv.config({ path: './config/config.env' });

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET', 'JWT_EXPIRE', 'MONGOURI', 'NODE_ENV'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Error: ${envVar} is not set in environment variables`);
    process.exit(1);
  }
}

const port = process.env.PORT || 4000;

// Only use clustering in production
if (process.env.NODE_ENV === 'production' && cluster.isMaster) {
  const numCPUs = os.cpus().length;

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork();
  });
} else {
  const startServer = async () => {
    try {
      // Connect to database
      await connectDb();

      // Handle uncaught exceptions
      process.on('uncaughtException', (err) => {
        console.log(`Error: ${err.message}`);
        console.log('Shutting down the server due to Uncaught Exception');
        process.exit(1);
      });

      // Start server
      const server = app.listen(port, () => {
        console.log(
          `Server running in ${process.env.NODE_ENV} mode on port ${port}`
        );
      });

      // Handle unhandled promise rejections
      process.on('unhandledRejection', (err) => {
        console.log(`Error: ${err.message}`);
        console.log(
          'Shutting down the server due to Unhandled Promise rejection'
        );
        server.close(() => {
          process.exit(1);
        });
      });
    } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  };

  startServer();
}
