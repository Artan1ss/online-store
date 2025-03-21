import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get query parameters
    const { 
      sort = 'createdAt', 
      order = 'desc',
      isOnSale,
      isFeatured,
      minPrice = '0',
      maxPrice = '10000',
      category,
      search
    } = req.query;

    // Build query conditions
    const where: any = {
      status: 'active',
      stock: {
        gt: 0,
      },
    };

    // Price range filter
    where.price = {
      gte: parseFloat(minPrice as string),
      lte: parseFloat(maxPrice as string),
    };

    // Sale items filter
    if (isOnSale === 'true') {
      where.isOnSale = true;
    }

    // Featured items filter
    if (isFeatured === 'true') {
      where.isFeatured = true;
    }

    // Category filter
    if (category) {
      where.category = category;
    }

    // Search filter
    if (search) {
      where.OR = [
        {
          name: {
            contains: search as string,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: search as string,
            mode: 'insensitive',
          },
        },
      ];
    }

    // Validate sort field
    const validSortFields = ['createdAt', 'price', 'name', 'discount'];
    const sortField = validSortFields.includes(sort as string) ? sort : 'createdAt';
    
    // Validate sort order
    const sortOrder = order === 'asc' ? 'asc' : 'desc';

    // Add debug log
    console.log('Query conditions:', JSON.stringify(where));

    // Execute query
    const products = await prisma.product.findMany({
      where,
      orderBy: {
        [sortField as string]: sortOrder,
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        originalPrice: true,
        discount: true,
        isOnSale: true,
        isFeatured: true,
        stock: true,
        category: true,
        status: true,
        images: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Add result log
    console.log(`Found ${products.length} products`);

    return res.status(200).json(products);
  } catch (error) {
    console.error('Error retrieving products:', error);
    return res.status(500).json({ message: 'Server error' });
  }
} 