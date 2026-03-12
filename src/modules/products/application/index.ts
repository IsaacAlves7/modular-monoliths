import { IProductRepository, CreateProductDto, UpdateProductDto, ProductFilter, Product } from '../domain'
import { NotFoundError, BusinessError } from '../../../shared/errors'
import { PaginatedResult, paginate } from '../../../shared/types'
import { logger } from '../../../shared/utils/logger'

export class CreateProductUseCase {
  constructor(private repo: IProductRepository) {}

  async execute(dto: CreateProductDto): Promise<Product> {
    const product = await this.repo.create(dto)
    logger.info(`Produto criado: ${product.name} (${product.id})`)
    return product
  }
}

export class GetProductsUseCase {
  constructor(private repo: IProductRepository) {}

  async execute(page = 1, limit = 10, filter: ProductFilter = {}): Promise<PaginatedResult<Product>> {
    const { products, total } = await this.repo.findAll(page, limit, filter)
    return paginate(products, total, page, limit)
  }
}

export class GetProductByIdUseCase {
  constructor(private repo: IProductRepository) {}

  async execute(id: string): Promise<Product> {
    const product = await this.repo.findById(id)
    if (!product) throw new NotFoundError('Produto', id)
    return product
  }
}

export class UpdateProductUseCase {
  constructor(private repo: IProductRepository) {}

  async execute(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.repo.findById(id)
    if (!product) throw new NotFoundError('Produto', id)
    return this.repo.update(id, dto)
  }
}

export class DeleteProductUseCase {
  constructor(private repo: IProductRepository) {}

  async execute(id: string): Promise<void> {
    const product = await this.repo.findById(id)
    if (!product) throw new NotFoundError('Produto', id)
    await this.repo.update(id, { active: false })
    logger.info(`Produto desativado: ${product.id}`)
  }
}

export class AdjustStockUseCase {
  constructor(private repo: IProductRepository) {}

  async execute(id: string, quantity: number): Promise<Product> {
    const product = await this.repo.findById(id)
    if (!product) throw new NotFoundError('Produto', id)

    const newStock = product.stock + quantity
    if (newStock < 0) {
      throw new BusinessError(`Estoque insuficiente. Disponível: ${product.stock}, solicitado: ${Math.abs(quantity)}`)
    }

    return this.repo.adjustStock(id, quantity)
  }
}
