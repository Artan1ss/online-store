import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import {
  FiShoppingCart,
  FiArrowLeft,
  FiPlus,
  FiMinus,
  FiTag,
  FiStar,
  FiTruck,
  FiShield,
} from "react-icons/fi";
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
  createdAt: string;
  updatedAt: string;
}

interface RelatedProduct {
  id: string;
  name: string;
  price: number;
  isOnSale: boolean;
  discount?: number | null;
  images: string[];
}

export default function ProductDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([]);
  const { addItem } = useCart();

  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/products/public/${id}`);

        if (response.ok) {
          const data = await response.json();
          setProduct(data);

          // Get related products (same category)
          fetchRelatedProducts(data.category, data.id);
        } else {
          console.error("Product not found");
          router.push("/products");
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchRelatedProducts = async (
      category: string,
      productId: string,
    ) => {
      try {
        const params = new URLSearchParams();
        params.append("category", category);

        const response = await fetch(
          `/api/products/public?${params.toString()}`,
        );
        const data = await response.json();

        // Filter out current product and limit to 4 related products
        const filtered = data
          .filter((p: RelatedProduct) => p.id !== productId)
          .slice(0, 4);

        setRelatedProducts(filtered);
      } catch (error) {
        console.error("Error fetching related products:", error);
      }
    };

    fetchProduct();
  }, [id, router]);

  const handleQuantityChange = (value: number) => {
    if (product) {
      // Ensure quantity is not less than 1 and not more than stock
      const newQty = Math.max(1, Math.min(value, product.stock));
      setQuantity(newQty);
    }
  };

  const handleAddToCart = () => {
    if (product) {
      let finalPrice = product.price;
      let originalPrice;

      if (product.isOnSale && product.discount) {
        finalPrice = product.price * (1 - product.discount / 100);
        originalPrice = product.price; // Store the original price for reference
      }

      // Add to cart with the correct quantity
      addItem(
        {
          id: product.id,
          name: product.name,
          price: finalPrice,
          originalPrice: originalPrice, // Include originalPrice if it's a discounted item
          image: product.images[0] || "/placeholder.png",
        },
        quantity,
      );
    }
  };

  // Format category name
  const formatCategoryName = (cat: string) => {
    return cat
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  // Calculate savings
  const calculateSavings = () => {
    if (product && product.isOnSale && product.discount) {
      const discountedPrice = product.price * (1 - product.discount / 100);
      return product.price - discountedPrice;
    }
    return 0;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900">
            Product Not Found
          </h1>
          <p className="mt-2 text-gray-600">
            The product you are looking for does not exist or has been removed.
          </p>
          <Link
            href="/products"
            className="mt-4 inline-block text-blue-500 hover:text-blue-700"
          >
            Back to Products
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>{product.name} - NAMarket</title>
        <meta name="description" content={product.description} />
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/products"
            className="inline-flex items-center text-blue-500 hover:text-blue-700"
          >
            <FiArrowLeft className="mr-1" /> Back to Products
          </Link>
        </div>

        <div className="lg:grid lg:grid-cols-2 lg:gap-8">
          {/* Product Images */}
          <div className="mb-8 lg:mb-0">
            <div className="relative aspect-w-1 aspect-h-1 bg-gray-100 rounded-lg overflow-hidden mb-4">
              {product.images.length > 0 ? (
                <img
                  src={product.images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-center object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <span className="text-gray-500">No Image Available</span>
                </div>
              )}

              {product.isOnSale && product.discount && (
                <div className="absolute top-4 left-4 bg-red-500 text-white px-2 py-1 text-sm font-bold rounded-md">
                  Sale {product.discount}% Off
                </div>
              )}

              {product.isFeatured && (
                <div className="absolute top-4 right-4 bg-yellow-500 text-white px-2 py-1 text-sm font-bold rounded-md">
                  Featured
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-w-1 aspect-h-1 rounded-md overflow-hidden border-2 ${
                      selectedImage === index
                        ? "border-blue-500"
                        : "border-transparent"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} - Image ${index + 1}`}
                      className="w-full h-full object-center object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Information */}
          <div>
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                {product.name}
              </h1>

              <div className="flex items-center mb-4">
                <Link
                  href={`/categories/${product.category}`}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-full text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  {formatCategoryName(product.category)}
                </Link>

                {product.stock > 0 ? (
                  <span className="ml-4 text-sm text-green-600 font-medium">
                    In Stock
                  </span>
                ) : (
                  <span className="ml-4 text-sm text-red-600 font-medium">
                    Out of Stock
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center">
                  {product.isOnSale && product.discount ? (
                    <>
                      <span className="text-3xl font-bold text-red-600">
                        $
                        {(product.price * (1 - product.discount / 100)).toFixed(
                          2,
                        )}
                      </span>
                      <span className="ml-3 text-lg text-gray-500 line-through">
                        ${product.price.toFixed(2)}
                      </span>
                      <span className="ml-3 px-2 py-0.5 bg-red-100 text-red-800 rounded-md text-sm font-medium">
                        Save ${calculateSavings().toFixed(2)}
                      </span>
                    </>
                  ) : (
                    <span className="text-3xl font-bold text-gray-900">
                      ${product.price.toFixed(2)}
                    </span>
                  )}
                </div>

                {product.isOnSale && product.discount && (
                  <p className="text-sm text-red-600">
                    Limited Time: {product.discount}% Off
                  </p>
                )}
              </div>
            </div>

            <div className="border-t border-b border-gray-200 py-6 mb-6">
              <div className="text-base text-gray-700 space-y-4">
                <p>{product.description}</p>
              </div>
            </div>

            {/* Purchase Area */}
            <div className="space-y-6">
              <div className="flex items-center">
                <div className="mr-6">
                  <label
                    htmlFor="quantity"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Quantity
                  </label>
                  <div className="flex items-center border border-gray-300 rounded-md">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(quantity - 1)}
                      className="p-2 text-gray-500 hover:text-gray-600"
                      disabled={quantity <= 1}
                    >
                      <FiMinus />
                    </button>
                    <input
                      type="number"
                      id="quantity"
                      name="quantity"
                      min="1"
                      max={product.stock}
                      value={quantity}
                      onChange={(e) =>
                        handleQuantityChange(parseInt(e.target.value) || 1)
                      }
                      className="w-12 text-center border-0 focus:ring-0"
                    />
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(quantity + 1)}
                      className="p-2 text-gray-500 hover:text-gray-600"
                      disabled={quantity >= product.stock}
                    >
                      <FiPlus />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total
                  </label>
                  <p className="text-lg font-medium text-gray-900">
                    $
                    {(product.isOnSale && product.discount
                      ? product.price * (1 - product.discount / 100) * quantity
                      : product.price * quantity
                    ).toFixed(2)}
                  </p>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                className={`w-full flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white 
                  ${product.stock > 0 ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"}`}
              >
                <FiShoppingCart className="mr-2" />
                {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
              </button>
            </div>

            {/* Shopping Guarantee */}
            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="flex items-start">
                <FiTruck className="text-blue-500 mt-1 mr-2" />
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    Fast Delivery
                  </h3>
                  <p className="text-xs text-gray-500">
                    Shipped within 48 hours
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <FiShield className="text-blue-500 mt-1 mr-2" />
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    Quality Guarantee
                  </h3>
                  <p className="text-xs text-gray-500">
                    7-day money-back guarantee
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Related Products
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <div className="relative group" key={relatedProduct.id}>
                  <Link href={`/products/${relatedProduct.id}`}>
                    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full">
                      <div className="aspect-w-1 aspect-h-1 relative">
                        <img
                          src={relatedProduct.images[0] || "/placeholder.png"}
                          alt={relatedProduct.name}
                          className="w-full h-48 object-cover"
                        />
                        {relatedProduct.isOnSale && relatedProduct.discount && (
                          <div className="absolute top-0 left-0 bg-red-500 text-white px-2 py-1 text-xs font-bold">
                            Sale {relatedProduct.discount}% Off
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {relatedProduct.name}
                        </h3>
                        <div className="flex justify-between items-center">
                          {relatedProduct.isOnSale &&
                          relatedProduct.discount ? (
                            <>
                              <span className="text-lg font-bold text-red-600">
                                $
                                {(
                                  relatedProduct.price *
                                  (1 - relatedProduct.discount / 100)
                                ).toFixed(2)}
                              </span>
                              <span className="ml-2 text-sm text-gray-500 line-through">
                                ${relatedProduct.price.toFixed(2)}
                              </span>
                            </>
                          ) : (
                            <span className="text-lg font-bold text-blue-600">
                              ${relatedProduct.price.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
