import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

// Define diagnostics types
type Diagnostics = {
  timestamp: string;
  environment: string | undefined;
  platform: string;
  database_url_exists: boolean;
  direct_url_exists: boolean;
  database_url_length: number | undefined;
  connection_test: boolean | null;
  raw_query: any | boolean | null;
  product_test: { success: boolean; count?: number; sample?: any } | null;
  errors: Array<{ stage: string; message: string; code?: string }>;
  vercel_region: string;
  request_headers: {
    host: string | undefined;
    user_agent: string | undefined;
  };
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('Vercel database test endpoint called');
  console.log('Environment:', process.env.NODE_ENV);
  
  // Create a dedicated Prisma client for this test
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });
  
  // Database connection diagnostics
  const diagnostics: Diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    platform: 'Vercel',
    database_url_exists: !!process.env.DATABASE_URL,
    direct_url_exists: !!process.env.DIRECT_URL,
    database_url_length: process.env.DATABASE_URL?.length,
    connection_test: null,
    raw_query: null,
    product_test: null,
    errors: [],
    vercel_region: process.env.VERCEL_REGION || 'unknown',
    request_headers: {
      host: req.headers.host,
      user_agent: req.headers['user-agent'],
    },
  };
  
  try {
    // Step 1: Test basic connection
    console.log('Testing basic connection...');
    try {
      await prisma.$connect();
      diagnostics.connection_test = true;
    } catch (error: any) {
      diagnostics.connection_test = false;
      diagnostics.errors.push({
        stage: 'connection',
        message: error.message,
        code: error.code
      });
      throw error; // Rethrow to stop further tests
    }
    
    // Step 2: Run a simple raw query
    console.log('Testing raw query...');
    try {
      const result = await prisma.$queryRaw`SELECT current_database() as database, current_user as user`;
      diagnostics.raw_query = result;
    } catch (error: any) {
      diagnostics.raw_query = false;
      diagnostics.errors.push({
        stage: 'raw_query',
        message: error.message,
        code: error.code
      });
      throw error;
    }
    
    // Step 3: Try to get products
    console.log('Testing product query...');
    try {
      const products = await prisma.product.findMany({
        take: 1,
        select: {
          id: true,
          name: true
        }
      });
      diagnostics.product_test = {
        success: true,
        count: products.length,
        sample: products.length > 0 ? products[0] : null
      };
    } catch (error: any) {
      diagnostics.product_test = {
        success: false,
      };
      diagnostics.errors.push({
        stage: 'product_query',
        message: error.message,
        code: error.code
      });
      throw error;
    }
    
    // Return success with diagnostics
    return res.status(200).json({
      status: 'success',
      message: 'Database connection successful on Vercel',
      diagnostics
    });
    
  } catch (error: any) {
    console.error('Error testing Vercel database connection:', error);
    
    // Construct detailed error response
    return res.status(500).json({
      status: 'error',
      message: 'Database connection failed on Vercel',
      error: {
        message: error.message,
        code: error.code,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      diagnostics
    });
  } finally {
    // Always disconnect
    await prisma.$disconnect();
  }
} 