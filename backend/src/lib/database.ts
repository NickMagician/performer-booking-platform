import { PrismaClient } from '@prisma/client';
import { config } from '../config';

// Global variable to store Prisma client instance
declare global {
  var __prisma: PrismaClient | undefined;
}

// Create Prisma client with appropriate configuration
const createPrismaClient = () => {
  return new PrismaClient({
    log: config.isDevelopment ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'pretty',
  });
};

// Use global variable in development to prevent multiple instances
// due to hot reloading
export const prisma = globalThis.__prisma || createPrismaClient();

if (config.isDevelopment) {
  globalThis.__prisma = prisma;
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export default prisma;
