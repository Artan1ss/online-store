import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import prisma, { executePrismaOperation } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Get user session
  const session = await getServerSession(req, res, authOptions);

  if (req.method === 'POST') {
    try {
      console.log('Creating order, received payload:', JSON.stringify(req.body));
      const { 
        customerName, 
        customerEmail, 
        customerPhone, 
        address, 
        city, 
        country, 
        postalCode, 
        items, 
        paymentMethod,
        saveAddress,
        savePaymentMethod,
        addressData,
        paymentData 
      } = req.body;

      // Basic validation
      if (!customerName || !customerEmail || !address || !city || !country || !postalCode || !items || items.length === 0) {
        return res.status(400).json({ error: 'Please fill all required fields' });
      }

      // Validate product IDs before transaction
      try {
        console.log('Validating products exist in database...');
        const productIds = items.map((item: any) => item.productId);
        
        // Get all products in one query to be efficient
        const existingProducts = await prisma.product.findMany({
          where: {
            id: {
              in: productIds
            }
          },
          select: {
            id: true,
            name: true,
            images: true
          }
        });

        // Create lookup for quick access
        const productLookup = existingProducts.reduce((lookup: any, product: { id: string }) => {
          lookup[product.id] = product;
          return lookup;
        }, {});

        // Check if any products are missing
        const missingProducts = productIds.filter((id: string) => !productLookup[id]);
        if (missingProducts.length > 0) {
          console.error('Missing products:', missingProducts);
          return res.status(400).json({ 
            error: 'Some products no longer exist in the database',
            details: `Products with ids ${missingProducts.join(', ')} not found`
          });
        }
      } catch (err) {
        console.error('Error validating products:', err);
        return res.status(500).json({ error: 'Error validating products in database' });
      }

      // Generate order number
      const orderNumber = `ORD-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 1000)}`;

      // Get current logged-in user ID (if logged in)
      let userId: string | null = null;
      if (session?.user?.id) {
        userId = session.user.id;
        
        // If user chooses to save address
        if (saveAddress && addressData && userId) {
          console.log('Saving new address for user:', userId);
          try {
            // Ensure userId is a string for TypeScript (we already checked it's not null above)
            const userIdString: string = userId;
            
            // Check if this is the first address (if so, set as default)
            const addressCount = await executePrismaOperation(
              () => prisma.address.count({ where: { userId: userIdString } }),
              'Failed to count user addresses'
            );
            
            await executePrismaOperation(
              () => prisma.address.create({
                data: {
                  userId: userIdString,
                  fullName: addressData.fullName,
                  phone: addressData.phone,
                  address: addressData.address,
                  city: addressData.city,
                  country: addressData.country,
                  postalCode: addressData.postalCode,
                  isDefault: addressCount === 0 // If this is the first address, set as default
                }
              }),
              'Failed to save user address'
            );
          } catch (error) {
            console.error('Error saving address:', error);
            // Continue with order creation even if address saving fails
          }
        }
        
        // If user chooses to save payment method
        if (savePaymentMethod && paymentData && userId) {
          console.log('Saving new payment method for user:', userId);
          try {
            // Ensure userId is a string for TypeScript (we already checked it's not null above)
            const userIdString: string = userId;
            
            // Check if this is the first payment method (if so, set as default)
            const paymentCount = await executePrismaOperation(
              () => prisma.paymentMethod.count({ where: { userId: userIdString } }),
              'Failed to count payment methods'
            );
            
            await executePrismaOperation(
              () => prisma.paymentMethod.create({
                data: {
                  userId: userIdString,
                  type: paymentData.type,
                  cardNumber: paymentData.cardNumber,
                  cardExpiry: paymentData.cardExpiry,
                  isDefault: paymentCount === 0 // If this is the first payment method, set as default
                }
              }),
              'Failed to save payment method'
            );
          } catch (error) {
            console.error('Error saving payment method:', error);
            // Continue with order creation even if payment method saving fails
          }
        }
      }

      // Calculate total amount
      const totalAmount = items.reduce((total: number, item: any) => {
        return total + (item.price * item.quantity);
      }, 0);

      console.log('Creating order with total amount:', totalAmount);
      
      // Use transaction for order creation to ensure consistency
      try {
        const newOrder = await prisma.$transaction(async (tx) => {
          // First create the order
          const order = await tx.order.create({
            data: {
              orderNumber,
              customerName,
              customerEmail,
              customerPhone,
              address,
              city,
              country,
              postalCode,
              paymentMethod,
              totalAmount,
              status: 'PENDING',
              ...(userId && { userId }), // If user is logged in, associate user ID
              total: totalAmount, // Compatibility field
            }
          });
          
          console.log('Order created successfully, now creating order items');
          
          // Prepare and create all order items in the same transaction
          for (const item of items) {
            // Try to find the product in the database
            const product = await tx.product.findUnique({
              where: { id: item.productId }
            });
            
            if (!product) {
              console.error(`Product ${item.productId} not found in transaction, using fallback data`);
              // Use fallback data from cart
              await tx.orderItem.create({
                data: {
                  orderId: order.id,
                  productId: item.productId,
                  name: item.name || 'Unknown Product',
                  price: item.price,
                  quantity: item.quantity,
                  image: item.image || ''
                }
              });
            } else {
              await tx.orderItem.create({
                data: {
                  orderId: order.id,
                  productId: product.id,
                  name: product.name,
                  price: item.price,
                  quantity: item.quantity,
                  image: product.images?.[0] || item.image || ''
                }
              });
            }
          }
          
          return order;
        }, {
          timeout: 10000, // 10 second timeout
          maxWait: 5000, // maximum wait time for a transaction slot
          isolationLevel: 'ReadCommitted', // isolation level
        });
        
        // Get complete order details after transaction
        const orderWithItems = await prisma.order.findUnique({
          where: { id: newOrder.id },
          include: { items: true }
        });
        
        console.log('Order created successfully with items:', orderWithItems?.id);
        
        // Return response
        return res.status(201).json({ 
          order: orderWithItems,
          id: newOrder.id // Ensure return order ID
        });
      } catch (error: any) {
        console.error('Error in order creation process:', error);
        
        // Return specific error for foreign key constraints
        if (error.code === 'P2003') {
          return res.status(400).json({
            error: 'Order creation failed due to database constraint',
            details: 'One or more products in your cart are no longer available in our system. Please refresh your cart and try again.'
          });
        }
        
        return res.status(500).json({
          error: 'Server error during order creation',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }
    } catch (error: any) {
      console.error('Order creation failed:', error);
      return res.status(500).json({ 
        error: 'Server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  } else if (req.method === 'GET') {
    // If not logged in, return error
    if (!session || !session.user?.email) {
      return res.status(401).json({ error: 'Unauthorized access' });
    }

    try {
      // Get orders associated with current user
      const orders = await executePrismaOperation(
        () => prisma.order.findMany({
          where: {
            OR: [
              { userId: session.user.id },
              { customerEmail: session.user.email }
            ]
          },
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            items: true
          }
        }),
        'Failed to retrieve orders'
      );

      return res.status(200).json(orders);
    } catch (error: any) {
      console.error('Failed to get orders:', error);
      return res.status(500).json({ 
        error: 'Server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 