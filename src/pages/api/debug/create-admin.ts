import { NextApiRequest, NextApiResponse } from 'next';
import { User } from '@prisma/client';
import bcrypt from 'bcrypt';
import { prisma, withPrismaClient } from '@/lib/prisma';

// Define response types
type SuccessResponse = {
  success: true;
  message: string;
  userId: string;
  email: string;
  name?: string;
  role?: string;
  createdAt?: Date;
  password?: string;
};

type ErrorResponse = {
  success: false;
  error: string;
  info?: string;
  details?: any;
  env?: any;
};

type ApiResponse = SuccessResponse | ErrorResponse;

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed, use POST' 
    });
  }

  // Debug environment variables
  const envDebug = {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    ALLOW_ADMIN_CREATION: process.env.ALLOW_ADMIN_CREATION,
    allowCreation: process.env.ALLOW_ADMIN_CREATION === 'true'
  };

  console.log('Admin creation environment variables:', envDebug);

  // A simple security check to prevent unwanted admin creation
  // In production, you might want more security (like a special token)
  const allowAdminCreation = process.env.VERCEL_ENV === 'production' 
    ? process.env.ALLOW_ADMIN_CREATION === 'true'
    : true;

  if (!allowAdminCreation) {
    return res.status(403).json({ 
      success: false,
      error: 'Admin creation not allowed in this environment',
      info: 'Set ALLOW_ADMIN_CREATION=true in your environment variables to enable this functionality',
      details: `Current value: ${process.env.ALLOW_ADMIN_CREATION}`,
      env: envDebug
    });
  }

  try {
    const adminEmail = 'admin@example.com';
    const password = 'Admin123!'; // Change this immediately after creation
    
    return await withPrismaClient(async (prisma) => {
      // Check if admin already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: adminEmail }
      });
      
      if (existingUser) {
        return res.status(200).json({ 
          success: true,
          message: 'Admin user already exists', 
          userId: existingUser.id,
          email: existingUser.email,
          name: existingUser.name || undefined,
          role: existingUser.role,
          createdAt: existingUser.createdAt
        });
      }
      
      // Create new admin
      const hashedPassword = await bcrypt.hash(password, 10);
      const newAdmin = await prisma.user.create({
        data: {
          email: adminEmail,
          name: 'Administrator',
          password: hashedPassword,
          role: 'ADMIN'
        }
      });
      
      return res.status(201).json({ 
        success: true,
        message: 'Admin user created successfully',
        userId: newAdmin.id,
        email: adminEmail,
        role: newAdmin.role,
        createdAt: newAdmin.createdAt,
        password: 'Use the password defined in code and change immediately'
      });
    });
  } catch (error) {
    console.error('Error creating admin:', error);
    
    let errorMessage = 'Failed to create admin user';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return res.status(500).json({ 
      success: false,
      error: errorMessage,
      details: error instanceof Error ? error.stack : String(error),
      env: envDebug
    });
  }
} 