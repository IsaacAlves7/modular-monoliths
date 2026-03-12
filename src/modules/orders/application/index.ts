import { IOrderRepository, CreateOrderDto, Order, OrderStatus, canTransition } from '../domain'
import { IProductRepository } from '../../products/domain'
import { NotFoundError, BusinessError, ForbiddenError } from '../../../shared/errors'
import { PaginatedResult, paginate } from '../../../shared/types'
import { logger } from '../../../shared/utils/logger'

export class CreateOrderUseCase {
  constructor(
    private orderRepo: IOrderRepository,
    private productRepo: IProductRepository
  ) {}

  async execute(dto: CreateOrderDto): Promise<Order> {
    if (!dto.items.length) throw new BusinessError('Pedido deve ter pelo menos 1 item.')

    // Resolve products and validate stock
    const enrichedItems = await Promise.all(
      dto.items.map(async (item) => {
        const product = await this.productRepo.findById(item.productId)
        if (!product) throw new NotFoundError('Produto', item.productId)
        if (!product.active) throw new BusinessError(`Produto '${product.name}' não está disponível.`)
        if (product.stock < item.quantity) {
          throw new BusinessError(`Estoque insuficiente para '${product.name}'. Disponível: ${product.stock}`)
        }
        const subtotal = Number((product.price * item.quantity).toFixed(2))
        return {
          id: '',
          orderId: '',
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: product.price,
          subtotal,
        }
      })
    )

    const total = Number(enrichedItems.reduce((s, i) => s + i.subtotal, 0).toFixed(2))

    // Deduct stock for each product
    await Promise.all(
      enrichedItems.map((i) => this.productRepo.adjustStock(i.productId, -i.quantity))
    )

    const order = await this.orderRepo.create({ ...dto, items: enrichedItems, total })
    logger.info(`Pedido criado: ${order.id} | userId: ${dto.userId} | total: R$${total}`)
    return order
  }
}

export class GetOrdersUseCase {
  constructor(private repo: IOrderRepository) {}

  async execute(page = 1, limit = 10, status?: OrderStatus): Promise<PaginatedResult<Order>> {
    const { orders, total } = await this.repo.findAll(page, limit, status)
    return paginate(orders, total, page, limit)
  }
}

export class GetMyOrdersUseCase {
  constructor(private repo: IOrderRepository) {}

  async execute(userId: string, page = 1, limit = 10): Promise<PaginatedResult<Order>> {
    const { orders, total } = await this.repo.findByUserId(userId, page, limit)
    return paginate(orders, total, page, limit)
  }
}

export class GetOrderByIdUseCase {
  constructor(private repo: IOrderRepository) {}

  async execute(id: string, requesterId: string, requesterRole: string): Promise<Order> {
    const order = await this.repo.findById(id)
    if (!order) throw new NotFoundError('Pedido', id)

    // Customer só pode ver seus próprios pedidos
    if (requesterRole !== 'ADMIN' && order.userId !== requesterId) {
      throw new ForbiddenError('Você não tem permissão para ver este pedido.')
    }

    return order
  }
}

export class UpdateOrderStatusUseCase {
  constructor(private repo: IOrderRepository) {}

  async execute(id: string, newStatus: OrderStatus, requesterId: string, requesterRole: string): Promise<Order> {
    const order = await this.repo.findById(id)
    if (!order) throw new NotFoundError('Pedido', id)

    // Customer só pode cancelar o próprio pedido
    if (requesterRole !== 'ADMIN') {
      if (order.userId !== requesterId) throw new ForbiddenError('Acesso negado.')
      if (newStatus !== 'CANCELLED') throw new ForbiddenError('Clientes só podem cancelar pedidos.')
    }

    if (!canTransition(order.status, newStatus)) {
      throw new BusinessError(
        `Transição inválida: '${order.status}' → '${newStatus}'.`
      )
    }

    const updated = await this.repo.updateStatus(id, newStatus)
    logger.info(`Pedido ${id}: ${order.status} → ${newStatus}`)
    return updated
  }
}
