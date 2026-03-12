import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuid } from 'uuid'
import { prisma } from '../../../prisma/client'
import { config } from '../../../config'
import { IUserRepository, CreateUserDto, UpdateUserDto, User, toPublic, UserPublic } from '../domain'
import { NotFoundError, ConflictError, UnauthorizedError, BusinessError } from '../../../shared/errors'
import { PaginatedResult, paginate, JwtPayload } from '../../../shared/types'
import { logger } from '../../../shared/utils/logger'

// ─── Auth Tokens ──────────────────────────────────────────────────────────────
interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: string
}

function generateTokens(user: User): AuthTokens {
  const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role }

  const accessToken = jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN,
  } as jwt.SignOptions)

  const refreshToken = jwt.sign({ sub: user.id }, config.REFRESH_SECRET, {
    expiresIn: config.REFRESH_EXPIRES_IN,
  } as jwt.SignOptions)

  return { accessToken, refreshToken, expiresIn: config.JWT_EXPIRES_IN }
}

// ══════════════════════════════════════════════════════════
//  USE CASES
// ══════════════════════════════════════════════════════════

export class RegisterUserUseCase {
  constructor(private repo: IUserRepository) {}

  async execute(dto: CreateUserDto): Promise<{ user: UserPublic; tokens: AuthTokens }> {
    const exists = await this.repo.findByEmail(dto.email)
    if (exists) throw new ConflictError(`Email '${dto.email}' já está em uso.`)

    const hashedPassword = await bcrypt.hash(dto.password, 10)
    const user = await this.repo.create({ ...dto, hashedPassword })
    const tokens = generateTokens(user)

    // Salvar refresh token no banco
    await prisma.refreshToken.create({
      data: {
        id: uuid(),
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    logger.info(`Novo usuário registrado: ${user.email}`)
    return { user: toPublic(user), tokens }
  }
}

export class LoginUseCase {
  constructor(private repo: IUserRepository) {}

  async execute(email: string, password: string): Promise<{ user: UserPublic; tokens: AuthTokens }> {
    const user = await this.repo.findByEmail(email)
    if (!user) throw new UnauthorizedError('Credenciais inválidas.')
    if (!user.active) throw new BusinessError('Conta desativada. Entre em contato com o suporte.')

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) throw new UnauthorizedError('Credenciais inválidas.')

    const tokens = generateTokens(user)

    await prisma.refreshToken.create({
      data: {
        id: uuid(),
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    logger.info(`Login: ${user.email}`)
    return { user: toPublic(user), tokens }
  }
}

export class RefreshTokenUseCase {
  async execute(refreshToken: string): Promise<AuthTokens> {
    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken }, include: { user: true } })
    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedError('Refresh token inválido ou expirado.')
    }

    const tokens = generateTokens(stored.user)

    // Rotate refresh token
    await prisma.refreshToken.delete({ where: { id: stored.id } })
    await prisma.refreshToken.create({
      data: {
        id: uuid(),
        token: tokens.refreshToken,
        userId: stored.userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    return tokens
  }
}

export class GetUsersUseCase {
  constructor(private repo: IUserRepository) {}

  async execute(page = 1, limit = 10): Promise<PaginatedResult<UserPublic>> {
    const { users, total } = await this.repo.findAll(page, limit)
    return paginate(users.map(toPublic), total, page, limit)
  }
}

export class GetUserByIdUseCase {
  constructor(private repo: IUserRepository) {}

  async execute(id: string): Promise<UserPublic> {
    const user = await this.repo.findById(id)
    if (!user) throw new NotFoundError('Usuário', id)
    return toPublic(user)
  }
}

export class UpdateUserUseCase {
  constructor(private repo: IUserRepository) {}

  async execute(id: string, dto: UpdateUserDto, requesterId: string, requesterRole: string): Promise<UserPublic> {
    const user = await this.repo.findById(id)
    if (!user) throw new NotFoundError('Usuário', id)

    // Só admin pode alterar outros usuários
    if (requesterId !== id && requesterRole !== 'ADMIN') {
      throw new UnauthorizedError('Você só pode atualizar seu próprio perfil.')
    }

    const updates: Partial<User> = {}
    if (dto.name) updates.name = dto.name
    if (dto.email && dto.email !== user.email) {
      const exists = await this.repo.findByEmail(dto.email)
      if (exists) throw new ConflictError(`Email '${dto.email}' já está em uso.`)
      updates.email = dto.email
    }
    if (dto.password) updates.password = await bcrypt.hash(dto.password, 10)

    const updated = await this.repo.update(id, updates)
    return toPublic(updated)
  }
}

export class DeleteUserUseCase {
  constructor(private repo: IUserRepository) {}

  async execute(id: string): Promise<void> {
    const user = await this.repo.findById(id)
    if (!user) throw new NotFoundError('Usuário', id)
    await this.repo.update(id, { active: false })
    logger.info(`Usuário desativado: ${user.email}`)
  }
}
