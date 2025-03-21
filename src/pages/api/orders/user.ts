import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 获取用户会话
  const session = await getServerSession(req, res, authOptions);

  // 检查用户是否已登录
  if (!session || !session.user?.email) {
    return res.status(401).json({ error: '未授权访问' });
  }

  if (req.method === 'GET') {
    try {
      // 查找当前用户的所有订单
      const orders = await prisma.order.findMany({
        where: {
          customerEmail: session.user.email
        },
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      });

      return res.status(200).json(orders);
    } catch (error) {
      console.error('获取用户订单时出错:', error);
      return res.status(500).json({ error: '服务器错误' });
    }
  } else {
    // 不支持的HTTP方法
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`不支持 ${req.method} 方法`);
  }
} 