import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { FiArrowLeft, FiShoppingBag, FiCreditCard } from 'react-icons/fi';
import Layout from '@/components/Layout';
import { useCart } from '@/contexts/CartContext';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

// Payment method type
type PaymentMethod = 'CREDIT_CARD' | 'PAYPAL' | 'BANK_TRANSFER';

// Form errors type
type FormErrors = {
  fullName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  cardNumber?: string;
  cardExpiry?: string;
  cardCvc?: string;
};

export default function Checkout() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { items, clearCart, verifyCartItems } = useCart();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CREDIT_CARD');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    postalCode: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvc: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [userAddresses, setUserAddresses] = useState<any[]>([]);
  const [userPaymentMethods, setUserPaymentMethods] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>('');
  const [useCustomAddress, setUseCustomAddress] = useState(!session);
  const [useCustomPayment, setUseCustomPayment] = useState(!session);
  const [saveAddress, setSaveAddress] = useState(false);
  const [savePaymentMethod, setSavePaymentMethod] = useState(false);

  // 获取用户地址和支付方式
  useEffect(() => {
    if (session && session.user) {
      // 获取用户的地址
      fetch('/api/user/addresses')
        .then(response => response.json())
        .then(data => {
          setUserAddresses(data);
          // 如果有默认地址，自动选择它
          const defaultAddress = data.find((addr: any) => addr.isDefault);
          if (defaultAddress) {
            setSelectedAddressId(defaultAddress.id);
            // 自动填充默认地址信息
            setFormData(prev => ({
              ...prev,
              fullName: defaultAddress.fullName,
              phone: defaultAddress.phone || '',
              address: defaultAddress.address,
              city: defaultAddress.city,
              country: defaultAddress.country,
              postalCode: defaultAddress.postalCode
            }));
            setUseCustomAddress(false);
          }
        })
        .catch(err => console.error('Error fetching addresses:', err));

      // 获取用户的支付方式
      fetch('/api/user/payment-methods')
        .then(response => response.json())
        .then(data => {
          setUserPaymentMethods(data);
          // 如果有默认支付方式，自动选择它
          const defaultPayment = data.find((payment: any) => payment.isDefault);
          if (defaultPayment && defaultPayment.type === 'CREDIT_CARD') {
            setSelectedPaymentMethodId(defaultPayment.id);
            setPaymentMethod('CREDIT_CARD');
            // 自动填充信用卡信息（仅显示最后四位）
            if (defaultPayment.cardNumber) {
              setFormData(prev => ({
                ...prev,
                cardNumber: defaultPayment.cardNumber,
                cardExpiry: defaultPayment.cardExpiry || ''
              }));
            }
            setUseCustomPayment(false);
          }
        })
        .catch(err => console.error('Error fetching payment methods:', err));

      // 自动填充邮箱
      if (session.user.email) {
        setFormData(prev => ({
          ...prev,
          email: session.user.email || ''
        }));
      }
    }
  }, [session]);

  // 选择保存的地址
  const handleSelectAddress = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const addressId = e.target.value;
    if (addressId === 'custom') {
      setUseCustomAddress(true);
      return;
    }
    
    setSelectedAddressId(addressId);
    setUseCustomAddress(false);
    
    const selectedAddress = userAddresses.find(addr => addr.id === addressId);
    if (selectedAddress) {
      setFormData(prev => ({
        ...prev,
        fullName: selectedAddress.fullName,
        phone: selectedAddress.phone || '',
        address: selectedAddress.address,
        city: selectedAddress.city,
        country: selectedAddress.country,
        postalCode: selectedAddress.postalCode
      }));
    }
  };

  // 选择支付方式
  const handleSelectPaymentMethod = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const paymentId = e.target.value;
    if (paymentId === 'custom') {
      setUseCustomPayment(true);
      return;
    }
    
    setSelectedPaymentMethodId(paymentId);
    setUseCustomPayment(false);
    
    const selectedPayment = userPaymentMethods.find(p => p.id === paymentId);
    if (selectedPayment && selectedPayment.type === 'CREDIT_CARD') {
      setFormData(prev => ({
        ...prev,
        cardNumber: selectedPayment.cardNumber || '',
        cardExpiry: selectedPayment.cardExpiry || ''
      }));
    }
  };

  // Calculate total
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = 10; // Fixed shipping cost
  const total = subtotal + shipping;

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: target.checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error when field is edited
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name as keyof FormErrors];
        return newErrors;
      });
    }
  };

  // Validate the form
  const validateForm = () => {
    const newErrors: FormErrors = {};
    
    // 如果使用自定义地址，才验证地址相关字段
    if (useCustomAddress) {
      if (!formData.fullName.trim()) {
        newErrors.fullName = 'Please enter your name';
      }
      
      if (!formData.phone.trim()) {
        newErrors.phone = 'Please enter your phone number';
      }
      
      if (!formData.address.trim()) {
        newErrors.address = 'Please enter your address';
      }
      
      if (!formData.city.trim()) {
        newErrors.city = 'Please enter your city';
      }
      
      if (!formData.country.trim()) {
        newErrors.country = 'Please enter your country/region';
      }
      
      if (!formData.postalCode.trim()) {
        newErrors.postalCode = 'Please enter your postal code';
      }
    }
    
    // 邮箱始终需要验证
    if (!formData.email.trim()) {
      newErrors.email = 'Please enter a valid email address';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // 如果选择信用卡支付，并且使用自定义支付方式，才验证信用卡字段
    if (paymentMethod === 'CREDIT_CARD' && useCustomPayment) {
      if (!formData.cardNumber.trim()) {
        newErrors.cardNumber = 'Please enter a valid card number';
      } else if (!/^\d{16}$/.test(formData.cardNumber.replace(/\s/g, ''))) {
        newErrors.cardNumber = 'Please enter a valid card number';
      }
      
      if (!formData.cardExpiry.trim()) {
        newErrors.cardExpiry = 'Please enter a valid expiration date';
      } else if (!/^\d{2}\/\d{2}$/.test(formData.cardExpiry)) {
        newErrors.cardExpiry = 'Please enter a valid expiration date';
      }
      
      if (!formData.cardCvc.trim()) {
        newErrors.cardCvc = 'Please enter your security code';
      } else if (!/^\d{3,4}$/.test(formData.cardCvc)) {
        newErrors.cardCvc = 'Please enter your security code';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle place order
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (items.length === 0) {
      alert('Your cart is empty');
      return;
    }
    
    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    setLoading(true);
    console.log('Starting order creation process...');
    
    try {
      // Verify cart items with database before proceeding
      console.log('Verifying cart items with database...');
      const cartVerification = await verifyCartItems();
      
      if (!cartVerification.valid) {
        setLoading(false);
        alert(cartVerification.message || 'Some items in your cart are no longer available. Please check your cart before proceeding.');
        router.push('/cart');
        return;
      }
      
      if (cartVerification.message) {
        // Cart was updated but is still valid
        alert(cartVerification.message);
      }
      
      if (cartVerification.removedItems && cartVerification.removedItems.length > 0) {
        // Products were removed, notify the user
        setLoading(false);
        alert(`${cartVerification.removedItems.length} item(s) were removed from your cart because they no longer exist in our inventory. Please review your cart before proceeding.`);
        router.push('/cart');
        return;
      }
      
      // If we got here, the cart is valid so continue with checkout
      const cartItems = cartVerification.updatedItems || items;
      
      if (cartItems.length === 0) {
        setLoading(false);
        alert('Your cart appears to be empty after verification. Please add products to your cart.');
        router.push('/products');
        return;
      }
      
      // Prepare order data with verified items
      const orderData = {
        customerName: formData.fullName,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        address: formData.address,
        city: formData.city,
        country: formData.country,
        postalCode: formData.postalCode,
        paymentMethod: paymentMethod,
        items: cartItems.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price,
          name: item.name,
          image: item.image
        })),
        shippingFee: shipping,
        totalAmount: total, // Includes subtotal and shipping
        // If user is logged in, save new address and payment method
        saveAddress: session && useCustomAddress && saveAddress,
        savePaymentMethod: session && paymentMethod === 'CREDIT_CARD' && useCustomPayment && savePaymentMethod,
        addressData: useCustomAddress && saveAddress ? {
          fullName: formData.fullName,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          country: formData.country,
          postalCode: formData.postalCode
        } : null,
        paymentData: useCustomPayment && paymentMethod === 'CREDIT_CARD' && savePaymentMethod ? {
          type: 'CREDIT_CARD',
          cardNumber: formData.cardNumber.slice(-4),  // Only save last four digits
          cardExpiry: formData.cardExpiry
        } : null
      };
      
      console.log('Sending order data:', JSON.stringify(orderData));
      
      try {
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(orderData)
        });
        
        console.log('Response status:', response.status);
        const responseText = await response.text();
        console.log('Raw response:', responseText);
        
        if (!response.ok) {
          let errorData;
          try {
            errorData = JSON.parse(responseText);
          } catch (parseError) {
            console.error('Failed to parse error response:', parseError);
            errorData = { error: 'Unknown server error' };
          }
          
          console.error('Server error:', errorData);
          setLoading(false);
          
          // Handle specific database errors with user-friendly messages
          if (errorData.details && errorData.details.includes('foreign key constraint')) {
            alert('One or more products in your cart are no longer available. Please refresh your cart and try again.');
            router.push('/cart');
            return;
          } else if (errorData.error.includes('products no longer exist')) {
            alert('Some items in your cart are no longer available. Please refresh your cart and try again.');
            router.push('/cart');
            return;
          } else {
            alert(`Order failed: ${errorData.error || 'Server error'} ${errorData.details || ''}`);
          }
          return;
        }
        
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Failed to parse success response:', parseError);
          setLoading(false);
          alert('Order may have been created, but we encountered an error processing the response. Please check your order history.');
          router.push('/account/orders');
          return;
        }
        
        console.log('Order successfully created:', data);
        
        // Clear cart
        clearCart();
        
        // Make sure to get the correct order ID
        const orderId = data.order?.id || data.id;
        if (!orderId) {
          console.error('Failed to get order ID from response:', data);
          alert('Order created successfully, but could not get order ID. Please check your order history.');
          router.push('/account/orders');
          return;
        }
        
        // Redirect to order confirmation
        console.log('Redirecting to order success page with ID:', orderId);
        router.push(`/order-success?orderId=${orderId}`);
      } catch (fetchError) {
        console.error('Network error during fetch:', fetchError);
        alert('Network error while connecting to the server. Please check your internet connection and try again.');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      alert('There was a problem processing your order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <Layout>
        <Head>
          <title>Checkout - NAMarket</title>
        </Head>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <Link href="/cart" className="flex items-center text-blue-600 hover:text-blue-800">
              <FiArrowLeft className="mr-2" />
              Back to Cart
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mt-4">Checkout</h1>
          </div>
          
          <div className="text-center py-12">
            <FiShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">Your cart is empty</h3>
            <p className="mt-1 text-sm text-gray-500">
              Please add items to your cart before proceeding to checkout.
            </p>
            <div className="mt-6">
              <Link href="/products" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Checkout - NAMarket</title>
      </Head>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href="/cart" className="flex items-center text-blue-600 hover:text-blue-800">
            <FiArrowLeft className="mr-2" />
            Back to Cart
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Checkout</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <form onSubmit={handlePlaceOrder}>
                {/* Personal Information */}
                <div className="border-b border-gray-200 pb-6 mb-6">
                  <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
                  
                  {session && userAddresses.length > 0 && (
                    <div className="mb-4">
                      <label htmlFor="savedAddress" className="block text-sm font-medium text-gray-700">
                        Choose a saved address
                      </label>
                      <select
                        id="savedAddress"
                        name="savedAddress"
                        value={selectedAddressId || 'custom'}
                        onChange={handleSelectAddress}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      >
                        <option value="custom">Use a new address</option>
                        {userAddresses.map((addr) => (
                          <option key={addr.id} value={addr.id}>
                            {addr.fullName} - {addr.address}, {addr.city}
                          </option>
                        ))}
                      </select>
                      {!useCustomAddress && (
                        <div className="mt-2">
                          <button
                            type="button"
                            onClick={() => setUseCustomAddress(true)}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            Use a different address
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="mb-4">
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                      Name *
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      disabled={!useCustomAddress && selectedAddressId !== ''}
                    />
                    {errors.fullName && (
                      <p className="mt-1 text-sm text-red-600">Please enter your name</p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="mb-4">
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600">Please enter a valid email address</p>
                      )}
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                        Phone *
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        disabled={!useCustomAddress && selectedAddressId !== ''}
                      />
                      {errors.phone && (
                        <p className="mt-1 text-sm text-red-600">Please enter your phone number</p>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Shipping Address */}
                <div className="border-b border-gray-200 pb-6 mb-6">
                  <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>
                  
                  <div className="mb-4">
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                      Address *
                    </label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      disabled={!useCustomAddress && selectedAddressId !== ''}
                    />
                    {errors.address && (
                      <p className="mt-1 text-sm text-red-600">Please enter your address</p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="mb-4">
                      <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                        City *
                      </label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        disabled={!useCustomAddress && selectedAddressId !== ''}
                      />
                      {errors.city && (
                        <p className="mt-1 text-sm text-red-600">Please enter your city</p>
                      )}
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                        Country/Region *
                      </label>
                      <input
                        type="text"
                        id="country"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        disabled={!useCustomAddress && selectedAddressId !== ''}
                      />
                      {errors.country && (
                        <p className="mt-1 text-sm text-red-600">Please enter your country/region</p>
                      )}
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">
                        Postal Code *
                      </label>
                      <input
                        type="text"
                        id="postalCode"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        disabled={!useCustomAddress && selectedAddressId !== ''}
                      />
                      {errors.postalCode && (
                        <p className="mt-1 text-sm text-red-600">Please enter your postal code</p>
                      )}
                    </div>
                  </div>
                  
                  {session && useCustomAddress && (
                    <div className="mt-4 flex items-center">
                      <input
                        type="checkbox"
                        id="saveAddress"
                        checked={saveAddress}
                        onChange={(e) => setSaveAddress(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="saveAddress" className="ml-2 block text-sm text-gray-600">
                        Save this address for next time
                      </label>
                    </div>
                  )}
                </div>
                
                {/* Payment Method */}
                <div className="mt-6">
                  <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Choose payment method</label>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center">
                        <input
                          id="credit-card"
                          name="paymentMethod"
                          type="radio"
                          checked={paymentMethod === 'CREDIT_CARD'}
                          onChange={() => setPaymentMethod('CREDIT_CARD')}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <label htmlFor="credit-card" className="ml-2 block text-sm text-gray-700">
                          Credit Card
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="paypal"
                          name="paymentMethod"
                          type="radio"
                          checked={paymentMethod === 'PAYPAL'}
                          onChange={() => setPaymentMethod('PAYPAL')}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <label htmlFor="paypal" className="ml-2 block text-sm text-gray-700">
                          PayPal
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="bank-transfer"
                          name="paymentMethod"
                          type="radio"
                          checked={paymentMethod === 'BANK_TRANSFER'}
                          onChange={() => setPaymentMethod('BANK_TRANSFER')}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <label htmlFor="bank-transfer" className="ml-2 block text-sm text-gray-700">
                          Bank Transfer
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  {paymentMethod === 'CREDIT_CARD' && (
                    <>
                      {session && userPaymentMethods.length > 0 && (
                        <div className="mb-4">
                          <label htmlFor="savedPayment" className="block text-sm font-medium text-gray-700">
                            Choose a saved card
                          </label>
                          <select
                            id="savedPayment"
                            name="savedPayment"
                            value={selectedPaymentMethodId || 'custom'}
                            onChange={handleSelectPaymentMethod}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          >
                            <option value="custom">Use a new card</option>
                            {userPaymentMethods
                              .filter(p => p.type === 'CREDIT_CARD')
                              .map((payment) => (
                                <option key={payment.id} value={payment.id}>
                                  Card ending in {payment.cardNumber.slice(-4)} - Expiry: {payment.cardExpiry}
                                </option>
                              ))}
                          </select>
                          {!useCustomPayment && (
                            <div className="mt-2">
                              <button
                                type="button"
                                onClick={() => setUseCustomPayment(true)}
                                className="text-sm text-blue-600 hover:text-blue-800"
                              >
                                Use a different card
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700">
                            Card Number *
                          </label>
                          <input
                            type="text"
                            id="cardNumber"
                            name="cardNumber"
                            value={formData.cardNumber}
                            onChange={handleChange}
                            disabled={!useCustomPayment && selectedPaymentMethodId !== ''}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            placeholder="1234 5678 9012 3456"
                          />
                          {errors.cardNumber && (
                            <p className="mt-1 text-sm text-red-600">{errors.cardNumber}</p>
                          )}
                        </div>
                        <div>
                          <label htmlFor="cardExpiry" className="block text-sm font-medium text-gray-700">
                            Expiry *
                          </label>
                          <input
                            type="text"
                            id="cardExpiry"
                            name="cardExpiry"
                            value={formData.cardExpiry}
                            onChange={handleChange}
                            disabled={!useCustomPayment && selectedPaymentMethodId !== ''}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            placeholder="MM/YY"
                          />
                          {errors.cardExpiry && (
                            <p className="mt-1 text-sm text-red-600">{errors.cardExpiry}</p>
                          )}
                        </div>
                      </div>
                      <div className="mb-4">
                        <label htmlFor="cardCvc" className="block text-sm font-medium text-gray-700">
                          Security Code *
                        </label>
                        <input
                          type="text"
                          id="cardCvc"
                          name="cardCvc"
                          value={formData.cardCvc}
                          onChange={handleChange}
                          className="mt-1 block w-full sm:w-1/4 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          placeholder="123"
                        />
                        {errors.cardCvc && (
                          <p className="mt-1 text-sm text-red-600">{errors.cardCvc}</p>
                        )}
                      </div>
                      
                      {session && useCustomPayment && paymentMethod === 'CREDIT_CARD' && (
                        <div className="mt-4 flex items-center">
                          <input
                            type="checkbox"
                            id="savePaymentMethod"
                            checked={savePaymentMethod}
                            onChange={(e) => setSavePaymentMethod(e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="savePaymentMethod" className="ml-2 block text-sm text-gray-600">
                            Save this card for next time
                          </label>
                        </div>
                      )}
                    </>
                  )}
                  
                  {paymentMethod === 'PAYPAL' && (
                    <div className="p-4 bg-gray-50 rounded-md mb-6">
                      <p className="text-sm text-gray-600">
                        After submitting the order, you will be redirected to PayPal to complete the payment.
                      </p>
                    </div>
                  )}
                  
                  {paymentMethod === 'BANK_TRANSFER' && (
                    <div className="p-4 bg-gray-50 rounded-md mb-6">
                      <p className="text-sm text-gray-600">
                        After submitting the order, we will provide bank account information. Please complete the transfer within 3 days.
                      </p>
                    </div>
                  )}
                  
                  <div className="mt-6 p-4 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-500">
                      This is a demo store. No actual payment will be processed.
                    </p>
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full inline-flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    'Submit Order'
                  )}
                </button>
              </form>
            </div>
          </div>
          
          {/* Order Summary */}
          <div>
            <div className="bg-white shadow overflow-hidden sm:rounded-lg sticky top-4">
              <div className="px-4 py-5 sm:px-6">
                <h2 className="text-lg font-medium text-gray-900">Order Summary</h2>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                <div className="flow-root">
                  <ul className="-my-6 divide-y divide-gray-200">
                    {items.map((item) => (
                      <li key={item.id} className="py-6 flex">
                        <div className="flex-shrink-0 w-24 h-24 border border-gray-200 rounded-md overflow-hidden">
                          <img
                            src={item.image || '/placeholder.png'}
                            alt={item.name}
                            className="w-full h-full object-center object-cover"
                          />
                        </div>
                        <div className="ml-4 flex-1 flex flex-col">
                          <div>
                            <div className="flex justify-between text-base font-medium text-gray-900">
                              <h3>{item.name}</h3>
                              <p className="ml-4">${(item.price * item.quantity).toFixed(2)}</p>
                            </div>
                          </div>
                          <div className="flex-1 flex items-end justify-between text-sm">
                            <p className="text-gray-500">Qty {item.quantity}</p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                <div className="flex justify-between text-base font-medium text-gray-900 mb-3">
                  <p>Subtotal</p>
                  <p>${subtotal.toFixed(2)}</p>
                </div>
                <div className="flex justify-between text-base font-medium text-gray-900 mb-3">
                  <p>Shipping</p>
                  <p>${shipping.toFixed(2)}</p>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900 pt-3 border-t border-gray-200">
                  <p>Total</p>
                  <p>${total.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 