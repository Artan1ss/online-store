import { NextApiRequest, NextApiResponse } from 'next';
import prisma, { executePrismaOperation } from '@/lib/db';
import { Product } from '@prisma/client';

type ResponseData = {
  status: 'success' | 'error';
  message: string;
  data?: any;
  error?: string;
  timestamp: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  const startTime = new Date();
  console.log(`[Products API] Request received: ${req.method} at ${startTime.toISOString()}`);
  console.log(`[Products API] Query params:`, req.query);
  
  // Only allow GET requests
  if (req.method !== 'GET') {
    console.warn(`[Products API] Invalid method: ${req.method}`);
    return res.status(405).json({
      status: 'error',
      message: 'Method not allowed',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    console.log('[Products API] Processing product request...');
    
    // Parse query parameters
    const search = req.query.search as string | undefined;
    const category = req.query.category as string | undefined;
    
    // Handle potential parsing errors for numeric values
    let minPrice = undefined;
    let maxPrice = undefined;
    
    try {
      if (req.query.minPrice) {
        minPrice = parseFloat(req.query.minPrice as string);
        if (isNaN(minPrice)) minPrice = 0;
      }
      
      if (req.query.maxPrice) {
        maxPrice = parseFloat(req.query.maxPrice as string);
        if (isNaN(maxPrice)) maxPrice = 10000;
      }
    } catch (error) {
      console.warn("[Products API] Error parsing price range, using defaults", error);
      minPrice = 0;
      maxPrice = 10000;
    }
    
    const isOnSale = req.query.isOnSale === 'true';
    const isFeatured = req.query.isFeatured === 'true';
    const sort = req.query.sort as string || 'createdAt';
    const order = req.query.order as 'asc' | 'desc' || 'desc';
    const limit = parseInt(req.query.limit as string || '50');
    const offset = parseInt(req.query.offset as string || '0');
    
    // Build query conditions
    const where: any = { status: 'active' };
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (category) {
      where.category = { contains: category, mode: 'insensitive' };
    }
    
    if (isOnSale) {
      where.isOnSale = true;
    }
    
    if (isFeatured) {
      where.isFeatured = true;
    }
    
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      
      if (minPrice !== undefined) {
        where.price.gte = minPrice;
      }
      
      if (maxPrice !== undefined) {
        where.price.lte = maxPrice;
      }
    }
    
    console.log('[Products API] Query conditions:', JSON.stringify(where));
    
    try {
      // First try querying with executePrismaOperation for better error handling
      const products = await executePrismaOperation(async () => {
        return await prisma.product.findMany({
          where,
          orderBy: {
            [sort]: order,
          },
          skip: offset,
          take: limit,
        });
      }, 'Failed to fetch products');
      
      console.log(`[Products API] Found ${products.length} products`);
      
      // Get total count for pagination
      const total = await executePrismaOperation(
        () => prisma.product.count({ where }),
        'Failed to count products'
      );
      
      console.log(`[Products API] Total product count: ${total}`);
      
      // Success response
      const responseTime = new Date().getTime() - startTime.getTime();
      console.log(`[Products API] Request completed in ${responseTime}ms`);
      
      return res.status(200).json({
        status: 'success',
        message: 'Products retrieved successfully',
        data: {
          products,
          pagination: {
            total,
            limit,
            offset,
            hasMore: offset + products.length < total,
          },
          meta: {
            responseTimeMs: responseTime,
          }
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('[Products API] Error executing Prisma query:', error);
      
      // If the first attempt fails, try a simpler fallback query
      console.log('[Products API] Trying fallback query');
      
      try {
        // Direct Prisma client call with minimal fields
        const products = await prisma.product.findMany({
          where,
          orderBy: {
            [sort]: order,
          },
          skip: offset,
          take: limit,
        });
        
        console.log(`[Products API] Found ${products.length} products with fallback query`);
        
        // Get total count for pagination
        const total = await prisma.product.count({ where });
        
        // Success response
        const responseTime = new Date().getTime() - startTime.getTime();
        console.log(`[Products API] Request completed with fallback in ${responseTime}ms`);
        
        return res.status(200).json({
          status: 'success',
          message: 'Products retrieved successfully (with fallback)',
          data: {
            products,
            pagination: {
              total,
              limit,
              offset,
              hasMore: offset + products.length < total,
            },
            meta: {
              responseTimeMs: responseTime,
              fallback: true,
            }
          },
          timestamp: new Date().toISOString(),
        });
      } catch (fallbackError: any) {
        // Even the fallback failed, provide detailed error
        console.error('[Products API] Fallback query also failed:', fallbackError);
        throw new Error(`Database query failed: ${fallbackError.message}`);
      }
    }
  } catch (error: any) {
    console.error('[Products API] Error:', error);
    
    // Detailed error response
    const errorMessage = process.env.NODE_ENV === 'development'
      ? `Failed to retrieve products: ${error.message}`
      : 'Failed to retrieve products';
      
    return res.status(500).json({
      status: 'error',
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
}

// Helper function to safely parse floats with fallback
function parseFloatSafe(value: string | undefined, fallback?: number): number | undefined {
  if (value === undefined) return fallback;
  
  try {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? fallback : parsed;
  } catch (e) {
    return fallback;
  }
} 