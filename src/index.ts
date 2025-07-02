import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './config';
import routes from './routes';
import { errorHandler, notFound } from './middlewares/errorHandler';
import { logger } from './utils/logger';

const app = express();

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'WhatsApp API',
      version: '1.0.0',
      description: 'A robust WhatsApp messaging API built with whatsapp-web.js',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      }
    },
    servers: [
      {
        url: config.apiBaseUrl,
        description: 'Development server'
      }
    ],
    components: {
      schemas: {
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Indicates if the request was successful'
            },
            data: {
              type: 'object',
              description: 'Response data (when successful)'
            },
            error: {
              type: 'string',
              description: 'Error message (when unsuccessful)'
            },
            message: {
              type: 'string',
              description: 'Additional message'
            }
          }
        },
        WhatsAppSession: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique session identifier'
            },
            status: {
              type: 'string',
              enum: ['initializing', 'qr', 'authenticated', 'ready', 'disconnected'],
              description: 'Current session status'
            },
            qrCode: {
              type: 'string',
              description: 'QR code string (when status is qr)'
            },
            clientInfo: {
              type: 'object',
              properties: {
                pushname: {
                  type: 'string',
                  description: 'WhatsApp display name'
                },
                wid: {
                  type: 'string',
                  description: 'WhatsApp ID'
                },
                platform: {
                  type: 'string',
                  description: 'WhatsApp platform'
                }
              }
            }
          }
        }
      }
    }
  },
  apis: ['./src/controllers/*.ts'] // Path to the API files
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cors({
  origin: config.corsOrigin,
  credentials: true
}));

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'WhatsApp API Documentation'
}));

// API Routes
app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'WhatsApp API Server',
    version: '1.0.0',
    documentation: `${config.apiBaseUrl.replace('/api', '')}/api-docs`,
    endpoints: {
      health: '/api/health',
      sessions: '/api/sessions',
      documentation: '/api-docs'
    }
  });
});

// Swagger JSON endpoint
app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Error handling
app.use(notFound);
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
const server = app.listen(config.port, () => {
  logger.info(`🚀 WhatsApp API Server running on port ${config.port}`);
  logger.info(`📚 API Documentation: http://localhost:${config.port}/api-docs`);
  logger.info(`🏥 Health Check: http://localhost:${config.port}/api/health`);
  logger.info(`🌍 Environment: ${config.nodeEnv}`);
});

export default app; 