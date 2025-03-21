import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { FiShoppingCart, FiArrowLeft, FiTag, FiAlertCircle } from 'react-icons/fi';
import Layout from '@/components/Layout';
import { useCart } from '@/contexts/CartContext';

interface Product {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  originalPrice?: number | null;
  discount?: number | null;
  isOnSale?: boolean;
  isFeatured?: boolean;
  stock?: number;
  inventory?: number;
  category: string;
  status?: string;
  images?: string[];
  imageUrl?: string;
}

interface ApiResponse {
  status: 'success' | 'error';
  message: string;
  data?: {
    products: Product[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
    meta: {
      responseTimeMs: number;
      fallback?: boolean;
    };
  };
  error?: string;
  timestamp: string;
}

export default function DealsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortMethod, setSortMethod] = useState('discount-high');
  const { addItem } = useCart();

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Build query parameters
        const params = new URLSearchParams();
        params.append('isOnSale', 'true');
        
        // Determine sort parameters
        const sortParams = getSortParams(sortMethod);
        params.append('sort', sortParams.sort);
        params.append('order', sortParams.order);
        
        const response = await fetch(`/api/products/public?${params.toString()}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Error fetching sale products: ${response.status} ${response.statusText}. ${errorText}`);
        }
        
        const result: ApiResponse = await response.json();
        
        if (result.status === 'error') {
          throw new Error(result.error || result.message || 'Unknown error occurred');
        }
        
        // Check if the response has the expected format
        if (!result.data || !Array.isArray(result.data.products)) {
          console.log('Unexpected API response format:', result);
          setProducts([]);
        } else {
          setProducts(result.data.products);
        }
      } catch (error) {
        console.error('Error fetching sale products:', error);
        setError(error instanceof Error ? error.message : 'Failed to load sale products');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDeals();
  }, [sortMethod]);

  // Get sort parameters based on sort method
  const getSortParams = (method: string) => {
    switch (method) {
      case 'newest':
        return { sort: 'createdAt', order: 'desc' };
      case 'price-low':
        return { sort: 'price', order: 'asc' };
      case 'price-high':
        return { sort: 'price', order: 'desc' };
      case 'discount-high':
        return { sort: 'discount', order: 'desc' };
      default:
        return { sort: 'discount', order: 'desc' };
    }
  };

  // Add to cart
  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    
    let finalPrice = product.price;
    let originalPrice;
    
    if (product.isOnSale && product.discount) {
      finalPrice = product.price * (1 - product.discount / 100);
      originalPrice = product.price; // Store the original price for reference
    }
    
    addItem({
      id: product.id,
      name: product.name,
      price: finalPrice,
      originalPrice: originalPrice,
      image: product.imageUrl || (product.images && product.images.length > 0 ? product.images[0] : '/placeholder.png')
    });
  };

  // Calculate savings
  const calculateSavings = (product: Product) => {
    if (product.isOnSale && product.discount && product.price) {
      const discountedPrice = product.price * (1 - product.discount / 100);
      return product.price - discountedPrice;
    }
    return 0;
  };

  return (
    <Layout>
      <Head>
        <title>Sale Items - NAMarket</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Link href="/products" className="mr-4 text-blue-500 hover:text-blue-700">
              <FiArrowLeft className="inline-block mr-1" /> Back to Products
            </Link>
          </div>
          
          <div className="flex items-center">
            <FiTag className="text-red-500 text-2xl mr-2" />
            <h1 className="text-3xl font-bold text-gray-900">Sale Items</h1>
          </div>
          
          <p className="mt-2 text-gray-600">
            Limited-time offers with great savings!
          </p>
          
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-gray-600">
              {loading ? 'Loading...' : `Found ${products.length} sale items`}
            </p>
            
            <div className="sm:w-48">
              <select
                value={sortMethod}
                onChange={(e) => setSortMethod(e.target.value)}
                className="w-full py-2 pl-3 pr-10 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="discount-high">Highest Discount</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="newest">Newest</option>
              </select>
            </div>
          </div>
          
          {/* Error message */}
          {error && (
            <div className="mt-4 p-4 border border-red-200 bg-red-50 rounded-md">
              <div className="flex items-start">
                <FiAlertCircle className="text-red-600 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <h3 className="text-red-700 font-medium">Error loading sale items</h3>
                  <p className="text-red-600 text-sm mt-1">{error}</p>
                  <div className="mt-3 flex space-x-4">
                    <button 
                      className="inline-flex items-center px-3 py-1.5 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      onClick={() => window.location.reload()}
                    >
                      Refresh page
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Product List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
              <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
            </div>
            <p className="mt-2 text-gray-600">Loading sale items...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products && products.length > 0 ? products.map((product) => (
              <div className="relative group" key={product.id}>
                <Link href={`/products/${product.id}`}>
                  <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full">
                    <div className="aspect-w-3 aspect-h-2 relative">
                      <img
                        src={product.imageUrl || (product.images && product.images.length > 0 ? product.images[0] : '/placeholder.png')}
                        alt={product.name}
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          // Fallback for image loading errors
                          (e.target as HTMLImageElement).src = '/placeholder.png';
                        }}
                      />
                      {product.discount && (
                        <div className="absolute top-0 left-0 bg-red-500 text-white px-2 py-1 text-xs font-bold">
                          Sale {product.discount}% Off
                        </div>
                      )}
                      {product.isFeatured && (
                        <div className="absolute top-0 right-0 bg-yellow-500 text-white px-2 py-1 text-xs font-bold">
                          Featured
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h3>
                      <p className="text-sm text-gray-500 mb-2 line-clamp-2">{product.description}</p>
                      <div className="flex justify-between items-center">
                        <div>
                          {product.isOnSale && product.discount ? (
                            <>
                              <span className="text-lg font-bold text-red-600">
                                ${(product.price * (1 - product.discount / 100)).toFixed(2)}
                              </span>
                              <span className="ml-2 text-sm text-gray-500 line-through">
                                ${product.price.toFixed(2)}
                              </span>
                            </>
                          ) : (
                            <span className="text-lg font-bold text-gray-900">${product.price.toFixed(2)}</span>
                          )}
                        </div>
                        <span className="text-sm text-gray-500">
                          {(product.stock ?? product.inventory ?? 0) > 0 
                            ? `${product.stock ?? product.inventory} in stock` 
                            : 'Out of stock'}
                        </span>
                      </div>
                      {product.originalPrice && (
                        <div className="mt-2 text-sm font-medium text-green-500">
                          Save: ${calculateSavings(product).toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
                {(product.stock ?? product.inventory ?? 0) > 0 && (
                  <button
                    onClick={(e) => handleAddToCart(e, product)}
                    className="absolute bottom-4 right-4 bg-blue-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    aria-label="Add to Cart"
                  >
                    <FiShoppingCart size={18} />
                  </button>
                )}
              </div>
            )) : null}
          </div>
        )}

        {!loading && (!products || products.length === 0) && (
          <div className="text-center py-12">
            <p className="text-gray-500">No sale items available at the moment.</p>
            <Link href="/products" className="mt-4 inline-block text-blue-500 hover:text-blue-700">
              View All Products
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
} 