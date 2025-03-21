import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 获取用户会话
  const session = await getServerSession(req, res, authOptions);

  // 验证用户是否已登录且为管理员
  if (!session || !session.user?.email || session.user.role !== 'ADMIN') {
    return res.status(403).json({ message: '权限不足' });
  }

  // GET 请求：获取所有用户列表
  if (req.method === 'GET') {
    try {
      // 支持分页和搜索
      const { page = '1', limit = '10', search = '' } = req.query;
      const pageNumber = parseInt(page as string, 10);
      const limitNumber = parseInt(limit as string, 10);
      const skip = (pageNumber - 1) * limitNumber;

      // 构建查询条件
      let where: any = {};

      // 搜索功能
      if (search) {
        where = {
          OR: [
            {
              name: {
                contains: search as string,
                mode: 'insensitive' as any,
              },
            },
            {
              email: {
                contains: search as string,
                mode: 'insensitive' as any,
              },
            },
          ],
        };
      }

      // 获取总用户数
      const totalUsers = await prisma.user.count({
        where,
      });

      // 获取用户列表
      const users = await prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          orders: {
            select: {
              id: true,
              orderNumber: true,
              status: true,
              totalAmount: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 5, // 只获取最近5个订单
          },
        },
        skip,
        take: limitNumber,
        orderBy: {
          createdAt: 'desc',
        },
      });

      return res.status(200).json({
        users,
        pagination: {
          total: totalUsers,
          page: pageNumber,
          limit: limitNumber,
          totalPages: Math.ceil(totalUsers / limitNumber),
        },
      });
    } catch (error) {
      console.error('获取用户列表失败:', error);
      return res.status(500).json({ message: '服务器错误' });
    }
  } else {
    return res.status(405).json({ message: '不支持的请求方法' });
  }
} 