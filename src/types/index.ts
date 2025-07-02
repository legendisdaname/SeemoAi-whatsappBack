export interface WhatsAppSession {
  id: string;
  status: 'initializing' | 'qr' | 'authenticated' | 'ready' | 'disconnected';
  qrCode?: string;
  clientInfo?: {
    pushname: string;
    wid: string;
    platform: string;
  };
}

export interface SendMessageRequest {
  sessionId: string;
  to: string;
  message: string;
  type?: 'text' | 'image' | 'document' | 'audio' | 'video';
}

export interface SendMessageResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface SessionStatusResponse {
  sessionId: string;
  status: WhatsAppSession['status'];
  qrCode?: string;
  clientInfo?: WhatsAppSession['clientInfo'];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface MediaMessage {
  file: Express.Multer.File;
  caption?: string;
} 