import { Request, Response } from "express";
import { ApiResponse } from "../types";
import { WhatsAppService } from "../services/WhatsAppService";
import { RateLimitService } from "../services/RateLimitService";
import { config } from "../config";
import { logger } from "../utils/logger";
import { createCorsConfig } from "../utils/cors";

export class HealthController {
  private whatsappService: WhatsAppService;
  private rateLimitService: RateLimitService;

  constructor() {
    this.whatsappService = new WhatsAppService();
    this.rateLimitService = new RateLimitService();
  }

  /**
   * @swagger
   * /api/health:
   *   get:
   *     summary: Get API health status
   *     tags: [System]
   *     responses:
   *       200:
   *         description: Health check successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     status:
   *                       type: string
   *                     timestamp:
   *                       type: string
   *                     uptime:
   *                       type: number
   *                     version:
   *                       type: string
   *                     environment:
   *                       type: string
   */
  getHealth = async (req: Request, res: Response): Promise<void> => {
    try {
      const sessions = this.whatsappService.getAllSessions();
      const rateLimitStats = this.rateLimitService.getGlobalStats();

      const healthData = {
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: "1.0.0",
        environment: config.nodeEnv,
        services: {
          whatsapp: {
            activeSessions: sessions.length,
            maxSessions: config.maxSessions,
          },
          rateLimit: rateLimitStats,
        },
        config: {
          messageDelayMs: config.messageDelayMs,
          maxMessagesPerHour: config.maxMessagesPerHour,
          enableAntiBan: config.enableAntiBan,
          cors: {
            allowedOrigins: createCorsConfig().allowedOrigins,
            allowCredentials: createCorsConfig().allowCredentials,
          },
        },
      };

      const response: ApiResponse = {
        success: true,
        data: healthData,
        message: "API is healthy",
      };

      res.json(response);
    } catch (error) {
      logger.error("Health check failed:", error);
      
      const response: ApiResponse = {
        success: false,
        error: "Health check failed",
        data: {
          status: "unhealthy",
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          error: error instanceof Error ? error.message : "Unknown error",
        },
      };

      res.status(503).json(response);
    }
  };

  /**
   * @swagger
   * /api/health/rate-limits:
   *   get:
   *     summary: Get rate limit status for all sessions
   *     tags: [System]
   *     responses:
   *       200:
   *         description: Rate limit status retrieved successfully
   */
  getRateLimitStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const sessions = this.whatsappService.getAllSessions();
      const rateLimitData = sessions.map(session => ({
        sessionId: session.id,
        status: this.rateLimitService.getSessionStatus(session.id),
      }));

      const response: ApiResponse = {
        success: true,
        data: {
          sessions: rateLimitData,
          global: this.rateLimitService.getGlobalStats(),
        },
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };

      res.status(500).json(response);
    }
  };

  /**
   * @swagger
   * /api/health/rate-limits/{sessionId}/reset:
   *   post:
   *     summary: Reset rate limits for a specific session
   *     tags: [System]
   *     parameters:
   *       - in: path
   *         name: sessionId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Rate limits reset successfully
   */
  resetRateLimits = async (req: Request, res: Response): Promise<void> => {
    try {
      const { sessionId } = req.params;
      
      this.rateLimitService.resetSessionLimits(sessionId);

      const response: ApiResponse = {
        success: true,
        message: `Rate limits reset for session ${sessionId}`,
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };

      res.status(500).json(response);
    }
  };

  /**
   * @swagger
   * /api/health/cors:
   *   get:
   *     summary: Get CORS configuration information
   *     tags: [System]
   *     responses:
   *       200:
   *         description: CORS configuration retrieved successfully
   */
  getCorsInfo = async (req: Request, res: Response): Promise<void> => {
    try {
      const corsConfig = createCorsConfig();

      const response: ApiResponse = {
        success: true,
        data: {
          allowedOrigins: corsConfig.allowedOrigins,
          allowCredentials: corsConfig.allowCredentials,
          allowedMethods: corsConfig.allowedMethods,
          allowedHeaders: corsConfig.allowedHeaders,
          currentOrigin: req.headers.origin || 'No origin',
          isAllowed: corsConfig.allowedOrigins.includes(req.headers.origin || ''),
        },
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };

      res.status(500).json(response);
    }
  };
} 