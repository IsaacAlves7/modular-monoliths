import { Router, Response, NextFunction } from 'express'
import { z } from 'zod'
import { AuthRequest, authenticate, authorize, validate } from '../../../../shared/middleware'
import { success } from '../../../../shared/types'
import {
  RegisterUserUseCase, LoginUseCase, RefreshTokenUseCase,
  GetUsersUseCase, GetUserByIdUseCase, UpdateUserUseCase, DeleteUserUseCase
} from '../../application'
import { PrismaUserRepository } from '../repository/prisma-user.repository'

// ─── Validation Schemas ───────────────────────────────────────────────────────
const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).regex(/[A-Z]/, 'Precisa de maiúscula').regex(/[0-9]/, 'Precisa de número'),
  role: z.enum(['ADMIN', 'CUSTOMER']).optional(),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const updateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
})

const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
})

// ─── Repository & Use Cases ───────────────────────────────────────────────────
const repo = new PrismaUserRepository()
const registerUC  = new RegisterUserUseCase(repo)
const loginUC     = new LoginUseCase(repo)
const refreshUC   = new RefreshTokenUseCase()
const getUsersUC  = new GetUsersUseCase(repo)
const getUserUC   = new GetUserByIdUseCase(repo)
const updateUserUC = new UpdateUserUseCase(repo)
const deleteUserUC = new DeleteUserUseCase(repo)

// ─── Router ───────────────────────────────────────────────────────────────────
export const usersRouter = Router()

/**
 * @route   POST /api/users/register
 * @desc    Registrar novo usuário
 * @access  Public
 */
usersRouter.post(
  '/register',
  validate(registerSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await registerUC.execute(req.body)
      res.status(201).json(success(result, 'Usuário registrado com sucesso.'))
    } catch (err) { next(err) }
  }
)

/**
 * @route   POST /api/users/login
 * @desc    Login
 * @access  Public
 */
usersRouter.post(
  '/login',
  validate(loginSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body
      const result = await loginUC.execute(email, password)
      res.json(success(result, 'Login realizado com sucesso.'))
    } catch (err) { next(err) }
  }
)

/**
 * @route   POST /api/users/refresh
 * @desc    Renovar access token
 * @access  Public
 */
usersRouter.post(
  '/refresh',
  validate(z.object({ refreshToken: z.string() })),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const tokens = await refreshUC.execute(req.body.refreshToken)
      res.json(success(tokens))
    } catch (err) { next(err) }
  }
)

/**
 * @route   GET /api/users/me
 * @desc    Perfil do usuário logado
 * @access  Private
 */
usersRouter.get(
  '/me',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = await getUserUC.execute(req.user!.sub)
      res.json(success(user))
    } catch (err) { next(err) }
  }
)

/**
 * @route   GET /api/users
 * @desc    Listar usuários (admin only)
 * @access  Admin
 */
usersRouter.get(
  '/',
  authenticate,
  authorize('ADMIN'),
  validate(paginationSchema, 'query'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { page, limit } = req.query as { page: string; limit: string }
      const result = await getUsersUC.execute(Number(page), Number(limit))
      res.json(success(result))
    } catch (err) { next(err) }
  }
)

/**
 * @route   GET /api/users/:id
 * @desc    Buscar usuário por ID
 * @access  Private
 */
usersRouter.get(
  '/:id',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = await getUserUC.execute(req.params.id)
      res.json(success(user))
    } catch (err) { next(err) }
  }
)

/**
 * @route   PUT /api/users/:id
 * @desc    Atualizar usuário
 * @access  Private (own) | Admin
 */
usersRouter.put(
  '/:id',
  authenticate,
  validate(updateSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = await updateUserUC.execute(
        req.params.id, req.body, req.user!.sub, req.user!.role
      )
      res.json(success(user, 'Usuário atualizado.'))
    } catch (err) { next(err) }
  }
)

/**
 * @route   DELETE /api/users/:id
 * @desc    Desativar usuário
 * @access  Admin
 */
usersRouter.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await deleteUserUC.execute(req.params.id)
      res.json(success(null, 'Usuário desativado.'))
    } catch (err) { next(err) }
  }
)
