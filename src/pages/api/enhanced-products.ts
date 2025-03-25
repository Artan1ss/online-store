import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, Product } from '@prisma/client';
import { getVercelDatabaseUrls } from '@/lib/connection-url';

interface SuccessResponse {
  status: 'success';
  message: string;
  metadata: {
    connectionType: string;
    environment: string;
    timestamp: string;
  };
  data: {
    products: Product[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
      hasNext: boolean;
    }
  }
}

interface ErrorResponse {
  status: 'error';
  message: string;
  error: {
    message: string;
    code?: string;
  };
  timestamp: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>
) {
  console.log('Enhanced products API called');
  
  // Get optimized database URLs
  const { databaseUrl, directUrl } = getVercelDatabaseUrls();
  
  // Create a dedicated Prisma client with optimized connection settings
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    // Log all queries when in development
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'info', 'warn', 'error']
      : ['error', 'warn'],
  });
  
  try {
    console.log('Querying products with enhanced connection...');
    
    // Extract query parameters
    const limit = parseInt(req.query.limit as string || '20');
    const page = parseInt(req.query.page as string || '0');
    const category = req.query.category as string;
    
    // Build query conditions
    const where: any = { status: 'active' };
    
    if (category) {
      where.category = category;
    }
    
    // Execute query with retry logic
    let products: Product[] = [];
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        // Try to execute the query
        products = await prisma.product.findMany({
          where,
          take: limit,
          skip: page * limit,
          orderBy: {
            createdAt: 'desc'
          }
        });
        
        // If successful, break the retry loop
        break;
      } catch (error) {
        retryCount++;
        console.error(`Query attempt ${retryCount} failed:`, error instanceof Error ? error.message : String(error));
        
        if (retryCount >= maxRetries) {
          throw error; // Rethrow if max retries reached
        }
        
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }
    
    // Count products for pagination
    const totalProducts = await prisma.product.count({ where });
    
    // Return success response
    return res.status(200).json({
      status: 'success',
      message: 'Products retrieved successfully with enhanced connection',
      metadata: {
        connectionType: 'enhanced',
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      },
      data: {
        products,
        pagination: {
          total: totalProducts,
          page,
          limit,
          pages: Math.ceil(totalProducts / limit),
          hasNext: (page + 1) * limit < totalProducts
        }
      }
    });
  } catch (error: any) {
    console.error('Error in enhanced products API:', error);
    
    // Return error response
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve products',
      error: {
        message: error.message || String(error),
        code: error.code
      },
      timestamp: new Date().toISOString()
    });
  } finally {
    // Always disconnect the client
    await prisma.$disconnect();
  }
} 