import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

type DbMetrics = {
  users: number;
  products: number;
  orders: number;
  orderItems: number;
  addresses: number;
  paymentMethods: number;
};

type DbResponse = {
  status: 'online' | 'error';
  timestamp: Date;
  metrics?: DbMetrics;
  recentOrders?: any[];
  lowStockProducts?: any[];
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DbResponse>
) {
  // Check authentication and admin role
  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user?.role !== 'ADMIN') {
    return res.status(403).json({ 
      status: 'error', 
      timestamp: new Date(),
      error: 'Unauthorized' 
    });
  }

  try {
    // Database connection check - explicitly defining the return type
    const dbStatusResult = await prisma.$queryRaw<Array<{time: Date}>>`
      SELECT current_timestamp as time
    `;
    
    const timestamp = dbStatusResult[0]?.time || new Date();
    
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

    const responseData: DbResponse = {
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
    };

    return res.status(200).json(responseData);
    
  } catch (error: any) {
    console.error('Database status check failed:', error);
    const errorResponse: DbResponse = {
      status: 'error',
      timestamp: new Date(),
      error: error?.message || 'Unknown database error'
    };
    return res.status(500).json(errorResponse);
  }
} 