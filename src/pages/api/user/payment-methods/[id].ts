import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import prisma, { executePrismaOperation } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get payment method ID
    const paymentMethodId = req.query.id as string;
    if (!paymentMethodId) {
      return res.status(400).json({ error: 'Payment method ID is required' });
    }

    // Verify user session
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user?.email) {
      return res.status(401).json({ error: 'Unauthorized access' });
    }

    // Find user
    const user = await executePrismaOperation(
      () => prisma.user.findUnique({
        where: { email: session.user.email! }
      }),
      'Failed to find user'
    );

    if (!user) {
      return res.status(404).json({ error: 'User does not exist' });
    }

    // Verify payment method belongs to current user
    const paymentMethod = await executePrismaOperation(
      () => prisma.paymentMethod.findUnique({
        where: { id: paymentMethodId }
      }),
      'Failed to find payment method'
    );

    if (!paymentMethod) {
      return res.status(404).json({ error: 'Payment method does not exist' });
    }

    if (paymentMethod.userId !== user.id) {
      return res.status(403).json({ error: 'No permission to access this payment method' });
    }

    // Handle HTTP methods
    if (req.method === 'GET') {
      return res.status(200).json(paymentMethod);
    } else if (req.method === 'PUT' || req.method === 'PATCH') {
      const { isDefault, type, cardExpiry } = req.body;
      
      // If set as default, first set other payment methods as non-default
      if (isDefault) {
        await executePrismaOperation(
          () => prisma.paymentMethod.updateMany({
            where: { 
              userId: user.id,
              id: { not: paymentMethodId }
            },
            data: { isDefault: false }
          }),
          'Failed to update status of other payment methods'
        );
      }

      // Update payment method
      const updatedPaymentMethod = await executePrismaOperation(
        () => prisma.paymentMethod.update({
          where: { id: paymentMethodId },
          data: {
            isDefault: isDefault !== undefined ? isDefault : paymentMethod.isDefault,
            type: type || paymentMethod.type,
            cardExpiry: cardExpiry || paymentMethod.cardExpiry
          }
        }),
        'Failed to update payment method'
      );

      return res.status(200).json(updatedPaymentMethod);
    } else if (req.method === 'DELETE') {
      // Check if the deleted payment method is default
      const isDefaultMethod = paymentMethod.isDefault;
      
      // Delete payment method
      await executePrismaOperation(
        () => prisma.paymentMethod.delete({
          where: { id: paymentMethodId }
        }),
        'Failed to delete payment method'
      );

      // If the deleted method was default, need to set a new default payment method
      if (isDefaultMethod) {
        const remainingMethods = await executePrismaOperation(
          () => prisma.paymentMethod.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            take: 1
          }),
          'Failed to find remaining payment methods'
        );

        if (remainingMethods.length > 0) {
          await executePrismaOperation(
            () => prisma.paymentMethod.update({
              where: { 
                id: remainingMethods[0]?.id
              },
              data: { isDefault: true }
            }),
            'Failed to update new default payment method'
          );
        }
      }

      return res.status(200).json({ success: true, message: 'Payment method deleted' });
    } else {
      res.setHeader('Allow', ['GET', 'PUT', 'PATCH', 'DELETE']);
      return res.status(405).end(`Method ${req.method} not supported`);
    }
  } catch (error: any) {
    console.error('Payment method API error:', error);
    return res.status(500).json({ 
      error: 'Server error',
      message: error.message 
    });
  }
} 