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

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: '无效的订单ID' });
  }

  // 处理GET请求 - 获取单个订单详情
  if (req.method === 'GET') {
    try {
      const order = await prisma.order.findUnique({
        where: { id },
        include: { items: true }
      });

      if (!order) {
        return res.status(404).json({ message: '订单未找到' });
      }

      return res.status(200).json(order);
    } catch (error) {
      console.error('获取订单详情失败:', error);
      return res.status(500).json({ message: '获取订单详情失败' });
    }
  }

  // 处理PUT请求 - 更新订单
  if (req.method === 'PUT') {
    try {
      const {
        customerName,
        customerEmail,
        customerPhone,
        address,
        city,
        country,
        postalCode,
        status
      } = req.body;

      const updatedOrder = await prisma.order.update({
        where: { id },
        data: {
          customerName,
          customerEmail,
          customerPhone,
          address,
          city,
          country,
          postalCode,
          status
        }
      });

      return res.status(200).json(updatedOrder);
    } catch (error) {
      console.error('更新订单失败:', error);
      return res.status(500).json({ message: '更新订单失败' });
    }
  }

  // 处理DELETE请求 - 删除订单
  if (req.method === 'DELETE') {
    try {
      // 首先删除订单项
      await prisma.orderItem.deleteMany({
        where: { orderId: id }
      });

      // 然后删除订单
      await prisma.order.delete({
        where: { id }
      });

      return res.status(204).end();
    } catch (error) {
      console.error('删除订单失败:', error);
      return res.status(500).json({ message: '删除订单失败' });
    }
  }

  // 如果不是支持的HTTP方法
  return res.status(405).json({ message: '方法不允许' });
} 