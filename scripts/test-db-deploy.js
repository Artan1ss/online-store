// Simple script to test database connection and insert a product
const { PrismaClient } = require('@prisma/client');

async function main() {
  console.log('Starting database deployment test...');
  
  // Create new Prisma client
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });

  try {
    // Test connection
    console.log('Testing database connection...');
    const result = await prisma.$queryRaw`SELECT 1 as connected`;
    console.log('Connection successful!', result);

    // Count current products
    const productCount = await prisma.product.count();
    console.log(`Current product count: ${productCount}`);

    // Create a test product
    console.log('Creating test product...');
    const product = await prisma.product.create({
      data: {
        name: 'Test Product - Deployment Check',
        description: 'This product was created during database redeployment testing',
        price: 99.99,
        originalPrice: 129.99,
        discount: 20,
        isOnSale: true,
        isFeatured: true,
        stock: 10,
        category: 'Test',
        status: 'active',
        images: ['https://via.placeholder.com/300/2ecc71/ffffff?text=Test+Product']
      },
    });

    console.log('Test product created successfully:', product);

    // Create a test admin user if none exists
    const adminCount = await prisma.user.count({
      where: {
        role: 'ADMIN'
      }
    });

    if (adminCount === 0) {
      console.log('Creating test admin user...');
      const admin = await prisma.user.create({
        data: {
          email: 'admin@example.com',
          password: '$2a$12$k8Y1Yk90U4k/bJ2ZRwgT8uNuHXiSWYg.q8JMiRmXfLM.x6/rLaYXG', // hashed 'admin123'
          name: 'Admin User',
          role: 'ADMIN'
        },
      });
      console.log('Admin user created successfully:', admin);
    } else {
      console.log('Admin user already exists');
    }

    console.log('Database deployment test completed successfully!');
  } catch (error) {
    console.error('Database deployment test failed:', error);
  } finally {
    // Disconnect Prisma client
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  }); 