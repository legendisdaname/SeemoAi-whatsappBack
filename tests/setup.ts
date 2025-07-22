// Test setup file
import dotenv from 'dotenv';
import '@jest/globals';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.API_KEY = 'test-api-key';
process.env.PORT = '3002';
process.env.CORS_ORIGIN = 'https://platform.seemoai.com';
process.env.SESSION_PATH = './test-sessions';
process.env.UPLOAD_PATH = './test-uploads';
process.env.MAX_SESSIONS = '5';
process.env.MAX_FILE_SIZE = '1048576';
process.env.MESSAGE_DELAY_MS = '1000';
process.env.MAX_MESSAGES_PER_HOUR = '10';
process.env.ENABLE_ANTI_BAN = 'false';

// Test environment is now configured 