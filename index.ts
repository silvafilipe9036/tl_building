import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  databaseUrl: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  refreshTokenSecret: string;
  refreshTokenExpiresIn: string;
  redisUrl: string;
  corsOrigin: string | string[];
  uploadDir: string;
  maxFileSize: number;
  bcryptRounds: number;
  rateLimitWindow: number;
  rateLimitMax: number;
  email: {
    from: string;
    sendgridApiKey: string;
  };
  aws: {
    accessKeyId: string;
    secretAccessKey: string;
    bucketName: string;
    region: string;
  };
  stripe: {
    secretKey: string;
    webhookSecret: string;
  };
  openai: {
    apiKey: string;
  };
  sentry: {
    dsn: string;
  };
}

const config: Config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || 'your-super-secret-refresh-key',
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  corsOrigin: process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
    : ['http://localhost:3000'],
  uploadDir: process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads'),
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '900000', 10), // 15 minutes
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  email: {
    from: process.env.FROM_EMAIL || 'noreply@tlbuilding.com',
    sendgridApiKey: process.env.SENDGRID_API_KEY || '',
  },
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    bucketName: process.env.AWS_BUCKET_NAME || 'tl-building-uploads',
    region: process.env.AWS_REGION || 'us-east-1',
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
  },
  sentry: {
    dsn: process.env.SENTRY_DSN || '',
  },
};

// Validate required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'REFRESH_TOKEN_SECRET',
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

export default config;

