import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { FiArrowLeft, FiSave, FiPlus, FiTrash2 } from 'react-icons/fi';
import AdminLayout from '@/components/AdminLayout';

// 订单状态类型
type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

// 支付状态类型
type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

// 订单项类型
interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  image?: string;
}

// 订单类型
interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress: string;
  billingAddress?: string;
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

// 产品类型
interface Product {
  id: string;
  name: string;
  price: number;
  images: string[];
}

export default function EditOrder() {
  const router = useRouter();
  const { id } = router.query;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  
  // 获取订单详情
  useEffect(() => {
    if (!id) return;
    
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/orders/${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch order details');
        }
        
        const data = await response.json();
        setOrder(data);
      } catch (error) {
        console.error('Error fetching order details:', error);
        setError('无法加载订单详情，请重试。');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrderDetails();
  }, [id]);
  
  // 获取产品列表
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products');
        if (!response.ok) throw new Error('Failed to fetch products');
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };
    
    fetchProducts();
  }, []);
  
  // 处理表单字段变更
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!order) return;
    
    const { name, value } = e.target;
    setOrder({
      ...order,
      [name]: value,
    });
  };
  
  // 处理订单项数量变更
  const handleItemQuantityChange = (itemId: string, newQuantity: number) => {
    if (!order) return;
    
    if (newQuantity < 1) newQuantity = 1;
    
    const updatedItems = order.items.map(item => {
      if (item.id === itemId) {
        return { ...item, quantity: newQuantity };
      }
      return item;
    });
    
    setOrder({
      ...order,
      items: updatedItems,
    });
  };
  
  // 处理删除订单项
  const handleRemoveItem = (itemId: string) => {
    if (!order) return;
    
    const updatedItems = order.items.filter(item => item.id !== itemId);
    
    setOrder({
      ...order,
      items: updatedItems,
    });
  };
  
  // 处理添加产品到订单
  const handleAddProduct = () => {
    if (!order || !selectedProduct || quantity < 1) return;
    
    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;
    
    // 生成临时ID (实际应用中可能需要更复杂的逻辑)
    const tempId = `temp-${Date.now()}`;
    
    const newItem: OrderItem = {
      id: tempId,
      productId: product.id,
      productName: product.name,
      quantity: quantity,
      price: product.price,
      image: product.images && product.images.length > 0 ? product.images[0] : undefined,
    };
    
    setOrder({
      ...order,
      items: [...order.items, newItem],
    });
    
    // 重置选择
    setSelectedProduct('');
    setQuantity(1);
  };
  
  // 计算订单总金额
  const calculateTotal = () => {
    if (!order) return 0;
    
    return order.items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  };
  
  // 处理保存订单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!order || !id) return;
    
    try {
      setSaving(true);
      
      // 更新总金额
      const totalAmount = calculateTotal();
      const orderData = {
        ...order,
        totalAmount,
      };
      
      const response = await fetch(`/api/admin/orders/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update order');
      }
      
      // 保存成功后跳转到订单详情页
      router.push(`/admin/orders/${id}`);
    } catch (error) {
      console.error('Error updating order:', error);
      alert('保存订单失败，请重试。');
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </AdminLayout>
    );
  }
  
  if (error || !order) {
    return (
      <AdminLayout>
        <div className="flex flex-col justify-center items-center h-screen">
          <p className="text-red-500 mb-4">{error || '订单不存在或已被删除'}</p>
          <Link href="/admin/orders" className="text-blue-500 hover:underline">
            返回订单列表
          </Link>
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout>
      <Head>
        <title>编辑订单 #{order.orderNumber} - NAMarket</title>
      </Head>
      
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* 顶部导航和操作 */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center mb-4 sm:mb-0">
            <Link href={`/admin/orders/${order.id}`} className="mr-4 text-gray-500 hover:text-gray-700">
              <FiArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-semibold text-gray-900">
              编辑订单 #{order.orderNumber}
            </h1>
          </div>
          
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {saving ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-b-2 border-white"></div>
                保存中...
              </>
            ) : (
              <>
                <FiSave className="mr-2 -ml-1 h-4 w-4" />
                保存订单
              </>
            )}
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          {/* 客户信息 */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">客户信息</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                编辑客户的联系信息和地址
              </p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor="customerName" className="block text-sm font-medium text-gray-700">
                    客户姓名
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="customerName"
                      id="customerName"
                      value={order.customerName}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                
                <div className="sm:col-span-3">
                  <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700">
                    电子邮箱
                  </label>
                  <div className="mt-1">
                    <input
                      type="email"
                      name="customerEmail"
                      id="customerEmail"
                      value={order.customerEmail}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                
                <div className="sm:col-span-3">
                  <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700">
                    联系电话
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="customerPhone"
                      id="customerPhone"
                      value={order.customerPhone || ''}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                
                <div className="sm:col-span-6">
                  <label htmlFor="shippingAddress" className="block text-sm font-medium text-gray-700">
                    配送地址
                  </label>
                  <div className="mt-1">
                    <textarea
                      name="shippingAddress"
                      id="shippingAddress"
                      rows={3}
                      value={order.shippingAddress}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                
                <div className="sm:col-span-6">
                  <label htmlFor="billingAddress" className="block text-sm font-medium text-gray-700">
                    账单地址 (可选)
                  </label>
                  <div className="mt-1">
                    <textarea
                      name="billingAddress"
                      id="billingAddress"
                      rows={3}
                      value={order.billingAddress || ''}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* 订单状态和支付信息 */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">订单状态和支付信息</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                更新订单的状态和支付详情
              </p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    订单状态
                  </label>
                  <div className="mt-1">
                    <select
                      id="status"
                      name="status"
                      value={order.status}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    >
                      <option value="PENDING">待处理</option>
                      <option value="PROCESSING">处理中</option>
                      <option value="SHIPPED">已发货</option>
                      <option value="DELIVERED">已送达</option>
                      <option value="CANCELLED">已取消</option>
                    </select>
                  </div>
                </div>
                
                <div className="sm:col-span-3">
                  <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">
                    支付方式
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="paymentMethod"
                      id="paymentMethod"
                      value={order.paymentMethod}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                
                <div className="sm:col-span-3">
                  <label htmlFor="paymentStatus" className="block text-sm font-medium text-gray-700">
                    支付状态
                  </label>
                  <div className="mt-1">
                    <select
                      id="paymentStatus"
                      name="paymentStatus"
                      value={order.paymentStatus}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    >
                      <option value="PENDING">待支付</option>
                      <option value="PAID">已支付</option>
                      <option value="FAILED">支付失败</option>
                      <option value="REFUNDED">已退款</option>
                    </select>
                  </div>
                </div>
                
                <div className="sm:col-span-6">
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                    订单备注 (可选)
                  </label>
                  <div className="mt-1">
                    <textarea
                      name="notes"
                      id="notes"
                      rows={3}
                      value={order.notes || ''}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* 订单商品 */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">订单商品</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                管理订单中的商品和数量
              </p>
            </div>
            <div className="border-t border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        商品
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        单价
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        数量
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        小计
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">操作</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {order.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {item.image ? (
                              <div className="flex-shrink-0 h-10 w-10">
                                <img
                                  className="h-10 w-10 rounded-md object-cover"
                                  src={item.image}
                                  alt={item.productName}
                                />
                              </div>
                            ) : (
                              <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-md flex items-center justify-center">
                                <span className="text-gray-500 text-xs">无图片</span>
                              </div>
                            )}
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                              <div className="text-sm text-gray-500">ID: {item.productId}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${item.price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleItemQuantityChange(item.id, parseInt(e.target.value))}
                              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-16 sm:text-sm border-gray-300 rounded-md"
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ${(item.price * item.quantity).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <FiTrash2 className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <th scope="row" colSpan={3} className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                        总计
                      </th>
                      <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${calculateTotal().toFixed(2)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
          
          {/* 添加商品 */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">添加商品</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                向订单中添加更多商品
              </p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-4">
                  <label htmlFor="product" className="block text-sm font-medium text-gray-700">
                    选择商品
                  </label>
                  <div className="mt-1">
                    <select
                      id="product"
                      value={selectedProduct}
                      onChange={(e) => setSelectedProduct(e.target.value)}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    >
                      <option value="">-- 选择商品 --</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} - ${product.price.toFixed(2)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="sm:col-span-1">
                  <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                    数量
                  </label>
                  <div className="mt-1">
                    <input
                      type="number"
                      id="quantity"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value))}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                
                <div className="sm:col-span-1 flex items-end">
                  <button
                    type="button"
                    onClick={handleAddProduct}
                    disabled={!selectedProduct}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    <FiPlus className="mr-2 -ml-1 h-4 w-4" />
                    添加
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* 提交按钮 */}
          <div className="flex justify-end">
            <Link
              href={`/admin/orders/${order.id}`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-3"
            >
              取消
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {saving ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-b-2 border-white"></div>
                  保存中...
                </>
              ) : (
                <>
                  <FiSave className="mr-2 -ml-1 h-4 w-4" />
                  保存订单
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
} 