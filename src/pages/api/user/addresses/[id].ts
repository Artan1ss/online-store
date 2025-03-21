import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import prisma, { executePrismaOperation } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get address ID
    const addressId = req.query.id as string;
    if (!addressId) {
      return res.status(400).json({ error: 'Address ID is required' });
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

    // Verify address belongs to current user
    const address = await executePrismaOperation(
      () => prisma.address.findUnique({
        where: { id: addressId }
      }),
      'Failed to find address'
    );

    if (!address) {
      return res.status(404).json({ error: 'Address does not exist' });
    }

    if (address.userId !== user.id) {
      return res.status(403).json({ error: 'No permission to access this address' });
    }

    // Handle HTTP methods
    if (req.method === 'GET') {
      return res.status(200).json(address);
    } else if (req.method === 'PUT' || req.method === 'PATCH') {
      const { 
        name, street, city, state, postalCode, country, phoneNumber, isDefault 
      } = req.body;
      
      // Validate required fields
      if (req.method === 'PUT') {
        if (!name || !street || !city || !postalCode || !country) {
          return res.status(400).json({ error: 'Please fill in all required address information' });
        }
      }

      // If set as default, first set other addresses as non-default
      if (isDefault) {
        await executePrismaOperation(
          () => prisma.address.updateMany({
            where: { 
              userId: user.id,
              id: { not: addressId }
            },
            data: { isDefault: false }
          }),
          'Failed to update other addresses status'
        );
      }

      // Update address
      const updatedAddress = await executePrismaOperation(
        () => prisma.address.update({
          where: { id: addressId },
          data: {
            name: name || address.name,
            street: street || address.street,
            city: city || address.city,
            state: state || address.state,
            postalCode: postalCode || address.postalCode,
            country: country || address.country,
            phoneNumber: phoneNumber || address.phoneNumber,
            isDefault: isDefault !== undefined ? isDefault : address.isDefault
          }
        }),
        'Failed to update address'
      );

      return res.status(200).json(updatedAddress);
    } else if (req.method === 'DELETE') {
      // Check if the address being deleted is the default
      const isDefaultAddress = address.isDefault;
      
      // Delete address
      await executePrismaOperation(
        () => prisma.address.delete({
          where: { id: addressId }
        }),
        'Failed to delete address'
      );

      // If deleting the default address, need to set a new default address
      if (isDefaultAddress) {
        const remainingAddresses = await executePrismaOperation(
          () => prisma.address.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            take: 1
          }),
          'Failed to find remaining addresses'
        );

        if (remainingAddresses.length > 0) {
          await executePrismaOperation(
            () => prisma.address.update({
              where: { id: remainingAddresses[0].id },
              data: { isDefault: true }
            }),
            'Failed to update new default address'
          );
        }
      }

      return res.status(200).json({ success: true, message: 'Address has been deleted' });
    } else {
      res.setHeader('Allow', ['GET', 'PUT', 'PATCH', 'DELETE']);
      return res.status(405).end(`Method ${req.method} not supported`);
    }
  } catch (error: any) {
    console.error('Address API error:', error);
    return res.status(500).json({ 
      error: 'Server error',
      message: error.message 
    });
  }
} 