import Joi from 'joi';
import { UserRole, PropertyType, PropertyStatus, ContractStatus, PaymentStatus, PaymentMethod } from '@prisma/client';

// Auth validation schemas
export const authSchemas = {
  register: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Email deve ter um formato válido',
      'string.empty': 'Email é obrigatório',
      'any.required': 'Email é obrigatório'
    }),
    password: Joi.string()
      .min(8)
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
      .required()
      .messages({
        'string.min': 'Senha deve ter pelo menos 8 caracteres',
        'string.pattern.base': 'Senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial',
        'string.empty': 'Senha é obrigatória',
        'any.required': 'Senha é obrigatória'
      }),
    firstName: Joi.string().min(2).max(50).required().messages({
      'string.min': 'Nome deve ter pelo menos 2 caracteres',
      'string.max': 'Nome deve ter no máximo 50 caracteres',
      'string.empty': 'Nome é obrigatório',
      'any.required': 'Nome é obrigatório'
    }),
    lastName: Joi.string().min(2).max(50).required().messages({
      'string.min': 'Sobrenome deve ter pelo menos 2 caracteres',
      'string.max': 'Sobrenome deve ter no máximo 50 caracteres',
      'string.empty': 'Sobrenome é obrigatório',
      'any.required': 'Sobrenome é obrigatório'
    }),
    phone: Joi.string().pattern(new RegExp('^\\+?[1-9]\\d{1,14}$')).optional().messages({
      'string.pattern.base': 'Telefone deve ter um formato válido'
    }),
    cpfCnpj: Joi.string().pattern(new RegExp('^\\d{11}$|^\\d{14}$')).optional().messages({
      'string.pattern.base': 'CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos'
    }),
    role: Joi.string().valid(...Object.values(UserRole)).optional()
  }),

  login: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Email deve ter um formato válido',
      'string.empty': 'Email é obrigatório',
      'any.required': 'Email é obrigatório'
    }),
    password: Joi.string().required().messages({
      'string.empty': 'Senha é obrigatória',
      'any.required': 'Senha é obrigatória'
    })
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required().messages({
      'string.empty': 'Senha atual é obrigatória',
      'any.required': 'Senha atual é obrigatória'
    }),
    newPassword: Joi.string()
      .min(8)
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
      .required()
      .messages({
        'string.min': 'Nova senha deve ter pelo menos 8 caracteres',
        'string.pattern.base': 'Nova senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial',
        'string.empty': 'Nova senha é obrigatória',
        'any.required': 'Nova senha é obrigatória'
      })
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Email deve ter um formato válido',
      'string.empty': 'Email é obrigatório',
      'any.required': 'Email é obrigatório'
    })
  }),

  updateProfile: Joi.object({
    firstName: Joi.string().min(2).max(50).optional(),
    lastName: Joi.string().min(2).max(50).optional(),
    phone: Joi.string().pattern(new RegExp('^\\+?[1-9]\\d{1,14}$')).optional().allow(''),
    address: Joi.string().max(200).optional().allow(''),
    city: Joi.string().max(100).optional().allow(''),
    state: Joi.string().max(100).optional().allow(''),
    zipCode: Joi.string().max(20).optional().allow(''),
    country: Joi.string().max(100).optional(),
    birthDate: Joi.date().optional()
  })
};

