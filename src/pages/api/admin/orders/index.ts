import { NextApiRequest, NextApiResponse } from 'next';
import { prisma, withPrismaClient } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify admin permissions
  const session = await getServerSession(req, res, authOptions);
  
  if (session?.user?.role !== 'ADMIN') {
    return res.status(401).json({ message: 'Unauthorized access' });
  }

  // Handle GET request - get all orders
  if (req.method === 'GET') {
    try {
      return await withPrismaClient(async (prisma) => {
        const orders = await prisma.order.findMany({
          orderBy: {
            createdAt: 'desc'
          }
        });
        
        return res.status(200).json(orders);
      });
    } catch (error) {
      console.error('Failed to get orders:', error);
      return res.status(500).json({ message: 'Failed to get orders' });
    }
  }

  // Handle POST request - create new order
  if (req.method === 'POST') {
    try {
      const {
        orderNumber,
        customerName,
        customerEmail,
        customerPhone,
        address,
        city,
        country,
        postalCode,
        status,
        totalAmount,
        items
      } = req.body;

      return await withPrismaClient(async (prisma) => {
        const order = await prisma.order.create({
          data: {
            orderNumber,
            customerName,
            customerEmail,
            customerPhone,
            address,
            city,
            country,
            postalCode,
            status,
            totalAmount,
            total: totalAmount,
            items: {
              create: items.map((item: any) => ({
                productId: item.productId,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                image: item.image
              }))
            }
          }
        });

        return res.status(201).json(order);
      });
    } catch (error) {
      console.error('Failed to create order:', error);
      return res.status(500).json({ message: 'Failed to create order' });
    }
  }

  // If not a supported HTTP method
  return res.status(405).json({ message: 'Method not allowed' });
} 