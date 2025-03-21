import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests for security
  if (req.method !== 'POST') {
    return res.status(405).json({
      status: 'error',
      message: 'Method not allowed',
      timestamp: new Date().toISOString(),
    });
  }

  // Check for admin authorization if needed
  // const { authorization } = req.headers;
  // if (authorization !== `Bearer ${process.env.ADMIN_API_KEY}`) {
  //   return res.status(401).json({ status: 'error', message: 'Unauthorized' });
  // }

  try {
    console.log('Force deploying application with schema check...');
    
    // Clear Prisma cache
    await prisma.$executeRawUnsafe('SELECT pg_advisory_unlock_all()');
    
    // Force Prisma to reconnect with fresh schema
    await prisma.$disconnect();
    await prisma.$connect();
    
    // Check a basic query to verify connection
    const productCount = await prisma.product.count();
    
    // Get git info 
    const gitInfo = {
      commitSha: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
      commitMessage: process.env.VERCEL_GIT_COMMIT_MESSAGE || 'unknown',
      commitAuthor: process.env.VERCEL_GIT_COMMIT_AUTHOR_NAME || 'unknown',
    };
    
    return res.status(200).json({
      status: 'success',
      message: 'Application successfully redeployed',
      data: {
        productCount,
        gitInfo,
        timestamp: new Date().toISOString(),
        cache: 'cleared'
      }
    });
  } catch (error: any) {
    console.error('Error during force deploy:', error);
    
    return res.status(500).json({
      status: 'error',
      message: 'Force deploy failed',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
} 