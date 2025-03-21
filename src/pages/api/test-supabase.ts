import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Create a direct connection for testing
  const testPrisma = new PrismaClient({
    log: ['warn', 'error', 'query'],
  });

  // Get database URL for troubleshooting (redacted for security)
  type DbUrlInfo = string | {
    host: string;
    database: string;
    format: string;
    direct_url_present: boolean;
  };
  
  let dbUrlInfo: DbUrlInfo = 'Missing DATABASE_URL';
  
  if (process.env.DATABASE_URL) {
    const url = process.env.DATABASE_URL;
    
    // Extract components without revealing sensitive info
    const urlParts = url.split('@');
    if (urlParts.length > 1) {
      const hostPart = urlParts[1].split('/')[0];
      const dbPart = urlParts[1].split('/')[1];
      
      dbUrlInfo = {
        host: hostPart,
        database: dbPart,
        format: 'postgres://user:password@host/database',
        direct_url_present: !!process.env.DIRECT_URL,
      };
    } else {
      dbUrlInfo = 'Invalid database URL format';
    }
  }
  
  // Define the result type to include all properties we'll use
  type TestResults = {
    connection: boolean;
    queries: {
      raw: boolean;
      product: boolean;
      user: boolean;
    };
    errors: string[];
    dbInfo: DbUrlInfo;
    db_info?: any;
    product_count?: number;
    user_count?: number;
    pool_info?: any;
    timestamp: string;
  };

  // Test results
  const testResults: TestResults = {
    connection: false,
    queries: {
      raw: false,
      product: false,
      user: false,
    },
    errors: [] as string[],
    dbInfo: dbUrlInfo,
    timestamp: new Date().toISOString(),
  };

  try {
    // Test simple raw connection
    try {
      const result = await testPrisma.$queryRaw`SELECT current_database() as db_name, current_user as user_name`;
      testResults.queries.raw = true;
      testResults.connection = true;
      testResults.db_info = result;
    } catch (error: any) {
      testResults.errors.push(`Raw query failed: ${error.message}`);
    }
    
    // Test Prisma models
    try {
      const productCount = await testPrisma.product.count();
      testResults.queries.product = true;
      testResults.product_count = productCount;
    } catch (error: any) {
      testResults.errors.push(`Product query failed: ${error.message}`);
    }
    
    try {
      const userCount = await testPrisma.user.count();
      testResults.queries.user = true;
      testResults.user_count = userCount;
    } catch (error: any) {
      testResults.errors.push(`User query failed: ${error.message}`);
    }
    
    // Check connection pooling
    try {
      const poolInfo = await testPrisma.$queryRaw`
        SELECT count(*) as active_connections
        FROM pg_stat_activity
        WHERE application_name LIKE '%prisma%'
      `;
      testResults.pool_info = poolInfo;
    } catch (error: any) {
      testResults.errors.push(`Connection pool query failed: ${error.message}`);
    }

    // Return result
    res.status(200).json({
      status: testResults.connection ? 'success' : 'error',
      message: testResults.connection 
        ? 'Supabase connection successful' 
        : 'Failed to connect to Supabase',
      test_results: testResults,
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: `Test failed: ${error.message}`,
      errors: [error.message],
    });
  } finally {
    // Always disconnect the test client
    await testPrisma.$disconnect();
  }
} 