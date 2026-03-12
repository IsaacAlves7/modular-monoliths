import { Router, Response, NextFunction } from 'express'
import { z } from 'zod'
import { AuthRequest, authenticate, authorize, validate } from '../../../../shared/middleware'
import { success } from '../../../../shared/types'
import {
  CreateProductUseCase, GetProductsUseCase, GetProductByIdUseCase,
  UpdateProductUseCase, DeleteProductUseCase, AdjustStockUseCase
} from '../../application'
import { PrismaProductRepository } from '../repository/prisma-product.repository'

const repo = new PrismaProductRepository()
const createUC    = new CreateProductUseCase(repo)
const getListUC   = new GetProductsUseCase(repo)
const getOneUC    = new GetProductByIdUseCase(repo)
const updateUC    = new UpdateProductUseCase(repo)
const deleteUC    = new DeleteProductUseCase(repo)
const stockUC     = new AdjustStockUseCase(repo)

const createSchema = z.object({
  name:        z.string().min(2).max(200),
  description: z.string().optional(),
  price:       z.number().positive(),
  stock:       z.number().int().min(0),
  category:    z.string().min(1),
})

const updateSchema = createSchema.partial().extend({
  active: z.boolean().optional()
})

const filterSchema = z.object({
  page:      z.coerce.number().min(1).default(1),
  limit:     z.coerce.number().min(1).max(100).default(10),
  category:  z.string().optional(),
  search:    z.string().optional(),
  minPrice:  z.coerce.number().optional(),
  maxPrice:  z.coerce.number().optional(),
})

const stockSchema = z.object({
  quantity: z.number().int().refine(q => q !== 0, 'Quantidade não pode ser 0'),
})

export const productsRouter = Router()

/** GET /api/products — público */
productsRouter.get(
  '/',
  validate(filterSchema, 'query'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { page, limit, ...filter } = req.query as z.infer<typeof filterSchema>
      const result = await getListUC.execute(Number(page), Number(limit), filter)
      res.json(success(result))
    } catch (err) { next(err) }
  }
)

/** GET /api/products/:id — público */
productsRouter.get(
  '/:id',
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const product = await getOneUC.execute(req.params.id)
      res.json(success(product))
    } catch (err) { next(err) }
  }
)

/** POST /api/products — admin */
productsRouter.post(
  '/',
  authenticate, authorize('ADMIN'),
  validate(createSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const product = await createUC.execute(req.body)
      res.status(201).json(success(product, 'Produto criado.'))
    } catch (err) { next(err) }
  }
)

/** PUT /api/products/:id — admin */
productsRouter.put(
  '/:id',
  authenticate, authorize('ADMIN'),
  validate(updateSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const product = await updateUC.execute(req.params.id, req.body)
      res.json(success(product, 'Produto atualizado.'))
    } catch (err) { next(err) }
  }
)

/** PATCH /api/products/:id/stock — admin */
productsRouter.patch(
  '/:id/stock',
  authenticate, authorize('ADMIN'),
  validate(stockSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const product = await stockUC.execute(req.params.id, req.body.quantity)
      res.json(success(product, 'Estoque ajustado.'))
    } catch (err) { next(err) }
  }
)

/** DELETE /api/products/:id — admin */
productsRouter.delete(
  '/:id',
  authenticate, authorize('ADMIN'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await deleteUC.execute(req.params.id)
      res.json(success(null, 'Produto desativado.'))
    } catch (err) { next(err) }
  }
)
