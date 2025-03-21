import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Get user session
  const session = await getServerSession(req, res, authOptions);

  // Verify user is logged in and is an admin
  if (!session || !session.user?.email || session.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }

  // Get user ID
  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  // GET request: Get user details
  if (req.method === 'GET') {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          orders: {
            select: {
              id: true,
              orderNumber: true,
              status: true,
              totalAmount: true,
              customerName: true,
              customerEmail: true,
              customerPhone: true,
              address: true,
              city: true,
              country: true,
              postalCode: true,
              createdAt: true,
              items: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  quantity: true,
                  product: {
                    select: {
                      id: true,
                      name: true,
                      images: true
                    }
                  }
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            }
          }
        }
      });

      if (!user) {
        return res.status(404).json({ message: 'User does not exist' });
      }

      return res.status(200).json(user);
    } catch (error) {
      console.error('Failed to get user details:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  } 
  // PUT request: Update user information
  else if (req.method === 'PUT') {
    try {
      const { name, role } = req.body;

      // Validate request body
      if (!name) {
        return res.status(400).json({ message: 'Name is required' });
      }

      // Validate role
      if (role && !['USER', 'ADMIN'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
      }

      // Update user information
      const updatedUser = await prisma.user.update({
        where: { id },
        data: { 
          name,
          ...(role && { role })
        },
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
        message: 'User information updated successfully',
        user: updatedUser
      });
    } catch (error) {
      console.error('Failed to update user information:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  }
  // DELETE request: Delete user
  else if (req.method === 'DELETE') {
    try {
      // Prevent deleting yourself
      const adminUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true }
      });

      if (adminUser?.id === id) {
        return res.status(400).json({ message: 'Cannot delete the currently logged in admin account' });
      }

      // Delete user
      await prisma.user.delete({
        where: { id }
      });

      return res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Failed to delete user:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  } else {
    return res.status(405).json({ message: 'Unsupported request method' });
  }
} 