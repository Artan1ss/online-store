import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow in development mode
  if (process.env.NODE_ENV !== 'development') {
    return res.status(404).json({ error: 'Not available in production mode' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Sample products data with fixed IDs for testing
    const products = [
      {
        name: 'Wireless Headphones',
        description: 'High-quality wireless headphones with active noise cancellation, comfortable fit, and long battery life.',
        price: 199.99,
        originalPrice: 299.99,
        discount: 33,
        isOnSale: true,
        isFeatured: true,
        stock: 50,
        category: 'Electronics',
        status: 'active',
        images: ['https://via.placeholder.com/300/3498db/ffffff?text=Wireless+Headphones']
      },
      {
        name: 'Smart Watch',
        description: 'Feature-rich smartwatch with health tracking, heart rate monitoring, message notifications, and more.',
        price: 299.99,
        originalPrice: 399.99,
        discount: 25,
        isOnSale: true,
        isFeatured: false,
        stock: 30,
        category: 'Electronics',
        status: 'active',
        images: ['https://via.placeholder.com/300/2ecc71/ffffff?text=Smart+Watch']
      },
      {
        name: 'Running Shoes',
        description: 'Professional running shoes used by athletes, lightweight and breathable with excellent support and cushioning.',
        price: 89.99,
        originalPrice: null,
        discount: null,
        isOnSale: false,
        isFeatured: true,
        stock: 100,
        category: 'Sports',
        status: 'active',
        images: ['https://via.placeholder.com/300/e74c3c/ffffff?text=Running+Shoes']
      },
      {
        name: 'Professional Camera',
        description: 'High-resolution professional digital camera with quality lenses, suitable for professional photographers.',
        price: 1299.99,
        originalPrice: 1599.99,
        discount: 18,
        isOnSale: true,
        isFeatured: true,
        stock: 15,
        category: 'Electronics',
        status: 'active',
        images: ['https://via.placeholder.com/300/9b59b6/ffffff?text=Camera']
      },
      {
        name: 'Laptop',
        description: 'Thin and high-performance laptop with the latest processor and high-speed SSD, suitable for work and entertainment.',
        price: 899.99,
        originalPrice: 1099.99,
        discount: 18,
        isOnSale: true,
        isFeatured: false,
        stock: 25,
        category: 'Electronics',
        status: 'active',
        images: ['https://via.placeholder.com/300/34495e/ffffff?text=Laptop']
      }
    ];

    // Clear existing products if requested
    if (req.query.clear === 'true') {
      console.log('Clearing existing order items and products...');
      await prisma.orderItem.deleteMany({});
      await prisma.order.deleteMany({});
      await prisma.product.deleteMany({});
      console.log('Existing data cleared');
    }
    
    // Create the products
    console.log('Creating sample products...');
    const createdProducts = [];
    for (const product of products) {
      const createdProduct = await prisma.product.create({
        data: product
      });
      createdProducts.push(createdProduct);
    }
    
    return res.status(200).json({
      success: true,
      message: `Created ${createdProducts.length} sample products`,
      products: createdProducts
    });
  } catch (error: any) {
    console.error('Error seeding products:', error);
    return res.status(500).json({
      error: 'Failed to seed products',
      message: error.message
    });
  }
} 