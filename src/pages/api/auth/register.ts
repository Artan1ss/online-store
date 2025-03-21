import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '仅支持POST请求' });
  }

  try {
    const { name, email, password } = req.body;

    // 输入验证
    if (!email || !password) {
      return res.status(400).json({ message: '邮箱和密码为必填项' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: '密码长度必须至少为6个字符' });
    }

    // 检查邮箱是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ message: '该邮箱已被注册' });
    }

    // 密码加密
    const hashedPassword = await hash(password, 10);

    // 创建用户
    const user = await prisma.user.create({
      data: {
        email,
        name: name || email.split('@')[0], // 如果没有提供名称，使用邮箱前缀
        password: hashedPassword,
        role: 'USER' // 默认角色
      }
    });

    // 不返回密码字段
    const { password: _, ...userWithoutPassword } = user;

    return res.status(201).json({
      message: '注册成功',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('注册失败:', error);
    return res.status(500).json({ message: '注册失败，请稍后再试' });
  }
} 