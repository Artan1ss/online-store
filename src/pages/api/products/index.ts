import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (session?.user?.role !== 'ADMIN') {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const products = await prisma.product.findMany({
        orderBy: { createdAt: 'desc' }
      });
      return res.status(200).json(products);
    } catch (error) {
      return res.status(500).json({ message: 'Error fetching products' });
    }
  }

  if (req.method === 'POST') {
    try {
      const product = await prisma.product.create({
        data: {
          ...req.body,
          price: parseFloat(req.body.price),
          stock: parseInt(req.body.stock),
          isOnSale: req.body.isOnSale === true,
          discount: req.body.isOnSale ? parseFloat(req.body.discount) || 0 : null,
          originalPrice: req.body.isOnSale ? parseFloat(req.body.price) : null,
          isFeatured: req.body.isFeatured === true
        }
      });
      return res.status(201).json(product);
    } catch (error) {
      console.error('Error creating product:', error);
      return res.status(500).json({ message: 'Error creating product' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
} 