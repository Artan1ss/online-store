import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import prisma, { executePrismaOperation } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 获取用户会话
    const session = await getServerSession(req, res, authOptions);

    // 检查会话是否存在
    if (!session || !session.user?.email) {
      return res.status(401).json({ error: '未授权访问' });
    }

    console.log('用户会话:', session.user.email);
    
    // 查找用户
    let user;
    try {
      user = await executePrismaOperation(
        () => prisma.user.findUnique({
          where: { email: session.user.email! }
        }),
        '查找用户失败'
      );
    } catch (dbError: any) {
      console.error('查找用户数据库错误:', dbError);
      return res.status(500).json({ 
        error: dbError.message || '查找用户时数据库错误'
      });
    }

    // 检查用户是否存在
    if (!user) {
      console.error('用户不存在:', session.user.email);
      return res.status(404).json({ error: '用户不存在' });
    }

    const userId = user.id;
    console.log('找到用户ID:', userId);

    if (req.method === 'GET') {
      try {
        console.log('获取地址列表, 用户ID:', userId);
        
        // 获取用户的所有地址
        const addresses = await executePrismaOperation(
          () => prisma.address.findMany({
            where: { userId },
            orderBy: { isDefault: 'desc' }
          }),
          '获取地址列表失败'
        );

        console.log(`找到${addresses.length}个地址`);
        return res.status(200).json(addresses);
      } catch (dbError: any) {
        console.error('获取地址数据库错误:', dbError);
        return res.status(500).json({ 
          error: dbError.message || '获取地址列表时数据库错误'
        });
      }
    } else if (req.method === 'POST') {
      try {
        const {
          fullName,
          phone,
          address,
          city,
          country,
          postalCode,
          isDefault
        } = req.body;
        
        console.log('创建新地址:', { fullName, city, country, isDefault });

        // 基本验证
        if (!fullName || !address || !city || !country || !postalCode) {
          return res.status(400).json({ error: '请填写所有必填字段' });
        }

        // 如果设置为默认地址，先将其他地址设为非默认
        if (isDefault) {
          await executePrismaOperation(
            () => prisma.address.updateMany({
              where: { userId },
              data: { isDefault: false }
            }),
            '更新默认地址状态失败'
          );
        }

        // 如果这是第一个地址，自动设为默认地址
        const addressCount = await executePrismaOperation(
          () => prisma.address.count({
            where: { userId }
          }),
          '获取地址数量失败'
        );

        const shouldBeDefault = isDefault || addressCount === 0;

        // 创建新地址
        const newAddress = await executePrismaOperation(
          () => prisma.address.create({
            data: {
              userId,
              fullName,
              phone,
              address,
              city,
              country,
              postalCode,
              isDefault: shouldBeDefault
            }
          }),
          '创建地址失败'
        );

        console.log('地址创建成功:', newAddress.id);
        return res.status(201).json(newAddress);
      } catch (dbError: any) {
        console.error('创建地址数据库错误:', dbError);
        return res.status(500).json({ 
          error: dbError.message || '创建地址时数据库错误'
        });
      }
    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).end(`不支持 ${req.method} 方法`);
    }
  } catch (error: any) {
    console.error('地址API未捕获错误:', error);
    return res.status(500).json({ 
      error: '服务器错误',
      message: error.message
    });
  }
} 