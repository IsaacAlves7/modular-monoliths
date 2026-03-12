import { Prisma } from '@prisma/client'
import { prisma } from '../../../../prisma/client'
import { IOrderRepository, CreateOrderDto, Order, OrderItem, OrderStatus } from '../../domain'

type PrismaOrder = Prisma.OrderGetPayload<{ include: { items: true } }>

export class PrismaOrderRepository implements IOrderRepository {

  async findById(id: string): Promise<Order | null> {
    const o = await prisma.order.findUnique({ where: { id }, include: { items: true } })
    return o ? this.map(o) : null
  }

  async findByUserId(userId: string, page: number, limit: number): Promise<{ orders: Order[]; total: number }> {
    const where = { userId }
    const skip = (page - 1) * limit
    const [orders, total] = await Promise.all([
      prisma.order.findMany({ where, skip, take: limit, include: { items: true }, orderBy: { createdAt: 'desc' } }),
      prisma.order.count({ where }),
    ])
    return { orders: orders.map(this.map), total }
  }

  async findAll(page: number, limit: number, status?: OrderStatus): Promise<{ orders: Order[]; total: number }> {
    const where: Prisma.OrderWhereInput = status ? { status } : {}
    const skip = (page - 1) * limit
    const [orders, total] = await Promise.all([
      prisma.order.findMany({ where, skip, take: limit, include: { items: true }, orderBy: { createdAt: 'desc' } }),
      prisma.order.count({ where }),
    ])
    return { orders: orders.map(this.map), total }
  }

  async create(data: CreateOrderDto & { items: OrderItem[]; total: number }): Promise<Order> {
    const o = await prisma.order.create({
      data: {
        userId: data.userId,
        total: data.total,
        notes: data.notes,
        items: {
          create: data.items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            subtotal: i.subtotal,
          })),
        },
      },
      include: { items: true },
    })
    return this.map(o)
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const o = await prisma.order.update({
      where: { id },
      data: { status },
      include: { items: true },
    })
    return this.map(o)
  }

  private map(o: PrismaOrder): Order {
    return {
      id: o.id,
      userId: o.userId,
      status: o.status as OrderStatus,
      total: Number(o.total),
      notes: o.notes,
      items: o.items.map((i) => ({
        id: i.id,
        orderId: i.orderId,
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: Number(i.unitPrice),
        subtotal: Number(i.subtotal),
      })),
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
    }
  }
}
