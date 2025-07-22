import { Router } from "express";
import { WhatsAppController } from "../controllers/WhatsAppController";
import { HealthController } from "../controllers/HealthController";
import { upload } from "../middlewares/upload";
import { validateApiKey } from "../middlewares/security";
import { 
  validateCreateSession, 
  validateSendTextMessage, 
  validateSendMediaMessage, 
  validateSessionId,
  validateFileUpload,
  validatePhoneNumber 
} from "../middlewares/validation";

const router = Router();
const whatsappController = new WhatsAppController();
const healthController = new HealthController();

// Health check routes (no authentication required)
router.get("/health", healthController.getHealth);
router.get("/health/rate-limits", healthController.getRateLimitStatus);
router.post("/health/rate-limits/:sessionId/reset", healthController.resetRateLimits);

// Protected routes (require API key)
router.use(validateApiKey);

// Session routes
router.post("/sessions", validateCreateSession, whatsappController.createSession);
router.get("/sessions", whatsappController.getAllSessions);
router.get("/sessions/:sessionId", validateSessionId, whatsappController.getSessionStatus);
router.post("/sessions/:sessionId/logout", validateSessionId, whatsappController.logout);
router.delete("/sessions/:sessionId", validateSessionId, whatsappController.destroySession);

// Message routes
router.post(
  "/sessions/:sessionId/send-text",
  validateSessionId,
  validatePhoneNumber,
  validateSendTextMessage,
  whatsappController.sendTextMessage
);
router.post(
  "/sessions/:sessionId/send-media",
  validateSessionId,
  validatePhoneNumber,
  upload.single("file"),
  validateFileUpload,
  validateSendMediaMessage,
  whatsappController.sendMediaMessage
);

export default router;
