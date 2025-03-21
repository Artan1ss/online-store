import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 验证管理员权限
  const session = await getServerSession(req, res, authOptions);
  
  if (session?.user?.role !== 'ADMIN') {
    return res.status(401).json({ message: '未授权访问' });
  }

  // 处理GET请求 - 获取所有订单
  if (req.method === 'GET') {
    try {
      const orders = await prisma.order.findMany({
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      return res.status(200).json(orders);
    } catch (error) {
      console.error('获取订单失败:', error);
      return res.status(500).json({ message: '获取订单失败' });
    }
  }

  // 处理POST请求 - 创建新订单
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
    } catch (error) {
      console.error('创建订单失败:', error);
      return res.status(500).json({ message: '创建订单失败' });
    }
  }

  // 如果不是支持的HTTP方法
  return res.status(405).json({ message: '方法不允许' });
} 