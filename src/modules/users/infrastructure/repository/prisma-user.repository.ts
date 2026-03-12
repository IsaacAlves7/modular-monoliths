import { prisma } from '../../../../prisma/client'
import { IUserRepository, CreateUserDto, User } from '../../domain'

export class PrismaUserRepository implements IUserRepository {

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } }) as Promise<User | null>
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } }) as Promise<User | null>
  }

  async findAll(page: number, limit: number): Promise<{ users: User[]; total: number }> {
    const skip = (page - 1) * limit
    const [users, total] = await Promise.all([
      prisma.user.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.user.count(),
    ])
    return { users: users as User[], total }
  }

  async create(data: CreateUserDto & { hashedPassword: string }): Promise<User> {
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: data.hashedPassword,
        role: data.role ?? 'CUSTOMER',
      },
    })
    return user as User
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    const user = await prisma.user.update({ where: { id }, data })
    return user as User
  }

  async delete(id: string): Promise<void> {
    await prisma.user.delete({ where: { id } })
  }

  async count(): Promise<number> {
    return prisma.user.count()
  }
}
