import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Check authentication and admin role
  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
    // Database connection check - using a specific SQL approach that TypeScript understands better
    const dbStatus: { time: Date }[] = await prisma.$queryRaw`
      SELECT current_timestamp::timestamp as time
    `;
    
    // Get table metrics
    const [
      userCount,
      productCount,
      orderCount,
      orderItemCount,
      addressCount,
      paymentMethodCount
    ] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.order.count(),
      prisma.orderItem.count(),
      prisma.address.count(),
      prisma.paymentMethod.count(),
    ]);
    
    // Get recent orders
    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        totalAmount: true,
        status: true,
        createdAt: true,
      }
    });

    // Get low stock products
    const lowStockProducts = await prisma.product.findMany({
      where: {
        stock: { lt: 10 }
      },
      select: {
        id: true,
        name: true,
        stock: true,
      },
      orderBy: { stock: 'asc' },
      take: 10
    });

    // Get current timestamp as a fallback if the query fails
    const timestamp = dbStatus[0]?.time || new Date();

    return res.status(200).json({
      status: 'online',
      timestamp,
      metrics: {
        users: userCount,
        products: productCount,
        orders: orderCount,
        orderItems: orderItemCount,
        addresses: addressCount,
        paymentMethods: paymentMethodCount
      },
      recentOrders,
      lowStockProducts
    });
  } catch (error: any) {
    console.error('Database status check failed:', error);
    return res.status(500).json({ 
      status: 'error',
      error: error?.message || 'Unknown database error'
    });
  }
} 