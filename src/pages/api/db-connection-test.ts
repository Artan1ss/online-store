import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('Testing database connection...');
    
    // Try a simple query to test the connection
    const result = await prisma.$queryRaw`SELECT 1 as connected`;
    
    // Get database statistics for diagnostics
    const productCount = await prisma.product.count();
    const orderCount = await prisma.order.count();
    const userCount = await prisma.user.count();
    
    console.log('Database connection successful');
    
    return res.status(200).json({
      status: 'success',
      message: 'Database connection successful',
      timestamp: new Date().toISOString(),
      databaseInfo: {
        connected: true,
        products: productCount,
        orders: orderCount,
        users: userCount
      }
    });
  } catch (error: any) {
    console.error('Database connection failed:', error);
    
    return res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
} 