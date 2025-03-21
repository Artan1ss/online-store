import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Get order ID
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid order ID' });
  }

  // Get user session
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user?.email) {
    return res.status(401).json({ error: 'Unauthorized access' });
  }

  if (req.method === 'GET') {
    try {
      // Find order with specified ID
      const order = await prisma.order.findUnique({
        where: {
          id: id
        },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      });

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      // Check if user is admin or order owner
      const isAdmin = session.user.role === 'ADMIN';
      const isOwner = order.customerEmail === session.user.email || order.userId === session.user.id;

      if (!isAdmin && !isOwner) {
        return res.status(403).json({ error: 'No permission to access this order' });
      }

      return res.status(200).json(order);
    } catch (error) {
      console.error('Error getting order details:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  } else if (req.method === 'DELETE') {
    try {
      // Find order with specified ID
      const order = await prisma.order.findUnique({
        where: { id: id }
      });

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      // Check if user is admin or order owner
      const isAdmin = session.user.role === 'ADMIN';
      const isOwner = order.customerEmail === session.user.email || order.userId === session.user.id;

      if (!isAdmin && !isOwner) {
        return res.status(403).json({ error: 'No permission to delete this order' });
      }

      // Only allow deleting orders in pending status
      if (order.status !== 'PENDING') {
        return res.status(400).json({ error: 'Only pending orders can be deleted' });
      }

      // Delete order (Prisma will automatically handle associated order items)
      await prisma.order.delete({
        where: { id: id }
      });

      return res.status(200).json({ message: 'Order deleted successfully' });
    } catch (error) {
      console.error('Error deleting order:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  } else {
    // Unsupported HTTP method
    res.setHeader('Allow', ['GET', 'DELETE']);
    return res.status(405).end(`Unsupported ${req.method} method`);
  }
} 