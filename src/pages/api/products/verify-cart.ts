import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        error: 'Invalid request body',
        message: 'Please provide a valid items array' 
      });
    }

    // Extract product IDs from cart items
    const cartProductIds = items.map(item => item.id);
    
    // Fetch actual products from the database
    const existingProducts = await prisma.product.findMany({
      where: {
        id: {
          in: cartProductIds
        }
      },
      select: {
        id: true,
        name: true,
        price: true,
        stock: true,
        images: true
      }
    });

    // Create lookup map for faster checking
    const productMap = new Map();
    existingProducts.forEach(product => {
      productMap.set(product.id, product);
    });

    // Validate each cart item
    const validatedItems = [];
    const removedItems = [];
    const updatedItems = [];

    for (const item of items) {
      const product = productMap.get(item.id);
      
      if (!product) {
        // Product doesn't exist in database
        removedItems.push({
          id: item.id,
          name: item.name,
          reason: 'Product no longer exists in the database'
        });
        continue;
      }
      
      // Check for stock issues or other discrepancies
      if (product.stock < 1) {
        removedItems.push({
          id: item.id,
          name: product.name,
          reason: 'Product is out of stock'
        });
        continue;
      }

      // Check if quantities need adjustment
      if (item.quantity > product.stock) {
        updatedItems.push({
          id: item.id,
          name: product.name,
          oldQuantity: item.quantity,
          newQuantity: product.stock,
          reason: 'Quantity adjusted to match available stock'
        });
        
        validatedItems.push({
          ...item,
          quantity: product.stock,
          price: product.price, // Use current price from database
          name: product.name,
          image: product.images && product.images.length > 0 ? product.images[0] : item.image
        });
      } else {
        // Item is valid
        validatedItems.push({
          ...item,
          price: product.price, // Use current price from database
          name: product.name,
          image: product.images && product.images.length > 0 ? product.images[0] : item.image
        });
      }
    }

    return res.status(200).json({
      success: true,
      validItems: validatedItems,
      validCount: validatedItems.length,
      removedItems,
      updatedItems,
      needsUpdate: removedItems.length > 0 || updatedItems.length > 0,
      message: `Cart validation complete. Found ${validatedItems.length} valid items, removed ${removedItems.length}, updated ${updatedItems.length}.`
    });
  } catch (error: any) {
    console.error('Error validating cart:', error);
    return res.status(500).json({
      error: 'Failed to validate cart items',
      message: error.message
    });
  }
} 