import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed, use POST' });
  }

  // A simple security check to prevent unwanted admin creation
  // In production, you might want more security (like a special token)
  const allowAdminCreation = process.env.VERCEL_ENV === 'production' 
    ? process.env.ALLOW_ADMIN_CREATION === 'true'
    : true;

  if (!allowAdminCreation) {
    return res.status(403).json({ 
      error: 'Admin creation not allowed in this environment',
      info: 'Set ALLOW_ADMIN_CREATION=true in your environment variables to enable this functionality'
    });
  }

  try {
    const adminEmail = 'admin@example.com';
    const password = 'Admin123!'; // Change this immediately after creation
    
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
        name: existingUser.name,
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
  } catch (error) {
    console.error('Error creating admin:', error);
    
    let errorMessage = 'Failed to create admin user';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return res.status(500).json({ 
      success: false,
      error: errorMessage
    });
  } finally {
    await prisma.$disconnect();
  }
} 