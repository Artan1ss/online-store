import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

interface DatabaseInfo {
  tables: {
    product?: {
      count?: number;
      status: string;
      error?: string;
    };
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Create a clean Prisma client for this test
  const prisma = new PrismaClient();
  let connected = false;
  let error = null;

  try {
    // Try a simple connection test
    console.log("Testing database connection...");
    const result = await prisma.$queryRaw`SELECT 1 as connected`;
    connected = true;
    
    // Get some basic database info
    const databaseInfo: DatabaseInfo = {
      tables: {}
    };
    
    try {
      const productCount = await prisma.product.count();
      databaseInfo.tables.product = {
        count: productCount,
        status: 'ok'
      };
    } catch (e) {
      databaseInfo.tables.product = {
        error: e instanceof Error ? e.message : 'Unknown error',
        status: 'error'
      };
    }
    
    // Return success response
    return res.status(200).json({
      status: 'success',
      message: 'Database connection successful',
      connected: true,
      info: databaseInfo,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    // Connection failed
    console.error("Database connection failed:", err);
    error = err.message;
    
    // Return error response
    return res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      connected: false,
      error: error,
      timestamp: new Date().toISOString()
    });
  } finally {
    // Always disconnect
    await prisma.$disconnect();
  }
} 