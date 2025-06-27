import { Request, Response } from 'express';
import { AuthService } from '@/services/authService';
import { AuthenticatedRequest } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';
import { logger } from '@/config/logger';

const authService = new AuthService();

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.register(req.body);

  res.status(201).json({
    success: true,
    message: 'Usuário registrado com sucesso',
    data: result
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body);

  // Set refresh token as httpOnly cookie
  res.cookie('refreshToken', result.tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  });

  res.json({
    success: true,
    message: 'Login realizado com sucesso',
    data: {
      user: result.user,
      accessToken: result.tokens.accessToken,
      expiresIn: result.tokens.expiresIn
    }
  });
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken: token } = req.cookies;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token de atualização não fornecido',
      code: 'REFRESH_TOKEN_REQUIRED'
    });
  }

  const tokens = await authService.refreshToken(token);

  // Set new refresh token as httpOnly cookie
  res.cookie('refreshToken', tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  });

  res.json({
    success: true,
    message: 'Token atualizado com sucesso',
    data: {
      accessToken: tokens.accessToken,
      expiresIn: tokens.expiresIn
    }
  });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken: token } = req.cookies;

  if (token) {
    await authService.logout(token);
  }

  // Clear refresh token cookie
  res.clearCookie('refreshToken');

  res.json({
    success: true,
    message: 'Logout realizado com sucesso'
  });
});

export const logoutAll = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Usuário não autenticado',
      code: 'NOT_AUTHENTICATED'
    });
  }

  await authService.logoutAll(req.user.id);

  // Clear refresh token cookie
  res.clearCookie('refreshToken');

  res.json({
    success: true,
    message: 'Logout realizado em todos os dispositivos'
  });
});

export const changePassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Usuário não autenticado',
      code: 'NOT_AUTHENTICATED'
    });
  }

  const { currentPassword, newPassword } = req.body;

  await authService.changePassword(req.user.id, currentPassword, newPassword);

  // Clear refresh token cookie to force re-login
  res.clearCookie('refreshToken');

  res.json({
    success: true,
    message: 'Senha alterada com sucesso. Faça login novamente.'
  });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  await authService.forgotPassword(email);

  res.json({
    success: true,
    message: 'Se o email existir, você receberá instruções para redefinir sua senha'
  });
});

export const getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Usuário não autenticado',
      code: 'NOT_AUTHENTICATED'
    });
  }

  // Get full user profile
  const user = await authService.getUserProfile(req.user.id);

  res.json({
    success: true,
    message: 'Perfil obtido com sucesso',
    data: user
  });
});

export const updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Usuário não autenticado',
      code: 'NOT_AUTHENTICATED'
    });
  }

  const updatedUser = await authService.updateProfile(req.user.id, req.body);

  res.json({
    success: true,
    message: 'Perfil atualizado com sucesso',
    data: updatedUser
  });
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { userId, token } = req.params;

  await authService.verifyEmail(userId, token);

  res.json({
    success: true,
    message: 'Email verificado com sucesso'
  });
});

export const resendVerificationEmail = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Usuário não autenticado',
      code: 'NOT_AUTHENTICATED'
    });
  }

  await authService.resendVerificationEmail(req.user.id);

  res.json({
    success: true,
    message: 'Email de verificação reenviado'
  });
});

