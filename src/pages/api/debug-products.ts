import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('[Debug Products API] Request received');

  try {
    // Test database connection
    console.log('[Debug Products API] Testing database connection...');
    const connectionTest = await prisma.$queryRaw`SELECT 1 as connected`;
    console.log('[Debug Products API] Connection test result:', connectionTest);

    // Try to get product count
    console.log('[Debug Products API] Counting products...');
    const productCount = await prisma.product.count();
    console.log(`[Debug Products API] Product count: ${productCount}`);

    // Try to retrieve a few products
    console.log('[Debug Products API] Retrieving sample products...');
    const products = await prisma.product.findMany({
      take: 3,
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Success response
    return res.status(200).json({
      status: 'success',
      message: 'Debug information retrieved successfully',
      data: {
        connectionTest,
        productCount,
        sampleProducts: products.map(p => ({
          id: p.id,
          name: p.name,
          price: p.price,
          category: p.category
        })),
        fullSampleData: products[0] || null,
        databaseInfo: {
          url: process.env.DATABASE_URL ? 'Present (redacted)' : 'Missing',
          directUrl: process.env.DIRECT_URL ? 'Present (redacted)' : 'Missing',
          env: process.env.NODE_ENV,
          timestamp: new Date().toISOString()
        }
      }
    });
  } catch (error: any) {
    console.error('[Debug Products API] Error:', error);
    
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve debug information',
      error: {
        message: error.message,
        code: error.code,
        meta: error.meta,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      timestamp: new Date().toISOString()
    });
  }
} 