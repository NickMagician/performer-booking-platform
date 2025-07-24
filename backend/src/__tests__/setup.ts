import { prisma } from '../lib/database';

// Setup test environment
beforeAll(async () => {
  // Connect to test database
  await prisma.$connect();
});

// Cleanup after all tests
afterAll(async () => {
  // Clean up test data
  await prisma.$disconnect();
});

// Clean up after each test
afterEach(async () => {
  // Clean up test data if needed
  // This would typically clean up test records
  // For now, we'll skip this to avoid affecting development data
});
