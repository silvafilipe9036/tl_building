import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { logger } from '@/config/logger';
import config from '@/config';

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const createError = (message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') => {
  return new AppError(message, statusCode, code);
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new AppError(`Rota não encontrada: ${req.originalUrl}`, 404, 'ROUTE_NOT_FOUND');
  next(error);
};

export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Erro interno do servidor';
  let code = 'INTERNAL_ERROR';
  let details: any = undefined;

  // Log error
  logger.error('Error occurred:', {
    error: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Handle operational errors
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    code = error.code;
  }
  // Handle Prisma errors
  else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        statusCode = 409;
        message = 'Registro já existe';
        code = 'DUPLICATE_ENTRY';
        details = {
          field: error.meta?.target,
          constraint: error.meta?.constraint
        };
        break;
      case 'P2025':
        statusCode = 404;
        message = 'Registro não encontrado';
        code = 'RECORD_NOT_FOUND';
        break;
      case 'P2003':
        statusCode = 400;
        message = 'Violação de chave estrangeira';
        code = 'FOREIGN_KEY_CONSTRAINT';
        break;
      case 'P2014':
        statusCode = 400;
        message = 'Dados relacionados são obrigatórios';
        code = 'REQUIRED_RELATION_VIOLATION';
        break;
      default:
        statusCode = 400;
        message = 'Erro de banco de dados';
        code = 'DATABASE_ERROR';
    }
  }
  // Handle Prisma validation errors
  else if (error instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = 'Dados inválidos fornecidos';
    code = 'VALIDATION_ERROR';
  }
  // Handle JSON parsing errors
  else if (error instanceof SyntaxError && 'body' in error) {
    statusCode = 400;
    message = 'JSON inválido';
    code = 'INVALID_JSON';
  }
  // Handle JWT errors
  else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token inválido';
    code = 'INVALID_TOKEN';
  }
  else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expirado';
    code = 'TOKEN_EXPIRED';
  }
  // Handle multer errors (file upload)
  else if (error.name === 'MulterError') {
    statusCode = 400;
    message = 'Erro no upload do arquivo';
    code = 'FILE_UPLOAD_ERROR';
    
    if (error.message.includes('File too large')) {
      message = 'Arquivo muito grande';
      code = 'FILE_TOO_LARGE';
    }
  }

  // Don't expose error details in production
  const response: any = {
    success: false,
    message,
    code,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  };

  if (details) {
    response.details = details;
  }

  // Include stack trace in development
  if (config.nodeEnv === 'development') {
    response.stack = error.stack;
  }

  res.status(statusCode).json(response);
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Close server & exit process
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  // Close server & exit process
  process.exit(1);
});

