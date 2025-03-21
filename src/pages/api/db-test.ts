import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow in development mode
  if (process.env.NODE_ENV !== 'development') {
    return res.status(404).json({ error: 'Not available in production mode' });
  }

  try {
    const { productIds } = req.query;

    // Basic database connection test
    console.log('Testing database connection...');
    const result = await prisma.$queryRaw`SELECT 1 as connected`;
    
    // Get sample products to verify they exist
    const products = await prisma.product.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        price: true
      }
    });

    // If specific product IDs are provided, check them
    let specificProducts: any = null;
    if (productIds) {
      const ids = Array.isArray(productIds) 
        ? productIds 
        : [productIds];
      
      specificProducts = await prisma.product.findMany({
        where: {
          id: {
            in: ids
          }
        },
        select: {
          id: true,
          name: true,
          price: true
        }
      });
    }
    
    // Check database tables and counts
    const productCount = await prisma.product.count();
    const userCount = await prisma.user.count();
    const orderCount = await prisma.order.count();
    const orderItemCount = await prisma.orderItem.count();
    
    return res.status(200).json({
      status: 'ok',
      message: 'Database is connected',
      counts: {
        products: productCount,
        users: userCount,
        orders: orderCount,
        orderItems: orderItemCount
      },
      sampleProducts: products,
      specificProducts,
      dbTest: result
    });
  } catch (error: any) {
    console.error('Database connection error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 