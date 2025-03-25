import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

// Simple direct database connection for diagnostics
const diagnosticPrisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const diagnosticInfo: any = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    vercel: {
      env: process.env.VERCEL_ENV || 'unknown',
      region: process.env.VERCEL_REGION || 'unknown',
      url: process.env.VERCEL_URL || 'unknown',
    },
    database: {
      status: 'pending',
      connection: false,
      error: null,
      tables: [],
      query_test: null,
    },
    system: {
      platform: process.platform,
      arch: process.arch,
      node: process.version,
      memory: process.memoryUsage(),
    },
    headers: {
      host: req.headers.host,
      'user-agent': req.headers['user-agent'],
    }
  };

  // Database connection test
  try {
    // Test raw connection
    diagnosticInfo.database.connection = 'testing';
    const testConnection = await diagnosticPrisma.$queryRaw`SELECT 1 as connected`;
    diagnosticInfo.database.connection = !!testConnection;
    
    // Try to access a simple database table
    try {
      const users = await diagnosticPrisma.user.count();
      diagnosticInfo.database.tables.push({
        name: 'User',
        count: users,
        status: 'ok'
      });
    } catch (error: any) {
      diagnosticInfo.database.tables.push({
        name: 'User',
        error: error.message,
        status: 'error'
      });
    }
    
    try {
      const products = await diagnosticPrisma.product.count();
      diagnosticInfo.database.tables.push({
        name: 'Product',
        count: products,
        status: 'ok'
      });
    } catch (error: any) {
      diagnosticInfo.database.tables.push({
        name: 'Product',
        error: error.message,
        status: 'error'
      });
    }
    
    // Check for specific fields in the Product table
    try {
      const productFields = await diagnosticPrisma.$queryRaw`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'Product'
      `;
      diagnosticInfo.database.schema = { Product: productFields };
    } catch (error: any) {
      diagnosticInfo.database.schema = { error: error.message };
    }
    
    // Report overall status
    diagnosticInfo.database.status = 'connected';
  } catch (error: any) {
    diagnosticInfo.database.status = 'error';
    diagnosticInfo.database.error = {
      message: error.message,
      code: error.code,
      meta: error.meta,
    };
  }
  
  // Database credentials check (redacted for security)
  if (process.env.DATABASE_URL) {
    const dbUrlParts = process.env.DATABASE_URL.split('@');
    // Use a safer approach to access array elements
    const firstPart = dbUrlParts[0]; // This might be undefined in TypeScript's view
    
    if (firstPart && firstPart.includes('://')) {
      const urlParts = firstPart.split('://');
      const credentials = urlParts.length > 1 ? urlParts[1] : '';
      
      if (credentials && credentials.includes(':')) {
        const [user, pass] = credentials.split(':');
        
        diagnosticInfo.database.credentials = {
          user: user || 'missing',
          password: pass ? '********' : 'missing',
          format: dbUrlParts.length > 1 ? 'valid' : 'invalid',
          url_length: process.env.DATABASE_URL.length,
        };
      } else {
        diagnosticInfo.database.credentials = {
          error: 'Invalid credentials format in DATABASE_URL'
        };
      }
    } else {
      diagnosticInfo.database.credentials = {
        error: 'Invalid DATABASE_URL format'
      };
    }
  } else {
    diagnosticInfo.database.credentials = {
      error: 'DATABASE_URL environment variable is missing'
    };
  }
  
  // Response
  res.status(200).json({
    status: diagnosticInfo.database.status === 'connected' ? 'success' : 'error',
    message: diagnosticInfo.database.status === 'connected' 
      ? 'Diagnostic completed successfully' 
      : 'Diagnostic completed with errors',
    diagnostics: diagnosticInfo
  });
  
  // Clean up the diagnostic connection
  await diagnosticPrisma.$disconnect();
} 