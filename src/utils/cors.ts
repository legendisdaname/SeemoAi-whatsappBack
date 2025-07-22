import { config } from "../config";
import { logger } from "./logger";

export interface CorsConfig {
  allowedOrigins: string[];
  allowCredentials: boolean;
  allowedMethods: string[];
  allowedHeaders: string[];
  optionsSuccessStatus: number;
}

export function createCorsConfig(): CorsConfig {
  return {
    allowedOrigins: Array.isArray(config.corsOrigin) ? config.corsOrigin : [config.corsOrigin],
    allowCredentials: true,
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
    optionsSuccessStatus: 200
  };
}

export function validateOrigin(origin: string | undefined): boolean {
  // Allow requests with no origin (like mobile apps or curl requests)
  if (!origin) {
    return true;
  }

  const allowedOrigins = Array.isArray(config.corsOrigin) ? config.corsOrigin : [config.corsOrigin];
  
  // Check if origin is in allowed list
  const isAllowed = allowedOrigins.includes(origin);
  
  // Log in development
  if (config.nodeEnv === 'development') {
    if (isAllowed) {
      logger.debug(`CORS allowed origin: ${origin}`);
    } else {
      logger.warn(`CORS blocked origin: ${origin}. Allowed origins: ${allowedOrigins.join(', ')}`);
    }
  }
  
  return isAllowed;
}

export function getCorsOriginFunction() {
  return function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    if (validateOrigin(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  };
} 