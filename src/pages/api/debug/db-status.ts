import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow in development mode
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ 
      error: 'This endpoint is only available in development mode' 
    });
  }

  try {
    // Get model counts
    const userCount = await prisma.user.count();
    const productCount = await prisma.product.count();
    const orderCount = await prisma.order.count();
    const orderItemCount = await prisma.orderItem.count();
    const addressCount = await prisma.address.count();
    const paymentMethodCount = await prisma.paymentMethod.count();
    
    // Get sample data for each model to check structure
    const sampleProduct = productCount > 0 ? await prisma.product.findFirst({
      take: 1,
      select: {
        id: true,
        name: true,
        price: true,
        stock: true,
        createdAt: true
      }
    }) : null;
    
    const sampleOrder = orderCount > 0 ? await prisma.order.findFirst({
      take: 1,
      select: {
        id: true,
        orderNumber: true, 
        customerName: true,
        status: true,
        createdAt: true,
        totalAmount: true
      }
    }) : null;
    
    const sampleOrderItem = orderItemCount > 0 ? await prisma.orderItem.findFirst({
      take: 1,
      select: {
        id: true,
        orderId: true,
        productId: true,
        name: true,
        price: true,
        quantity: true
      }
    }) : null;
    
    // Check for orders with missing items
    const emptyOrders = await prisma.order.findMany({
      where: {
        items: {
          none: {}
        }
      },
      select: {
        id: true,
        orderNumber: true,
        createdAt: true
      }
    });
    
    // Check for invalid order items (referencing non-existing products)
    let invalidOrderItems: any[] = [];
    try {
      // This is potentially inefficient but useful for debugging
      const allOrderItems = await prisma.orderItem.findMany({
        select: {
          id: true,
          productId: true,
          orderId: true
        },
        take: 100 // Limit to prevent overload
      });
      
      const productIds = [...new Set(allOrderItems.map((item: { productId: string }) => item.productId))];
      const existingProducts = await prisma.product.findMany({
        where: {
          id: {
            in: productIds
          }
        },
        select: {
          id: true
        }
      });
      
      const existingProductIds = new Set(existingProducts.map((p: { id: string }) => p.id));
      invalidOrderItems = allOrderItems
        .filter((item: { productId: string }) => !existingProductIds.has(item.productId))
        .map((item: { id: string; productId: string; orderId: string }) => ({
          id: item.id,
          productId: item.productId,
          orderId: item.orderId
        }));
    } catch (error) {
      console.error('Error checking invalid order items:', error);
    }
    
    // Database connection status
    let dbConnectionStatus = 'OK';
    try {
      // Simple query to verify connection
      await prisma.$queryRaw`SELECT 1 as result`;
    } catch (error) {
      dbConnectionStatus = 'ERROR: ' + (error instanceof Error ? error.message : String(error));
    }

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      dbConnection: dbConnectionStatus,
      counts: {
        users: userCount,
        products: productCount,
        orders: orderCount,
        orderItems: orderItemCount,
        addresses: addressCount,
        paymentMethods: paymentMethodCount
      },
      emptyOrders: {
        count: emptyOrders.length,
        orders: emptyOrders
      },
      invalidOrderItems: {
        count: invalidOrderItems.length,
        items: invalidOrderItems
      },
      samples: {
        product: sampleProduct,
        order: sampleOrder,
        orderItem: sampleOrderItem
      }
    });
  } catch (error) {
    console.error('Error retrieving database status:', error);
    return res.status(500).json({ 
      error: 'Failed to retrieve database status', 
      message: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined 
    });
  }
} 