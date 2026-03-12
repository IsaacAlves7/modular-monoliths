import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@example.com',
      password: await bcrypt.hash('Admin@123', 10),
      role: 'ADMIN',
    },
  })

  // Customer user
  const customer = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      name: 'João Silva',
      email: 'customer@example.com',
      password: await bcrypt.hash('Customer@123', 10),
      role: 'CUSTOMER',
    },
  })

  // Products
  const products = await Promise.all([
    prisma.product.upsert({
      where: { id: 'prod-001' },
      update: {},
      create: {
        id: 'prod-001',
        name: 'Notebook Pro X1',
        description: 'Notebook profissional com Intel i7',
        price: 4999.99,
        stock: 50,
        category: 'Electronics',
      },
    }),
    prisma.product.upsert({
      where: { id: 'prod-002' },
      update: {},
      create: {
        id: 'prod-002',
        name: 'Mouse Ergonômico',
        description: 'Mouse sem fio ergonômico',
        price: 249.90,
        stock: 200,
        category: 'Accessories',
      },
    }),
    prisma.product.upsert({
      where: { id: 'prod-003' },
      update: {},
      create: {
        id: 'prod-003',
        name: 'Teclado Mecânico',
        description: 'Teclado mecânico RGB',
        price: 599.00,
        stock: 100,
        category: 'Accessories',
      },
    }),
  ])

  console.log('✅ Seed concluído!')
  console.log(`   Admin: admin@example.com / Admin@123`)
  console.log(`   Customer: customer@example.com / Customer@123`)
  console.log(`   ${products.length} produtos criados`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
