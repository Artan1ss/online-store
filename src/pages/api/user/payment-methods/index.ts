import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import prisma, { executePrismaOperation } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get user session
    const session = await getServerSession(req, res, authOptions);

    // Check if session exists
    if (!session || !session.user?.email) {
      return res.status(401).json({ error: 'Unauthorized access' });
    }

    console.log('User session:', session.user.email);
    
    // Find user
    let user;
    try {
      user = await executePrismaOperation(
        () => prisma.user.findUnique({
          where: { email: session.user.email! }
        }),
        'Failed to find user'
      );
    } catch (dbError: any) {
      console.error('Database error finding user:', dbError);
      return res.status(500).json({ 
        error: dbError.message || 'Database error while finding user'
      });
    }

    // Check if user exists
    if (!user) {
      console.error('User does not exist:', session.user.email);
      return res.status(404).json({ error: 'User does not exist' });
    }

    const userId = user.id;
    console.log('Found user ID:', userId);

    if (req.method === 'GET') {
      try {
        console.log('Getting payment methods list, user ID:', userId);
        
        // Get all user payment methods
        const paymentMethods = await executePrismaOperation(
          () => prisma.paymentMethod.findMany({
            where: { userId },
            orderBy: { isDefault: 'desc' }
          }),
          'Failed to get payment methods list'
        );

        console.log(`Found ${paymentMethods.length} payment methods`);
        return res.status(200).json(paymentMethods);
      } catch (dbError: any) {
        console.error('Database error getting payment methods:', dbError);
        return res.status(500).json({ 
          error: dbError.message || 'Database error while getting payment methods list'
        });
      }
    } else if (req.method === 'POST') {
      try {
        const { type, cardNumber, cardExpiry, isDefault } = req.body;
        console.log('Creating new payment method:', { type, isDefault });

        // Basic validation
        if (!type) {
          return res.status(400).json({ error: 'Please select a payment method type' });
        }

        // For credit cards, card number and expiry date must be validated
        if (type === 'CREDIT_CARD') {
          if (!cardNumber || !cardExpiry) {
            return res.status(400).json({ error: 'Please fill in complete credit card information' });
          }
        }

        // If set as default payment method, first set other payment methods as non-default
        if (isDefault) {
          await executePrismaOperation(
            () => prisma.paymentMethod.updateMany({
              where: { userId },
              data: { isDefault: false }
            }),
            'Failed to update default payment method status'
          );
        }

        // If this is the first payment method, automatically set as default
        const paymentMethodCount = await executePrismaOperation(
          () => prisma.paymentMethod.count({
            where: { userId }
          }),
          'Failed to get payment method count'
        );

        const shouldBeDefault = isDefault || paymentMethodCount === 0;

        // For credit cards, only store the last four digits
        let maskedCardNumber = null;
        if (type === 'CREDIT_CARD' && cardNumber) {
          maskedCardNumber = cardNumber.slice(-4).padStart(cardNumber.length, '*');
        }

        // Create new payment method
        const newPaymentMethod = await executePrismaOperation(
          () => prisma.paymentMethod.create({
            data: {
              userId,
              type,
              cardNumber: maskedCardNumber,
              cardExpiry,
              isDefault: shouldBeDefault
            }
          }),
          'Failed to create payment method'
        );

        console.log('Payment method created successfully:', newPaymentMethod.id);
        return res.status(201).json(newPaymentMethod);
      } catch (dbError: any) {
        console.error('Database error creating payment method:', dbError);
        return res.status(500).json({ 
          error: dbError.message || 'Database error while creating payment method'
        });
      }
    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).end(`Method ${req.method} not supported`);
    }
  } catch (error: any) {
    console.error('Payment method API uncaught error:', error);
    return res.status(500).json({ 
      error: 'Server error',
      message: error.message
    });
  }
} 