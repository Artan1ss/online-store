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
    console.log('[Products API] Query params:', req.query);
    
    // Parse query parameters
    const search = req.query.search as string | undefined;
    const category = req.query.category as string | undefined;
    const minPrice = parseFloatSafe(req.query.minPrice as string);
    const maxPrice = parseFloatSafe(req.query.maxPrice as string);
    const isOnSale = req.query.isOnSale === 'true';
    const isFeatured = req.query.isFeatured === 'true';
    const sort = req.query.sort as string || 'name';
    const order = req.query.order as 'asc' | 'desc' || 'asc';
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

    // Safely determine fields to select, using a fallback approach to handle potential schema differences
    // between environments
    let selectFields = null;
    try {
      // First try with all fields we expect to be in the schema
      selectFields = {
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
      };
      
      // Execute the database query with enhanced error handling
      const products = await executePrismaOperation(async () => {
        console.log('[Products API] Executing Prisma query...');
        
        return prisma.product.findMany({
          where,
          select: selectFields,
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
      console.error('[Products API] Error with full select fields:', error);
      
      // If there was an error, try with minimal fields that must exist
      if (error.message.includes('Unknown argument')) {
        console.log('[Products API] Falling back to minimal field selection');
        
        try {
          // Use only the minimal set of fields guaranteed to exist
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
          // Even the fallback failed, rethrow with more context
          console.error('[Products API] Fallback query also failed:', fallbackError);
          throw new Error(`Fallback query failed: ${fallbackError.message}`);
        }
      } else {
        // If it wasn't a field selection error, rethrow the original error
        throw error;
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

// Helper function to safely parse float values
function parseFloatSafe(value: string | undefined): number | undefined {
  if (!value) return undefined;
  
  try {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? undefined : parsed;
  } catch (e) {
    console.warn(`[Products API] Failed to parse value: ${value}`);
    return undefined;
  }
} 