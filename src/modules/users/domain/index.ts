// ══════════════════════════════════════════════════════════
//  MODULE: Users — Domain Layer
//  Contém: entidades, interfaces de repositório e regras
// ══════════════════════════════════════════════════════════

export type UserRole = 'ADMIN' | 'CUSTOMER'

export interface User {
  id: string
  name: string
  email: string
  password: string
  role: UserRole
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export interface UserPublic {
  id: string
  name: string
  email: string
  role: UserRole
  active: boolean
  createdAt: Date
}

export interface CreateUserDto {
  name: string
  email: string
  password: string
  role?: UserRole
}

export interface UpdateUserDto {
  name?: string
  email?: string
  password?: string
}

export interface IUserRepository {
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  findAll(page: number, limit: number): Promise<{ users: User[]; total: number }>
  create(data: CreateUserDto & { hashedPassword: string }): Promise<User>
  update(id: string, data: Partial<User>): Promise<User>
  delete(id: string): Promise<void>
  count(): Promise<number>
}

// Remover dados sensíveis
export function toPublic(user: User): UserPublic {
  const { password: _p, updatedAt: _u, ...pub } = user
  return pub as UserPublic
}
