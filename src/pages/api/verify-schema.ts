import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Create a direct Prisma instance for introspection
    const prisma = new PrismaClient();
    
    // Get model information
    const productSchema = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Product' 
      ORDER BY column_name
    `;
    
    // Environment information
    const env = {
      nodeEnv: process.env.NODE_ENV,
      databaseUrl: process.env.DATABASE_URL ? `${process.env.DATABASE_URL.substring(0, 15)}...` : 'undefined',
      directUrl: process.env.DIRECT_URL ? `${process.env.DIRECT_URL.substring(0, 15)}...` : 'undefined',
      vercelUrl: process.env.VERCEL_URL || 'undefined',
      deployment: process.env.VERCEL_ENV || 'undefined',
    };
    
    return res.status(200).json({
      status: 'success',
      message: 'Schema verification completed',
      database: {
        product: productSchema,
      },
      environment: env,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Schema verification failed:', error);
    
    return res.status(500).json({
      status: 'error',
      message: 'Schema verification failed',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
  }
} 