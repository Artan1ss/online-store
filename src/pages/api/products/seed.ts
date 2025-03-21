import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';

const prisma = new PrismaClient();

// 商品分类
const categories = [
  'Electronics',
  'Clothing',
  'Home & Kitchen',
  'Books',
  'Sports & Outdoors',
  'Beauty & Personal Care',
  'Toys & Games',
  'Health & Wellness',
  'Furniture',
  'Jewelry'
];

// 商品数据
const sampleProducts = [
  {
    name: "智能4K超高清电视",
    description: "55英寸智能4K超高清电视，支持HDR和各种流媒体应用，带有内置的AI语音助手。",
    price: 599.99,
    originalPrice: 799.99,
    discount: 25,
    isOnSale: true,
    isFeatured: true,
    stock: 15,
    category: "Electronics",
    images: ["/uploads/tv.jpg", "/uploads/tv-2.jpg"]
  },
  {
    name: "无线降噪耳机",
    description: "先进的主动降噪技术，30小时电池续航，超舒适的佩戴体验。",
    price: 149.99,
    originalPrice: 199.99,
    discount: 25,
    isOnSale: true,
    isFeatured: false,
    stock: 25,
    category: "Electronics",
    images: ["/uploads/headphones.jpg"]
  },
  {
    name: "专业咖啡机",
    description: "15巴压力泵浦，适合制作意式浓缩和拿铁咖啡，配有蒸汽奶泡器。",
    price: 299.99,
    originalPrice: null,
    discount: null,
    isOnSale: false,
    isFeatured: true,
    stock: 10,
    category: "Home & Kitchen",
    images: ["/uploads/coffee-maker.jpg"]
  },
  {
    name: "男士休闲夹克",
    description: "轻量防水夹克，适合户外活动和日常穿着，多口袋设计。",
    price: 89.99,
    originalPrice: 119.99,
    discount: 25,
    isOnSale: true,
    isFeatured: false,
    stock: 30,
    category: "Clothing",
    images: ["/uploads/jacket.jpg"]
  },
  {
    name: "瑜伽垫",
    description: "防滑环保瑜伽垫，厚度6mm，适合各种瑜伽和健身活动。",
    price: 29.99,
    originalPrice: null,
    discount: null,
    isOnSale: false,
    isFeatured: false,
    stock: 50,
    category: "Sports & Outdoors",
    images: ["/uploads/yoga-mat.jpg"]
  },
  {
    name: "多功能厨师机",
    description: "强力搅拌器和食物处理器二合一，含多种搅拌头和配件，容量5升。",
    price: 249.99,
    originalPrice: 349.99,
    discount: 28.6,
    isOnSale: true,
    isFeatured: true,
    stock: 8,
    category: "Home & Kitchen",
    images: ["/uploads/kitchen-mixer.jpg"]
  },
  {
    name: "商务笔记本电脑",
    description: "轻薄高性能笔记本电脑，16GB内存，512GB SSD，带触摸屏。",
    price: 1299.99,
    originalPrice: 1499.99,
    discount: 13.3,
    isOnSale: true,
    isFeatured: true,
    stock: 12,
    category: "Electronics",
    images: ["/uploads/laptop.jpg"]
  },
  {
    name: "保温水杯",
    description: "24小时保冷/12小时保热不锈钢保温水杯，容量500ml，防漏设计。",
    price: 24.99,
    originalPrice: null,
    discount: null,
    isOnSale: false,
    isFeatured: false,
    stock: 45,
    category: "Home & Kitchen",
    images: ["/uploads/water-bottle.jpg"]
  },
  {
    name: "小说集锦",
    description: "当代畅销小说合集，包含5本精选作品，精装版。",
    price: 59.99,
    originalPrice: 79.99,
    discount: 25,
    isOnSale: true,
    isFeatured: false,
    stock: 20,
    category: "Books",
    images: ["/uploads/books.jpg"]
  },
  {
    name: "智能手表",
    description: "健康监测和运动追踪功能，防水设计，长达7天的电池续航。",
    price: 179.99,
    originalPrice: 229.99,
    discount: 21.7,
    isOnSale: true,
    isFeatured: true,
    stock: 18,
    category: "Electronics",
    images: ["/uploads/smartwatch.jpg"]
  },
  {
    name: "化妆品套装",
    description: "完整的化妆品系列，包含粉底、眼影、口红和化妆刷。",
    price: 89.99,
    originalPrice: 129.99,
    discount: 30.8,
    isOnSale: true,
    isFeatured: false,
    stock: 15,
    category: "Beauty & Personal Care",
    images: ["/uploads/makeup-kit.jpg"]
  },
  {
    name: "积木玩具套装",
    description: "益智积木玩具，含1000多块积木，适合7岁及以上儿童。",
    price: 49.99,
    originalPrice: null,
    discount: null,
    isOnSale: false,
    isFeatured: false,
    stock: 25,
    category: "Toys & Games",
    images: ["/uploads/building-blocks.jpg"]
  },
  {
    name: "维生素套装",
    description: "多种维生素和矿物质补充剂，90天用量。",
    price: 19.99,
    originalPrice: 24.99,
    discount: 20,
    isOnSale: true,
    isFeatured: false,
    stock: 60,
    category: "Health & Wellness",
    images: ["/uploads/vitamins.jpg"]
  },
  {
    name: "沙发",
    description: "三人座布艺沙发，舒适耐用，现代风格设计。",
    price: 599.99,
    originalPrice: 799.99,
    discount: 25,
    isOnSale: true,
    isFeatured: true,
    stock: 5,
    category: "Furniture",
    images: ["/uploads/sofa.jpg"]
  },
  {
    name: "银项链",
    description: "925纯银项链，长度45cm，适合日常佩戴或送礼。",
    price: 79.99,
    originalPrice: null,
    discount: null,
    isOnSale: false,
    isFeatured: false,
    stock: 30,
    category: "Jewelry",
    images: ["/uploads/necklace.jpg"]
  },
  {
    name: "无线蓝牙音箱",
    description: "高品质音效蓝牙音箱，防水设计，10小时播放时间。",
    price: 69.99,
    originalPrice: 99.99,
    discount: 30,
    isOnSale: true,
    isFeatured: false,
    stock: 22,
    category: "Electronics",
    images: ["/uploads/bluetooth-speaker.jpg"]
  },
  {
    name: "女士连衣裙",
    description: "优雅修身连衣裙，适合工作和社交场合，多色可选。",
    price: 79.99,
    originalPrice: 99.99,
    discount: 20,
    isOnSale: true,
    isFeatured: true,
    stock: 15,
    category: "Clothing",
    images: ["/uploads/dress.jpg"]
  },
  {
    name: "不粘锅套装",
    description: "3件套不粘煎锅，采用高品质铝合金材质，适用于所有炉灶。",
    price: 89.99,
    originalPrice: 129.99,
    discount: 30.8,
    isOnSale: true,
    isFeatured: false,
    stock: 10,
    category: "Home & Kitchen",
    images: ["/uploads/pan-set.jpg"]
  },
  {
    name: "时尚太阳镜",
    description: "偏光太阳镜，100% UV防护，轻量框架，适合驾驶和户外活动。",
    price: 49.99,
    originalPrice: 69.99,
    discount: 28.6,
    isOnSale: true,
    isFeatured: false,
    stock: 35,
    category: "Clothing",
    images: ["/uploads/sunglasses.jpg"]
  },
  {
    name: "电动牙刷",
    description: "声波电动牙刷，5种清洁模式，内置计时器，防水设计。",
    price: 89.99,
    originalPrice: 129.99,
    discount: 30.8,
    isOnSale: true,
    isFeatured: true,
    stock: 18,
    category: "Beauty & Personal Care",
    images: ["/uploads/electric-toothbrush.jpg"]
  },
  {
    name: "棋盘游戏合集",
    description: "经典棋盘游戏套装，包含10种游戏，适合全家娱乐。",
    price: 34.99,
    originalPrice: null,
    discount: null,
    isOnSale: false,
    isFeatured: false,
    stock: 12,
    category: "Toys & Games",
    images: ["/uploads/board-games.jpg"]
  },
  {
    name: "按摩器",
    description: "颈肩背按摩器，8个按摩头，3种强度，带加热功能。",
    price: 59.99,
    originalPrice: 79.99,
    discount: 25,
    isOnSale: true,
    isFeatured: false,
    stock: 20,
    category: "Health & Wellness",
    images: ["/uploads/massager.jpg"]
  },
  {
    name: "书架",
    description: "5层木质书架，现代简约设计，轻松组装。",
    price: 129.99,
    originalPrice: 169.99,
    discount: 23.5,
    isOnSale: true,
    isFeatured: true,
    stock: 8,
    category: "Furniture",
    images: ["/uploads/bookshelf.jpg"]
  },
  {
    name: "金耳环",
    description: "18K镀金耳环，简约设计，适合日常佩戴。",
    price: 39.99,
    originalPrice: 59.99,
    discount: 33.3,
    isOnSale: true,
    isFeatured: false,
    stock: 25,
    category: "Jewelry",
    images: ["/uploads/earrings.jpg"]
  },
  {
    name: "智能扬声器",
    description: "AI智能扬声器，支持语音控制，与智能家居设备连接。",
    price: 99.99,
    originalPrice: 129.99,
    discount: 23.1,
    isOnSale: true,
    isFeatured: true,
    stock: 15,
    category: "Electronics",
    images: ["/uploads/smart-speaker.jpg"]
  },
  {
    name: "男士皮鞋",
    description: "真皮男士正装皮鞋，舒适耐穿，适合工作和正式场合。",
    price: 119.99,
    originalPrice: 159.99,
    discount: 25,
    isOnSale: true,
    isFeatured: false,
    stock: 10,
    category: "Clothing",
    images: ["/uploads/leather-shoes.jpg"]
  },
  {
    name: "榨汁机",
    description: "多功能榨汁机，800W功率，多种速度选择，易于清洗。",
    price: 69.99,
    originalPrice: null,
    discount: null,
    isOnSale: false,
    isFeatured: false,
    stock: 15,
    category: "Home & Kitchen",
    images: ["/uploads/juicer.jpg"]
  },
  {
    name: "历史书籍",
    description: "全球历史系列丛书，精装版，包含大量图片和地图。",
    price: 49.99,
    originalPrice: 69.99,
    discount: 28.6,
    isOnSale: true,
    isFeatured: false,
    stock: 20,
    category: "Books",
    images: ["/uploads/history-books.jpg"]
  },
  {
    name: "登山包",
    description: "45L大容量登山包，防水材质，人体工学设计，多口袋。",
    price: 79.99,
    originalPrice: 99.99,
    discount: 20,
    isOnSale: true,
    isFeatured: true,
    stock: 12,
    category: "Sports & Outdoors",
    images: ["/uploads/hiking-backpack.jpg"]
  }
];

