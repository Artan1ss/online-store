import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // 创建管理员用户
  const adminPassword = await hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: adminPassword,
      name: 'Admin User',
      role: 'ADMIN'
    },
  });

  // 清除现有的所有订单项和产品，确保没有重复
  try {
    // 先删除订单项（因为它们引用了产品）
    await prisma.orderItem.deleteMany({});
    // 删除订单
    await prisma.order.deleteMany({});
    // 然后删除产品
    await prisma.product.deleteMany({});
    
    console.log('已清除现有数据');
  } catch (error) {
    console.error('清除数据时出错:', error);
  }
  
  // 创建示例产品
  const products = await prisma.product.createMany({
    data: [
      {
        name: '无线耳机',
        description: '高品质无线耳机，具有主动降噪功能，舒适的佩戴感，长久续航',
        price: 199.99,
        originalPrice: 299.99,
        discount: 33,
        isOnSale: true,
        isFeatured: true,
        stock: 50,
        category: 'Electronics',
        status: 'active',
        images: ['https://via.placeholder.com/300/3498db/ffffff?text=Wireless+Headphones']
      },
      {
        name: '智能手表',
        description: '功能丰富的智能手表，支持健康追踪、心率监测、消息提醒等多种功能',
        price: 299.99,
        originalPrice: 399.99,
        discount: 25,
        isOnSale: true,
        isFeatured: false,
        stock: 30,
        category: 'Electronics',
        status: 'active',
        images: ['https://via.placeholder.com/300/2ecc71/ffffff?text=Smart+Watch']
      },
      {
        name: '跑步鞋',
        description: '专业运动员使用的舒适跑步鞋，轻便透气，提供出色的支撑和缓震效果',
        price: 89.99,
        originalPrice: null,
        discount: null,
        isOnSale: false,
        isFeatured: true,
        stock: 100,
        category: 'Sports',
        status: 'active',
        images: ['https://via.placeholder.com/300/e74c3c/ffffff?text=Running+Shoes']
      },
      {
        name: '专业相机',
        description: '高分辨率专业数码相机，配备高质量镜头，适合专业摄影师使用',
        price: 1299.99,
        originalPrice: 1599.99,
        discount: 18,
        isOnSale: true,
        isFeatured: true,
        stock: 15,
        category: 'Electronics',
        status: 'active',
        images: ['https://via.placeholder.com/300/9b59b6/ffffff?text=Camera']
      },
      {
        name: '笔记本电脑',
        description: '轻薄高性能笔记本电脑，搭载最新处理器和高速固态硬盘，适合工作和娱乐',
        price: 899.99,
        originalPrice: 1099.99,
        discount: 18,
        isOnSale: true,
        isFeatured: false,
        stock: 25,
        category: 'Electronics',
        status: 'active',
        images: ['https://via.placeholder.com/300/34495e/ffffff?text=Laptop']
      },
      {
        name: '瑜伽垫',
        description: '环保防滑瑜伽垫，厚度适中，提供良好的支撑和舒适感',
        price: 29.99,
        originalPrice: null,
        discount: null,
        isOnSale: false,
        isFeatured: false,
        stock: 200,
        category: 'Sports',
        status: 'active',
        images: ['https://via.placeholder.com/300/16a085/ffffff?text=Yoga+Mat']
      },
      {
        name: '蓝牙音箱',
        description: '便携式蓝牙音箱，音质清晰，电池续航时间长，防水设计',
        price: 59.99,
        originalPrice: 79.99,
        discount: 25,
        isOnSale: true,
        isFeatured: true,
        stock: 40,
        category: 'Electronics',
        status: 'active',
        images: ['https://via.placeholder.com/300/f39c12/ffffff?text=Bluetooth+Speaker']
      },
      {
        name: '篮球',
        description: '专业比赛用篮球，耐用防滑，适合室内和室外使用',
        price: 39.99,
        originalPrice: null,
        discount: null,
        isOnSale: false,
        isFeatured: false,
        stock: 50,
        category: 'Sports',
        status: 'active',
        images: ['https://via.placeholder.com/300/d35400/ffffff?text=Basketball']
      },
      {
        name: '智能家居套装',
        description: '包含智能灯泡、插座和温度传感器的智能家居入门套装，支持手机控制',
        price: 129.99,
        originalPrice: 169.99,
        discount: 23,
        isOnSale: true,
        isFeatured: true,
        stock: 20,
        category: 'Smart_Home',
        status: 'active',
        images: ['https://via.placeholder.com/300/27ae60/ffffff?text=Smart+Home+Kit']
      },
      {
        name: '咖啡机',
        description: '自动滴漏式咖啡机，可编程设置，内置研磨功能，制作多种咖啡饮品',
        price: 149.99,
        originalPrice: 199.99,
        discount: 25,
        isOnSale: true,
        isFeatured: false,
        stock: 30,
        category: 'Home_Appliances',
        status: 'active',
        images: ['https://via.placeholder.com/300/c0392b/ffffff?text=Coffee+Maker']
      }
    ]
  });

  console.log('Seed data created:', { admin, products });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 