import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Get user session
  const session = await getServerSession(req, res, authOptions);

  // Verify user is logged in
  if (!session || !session.user?.email) {
    return res.status(401).json({ message: 'Please login first' });
  }

  const userEmail = session.user.email;

  // GET request: get user profile
  if (req.method === 'GET') {
    try {
      const user = await prisma.user.findUnique({
        where: { email: userEmail },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      return res.status(200).json(user);
    } catch (error) {
      console.error('Failed to get user profile:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  } 
  // PUT request: update user profile
  else if (req.method === 'PUT') {
    try {
      const { name } = req.body;

      // Validate request body
      if (!name) {
        return res.status(400).json({ message: 'Name is required' });
      }

      // Update user profile
      const updatedUser = await prisma.user.update({
        where: { email: userEmail },
        data: { name },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true
        }
      });

      return res.status(200).json({
        message: 'Profile updated successfully',
        user: updatedUser
      });
    } catch (error) {
      console.error('Failed to update user profile:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  } else {
    return res.status(405).json({ message: 'Method not supported' });
  }
} 