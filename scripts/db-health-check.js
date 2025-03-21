// Database Health Check Script
const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: process.argv[2] || '.env.production' });

const prisma = new PrismaClient();

async function healthCheck() {
  console.log('🏥 Running Database Health Check...');
  console.log(`Time: ${new Date().toISOString()}`);
  console.log('------------------------------------');
  
  try {
    // 1. Connection & Response Time Check
    console.log('1️⃣ Connection Test');
    const startTime = Date.now();
    const result = await prisma.$queryRaw`SELECT 1 as result`;
    const endTime = Date.now();
    
    console.log(`✅ Connection successful`);
    console.log(`   Response time: ${endTime - startTime}ms`);
    
    // 2. Table Counts Check
    console.log('\n2️⃣ Table Data Counts');
    const counts = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.order.count(),
      prisma.orderItem.count(),
      prisma.address.count(),
      prisma.paymentMethod.count(),
    ]);
    
    console.log(`   Users: ${counts[0]}`);
    console.log(`   Products: ${counts[1]}`);
    console.log(`   Orders: ${counts[2]}`);
    console.log(`   OrderItems: ${counts[3]}`);
    console.log(`   Addresses: ${counts[4]}`);
    console.log(`   PaymentMethods: ${counts[5]}`);
    
    // 3. Recent Activity Check
    console.log('\n3️⃣ Recent Activity');
    
    // Recent orders
    const recentOrders = await prisma.order.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
    });
    
    if (recentOrders.length > 0) {
      console.log(`   Most recent order: ${recentOrders[0].orderNumber} (${recentOrders[0].createdAt})`);
      console.log(`   Orders in last 24h: ${await prisma.order.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }
      })}`);
    } else {
      console.log('   No orders found');
    }
    
    // 4. Database size check
    console.log('\n4️⃣ Database Size Information');
    const dbSize = await prisma.$queryRaw`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size;
    `;
    console.log(`   Database size: ${dbSize[0].size}`);
    
    // 5. Table sizes
    const tableSizes = await prisma.$queryRaw`
      SELECT
        table_name,
        pg_size_pretty(pg_total_relation_size('"' || table_name || '"')) as size
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY pg_total_relation_size('"' || table_name || '"') DESC
      LIMIT 5;
    `;
    
    console.log('\n5️⃣ Top 5 Largest Tables');
    tableSizes.forEach(table => {
      console.log(`   ${table.table_name}: ${table.size}`);
    });
    
    console.log('\n✅ Health check completed successfully');
    
  } catch (error) {
    console.error('\n❌ Health check failed:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

healthCheck(); 