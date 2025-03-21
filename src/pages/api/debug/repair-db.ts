import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow in development mode
  if (process.env.NODE_ENV !== 'development') {
    return res.status(404).json({ error: 'Not available in production mode' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed, use POST' });
  }

  try {
    const operations = [];
    const results = {
      orderItems: 0,
      orders: 0,
      messages: []
    };

    // Step 1: Find and remove any orderItems with invalid product references
    console.log('Checking for invalid order items...');
    const orderItems = await prisma.orderItem.findMany({
      include: {
        product: true
      }
    });

    const invalidOrderItems = orderItems.filter(item => !item.product);
    if (invalidOrderItems.length > 0) {
      console.log(`Found ${invalidOrderItems.length} invalid order items to clean up`);
      results.messages.push(`Found ${invalidOrderItems.length} invalid order items`);
      
      // Delete invalid order items
      const deleteResult = await prisma.orderItem.deleteMany({
        where: {
          id: {
            in: invalidOrderItems.map(item => item.id)
          }
        }
      });
      
      results.orderItems = deleteResult.count;
      results.messages.push(`Deleted ${deleteResult.count} invalid order items`);
    } else {
      results.messages.push('No invalid order items found');
    }

    // Step 2: Find and remove empty orders (orders with no items)
    console.log('Checking for empty orders...');
    const orders = await prisma.order.findMany({
      include: {
        items: true
      }
    });

    const emptyOrders = orders.filter(order => order.items.length === 0);
    if (emptyOrders.length > 0) {
      console.log(`Found ${emptyOrders.length} empty orders to clean up`);
      results.messages.push(`Found ${emptyOrders.length} empty orders`);
      
      // Delete empty orders
      const deleteResult = await prisma.order.deleteMany({
        where: {
          id: {
            in: emptyOrders.map(order => order.id)
          }
        }
      });
      
      results.orders = deleteResult.count;
      results.messages.push(`Deleted ${deleteResult.count} empty orders`);
    } else {
      results.messages.push('No empty orders found');
    }

    // Return database stats after cleanup
    const stats = {
      products: await prisma.product.count(),
      orders: await prisma.order.count(),
      orderItems: await prisma.orderItem.count(),
      users: await prisma.user.count(),
    };

    return res.status(200).json({
      success: true,
      results,
      stats,
      message: 'Database cleanup completed successfully'
    });
  } catch (error: any) {
    console.error('Database repair error:', error);
    return res.status(500).json({
      error: 'Failed to repair database',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 