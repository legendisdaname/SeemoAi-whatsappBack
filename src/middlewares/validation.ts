import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import { ApiResponse } from "../types";
import { logger } from "../utils/logger";

// Validation schemas
const createSessionSchema = Joi.object({
  sessionId: Joi.string().alphanum().min(3).max(50).optional(),
});

const sendTextMessageSchema = Joi.object({
  to: Joi.string().pattern(/^[0-9]+$/).min(7).max(15).required(),
  message: Joi.string().min(1).max(4096).required(),
});

const sendMediaMessageSchema = Joi.object({
  to: Joi.string().pattern(/^[0-9]+$/).min(7).max(15).required(),
  caption: Joi.string().max(1024).optional(),
});

const sessionIdSchema = Joi.object({
  sessionId: Joi.string().alphanum().min(3).max(50).required(),
});

// Validation middleware factory
export const validateRequest = (schema: Joi.ObjectSchema, property: 'body' | 'params' | 'query' = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorDetails = error.details.map((detail: Joi.ValidationErrorItem) => detail.message);
      logger.warn(`Validation failed for ${req.method} ${req.path}: ${errorDetails.join(', ')}`);
      
      const response: ApiResponse = {
        success: false,
        error: `Validation failed: ${errorDetails.join(', ')}`,
      };

      res.status(400).json(response);
      return;
    }

    // Replace request data with validated data
    req[property] = value;
    next();
  };
};

// Specific validation middlewares
export const validateCreateSession = validateRequest(createSessionSchema, 'body');
export const validateSendTextMessage = validateRequest(sendTextMessageSchema, 'body');
export const validateSendMediaMessage = validateRequest(sendMediaMessageSchema, 'body');
export const validateSessionId = validateRequest(sessionIdSchema, 'params');

// File validation middleware
export const validateFileUpload = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.file) {
    const response: ApiResponse = {
      success: false,
      error: "No file uploaded",
    };
    res.status(400).json(response);
    return;
  }

  // Check file size (already handled by multer, but double-check)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (req.file.size > maxSize) {
    const response: ApiResponse = {
      success: false,
      error: "File too large. Maximum size is 10MB",
    };
    res.status(413).json(response);
    return;
  }

  // Validate file type
  const allowedMimes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "video/mp4",
    "video/mpeg",
    "video/quicktime",
    "audio/mpeg",
    "audio/wav",
    "audio/ogg",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];

  if (!allowedMimes.includes(req.file.mimetype)) {
    const response: ApiResponse = {
      success: false,
      error: `File type ${req.file.mimetype} not allowed`,
    };
    res.status(415).json(response);
    return;
  }

  next();
};

// Phone number validation middleware
export const validatePhoneNumber = (req: Request, res: Response, next: NextFunction): void => {
  const phone = req.body.to || req.params.to;
  
  if (!phone) {
    const response: ApiResponse = {
      success: false,
      error: "Phone number is required",
    };
    res.status(400).json(response);
    return;
  }

  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, "");
  
  // Check if it's a valid international format (7-15 digits)
  if (cleanPhone.length < 7 || cleanPhone.length > 15) {
    const response: ApiResponse = {
      success: false,
      error: "Invalid phone number format. Must be 7-15 digits",
    };
    res.status(400).json(response);
    return;
  }

  // Check if it starts with a valid country code
  const validCountryCodes = [
    "1", "7", "20", "27", "30", "31", "32", "33", "34", "36", "39", "40", "41", "43", "44", "45", "46", "47", "48", "49",
    "51", "52", "53", "54", "55", "56", "57", "58", "60", "61", "62", "63", "64", "65", "66", "81", "82", "84", "86", "90", "91", "92", "93", "94", "95", "98", "971", "972", "973", "974", "975", "976", "977", "978", "979", "880", "886", "960", "961", "962", "963", "964", "965", "966", "967", "968", "970"
  ];

  const hasValidCountryCode = validCountryCodes.some(code => cleanPhone.startsWith(code));
  
  if (!hasValidCountryCode) {
    const response: ApiResponse = {
      success: false,
      error: "Invalid country code in phone number",
    };
    res.status(400).json(response);
    return;
  }

  // Update the request with cleaned phone number
  if (req.body.to) {
    req.body.to = cleanPhone;
  }
  if (req.params.to) {
    req.params.to = cleanPhone;
  }

  next();
}; 