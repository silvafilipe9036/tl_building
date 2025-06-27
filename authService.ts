import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/config/database';
import { logger } from '@/config/logger';
import config from '@/config';
import { AppError } from '@/middleware/errorHandler';
import { User, UserRole } from '@prisma/client';

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  cpfCnpj?: string;
  role?: UserRole;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: Omit<User, 'password'>;
  tokens: AuthTokens;
}

export class AuthService {
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email }
      });

      if (existingUser) {
        throw new AppError('Usuário já existe com este email', 409, 'USER_ALREADY_EXISTS');
      }

      // Check CPF/CNPJ if provided
      if (data.cpfCnpj) {
        const existingCpfCnpj = await prisma.user.findUnique({
          where: { cpfCnpj: data.cpfCnpj }
        });

        if (existingCpfCnpj) {
          throw new AppError('CPF/CNPJ já cadastrado', 409, 'CPF_CNPJ_ALREADY_EXISTS');
        }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, config.bcryptRounds);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone || null,
          cpfCnpj: data.cpfCnpj || null,
          role: data.role || UserRole.TENANT,
        }
      });

      // Generate tokens
      const tokens = await this.generateTokens(user.id, user.email, user.role);

      // Remove password from response
      const { password, ...userWithoutPassword } = user;

      logger.info('User registered successfully', { userId: user.id, email: user.email });

      return {
        user: userWithoutPassword,
        tokens
      };
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  async login(data: LoginData): Promise<AuthResponse> {
    try {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email: data.email }
      });

      if (!user) {
        throw new AppError('Credenciais inválidas', 401, 'INVALID_CREDENTIALS');
      }

      if (!user.isActive) {
        throw new AppError('Conta desativada', 401, 'ACCOUNT_DEACTIVATED');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(data.password, user.password);

      if (!isPasswordValid) {
        throw new AppError('Credenciais inválidas', 401, 'INVALID_CREDENTIALS');
      }

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });

      // Generate tokens
      const tokens = await this.generateTokens(user.id, user.email, user.role);

      // Remove password from response
      const { password, ...userWithoutPassword } = user;

      logger.info('User logged in successfully', { userId: user.id, email: user.email });

      return {
        user: userWithoutPassword,
        tokens
      };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, config.refreshTokenSecret) as any;

      // Check if refresh token exists in database
      const storedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true }
      });

      if (!storedToken || storedToken.expiresAt < new Date()) {
        throw new AppError('Token de atualização inválido ou expirado', 401, 'INVALID_REFRESH_TOKEN');
      }

      if (!storedToken.user.isActive) {
        throw new AppError('Conta desativada', 401, 'ACCOUNT_DEACTIVATED');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(
        storedToken.user.id,
        storedToken.user.email,
        storedToken.user.role
      );

      // Remove old refresh token
      await prisma.refreshToken.delete({
        where: { id: storedToken.id }
      });

      logger.info('Token refreshed successfully', { userId: storedToken.user.id });

      return tokens;
    } catch (error) {
      logger.error('Refresh token error:', error);
      throw error;
    }
  }

  async logout(refreshToken: string): Promise<void> {
    try {
      // Remove refresh token from database
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken }
      });

      logger.info('User logged out successfully');
    } catch (error) {
      logger.error('Logout error:', error);
      throw error;
    }
  }

  async logoutAll(userId: string): Promise<void> {
    try {
      // Remove all refresh tokens for user
      await prisma.refreshToken.deleteMany({
        where: { userId }
      });

      logger.info('User logged out from all devices', { userId });
    } catch (error) {
      logger.error('Logout all error:', error);
      throw error;
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    try {
      // Get user
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new AppError('Usuário não encontrado', 404, 'USER_NOT_FOUND');
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);

      if (!isCurrentPasswordValid) {
        throw new AppError('Senha atual incorreta', 400, 'INVALID_CURRENT_PASSWORD');
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, config.bcryptRounds);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword }
      });

      // Logout from all devices for security
      await this.logoutAll(userId);

      logger.info('Password changed successfully', { userId });
    } catch (error) {
      logger.error('Change password error:', error);
      throw error;
    }
  }

  async forgotPassword(email: string): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        // Don't reveal if email exists
        logger.warn('Password reset requested for non-existent email', { email });
        return;
      }

      // Generate reset token
      const resetToken = uuidv4();
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

      // Store reset token (you might want to create a separate table for this)
      // For now, we'll use a system config or add fields to user table
      
      // TODO: Send email with reset link
      // await emailService.sendPasswordResetEmail(user.email, resetToken);

      logger.info('Password reset requested', { userId: user.id, email });
    } catch (error) {
      logger.error('Forgot password error:', error);
      throw error;
    }
  }

  private async generateTokens(userId: string, email: string, role: string): Promise<AuthTokens> {
    // Generate access token
    const accessToken = jwt.sign(
      { userId, email, role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    // Generate refresh token
    const refreshToken = jwt.sign(
      { userId, type: 'refresh' },
      config.refreshTokenSecret,
      { expiresIn: config.refreshTokenExpiresIn }
    );

    // Store refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt
      }
    });

    // Clean up expired tokens
    await prisma.refreshToken.deleteMany({
      where: {
        expiresAt: { lt: new Date() }
      }
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 7 * 24 * 60 * 60 // 7 days in seconds
    };
  }

  async verifyEmail(userId: string, token: string): Promise<void> {
    try {
      // TODO: Implement email verification logic
      await prisma.user.update({
        where: { id: userId },
        data: {
          emailVerified: true,
          emailVerifiedAt: new Date()
        }
      });

      logger.info('Email verified successfully', { userId });
    } catch (error) {
      logger.error('Email verification error:', error);
      throw error;
    }
  }

  async resendVerificationEmail(userId: string): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      if (user.emailVerified) {
        throw new Error('Email já verificado');
      }

      // TODO: Implement email sending logic
      logger.info('Verification email resent', { userId, email: user.email });
    } catch (error) {
      logger.error('Resend verification email error:', error);
      throw error;
    }
  }
}

