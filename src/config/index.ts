import dotenv from "dotenv";

dotenv.config();

export const config = {
  // Server Configuration
  port: parseInt(process.env.PORT || "3001", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  apiBaseUrl: process.env.API_BASE_URL || "http://localhost:3001/api",
  
  // CORS Configuration
  corsOrigin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ["http://localhost:3000"],
  
  // Session Management
  sessionPath: process.env.SESSION_PATH || "./sessions",
  maxSessions: parseInt(process.env.MAX_SESSIONS || "10", 10),
  
  // File Upload Configuration
  uploadPath: process.env.UPLOAD_PATH || "./uploads",
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || "10485760", 10), // 10MB
  maxRequestSize: parseInt(process.env.MAX_REQUEST_SIZE || "52428800", 10), // 50MB
  
  // Security Configuration
  apiKey: process.env.API_KEY || "default-dev-key-change-in-production",
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10), // 15 minutes
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10),
  
  // WhatsApp Configuration
  messageDelayMs: parseInt(process.env.MESSAGE_DELAY_MS || "30000", 10), // 30 seconds
  maxMessagesPerHour: parseInt(process.env.MAX_MESSAGES_PER_HOUR || "50", 10),
  enableAntiBan: process.env.ENABLE_ANTI_BAN === "true",
  
  // Logging Configuration
  logLevel: process.env.LOG_LEVEL || "info",
  logFilePath: process.env.LOG_FILE_PATH || "./logs/app.log",
};

export const isDevelopment = config.nodeEnv === "development";
export const isProduction = config.nodeEnv === "production";

// Ensure required directories exist
import fs from "fs";

if (!fs.existsSync(config.sessionPath)) {
  fs.mkdirSync(config.sessionPath, { recursive: true });
}

if (!fs.existsSync(config.uploadPath)) {
  fs.mkdirSync(config.uploadPath, { recursive: true });
}
