export interface Product {
  id: string
  name: string
  description: string | null
  price: number
  stock: number
  category: string
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateProductDto {
  name: string
  description?: string
  price: number
  stock: number
  category: string
}

export interface UpdateProductDto {
  name?: string
  description?: string
  price?: number
  stock?: number
  category?: string
  active?: boolean
}

export interface ProductFilter {
  category?: string
  minPrice?: number
  maxPrice?: number
  search?: string
  active?: boolean
}

export interface IProductRepository {
  findById(id: string): Promise<Product | null>
  findAll(page: number, limit: number, filter: ProductFilter): Promise<{ products: Product[]; total: number }>
  create(data: CreateProductDto): Promise<Product>
  update(id: string, data: UpdateProductDto): Promise<Product>
  delete(id: string): Promise<void>
  adjustStock(id: string, quantity: number): Promise<Product>
}
