import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { config } from "../config";
import { logger } from "../utils/logger";

// Rate limiting configuration
export const rateLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: {
    success: false,
    error: "Too many requests, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: "Too many requests, please try again later.",
    });
  },
});

// API Key validation middleware
export const validateApiKey = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = req.headers["x-api-key"] || req.headers["authorization"];
  
  if (!apiKey) {
    logger.warn(`API request without key from IP: ${req.ip}`);
    res.status(401).json({
      success: false,
      error: "API key required",
    });
    return;
  }

  // Remove 'Bearer ' prefix if present
  const key = typeof apiKey === "string" ? apiKey.replace("Bearer ", "") : apiKey;
  
  if (key !== config.apiKey) {
    logger.warn(`Invalid API key from IP: ${req.ip}`);
    res.status(401).json({
      success: false,
      error: "Invalid API key",
    });
    return;
  }

  next();
};

// Input sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
  // Sanitize body
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === "string") {
        req.body[key] = req.body[key].trim().replace(/[<>]/g, "");
      }
    });
  }

  // Sanitize query parameters
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === "string") {
        req.query[key] = req.query[key]?.toString().trim().replace(/[<>]/g, "");
      }
    });
  }

  // Sanitize URL parameters
  if (req.params) {
    Object.keys(req.params).forEach(key => {
      if (typeof req.params[key] === "string") {
        req.params[key] = req.params[key].trim().replace(/[<>]/g, "");
      }
    });
  }

  next();
};

// Phone number validation
export const validatePhoneNumber = (phone: string): boolean => {
  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, "");
  
  // Check if it's a valid international format (7-15 digits)
  if (cleanPhone.length < 7 || cleanPhone.length > 15) {
    return false;
  }

  // Check if it starts with a valid country code
  const validCountryCodes = [
    "1", "7", "20", "27", "30", "31", "32", "33", "34", "36", "39", "40", "41", "43", "44", "45", "46", "47", "48", "49",
    "51", "52", "53", "54", "55", "56", "57", "58", "60", "61", "62", "63", "64", "65", "66", "81", "82", "84", "86", "90", "91", "92", "93", "94", "95", "98", "971", "972", "973", "974", "975", "976", "977", "978", "979", "880", "886", "960", "961", "962", "963", "964", "965", "966", "967", "968", "970", "971", "972", "973", "974", "975", "976", "977", "978", "979", "880", "886", "960", "961", "962", "963", "964", "965", "966", "967", "968", "970"
  ];

  return validCountryCodes.some(code => cleanPhone.startsWith(code));
};

// Request size validation
export const validateRequestSize = (req: Request, res: Response, next: NextFunction): void => {
  const contentLength = parseInt(req.headers["content-length"] || "0");
  
  if (contentLength > config.maxRequestSize) {
    logger.warn(`Request too large: ${contentLength} bytes from IP: ${req.ip}`);
    res.status(413).json({
      success: false,
      error: "Request too large",
    });
    return;
  }

  next();
};

// Security headers middleware
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});

// Logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  
  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });

  next();
}; 