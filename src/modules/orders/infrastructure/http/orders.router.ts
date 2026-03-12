import { Router, Response, NextFunction } from 'express'
import { z } from 'zod'
import { AuthRequest, authenticate, authorize, validate } from '../../../../shared/middleware'
import { success } from '../../../../shared/types'
import {
  CreateOrderUseCase, GetOrdersUseCase, GetMyOrdersUseCase,
  GetOrderByIdUseCase, UpdateOrderStatusUseCase
} from '../../application'
import { PrismaOrderRepository } from '../repository/prisma-order.repository'
import { PrismaProductRepository } from '../../../products/infrastructure/repository/prisma-product.repository'

const orderRepo   = new PrismaOrderRepository()
const productRepo = new PrismaProductRepository()

const createUC       = new CreateOrderUseCase(orderRepo, productRepo)
const getListUC      = new GetOrdersUseCase(orderRepo)
const getMyOrdersUC  = new GetMyOrdersUseCase(orderRepo)
const getOneUC       = new GetOrderByIdUseCase(orderRepo)
const updateStatusUC = new UpdateOrderStatusUseCase(orderRepo)

const createSchema = z.object({
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity:  z.number().int().min(1),
  })).min(1, 'Mínimo 1 item'),
})

const statusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
})

const paginationSchema = z.object({
  page:   z.coerce.number().min(1).default(1),
  limit:  z.coerce.number().min(1).max(100).default(10),
  status: z.enum(['PENDING','CONFIRMED','PROCESSING','SHIPPED','DELIVERED','CANCELLED']).optional(),
})

export const ordersRouter = Router()

/** POST /api/orders — Create */
ordersRouter.post(
  '/',
  authenticate,
  validate(createSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const order = await createUC.execute({ ...req.body, userId: req.user!.sub })
      res.status(201).json(success(order, 'Pedido criado com sucesso.'))
    } catch (err) { next(err) }
  }
)

/** GET /api/orders/me — My orders */
ordersRouter.get(
  '/me',
  authenticate,
  validate(paginationSchema, 'query'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { page, limit } = req.query as { page: string; limit: string }
      const result = await getMyOrdersUC.execute(req.user!.sub, Number(page), Number(limit))
      res.json(success(result))
    } catch (err) { next(err) }
  }
)

/** GET /api/orders — Admin: list all */
ordersRouter.get(
  '/',
  authenticate, authorize('ADMIN'),
  validate(paginationSchema, 'query'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { page, limit, status } = req.query as z.infer<typeof paginationSchema>
      const result = await getListUC.execute(Number(page), Number(limit), status)
      res.json(success(result))
    } catch (err) { next(err) }
  }
)

/** GET /api/orders/:id */
ordersRouter.get(
  '/:id',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const order = await getOneUC.execute(req.params.id, req.user!.sub, req.user!.role)
      res.json(success(order))
    } catch (err) { next(err) }
  }
)

/** PATCH /api/orders/:id/status */
ordersRouter.patch(
  '/:id/status',
  authenticate,
  validate(statusSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const order = await updateStatusUC.execute(
        req.params.id, req.body.status, req.user!.sub, req.user!.role
      )
      res.json(success(order, `Status atualizado para ${order.status}.`))
    } catch (err) { next(err) }
  }
)