// 生成商品的占位图URL
function generatePlaceholderImage(name: string, index: number): string {
  // 使用不同颜色的占位图
  const colors = ['1abc9c', '3498db', 'e74c3c', 'f39c12', '9b59b6', '2ecc71'];
  const color = colors[index % colors.length];
  const encodedName = encodeURIComponent(name);
  return `https://via.placeholder.com/400x300/${color}/ffffff?text=${encodedName}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 验证管理员权限
  const session = await getServerSession(req, res, authOptions);
  
  if (session?.user?.role !== 'ADMIN') {
    return res.status(401).json({ message: '未授权访问' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: '方法不允许' });
  }

  try {
    // 首先删除所有现有产品
    await prisma.product.deleteMany({});
    
    // 创建示例产品
    const products = await Promise.all(
      sampleProducts.map(async (product, index) => {
        // 检查产品图片是否为空，如果是则生成占位图
        const images = product.images.length > 0 
          ? product.images 
          : [generatePlaceholderImage(product.name, index), generatePlaceholderImage(product.name, index + 1)];
          
        return prisma.product.create({
          data: {
            ...product,
            images
          }
        });
      })
    );
    
    return res.status(200).json({ message: '成功创建30个示例商品', count: products.length });
  } catch (error) {
    console.error('创建示例商品失败:', error);
    return res.status(500).json({ message: '创建示例商品失败', error });
  }
} 