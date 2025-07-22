// Test setup file
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.API_KEY = 'test-api-key';
process.env.PORT = '3002';
process.env.CORS_ORIGIN = 'http://localhost:3000';
process.env.SESSION_PATH = './test-sessions';
process.env.UPLOAD_PATH = './test-uploads';
process.env.MAX_SESSIONS = '5';
process.env.MAX_FILE_SIZE = '1048576';
process.env.MESSAGE_DELAY_MS = '1000';
process.env.MAX_MESSAGES_PER_HOUR = '10';
process.env.ENABLE_ANTI_BAN = 'false';

// Global test timeout
jest.setTimeout(10000);

// Clean up after tests
afterAll(async () => {
  // Add any cleanup logic here
}); 