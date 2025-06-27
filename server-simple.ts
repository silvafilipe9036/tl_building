import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://tl-building-system.vercel.app',
    'https://tlbuilding.com'
  ],
  credentials: true,
  optionsSuccessStatus: 200,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    message: 'Muitas tentativas. Tente novamente mais tarde.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'TL Building System API is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: '1.0.0',
  });
});

// Mock authentication endpoint
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email e senha são obrigatórios',
      code: 'MISSING_CREDENTIALS'
    });
  }

  // Mock successful login
  res.json({
    success: true,
    message: 'Login realizado com sucesso',
    data: {
      user: {
        id: '1',
        email: email,
        firstName: 'João',
        lastName: 'Silva',
        role: 'OWNER',
        isActive: true,
        emailVerified: true,
        createdAt: new Date().toISOString()
      },
      accessToken: 'mock-jwt-token-' + Date.now(),
      expiresIn: 7 * 24 * 60 * 60 // 7 days
    }
  });
});

// Mock register endpoint
app.post('/api/auth/register', (req, res) => {
  const { email, password, firstName, lastName } = req.body;
  
  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({
      success: false,
      message: 'Todos os campos são obrigatórios',
      code: 'MISSING_FIELDS'
    });
  }

  // Mock successful registration
  res.status(201).json({
    success: true,
    message: 'Usuário registrado com sucesso',
    data: {
      user: {
        id: '2',
        email: email,
        firstName: firstName,
        lastName: lastName,
        role: 'TENANT',
        isActive: true,
        emailVerified: false,
        createdAt: new Date().toISOString()
      },
      accessToken: 'mock-jwt-token-' + Date.now(),
      expiresIn: 7 * 24 * 60 * 60 // 7 days
    }
  });
});

// Mock profile endpoint
app.get('/api/auth/profile', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Token de acesso não fornecido',
      code: 'NO_TOKEN'
    });
  }

  res.json({
    success: true,
    message: 'Perfil obtido com sucesso',
    data: {
      id: '1',
      email: 'admin@tlbuilding.com',
      firstName: 'João',
      lastName: 'Silva',
      role: 'OWNER',
      isActive: true,
      emailVerified: true,
      createdAt: new Date().toISOString()
    }
  });
});

// Mock logout endpoint
app.post('/api/auth/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logout realizado com sucesso'
  });
});

// Mock properties endpoint
app.get('/api/properties', (req, res) => {
  res.json({
    success: true,
    message: 'Imóveis obtidos com sucesso',
    data: {
      properties: [
        {
          id: '1',
          title: 'Apartamento 2 quartos - Centro',
          description: 'Apartamento moderno no centro da cidade',
          type: 'APARTMENT',
          status: 'AVAILABLE',
          address: 'Rua das Flores, 123',
          city: 'São Paulo',
          state: 'SP',
          monthlyRent: 2500,
          bedrooms: 2,
          bathrooms: 1,
          area: 65,
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          title: 'Casa 3 quartos - Jardins',
          description: 'Casa espaçosa com quintal',
          type: 'HOUSE',
          status: 'RENTED',
          address: 'Rua dos Pinheiros, 456',
          city: 'São Paulo',
          state: 'SP',
          monthlyRent: 4500,
          bedrooms: 3,
          bathrooms: 2,
          area: 120,
          createdAt: new Date().toISOString()
        }
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1
      }
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'TL Building System API',
    version: '1.0.0',
    documentation: '/api/docs',
    health: '/health',
    endpoints: {
      auth: {
        login: 'POST /api/auth/login',
        register: 'POST /api/auth/register',
        profile: 'GET /api/auth/profile',
        logout: 'POST /api/auth/logout'
      },
      properties: {
        list: 'GET /api/properties'
      }
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint não encontrado',
    code: 'NOT_FOUND',
    path: req.originalUrl
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erro interno do servidor',
    code: err.code || 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 TL Building System API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  console.log(`Received ${signal}. Starting graceful shutdown...`);
  
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });

  // Force close after 30 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
};

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;

