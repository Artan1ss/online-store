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
    // Get product counts
    const productCount = await prisma.product.count();
    
    // Get a list of all product IDs
    const validProductIds = await prisma.product.findMany({
      select: { id: true }
    });
    
    // Get recent orders
    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true }
            }
          }
        }
      }
    });

    // Get recent order items
    const recentOrderItems = await prisma.orderItem.findMany({
      take: 10,
      orderBy: { orderId: 'desc' },
      include: {
        product: {
          select: { id: true, name: true }
        },
        order: {
          select: { id: true }
        }
      }
    });

    // Handle any cart items passed in the request body
    let cartDiagnosis = null;
    if (req.method === 'POST' && req.body.items) {
      const cartItems = req.body.items;
      
      // Check if all products in the cart exist
      const cartProductIds = cartItems.map(item => item.id);
      const existingProductIds = validProductIds.map(p => p.id);
      
      const invalidCartItems = cartItems.filter(item => 
        !existingProductIds.includes(item.id)
      );
      
      cartDiagnosis = {
        totalCartItems: cartItems.length,
        validItems: cartItems.length - invalidCartItems.length,
        invalidItems: invalidCartItems.length,
        invalidItemDetails: invalidCartItems,
        recommendation: invalidCartItems.length > 0 
          ? "Clear your cart and add products again." 
          : "Your cart items appear to be valid."
      };
    }

    return res.status(200).json({
      status: 'success',
      databaseStats: {
        productCount,
        validProductIds: validProductIds.map(p => p.id),
      },
      recentOrders,
      recentOrderItems,
      cartDiagnosis
    });
  } catch (error) {
    console.error('Error diagnosing cart:', error);
    return res.status(500).json({ 
      error: 'Error diagnosing cart', 
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
} 