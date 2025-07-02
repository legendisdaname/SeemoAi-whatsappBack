import fs from "fs";
import path from "path";
import QRCode from "qrcode-terminal";
import { v4 as uuidv4 } from "uuid";
import { Client, LocalAuth, MessageMedia } from "whatsapp-web.js";
import { config } from "../config";
import { SendMessageResponse, WhatsAppSession } from "../types";

export class WhatsAppService {
  private sessions: Map<string, { client: Client; session: WhatsAppSession }> =
    new Map();

  constructor() {
    this.ensureSessionDirectory();
  }

  private ensureSessionDirectory(): void {
    if (!fs.existsSync(config.sessionPath)) {
      fs.mkdirSync(config.sessionPath, { recursive: true });
    }
  }

  async createSession(sessionId?: string): Promise<WhatsAppSession> {
    const id = sessionId || uuidv4();

    if (this.sessions.has(id)) {
      throw new Error(`Session ${id} already exists`);
    }

    if (this.sessions.size >= config.maxSessions) {
      throw new Error(
        `Maximum number of sessions (${config.maxSessions}) reached`
      );
    }

    const session: WhatsAppSession = {
      id,
      status: "initializing",
    };

    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: id,
        dataPath: path.join(config.sessionPath, id),
      }),
      puppeteer: {
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--single-process",
          "--disable-gpu",
        ],
      },
    });

    this.setupClientEvents(client, session);
    this.sessions.set(id, { client, session });

    try {
      await client.initialize();
      return session;
    } catch (error) {
      this.sessions.delete(id);
      throw new Error(`Failed to initialize session: ${error}`);
    }
  }

  private setupClientEvents(client: Client, session: WhatsAppSession): void {
    client.on("qr", (qr) => {
      session.qrCode = qr;
      session.status = "qr";
      console.log(`QR Code for session ${session.id}:`);
      QRCode.generate(qr, { small: true });
    });

    client.on("authenticated", () => {
      session.status = "authenticated";
      console.log(`Session ${session.id} authenticated`);
    });

    client.on("ready", async () => {
      session.status = "ready";
      const info = client.info;
      session.clientInfo = {
        pushname: info.pushname || "Unknown",
        wid: info.wid._serialized,
        platform: info.platform || "Unknown",
      };
      console.log(`Session ${session.id} is ready`);
    });

    client.on("disconnected", (reason) => {
      session.status = "disconnected";
      session.qrCode = undefined;
      session.clientInfo = undefined;
      console.log(`Session ${session.id} disconnected: ${reason}`);
    });

    client.on("auth_failure", (message) => {
      session.status = "disconnected";
      console.log(`Session ${session.id} authentication failed: ${message}`);
    });
  }

  getSession(sessionId: string): WhatsAppSession | null {
    const sessionData = this.sessions.get(sessionId);
    return sessionData ? sessionData.session : null;
  }

  getAllSessions(): WhatsAppSession[] {
    return Array.from(this.sessions.values()).map((data) => data.session);
  }

  async sendTextMessage(
    sessionId: string,
    to: string,
    message: string
  ): Promise<SendMessageResponse> {
    const sessionData = this.sessions.get(sessionId);

    if (!sessionData) {
      return { success: false, error: "Session not found" };
    }

    if (sessionData.session.status !== "ready") {
      return { success: false, error: "Session not ready" };
    }

    try {
      // Format phone number
      const chatId = to.includes("@") ? to : `${to.replace(/\D/g, "")}@c.us`;
      const sentMessage = await sessionData.client.sendMessage(chatId, message);

      return {
        success: true,
        messageId: sentMessage.id._serialized,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async sendMediaMessage(
    sessionId: string,
    to: string,
    mediaPath: string,
    caption?: string
  ): Promise<SendMessageResponse> {
    const sessionData = this.sessions.get(sessionId);

    if (!sessionData) {
      return { success: false, error: "Session not found" };
    }

    if (sessionData.session.status !== "ready") {
      return { success: false, error: "Session not ready" };
    }

    try {
      const media = MessageMedia.fromFilePath(mediaPath);
      const chatId = to.includes("@") ? to : `${to.replace(/\D/g, "")}@c.us`;

      const sentMessage = await sessionData.client.sendMessage(chatId, media, {
        caption: caption || undefined,
      });

      return {
        success: true,
        messageId: sentMessage.id._serialized,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async logout(sessionId: string): Promise<boolean> {
    const sessionData = this.sessions.get(sessionId);

    if (!sessionData) {
      return false;
    }

    try {
      await sessionData.client.logout();
      await sessionData.client.destroy();
      this.sessions.delete(sessionId);

      // Clean up session directory
      const sessionDir = path.join(config.sessionPath, sessionId);
      if (fs.existsSync(sessionDir)) {
        fs.rmSync(sessionDir, { recursive: true, force: true });
      }

      return true;
    } catch (error) {
      console.error(`Error logging out session ${sessionId}:`, error);
      return false;
    }
  }

  async destroySession(sessionId: string): Promise<boolean> {
    const sessionData = this.sessions.get(sessionId);

    if (!sessionData) {
      return false;
    }

    try {
      await sessionData.client.destroy();
      this.sessions.delete(sessionId);
      return true;
    } catch (error) {
      console.error(`Error destroying session ${sessionId}:`, error);
      return false;
    }
  }
}
