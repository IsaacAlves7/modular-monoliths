import { Prisma } from '@prisma/client'
import { prisma } from '../../../../prisma/client'
import { IProductRepository, CreateProductDto, UpdateProductDto, ProductFilter, Product } from '../../domain'

export class PrismaProductRepository implements IProductRepository {

  async findById(id: string): Promise<Product | null> {
    const p = await prisma.product.findUnique({ where: { id } })
    return p ? this.map(p) : null
  }

  async findAll(page: number, limit: number, filter: ProductFilter): Promise<{ products: Product[]; total: number }> {
    const where: Prisma.ProductWhereInput = {}

    if (filter.active !== undefined) where.active = filter.active
    else where.active = true

    if (filter.category) where.category = filter.category
    if (filter.search) where.name = { contains: filter.search, mode: 'insensitive' }
    if (filter.minPrice || filter.maxPrice) {
      where.price = {
        ...(filter.minPrice ? { gte: filter.minPrice } : {}),
        ...(filter.maxPrice ? { lte: filter.maxPrice } : {}),
      }
    }

    const skip = (page - 1) * limit
    const [products, total] = await Promise.all([
      prisma.product.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.product.count({ where }),
    ])
    return { products: products.map(this.map), total }
  }

  async create(data: CreateProductDto): Promise<Product> {
    const p = await prisma.product.create({ data })
    return this.map(p)
  }

  async update(id: string, data: UpdateProductDto): Promise<Product> {
    const p = await prisma.product.update({ where: { id }, data })
    return this.map(p)
  }

  async delete(id: string): Promise<void> {
    await prisma.product.delete({ where: { id } })
  }

  async adjustStock(id: string, quantity: number): Promise<Product> {
    const p = await prisma.product.update({
      where: { id },
      data: { stock: { increment: quantity } },
    })
    return this.map(p)
  }

  private map(p: { id: string; name: string; description: string | null; price: Prisma.Decimal; stock: number; category: string; active: boolean; createdAt: Date; updatedAt: Date }): Product {
    return { ...p, price: Number(p.price) }
  }
}
