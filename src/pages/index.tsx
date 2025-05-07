import React, { useState, useEffect } from "react";
import Head from "next/head";
import { FiArrowRight, FiTag, FiStar } from "react-icons/fi";
import Link from "next/link";
import Footer from "@/components/Footer";

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number | null;
  discount?: number | null;
  isOnSale: boolean;
  isFeatured: boolean;
  category: string;
  images: string[];
}

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [saleProducts, setSaleProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Get featured products
        const featuredResponse = await fetch(
          "/api/products/public?isFeatured=true&limit=4",
        );
        const featuredData = await featuredResponse.json();
        setFeaturedProducts(Array.isArray(featuredData) ? featuredData : []);

        // Get sale products
        const saleResponse = await fetch(
          "/api/products/public?isOnSale=true&limit=4",
        );
        const saleData = await saleResponse.json();
        setSaleProducts(Array.isArray(saleData) ? saleData : []);

        console.log("Sale products data:", saleData);
      } catch (error) {
        console.error("Error fetching products:", error);
        // Set empty arrays on error to prevent crashes
        setFeaturedProducts([]);
        setSaleProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <>
      <Head>
        <title>NAMarket - Online Shopping Platform</title>
        <meta
          name="description"
          content="NAMarket, your trusted online shopping platform offering high-quality products"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Main Banner */}
      <section
        className="relative pt-12 pb-16 text-white bg-cover bg-center"
        style={{ backgroundImage: "url('/img/Online_shopping.webp')" }}
      >
        <div className="absolute inset-0 bg-blue-900 bg-opacity-70"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="py-20 px-10 text-center text-white rounded-lg">
              <h2 className="text-4xl font-bold mb-4">
                Discover Amazing Products
              </h2>
              <p className="text-xl mb-8">
                Shop at NAMarket and enjoy high-quality products and services
              </p>
              <Link
                href="/products"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors inline-flex items-center font-semibold"
              >
                Shop Now <FiArrowRight className="ml-2" />
              </Link>
            </div>
            <div className="hidden md:flex justify-center items-center">
              <div className="bg-white bg-opacity-20 rounded-lg p-8 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="240"
                  height="240"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-white"
                >
                  <circle cx="8" cy="21" r="1"></circle>
                  <circle cx="19" cy="21" r="1"></circle>
                  <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Quick Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Link
            href="/categories/Electronics"
            className="bg-white shadow-md rounded-lg p-6 text-center hover:shadow-lg transition duration-300"
          >
            <div className="text-4xl text-blue-600 mb-4 flex justify-center">
              🖥️
            </div>
            <h3 className="text-lg font-medium text-gray-900">Electronics</h3>
          </Link>
          <Link
            href="/categories/Sports"
            className="bg-white shadow-md rounded-lg p-6 text-center hover:shadow-lg transition duration-300"
          >
            <div className="text-4xl text-blue-600 mb-4 flex justify-center">
              🏀
            </div>
            <h3 className="text-lg font-medium text-gray-900">Sports</h3>
          </Link>
          <Link
            href="/categories/Home"
            className="bg-white shadow-md rounded-lg p-6 text-center hover:shadow-lg transition duration-300"
          >
            <div className="text-4xl text-blue-600 mb-4 flex justify-center">
              🏠
            </div>
            <h3 className="text-lg font-medium text-gray-900">Home</h3>
          </Link>
        </div>
      </div>

      {/* On Sale Products */}
      <div className="bg-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <FiTag className="mr-2 text-red-500" /> On Sale
            </h2>
            <Link
              href="/deals"
              className="text-blue-600 hover:text-blue-800 flex items-center"
            >
              View All <FiArrowRight className="ml-1" />
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.isArray(saleProducts) && saleProducts.length > 0 ? (
                saleProducts.map((product) => (
                  <Link key={product.id} href={`/products/${product.id}`}>
                    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full">
                      <div className="relative h-48">
                        <img
                          src={product.images?.[0] || "/placeholder.png"}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                        {product.discount && (
                          <div className="absolute top-0 left-0 bg-red-500 text-white px-2 py-1 text-xs font-bold">
                            -{product.discount}%
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {product.name}
                        </h3>
                        <div className="flex justify-between items-center">
                          <div>
                            {product.isOnSale && product.discount ? (
                              <>
                                <span className="text-lg font-bold text-red-600">
                                  $
                                  {(
                                    product.price *
                                    (1 - product.discount / 100)
                                  ).toFixed(2)}
                                </span>
                                <span className="ml-2 text-sm text-gray-500 line-through">
                                  ${product.price.toFixed(2)}
                                </span>
                              </>
                            ) : (
                              <span className="text-lg font-bold text-gray-900">
                                ${product.price.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="col-span-4 text-center py-6">
                  <p className="text-gray-500">No sale items available</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Featured Products */}
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <FiStar className="mr-2 text-yellow-500" /> Featured Products
            </h2>
            <Link
              href="/products?isFeatured=true"
              className="text-blue-600 hover:text-blue-800 flex items-center"
            >
              View All <FiArrowRight className="ml-1" />
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.isArray(featuredProducts) &&
              featuredProducts.length > 0 ? (
                featuredProducts.map((product) => (
                  <Link key={product.id} href={`/products/${product.id}`}>
                    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full">
                      <div className="relative h-48">
                        <img
                          src={product.images?.[0] || "/placeholder.png"}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                        {product.isFeatured && (
                          <div className="absolute top-0 right-0 bg-yellow-500 text-white px-2 py-1 text-xs font-bold">
                            Featured
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {product.name}
                        </h3>
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold text-gray-900">
                            ${product.price.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="col-span-4 text-center py-6">
                  <p className="text-gray-500">
                    No featured products available
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Shopping Benefits */}
      <div className="bg-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Shopping Benefits
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-4xl text-blue-600 mb-4 flex justify-center">
                🚚
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2 text-center">
                Fast Delivery
              </h3>
              <p className="text-gray-600 text-center">
                Orders shipped within 48 hours, ensuring you receive your
                products quickly
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-4xl text-blue-600 mb-4 flex justify-center">
                🔒
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2 text-center">
                Secure Payment
              </h3>
              <p className="text-gray-600 text-center">
                Multiple secure payment options to protect your financial
                information
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-4xl text-blue-600 mb-4 flex justify-center">
                🔄
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2 text-center">
                7-Day Returns
              </h3>
              <p className="text-gray-600 text-center">
                7-day no-questions-asked return policy to ensure your
                satisfaction
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
