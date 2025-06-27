import { Router } from 'express';
import * as authController from '@/controllers/authController';
import { validate, validateParams } from '@/middleware/validation';
import { authenticateToken } from '@/middleware/auth';
import { authSchemas, commonSchemas } from '@/utils/validationSchemas';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         email:
 *           type: string
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         role:
 *           type: string
 *           enum: [ADMIN, OWNER, TENANT, MANAGER]
 *         isActive:
 *           type: boolean
 *         emailVerified:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *     
 *     AuthTokens:
 *       type: object
 *       properties:
 *         accessToken:
 *           type: string
 *         expiresIn:
 *           type: number
 *     
 *     AuthResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             user:
 *               $ref: '#/components/schemas/User'
 *             accessToken:
 *               type: string
 *             expiresIn:
 *               type: number
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registrar novo usuário
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               cpfCnpj:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [ADMIN, OWNER, TENANT, MANAGER]
 *     responses:
 *       201:
 *         description: Usuário registrado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Dados inválidos
 *       409:
 *         description: Usuário já existe
 */
router.post('/register', validate(authSchemas.register), authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Fazer login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Credenciais inválidas
 */
router.post('/login', validate(authSchemas.login), authController.login);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Atualizar token de acesso
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Token atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/AuthTokens'
 *       401:
 *         description: Token de atualização inválido
 */
router.post('/refresh', authController.refreshToken);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Fazer logout
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logout realizado com sucesso
 */
router.post('/logout', authController.logout);

/**
 * @swagger
 * /api/auth/logout-all:
 *   post:
 *     summary: Fazer logout de todos os dispositivos
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout realizado em todos os dispositivos
 *       401:
 *         description: Token inválido
 */
router.post('/logout-all', authenticateToken, authController.logoutAll);

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Alterar senha
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Senha alterada com sucesso
 *       400:
 *         description: Senha atual incorreta
 *       401:
 *         description: Token inválido
 */
router.post('/change-password', 
  authenticateToken, 
  validate(authSchemas.changePassword), 
  authController.changePassword
);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Solicitar redefinição de senha
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Email de redefinição enviado (se o email existir)
 */
router.post('/forgot-password', validate(authSchemas.forgotPassword), authController.forgotPassword);

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Obter perfil do usuário
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil obtido com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Token inválido
 */
router.get('/profile', authenticateToken, authController.getProfile);

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: Atualizar perfil do usuário
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               zipCode:
 *                 type: string
 *               country:
 *                 type: string
 *               birthDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Perfil atualizado com sucesso
 *       401:
 *         description: Token inválido
 */
router.put('/profile', 
  authenticateToken, 
  validate(authSchemas.updateProfile), 
  authController.updateProfile
);

/**
 * @swagger
 * /api/auth/verify-email/{userId}/{token}:
 *   get:
 *     summary: Verificar email
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Email verificado com sucesso
 *       400:
 *         description: Token inválido
 */
router.get('/verify-email/:userId/:token', authController.verifyEmail);

/**
 * @swagger
 * /api/auth/resend-verification:
 *   post:
 *     summary: Reenviar email de verificação
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Email de verificação reenviado
 *       401:
 *         description: Token inválido
 */
router.post('/resend-verification', authenticateToken, authController.resendVerificationEmail);

export default router;

