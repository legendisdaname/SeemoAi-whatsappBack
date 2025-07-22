import { config } from "../config";
import { logger } from "../utils/logger";

interface MessageRecord {
  timestamp: number;
  count: number;
}

interface SessionLimits {
  lastMessageTime: number;
  hourlyCount: number;
  hourlyResetTime: number;
}

export class RateLimitService {
  private sessionLimits: Map<string, SessionLimits> = new Map();
  private globalHourlyCount: number = 0;
  private globalHourlyResetTime: number = Date.now() + 3600000; // 1 hour

  constructor() {
    // Reset global counter every hour
    setInterval(() => {
      this.globalHourlyCount = 0;
      this.globalHourlyResetTime = Date.now() + 3600000;
      logger.info("Global hourly message counter reset");
    }, 3600000);
  }

  /**
   * Check if a session can send a message based on anti-ban rules
   */
  canSendMessage(sessionId: string): { allowed: boolean; delayMs?: number; reason?: string } {
    if (!config.enableAntiBan) {
      return { allowed: true };
    }

    const now = Date.now();
    const sessionLimit = this.sessionLimits.get(sessionId);

    // Check global hourly limit
    if (this.globalHourlyCount >= config.maxMessagesPerHour) {
      return {
        allowed: false,
        reason: `Global hourly limit reached (${config.maxMessagesPerHour} messages)`,
      };
    }

    // Initialize session limits if not exists
    if (!sessionLimit) {
      this.sessionLimits.set(sessionId, {
        lastMessageTime: 0,
        hourlyCount: 0,
        hourlyResetTime: now + 3600000,
      });
    }

    const currentLimit = this.sessionLimits.get(sessionId)!;

    // Reset hourly counter if needed
    if (now > currentLimit.hourlyResetTime) {
      currentLimit.hourlyCount = 0;
      currentLimit.hourlyResetTime = now + 3600000;
    }

    // Check minimum delay between messages
    const timeSinceLastMessage = now - currentLimit.lastMessageTime;
    if (timeSinceLastMessage < config.messageDelayMs) {
      const remainingDelay = config.messageDelayMs - timeSinceLastMessage;
      return {
        allowed: false,
        delayMs: remainingDelay,
        reason: `Minimum delay between messages not met (${Math.ceil(remainingDelay / 1000)}s remaining)`,
      };
    }

    // Check session hourly limit (half of global limit)
    const sessionHourlyLimit = Math.floor(config.maxMessagesPerHour / 2);
    if (currentLimit.hourlyCount >= sessionHourlyLimit) {
      return {
        allowed: false,
        reason: `Session hourly limit reached (${sessionHourlyLimit} messages)`,
      };
    }

    return { allowed: true };
  }

  /**
   * Record a message being sent
   */
  recordMessage(sessionId: string): void {
    const now = Date.now();
    
    // Update global counter
    this.globalHourlyCount++;

    // Update session counter
    const sessionLimit = this.sessionLimits.get(sessionId);
    if (sessionLimit) {
      sessionLimit.lastMessageTime = now;
      sessionLimit.hourlyCount++;
    }

    logger.info(`Message recorded for session ${sessionId}. Global: ${this.globalHourlyCount}/${config.maxMessagesPerHour}, Session: ${sessionLimit?.hourlyCount || 1}/${Math.floor(config.maxMessagesPerHour / 2)}`);
  }

  /**
   * Get current rate limit status for a session
   */
  getSessionStatus(sessionId: string): {
    canSend: boolean;
    timeUntilNextMessage: number;
    hourlyCount: number;
    hourlyLimit: number;
    globalCount: number;
    globalLimit: number;
  } {
    const now = Date.now();
    const sessionLimit = this.sessionLimits.get(sessionId);
    const check = this.canSendMessage(sessionId);

    return {
      canSend: check.allowed,
      timeUntilNextMessage: check.delayMs || 0,
      hourlyCount: sessionLimit?.hourlyCount || 0,
      hourlyLimit: Math.floor(config.maxMessagesPerHour / 2),
      globalCount: this.globalHourlyCount,
      globalLimit: config.maxMessagesPerHour,
    };
  }

  /**
   * Add random delay to simulate human behavior
   */
  async addRandomDelay(): Promise<void> {
    if (!config.enableAntiBan) {
      return;
    }

    // Random delay between 1-5 seconds
    const randomDelay = Math.random() * 4000 + 1000;
    await new Promise(resolve => setTimeout(resolve, randomDelay));
  }

  /**
   * Reset limits for a session (useful for testing or manual reset)
   */
  resetSessionLimits(sessionId: string): void {
    this.sessionLimits.delete(sessionId);
    logger.info(`Rate limits reset for session ${sessionId}`);
  }

  /**
   * Get all session limits (for monitoring)
   */
  getAllSessionLimits(): Map<string, SessionLimits> {
    return new Map(this.sessionLimits);
  }

  /**
   * Get global statistics
   */
  getGlobalStats(): {
    globalHourlyCount: number;
    globalHourlyLimit: number;
    activeSessions: number;
    timeUntilReset: number;
  } {
    return {
      globalHourlyCount: this.globalHourlyCount,
      globalHourlyLimit: config.maxMessagesPerHour,
      activeSessions: this.sessionLimits.size,
      timeUntilReset: Math.max(0, this.globalHourlyResetTime - Date.now()),
    };
  }
} 