// Property validation schemas
export const propertySchemas = {
  create: Joi.object({
    title: Joi.string().min(5).max(200).required().messages({
      'string.min': 'Título deve ter pelo menos 5 caracteres',
      'string.max': 'Título deve ter no máximo 200 caracteres',
      'string.empty': 'Título é obrigatório',
      'any.required': 'Título é obrigatório'
    }),
    description: Joi.string().max(2000).optional().allow(''),
    type: Joi.string().valid(...Object.values(PropertyType)).required().messages({
      'any.only': 'Tipo de imóvel inválido',
      'any.required': 'Tipo de imóvel é obrigatório'
    }),
    status: Joi.string().valid(...Object.values(PropertyStatus)).optional(),
    address: Joi.string().min(10).max(200).required().messages({
      'string.min': 'Endereço deve ter pelo menos 10 caracteres',
      'string.max': 'Endereço deve ter no máximo 200 caracteres',
      'string.empty': 'Endereço é obrigatório',
      'any.required': 'Endereço é obrigatório'
    }),
    city: Joi.string().min(2).max(100).required().messages({
      'string.min': 'Cidade deve ter pelo menos 2 caracteres',
      'string.max': 'Cidade deve ter no máximo 100 caracteres',
      'string.empty': 'Cidade é obrigatória',
      'any.required': 'Cidade é obrigatória'
    }),
    state: Joi.string().min(2).max(100).required().messages({
      'string.min': 'Estado deve ter pelo menos 2 caracteres',
      'string.max': 'Estado deve ter no máximo 100 caracteres',
      'string.empty': 'Estado é obrigatório',
      'any.required': 'Estado é obrigatório'
    }),
    zipCode: Joi.string().pattern(new RegExp('^\\d{5}-?\\d{3}$')).required().messages({
      'string.pattern.base': 'CEP deve ter o formato 00000-000',
      'string.empty': 'CEP é obrigatório',
      'any.required': 'CEP é obrigatório'
    }),
    country: Joi.string().max(100).optional(),
    latitude: Joi.number().min(-90).max(90).optional(),
    longitude: Joi.number().min(-180).max(180).optional(),
    area: Joi.number().positive().optional(),
    bedrooms: Joi.number().integer().min(0).optional(),
    bathrooms: Joi.number().integer().min(0).optional(),
    parkingSpaces: Joi.number().integer().min(0).optional(),
    furnished: Joi.boolean().optional(),
    petAllowed: Joi.boolean().optional(),
    smokingAllowed: Joi.boolean().optional(),
    monthlyRent: Joi.number().positive().optional(),
    salePrice: Joi.number().positive().optional(),
    condominiumFee: Joi.number().min(0).optional(),
    iptu: Joi.number().min(0).optional(),
    managerId: Joi.string().optional()
  }),

  update: Joi.object({
    title: Joi.string().min(5).max(200).optional(),
    description: Joi.string().max(2000).optional().allow(''),
    type: Joi.string().valid(...Object.values(PropertyType)).optional(),
    status: Joi.string().valid(...Object.values(PropertyStatus)).optional(),
    address: Joi.string().min(10).max(200).optional(),
    city: Joi.string().min(2).max(100).optional(),
    state: Joi.string().min(2).max(100).optional(),
    zipCode: Joi.string().pattern(new RegExp('^\\d{5}-?\\d{3}$')).optional(),
    country: Joi.string().max(100).optional(),
    latitude: Joi.number().min(-90).max(90).optional(),
    longitude: Joi.number().min(-180).max(180).optional(),
    area: Joi.number().positive().optional(),
    bedrooms: Joi.number().integer().min(0).optional(),
    bathrooms: Joi.number().integer().min(0).optional(),
    parkingSpaces: Joi.number().integer().min(0).optional(),
    furnished: Joi.boolean().optional(),
    petAllowed: Joi.boolean().optional(),
    smokingAllowed: Joi.boolean().optional(),
    monthlyRent: Joi.number().positive().optional(),
    salePrice: Joi.number().positive().optional(),
    condominiumFee: Joi.number().min(0).optional(),
    iptu: Joi.number().min(0).optional(),
    managerId: Joi.string().optional().allow('')
  }),

  search: Joi.object({
    q: Joi.string().optional(),
    type: Joi.string().valid(...Object.values(PropertyType)).optional(),
    status: Joi.string().valid(...Object.values(PropertyStatus)).optional(),
    city: Joi.string().optional(),
    state: Joi.string().optional(),
    minPrice: Joi.number().min(0).optional(),
    maxPrice: Joi.number().min(0).optional(),
    minArea: Joi.number().min(0).optional(),
    maxArea: Joi.number().min(0).optional(),
    bedrooms: Joi.number().integer().min(0).optional(),
    bathrooms: Joi.number().integer().min(0).optional(),
    furnished: Joi.boolean().optional(),
    petAllowed: Joi.boolean().optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string().valid('createdAt', 'updatedAt', 'monthlyRent', 'salePrice', 'area').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  })
};

// Contract validation schemas
export const contractSchemas = {
  create: Joi.object({
    propertyId: Joi.string().required().messages({
      'string.empty': 'ID do imóvel é obrigatório',
      'any.required': 'ID do imóvel é obrigatório'
    }),
    tenantId: Joi.string().required().messages({
      'string.empty': 'ID do inquilino é obrigatório',
      'any.required': 'ID do inquilino é obrigatório'
    }),
    startDate: Joi.date().min('now').required().messages({
      'date.min': 'Data de início deve ser futura',
      'any.required': 'Data de início é obrigatória'
    }),
    endDate: Joi.date().greater(Joi.ref('startDate')).required().messages({
      'date.greater': 'Data de fim deve ser posterior à data de início',
      'any.required': 'Data de fim é obrigatória'
    }),
    monthlyRent: Joi.number().positive().required().messages({
      'number.positive': 'Valor do aluguel deve ser positivo',
      'any.required': 'Valor do aluguel é obrigatório'
    }),
    deposit: Joi.number().min(0).optional(),
    condominiumFee: Joi.number().min(0).optional(),
    iptu: Joi.number().min(0).optional(),
    terms: Joi.string().max(5000).optional().allow(''),
    notes: Joi.string().max(1000).optional().allow('')
  }),

  update: Joi.object({
    status: Joi.string().valid(...Object.values(ContractStatus)).optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    monthlyRent: Joi.number().positive().optional(),
    deposit: Joi.number().min(0).optional(),
    condominiumFee: Joi.number().min(0).optional(),
    iptu: Joi.number().min(0).optional(),
    terms: Joi.string().max(5000).optional().allow(''),
    notes: Joi.string().max(1000).optional().allow('')
  })
};

// Payment validation schemas
export const paymentSchemas = {
  create: Joi.object({
    contractId: Joi.string().required(),
    amount: Joi.number().positive().required(),
    dueDate: Joi.date().required(),
    description: Joi.string().max(200).optional().allow(''),
    installment: Joi.number().integer().min(1).optional(),
    totalInstallments: Joi.number().integer().min(1).optional()
  }),

  update: Joi.object({
    status: Joi.string().valid(...Object.values(PaymentStatus)).optional(),
    method: Joi.string().valid(...Object.values(PaymentMethod)).optional(),
    paidDate: Joi.date().optional(),
    lateFee: Joi.number().min(0).optional(),
    discount: Joi.number().min(0).optional()
  })
};

// Common validation schemas
export const commonSchemas = {
  id: Joi.object({
    id: Joi.string().required().messages({
      'string.empty': 'ID é obrigatório',
      'any.required': 'ID é obrigatório'
    })
  }),

  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string().default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  })
};

