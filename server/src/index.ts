import dotenv from 'dotenv';
import app from './app';
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';
import logger from './utils/logger';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;

/**
 * Start the server
 */
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDatabase();
    logger.info('Database connection established');

    // Connect to Redis (optional - won't block server startup)
    try {
      await connectRedis();
      logger.info('Redis connection established');
    } catch (redisError) {
      logger.warn('Redis connection failed - continuing without Redis:', redisError);
    }

    // Start Express server - bind to 0.0.0.0 to accept external connections
    const server = app.listen(Number(PORT), '0.0.0.0', () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`API endpoints available at http://0.0.0.0:${PORT}/api/v1`);
      if (process.env.NODE_ENV === 'production' && process.env.API_URL) {
        logger.info(`Public URL: ${process.env.API_URL}`);
      }
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle SIGTERM gracefully
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

// Start the server
startServer();
