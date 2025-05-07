import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { FiShoppingCart, FiArrowLeft } from "react-icons/fi";
import Layout from "@/components/Layout";
import { useCart } from "@/contexts/CartContext";

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

export default function CategoryPage() {
  const router = useRouter();
  const { category } = router.query;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortMethod, setSortMethod] = useState("newest");
  const { addItem } = useCart();

  useEffect(() => {
    if (!category) return;

    const fetchCategoryProducts = async () => {
      try {
        setLoading(true);

        // Build query parameters
        const params = new URLSearchParams();
        params.append("category", category as string);

        // Determine sort parameters
        const sortParams = getSortParams(sortMethod);
        params.append("sort", sortParams.sort);
        params.append("order", sortParams.order);

        const response = await fetch(
          `/api/products/public?${params.toString()}`,
        );
        const data = await response.json();

        // 正确处理API响应格式
        console.log("Category products data:", data);
        if (
          data.status === "success" &&
          data.data &&
          Array.isArray(data.data.products)
        ) {
          setProducts(data.data.products);
          console.log(
            `Found ${data.data.products.length} products in ${category} category`,
          );
        } else {
          console.error("Invalid API response format:", data);
          setProducts([]);
        }
      } catch (error) {
        console.error("Error fetching category products:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryProducts();
  }, [category, sortMethod]);

  // Get sort parameters based on sort method
  const getSortParams = (method: string) => {
    switch (method) {
      case "newest":
        return { sort: "createdAt", order: "desc" };
      case "price-low":
        return { sort: "price", order: "asc" };
      case "price-high":
        return { sort: "price", order: "desc" };
      case "discount-high":
        return { sort: "discount", order: "desc" };
      default:
        return { sort: "createdAt", order: "desc" };
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
      image: product.images[0] || "/placeholder.png",
    });
  };

  // Format category name
  const formatCategoryName = (cat: string) => {
    return cat
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const categoryDisplayName = category
    ? formatCategoryName(category as string)
    : "";

  return (
    <Layout>
      <Head>
        <title>{categoryDisplayName || "Category"} - NAMarket</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Link
              href="/products"
              className="mr-4 text-blue-500 hover:text-blue-700"
            >
              <FiArrowLeft className="inline-block mr-1" /> Back to Products
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            {categoryDisplayName} Products
          </h1>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-gray-600">
              {loading ? "Loading..." : `Found ${products.length} products`}
            </p>

            <div className="sm:w-48">
              <select
                value={sortMethod}
                onChange={(e) => setSortMethod(e.target.value)}
                className="w-full py-2 pl-3 pr-10 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="discount-high">Highest Discount</option>
              </select>
            </div>
          </div>
        </div>

        {/* Product List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        ) : (
          <>
            {Array.isArray(products) && products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <div className="relative group" key={product.id}>
                    <Link href={`/products/${product.id}`}>
                      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full">
                        <div className="aspect-w-3 aspect-h-2 relative">
                          <img
                            src={product.images?.[0] || "/placeholder.png"}
                            alt={product.name}
                            className="w-full h-48 object-cover"
                          />
                          {product.isOnSale && product.discount && (
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
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {product.name}
                          </h3>
                          <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                            {product.description}
                          </p>
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
                                <span className="text-lg font-bold text-blue-600">
                                  ${product.price.toFixed(2)}
                                </span>
                              )}
                            </div>
                            <span className="text-sm text-gray-500">
                              {product.stock} in stock
                            </span>
                          </div>
                          {product.isOnSale && product.discount && (
                            <div className="mt-2 text-sm font-medium text-green-500">
                              Save: $
                              {(
                                (product.price * product.discount) /
                                100
                              ).toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                    {product.stock > 0 && (
                      <button
                        onClick={(e) => handleAddToCart(e, product)}
                        className="absolute bottom-4 right-4 bg-blue-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        aria-label="Add to Cart"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No products available</p>
              </div>
            )}
          </>
        )}

        {!loading && products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No products found in this category.</p>
            <Link
              href="/products"
              className="mt-4 inline-block text-blue-500 hover:text-blue-700"
            >
              View All Products
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
}
