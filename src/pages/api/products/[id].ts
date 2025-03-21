import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Get current session
  const session = await getServerSession(req, res, authOptions);
  
  // Permission check - must be admin
  if (session?.user?.role !== 'ADMIN') {
    return res.status(401).json({ message: 'Not authorized to perform this action' });
  }

  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ message: 'Invalid product ID' });
  }

  try {
    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    switch (req.method) {
      case 'GET':
        // Get single product
        return res.status(200).json(existingProduct);

      case 'PUT':
        // Update product
        const updatedProduct = await prisma.product.update({
          where: { id },
          data: {
            ...req.body,
            price: parseFloat(req.body.price),
            stock: parseInt(req.body.stock),
            isOnSale: req.body.isOnSale === true,
            discount: req.body.isOnSale ? parseFloat(req.body.discount) || 0 : null,
            // If on sale, original price is the regular price (if not already set)
            originalPrice: req.body.isOnSale ? parseFloat(req.body.price) : null,
            isFeatured: req.body.isFeatured === true
          },
        });
        return res.status(200).json(updatedProduct);

      case 'DELETE':
        // Delete product
        await prisma.product.delete({
          where: { id },
        });
        return res.status(204).end();

      default:
        return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Product operation failed:', error);
    return res.status(500).json({ message: 'Server error' });
  }
} 