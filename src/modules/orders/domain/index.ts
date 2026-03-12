export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'

export interface OrderItem {
  id: string
  orderId: string
  productId: string
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface Order {
  id: string
  userId: string
  status: OrderStatus
  total: number
  notes: string | null
  items: OrderItem[]
  createdAt: Date
  updatedAt: Date
}

export interface CreateOrderDto {
  userId: string
  notes?: string
  items: { productId: string; quantity: number }[]
}

export interface IOrderRepository {
  findById(id: string): Promise<Order | null>
  findByUserId(userId: string, page: number, limit: number): Promise<{ orders: Order[]; total: number }>
  findAll(page: number, limit: number, status?: OrderStatus): Promise<{ orders: Order[]; total: number }>
  create(data: CreateOrderDto & { items: (OrderItem & { unitPrice: number })[]; total: number }): Promise<Order>
  updateStatus(id: string, status: OrderStatus): Promise<Order>
}

// Valid status transitions
export const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING:    ['CONFIRMED', 'CANCELLED'],
  CONFIRMED:  ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED:    ['DELIVERED'],
  DELIVERED:  [],
  CANCELLED:  [],
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return STATUS_TRANSITIONS[from].includes(to)
}
