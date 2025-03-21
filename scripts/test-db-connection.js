// Test database connection to Supabase
const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.production' });

console.log('🔍 Testing connection to Supabase database...');
console.log(`Database URL: ${process.env.DATABASE_URL.replace(/\/\/postgres:(.+?)@/, '//postgres:****@')}`);

async function testConnection() {
  const prisma = new PrismaClient();
  
  try {
    // Try to query the database
    console.log('📡 Attempting to connect...');
    
    // Simple query to test connection
    const result = await prisma.$queryRaw`SELECT current_timestamp as time, current_database() as database`;
    
    console.log('✅ Connection successful!');
    console.log('Database details:');
    console.log(`- Time on server: ${result[0].time}`);
    console.log(`- Database name: ${result[0].database}`);
    
    // Test schema existence by querying for tables
    console.log('\n📋 Checking for existing tables...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    if (tables.length === 0) {
      console.log('⚠️ No tables found. Your schema may not be deployed yet.');
    } else {
      console.log(`Found ${tables.length} tables:`);
      tables.forEach(table => {
        console.log(`- ${table.table_name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Connection failed:');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection(); 