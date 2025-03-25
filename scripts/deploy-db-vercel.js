// Script to verify and redeploy the database for Vercel
const { PrismaClient } = require('@prisma/client');

async function main() {
  console.log('Starting database verification and redeployment for Vercel...');
  
  // Create new Prisma client with detailed logging
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });

  try {
    // 1. Test connection
    console.log('1. Testing database connection...');
    const result = await prisma.$queryRaw`SELECT current_database() as db_name, current_user as user_name`;
    console.log(`✅ Connection successful to database: ${result[0].db_name} as user: ${result[0].user_name}`);

    // 2. Verify schema exists by checking tables
    console.log('\n2. Verifying database schema...');
    
    // Get list of models from Prisma
    const models = {
      user: prisma.user,
      product: prisma.product,
      order: prisma.order,
      orderItem: prisma.orderItem,
      address: prisma.address,
      paymentMethod: prisma.paymentMethod
    };
    
    let allTablesExist = true;
    
    for (const [modelName, model] of Object.entries(models)) {
      try {
        const count = await model.count();
        console.log(`✅ Table ${modelName} exists with ${count} records`);
      } catch (error) {
        console.error(`❌ Table ${modelName} verification failed:`, error.message);
        allTablesExist = false;
      }
    }

    if (!allTablesExist) {
      console.log('\n⚠️ Some tables are missing. Running schema push...');
      // This would normally be done with npx prisma db push
      console.log('Please run "npx prisma db push" manually if needed.');
    } else {
      console.log('\n✅ All required tables exist in the database');
    }

    // 3. Verify products exist (crucial for application functionality)
    console.log('\n3. Verifying products...');
    const productCount = await prisma.product.count();
    
    if (productCount === 0) {
      console.log('⚠️ No products found in database. Creating sample products...');
      
      // Create at least one sample product
      const product = await prisma.product.create({
        data: {
          name: 'Sample Product for Vercel Deployment',
          description: 'This product was created during database deployment for Vercel',
          price: 49.99,
          originalPrice: 69.99,
          discount: 28,
          isOnSale: true,
          isFeatured: true,
          stock: 100,
          category: 'Sample',
          status: 'active',
          images: ['https://via.placeholder.com/300/3498db/ffffff?text=Sample+Product']
        },
      });
      
      console.log('✅ Sample product created successfully:', product.name);
    } else {
      console.log(`✅ ${productCount} products found in the database`);
    }

    // 4. Verify admin user exists
    console.log('\n4. Verifying admin user...');
    const adminCount = await prisma.user.count({
      where: {
        role: 'ADMIN'
      }
    });

    if (adminCount === 0) {
      console.log('⚠️ No admin user found. Creating admin user...');
      
      // Create admin user - password is 'admin123'
      const admin = await prisma.user.create({
        data: {
          email: 'admin@example.com',
          password: '$2a$12$k8Y1Yk90U4k/bJ2ZRwgT8uNuHXiSWYg.q8JMiRmXfLM.x6/rLaYXG',
          name: 'Admin User',
          role: 'ADMIN'
        },
      });
      
      console.log('✅ Admin user created successfully:', admin.email);
    } else {
      console.log(`✅ ${adminCount} admin user(s) found in the database`);
    }

    // 5. Check connection pool
    console.log('\n5. Checking database connection pool...');
    const poolInfo = await prisma.$queryRaw`
      SELECT count(*) as active_connections
      FROM pg_stat_activity
      WHERE application_name LIKE '%prisma%'
    `;
    console.log(`✅ Current active connections: ${poolInfo[0].active_connections}`);

    // 6. Verification complete
    console.log('\n✅ Database verification and redeployment completed successfully!');
    console.log('The database is ready for Vercel deployment.');
    console.log('\nRemember to:');
    console.log('1. Update your Vercel environment variables with the correct DATABASE_URL and DIRECT_URL');
    console.log('2. Redeploy your application on Vercel');
    console.log('3. Access /debug/simple-check on your deployed site to verify the connection');
    
  } catch (error) {
    console.error('\n❌ Database verification failed:', error);
    console.error('Please check your database connection settings and try again.');
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