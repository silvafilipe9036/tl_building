import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { logger } from '@/config/logger';

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: false
    });

    if (error) {
      const validationErrors: ValidationError[] = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      logger.warn('Validation error:', { errors: validationErrors, body: req.body });

      res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        code: 'VALIDATION_ERROR',
        errors: validationErrors
      });
      return;
    }

    // Replace req.body with validated and sanitized data
    req.body = value;
    next();
  };
};

export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: false
    });

    if (error) {
      const validationErrors: ValidationError[] = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      logger.warn('Query validation error:', { errors: validationErrors, query: req.query });

      res.status(400).json({
        success: false,
        message: 'Parâmetros de consulta inválidos',
        code: 'QUERY_VALIDATION_ERROR',
        errors: validationErrors
      });
      return;
    }

    req.query = value;
    next();
  };
};

export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: false
    });

    if (error) {
      const validationErrors: ValidationError[] = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      logger.warn('Params validation error:', { errors: validationErrors, params: req.params });

      res.status(400).json({
        success: false,
        message: 'Parâmetros de rota inválidos',
        code: 'PARAMS_VALIDATION_ERROR',
        errors: validationErrors
      });
      return;
    }

    req.params = value;
    next();
  };
};

// Common validation schemas
export const commonSchemas = {
  id: Joi.string().required().messages({
    'string.empty': 'ID é obrigatório',
    'any.required': 'ID é obrigatório'
  }),
  
  email: Joi.string().email().required().messages({
    'string.email': 'Email deve ter um formato válido',
    'string.empty': 'Email é obrigatório',
    'any.required': 'Email é obrigatório'
  }),
  
  password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]')).required().messages({
    'string.min': 'Senha deve ter pelo menos 8 caracteres',
    'string.pattern.base': 'Senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial',
    'string.empty': 'Senha é obrigatória',
    'any.required': 'Senha é obrigatória'
  }),
  
  phone: Joi.string().pattern(new RegExp('^\\+?[1-9]\\d{1,14}$')).messages({
    'string.pattern.base': 'Telefone deve ter um formato válido'
  }),
  
  cpfCnpj: Joi.string().pattern(new RegExp('^\\d{11}$|^\\d{14}$')).messages({
    'string.pattern.base': 'CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos'
  }),
  
  pagination: {
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string().default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  }
};

