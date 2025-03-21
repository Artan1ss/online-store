import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

// Define the type for the database status response
interface DbStatusRow {
  time: Date;
}

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
    // Database connection check with explicit type casting
    const dbStatus = await prisma.$queryRaw`SELECT current_timestamp as time` as DbStatusRow[];
    
    // Get table metrics
    const metrics = await Promise.all([
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

    return res.status(200).json({
      status: 'online',
      timestamp: dbStatus[0].time,
      metrics: {
        users: metrics[0],
        products: metrics[1],
        orders: metrics[2],
        orderItems: metrics[3],
        addresses: metrics[4],
        paymentMethods: metrics[5]
      },
      recentOrders,
      lowStockProducts
    });
  } catch (error: any) {
    console.error('Database status check failed:', error);
    return res.status(500).json({ 
      status: 'error',
      error: error.message || 'Unknown error' 
    });
  }
} 