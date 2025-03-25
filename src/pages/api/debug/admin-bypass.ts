import { NextApiRequest, NextApiResponse } from 'next';
import { prisma, withPrismaClient } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import bcrypt from 'bcrypt';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // This is a debug-only endpoint, so we should be careful with it
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEBUG_BYPASS !== 'true') {
    return res.status(403).json({
      success: false,
      message: 'This endpoint is only available in development mode or with ALLOW_DEBUG_BYPASS=true'
    });
  }

  // Get current environment information
  const envInfo = {
    NODE_ENV: process.env.NODE_ENV,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    DATABASE_URL_PREFIX: process.env.DATABASE_URL?.substring(0, 25) + '...',
    VERCEL_ENV: process.env.VERCEL_ENV
  };

  try {
    // Create a direct admin user if needed
    const adminEmail = 'debug-admin@example.com';
    const adminPassword = 'Debug12345!';
    
    return await withPrismaClient(async (prisma) => {
      // Check if user exists
      let adminUser = await prisma.user.findUnique({
        where: { email: adminEmail }
      });
      
      // Create if doesn't exist
      if (!adminUser) {
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        adminUser = await prisma.user.create({
          data: {
            email: adminEmail,
            name: 'Debug Admin',
            password: hashedPassword,
            role: 'ADMIN'
          }
        });
      }
      
      // Return admin credentials for manual login
      return res.status(200).json({
        success: true,
        message: 'Debug admin user is available',
        loginInfo: {
          email: adminEmail,
          password: adminPassword
        },
        userInfo: {
          id: adminUser.id,
          email: adminUser.email,
          role: adminUser.role
        },
        environment: envInfo,
        instructions: 'Use these credentials to log in manually. This account is for debugging only.'
      });
    });
  } catch (error) {
    console.error('Admin bypass error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to create debug admin',
      error: error instanceof Error ? error.message : String(error),
      environment: envInfo
    });
  }
} 