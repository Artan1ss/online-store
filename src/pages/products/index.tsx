import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { FiSearch, FiFilter, FiShoppingCart, FiTag, FiStar } from 'react-icons/fi';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { useCart } from '@/contexts/CartContext';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number | null;
  discount?: number | null;
  isOnSale: boolean;
  isFeatured: boolean;
  stock: number;
  category: string;
  status: string;
  images: string[];
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [sortMethod, setSortMethod] = useState('newest');
  const [showOnSale, setShowOnSale] = useState(false);
  const [showFeatured, setShowFeatured] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const { addItem } = useCart();

  // Get all products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Build query parameters
        const params = new URLSearchParams();
        
        if (showOnSale) {
          params.append('isOnSale', 'true');
        }
        
        if (showFeatured) {
          params.append('isFeatured', 'true');
        }
        
        // Determine sorting parameters
        const sortParams = getSortParams(sortMethod);
        params.append('sort', sortParams.sort);
        params.append('order', sortParams.order);
        
        // Price range filtering
        params.append('minPrice', priceRange[0].toString());
        params.append('maxPrice', priceRange[1].toString());
        
        const response = await fetch(`/api/products/public?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error(`Error fetching products: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!Array.isArray(data)) {
          throw new Error('Invalid data format received from server');
        }
        
        setProducts(data);
        
        // Extract all unique categories
        const uniqueCategories = Array.from(new Set(data.map((product: Product) => product.category).filter(Boolean))) as string[];
        setCategories(uniqueCategories);
      } catch (error) {
        console.error('Error fetching products:', error);
        setError(error instanceof Error ? error.message : 'Failed to load products');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [sortMethod, showOnSale, showFeatured, priceRange]);

  // Get sorting parameters based on method
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
        return { sort: 'createdAt', order: 'desc' };
    }
  };

  // Filter products
  const filteredProducts = products ? products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }) : [];

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
      image: product.images[0] || '/placeholder.png'
    });
  };

  // Format category name
  const formatCategoryName = (cat: string) => {
    return cat.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  // Handle price range change
  const handlePriceRangeChange = (index: number, value: number) => {
    const newRange = [...priceRange] as [number, number];
    newRange[index] = value;
    
    // Ensure min price is not greater than max price
    if (index === 0 && value > newRange[1]) {
      newRange[1] = value;
    } else if (index === 1 && value < newRange[0]) {
      newRange[0] = value;
    }
    
    setPriceRange(newRange);
  };

  return (
    <Layout>
      <Head>
        <title>Product List - NAMarket</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Product List</h1>
          
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <Link 
              href="/deals" 
              className="inline-flex items-center px-3 py-1 border border-red-300 rounded-full text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100"
            >
              <FiTag className="mr-1" />
              Special Offers
            </Link>
            
            {categories.slice(0, 5).map((category) => (
              <Link 
                key={category}
                href={`/categories/${category}`}
                className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-full text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                {formatCategoryName(category)}
              </Link>
            ))}
            
            {categories.length > 5 && (
              <span className="text-sm text-gray-500">+{categories.length - 5} more categories</span>
            )}
          </div>
          
          {/* Search and filter area */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
                <FiSearch className="absolute left-3 top-3 text-gray-400" />
              </div>
            </div>
            
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full py-2 pl-3 pr-10 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{formatCategoryName(category)}</option>
                ))}
              </select>
            </div>
            
            <div>
              <select
                value={sortMethod}
                onChange={(e) => setSortMethod(e.target.value)}
                className="w-full py-2 pl-3 pr-10 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="discount-high">Max Discount</option>
              </select>
            </div>
          </div>
          
          {/* Filters */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <input
                id="show-on-sale"
                type="checkbox"
                checked={showOnSale}
                onChange={() => setShowOnSale(!showOnSale)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="show-on-sale" className="text-sm text-gray-700">Only show sale items</label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                id="show-featured"
                type="checkbox"
                checked={showFeatured}
                onChange={() => setShowFeatured(!showFeatured)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="show-featured" className="text-sm text-gray-700">Only show recommended items</label>
            </div>
            
            <div className="md:col-span-3 mt-2">
              <label className="text-sm text-gray-700 block mb-1">Price Range: ${priceRange[0]} - ${priceRange[1]}</label>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  value={priceRange[0]}
                  onChange={(e) => handlePriceRangeChange(0, parseInt(e.target.value) || 0)}
                  placeholder="Min Price"
                  className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="number"
                  value={priceRange[1]}
                  onChange={(e) => handlePriceRangeChange(1, parseInt(e.target.value) || 0)}
                  placeholder="Max Price"
                  className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
          
          {/* Error message */}
          {error && (
            <div className="mt-4 p-4 border border-red-200 bg-red-50 rounded-md">
              <p className="text-red-700">{error}</p>
              <button 
                className="mt-2 text-blue-600 underline"
                onClick={() => window.location.reload()}
              >
                Try again
              </button>
            </div>
          )}
        </div>

        {/* Product list */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
              <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
            </div>
            <p className="mt-2 text-gray-600">Loading products...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div className="relative group" key={product.id}>
                <Link href={`/products/${product.id}`}>
                  <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full">
                    <div className="aspect-w-3 aspect-h-2 relative">
                      <img
                        src={product.images[0] || '/placeholder.png'}
                        alt={product.name}
                        className="w-full h-48 object-cover"
                      />
                      {product.isOnSale && product.discount && (
                        <div className="absolute top-0 left-0 bg-red-500 text-white px-2 py-1 text-xs font-bold">
                          Sale {product.discount}% off
                        </div>
                      )}
                      {product.isFeatured && (
                        <div className="absolute top-0 right-0 bg-yellow-500 text-white px-2 py-1 text-xs font-bold">
                          Recommended
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
                        <span className="text-sm text-gray-500">{product.stock} in stock</span>
                      </div>
                      {product.isOnSale && product.discount && (
                        <div className="mt-2 text-sm font-medium text-green-500">
                          Save: ${(product.price * product.discount / 100).toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
                {product.stock > 0 && (
                  <button
                    onClick={(e) => handleAddToCart(e, product)}
                    className="absolute bottom-4 right-4 bg-blue-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    aria-label="Add to cart"
                  >
                    <FiShoppingCart size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {!loading && filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No products found.</p>
          </div>
        )}
      </div>
    </Layout>
  );
} 