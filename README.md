# WhatsApp API Backend

A robust, scalable WhatsApp messaging API built with TypeScript, Express, and whatsapp-web.js.

## Features

- 🔄 Multi-session support (multiple WhatsApp accounts)
- 📱 QR Code authentication
- 💬 Send text and media messages
- 📊 Session management and status monitoring
- 📚 Complete API documentation with Swagger
- 🔒 File upload validation and security
- 🏗️ Modular, scalable architecture
- 📝 TypeScript for type safety

## Quick Start

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Configure environment:**

   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

3. **Start development server:**

   ```bash
   npm run dev
   ```

4. **Access the API:**
   - API Base: http://localhost:3001/api
   - Documentation: http://localhost:3001/api-docs
   - Health Check: http://localhost:3001/api/health

## API Endpoints

### Sessions

- `POST /api/sessions` - Create new session
- `GET /api/sessions` - List all sessions
- `GET /api/sessions/:id` - Get session status
- `POST /api/sessions/:id/logout` - Logout session
- `DELETE /api/sessions/:id` - Delete session

### Messages

- `POST /api/sessions/:id/send-text` - Send text message
- `POST /api/sessions/:id/send-media` - Send media message

### System

- `GET /api/health` - Health check

## Environment Variables

| Variable        | Description                 | Default               |
| --------------- | --------------------------- | --------------------- |
| `PORT`          | Server port                 | 3001                  |
| `NODE_ENV`      | Environment                 | development           |
| `CORS_ORIGIN`   | CORS origin                 | http://localhost:3000 |
| `SESSION_PATH`  | Session storage path        | ./sessions            |
| `MAX_SESSIONS`  | Maximum concurrent sessions | 10                    |
| `UPLOAD_PATH`   | File upload path            | ./uploads             |
| `MAX_FILE_SIZE` | Max file size in bytes      | 10485760 (10MB)       |

## Usage Examples

### Create a Session

```bash
curl -X POST http://localhost:3001/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "my-session"}'
```

### Send Text Message

```bash
curl -X POST http://localhost:3001/api/sessions/my-session/send-text \
  -H "Content-Type: application/json" \
  -d '{
    "to": "1234567890",
    "message": "Hello from WhatsApp API!"
  }'
```

### Send Media Message

```bash
curl -X POST http://localhost:3001/api/sessions/my-session/send-media \
  -F "to=1234567890" \
  -F "caption=Check this image!" \
  -F "file=@/path/to/image.jpg"
```

## Development

### Project Structure

```
src/
├── config/          # Configuration files
├── controllers/     # Route controllers
├── middlewares/     # Express middlewares
├── routes/          # Route definitions
├── services/        # Business logic
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
└── index.ts         # Application entry point
```

### Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run type-check` - Type checking without compilation

## Production Deployment

1. **Build the application:**

   ```bash
   npm run build
   ```

2. **Start production server:**

   ```bash
   npm start
   ```

3. **Using PM2 (recommended):**
   ```bash
   pm2 start dist/index.js --name whatsapp-api
   ```

## Security Considerations

- File uploads are validated for type and size
- CORS is configured for specific origins
- Input validation on all endpoints
- Error handling prevents information leakage
- Session isolation between users

## Troubleshooting

### Common Issues

1. **Puppeteer issues:**

   - Install missing dependencies: `apt-get install -y chromium-browser`
   - Use provided Puppeteer args for headless mode

2. **Permission errors:**

   - Check file permissions for session and upload directories
   - Ensure proper write access

3. **Memory issues:**
   - Monitor session count and cleanup inactive sessions
   - Consider implementing session timeout

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details
