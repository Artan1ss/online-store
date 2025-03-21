import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { FiPlus, FiCreditCard, FiEdit2, FiTrash2, FiCheck, FiAlertCircle } from 'react-icons/fi';

interface PaymentMethod {
  id: string;
  type: string;
  cardNumber: string | null;
  cardExpiry: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function PaymentMethodsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletePaymentId, setDeletePaymentId] = useState<string | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentMethod | null>(null);
  const [formData, setFormData] = useState({
    type: 'CREDIT_CARD',
    cardNumber: '',
    cardExpiry: '',
    isDefault: false
  });

  useEffect(() => {
    // Check if user is logged in
    if (status === 'unauthenticated') {
      router.push('/auth/login?redirect=/account/payment');
      return;
    }

    if (status === 'authenticated') {
      fetchPaymentMethods();
    }
  }, [status, router]);

  const fetchPaymentMethods = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      console.log('Fetching payment methods list...');
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          const response = await fetch('/api/user/payment-methods');
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error(`Payment methods API error response (attempt ${retryCount + 1}/${maxRetries}):`, response.status, errorData);
            
            // If 401 or 404 error, no need to retry
            if (response.status === 401 || response.status === 404) {
              throw new Error(errorData.error || `Failed to fetch payment methods list (${response.status})`);
            }
            
            // For other errors, we can retry
            retryCount++;
            if (retryCount < maxRetries) {
              console.log(`Will retry in 2 seconds... (${retryCount}/${maxRetries})`);
              await new Promise(resolve => setTimeout(resolve, 2000));
              continue;
            }
            
            throw new Error(errorData.error || `Failed to fetch payment methods list, tried ${maxRetries} times (${response.status})`);
          }

          const data = await response.json();
          console.log('Retrieved payment methods list:', data.length);
          setPaymentMethods(data);
          break; // Successfully fetched data, exit loop
          
        } catch (fetchError) {
          retryCount++;
          
          if (retryCount >= maxRetries) {
            throw fetchError; // Reached maximum retries, throw error
          }
          
          console.log(`Failed to fetch payment methods, will retry in 2 seconds... (${retryCount}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
    } catch (error: any) {
      console.error('Error fetching payment methods list:', error);
      setError(error.message || 'Unable to load payment methods list. Please try again later.');
      // Set empty array even with errors
      setPaymentMethods([]);
    } finally {
      setIsLoading(false);
    }
  };

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
  };

  const handleAddPayment = () => {
    setEditingPayment(null);
    setFormData({
      type: 'CREDIT_CARD',
      cardNumber: '',
      cardExpiry: '',
      isDefault: false
    });
    setShowPaymentForm(true);
  };

  const handleEditPayment = (payment: PaymentMethod) => {
    setEditingPayment(payment);
    setFormData({
      type: payment.type,
      cardNumber: '',  // Don't display card number, needs to be re-entered
      cardExpiry: payment.cardExpiry || '',
      isDefault: payment.isDefault
    });
    setShowPaymentForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.type === 'CREDIT_CARD' && (!formData.cardNumber || !formData.cardExpiry)) {
      setError('Please complete all credit card information');
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      setSuccess('');
      
      const url = editingPayment 
        ? `/api/user/payment-methods/${editingPayment.id}` 
        : '/api/user/payment-methods';
      
      const method = editingPayment ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Operation failed');
      }
      
      await fetchPaymentMethods();
      setSuccess(editingPayment ? 'Payment method updated' : 'New payment method added');
      setShowPaymentForm(false);
      setEditingPayment(null);
    } catch (error: any) {
      console.error('Failed to save payment method:', error);
      setError(error.message || 'Operation failed, please try again later');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    try {
      setIsDeleting(true);
      setDeletePaymentId(paymentId);
      setError('');
      setSuccess('');
      
      const response = await fetch(`/api/user/payment-methods/${paymentId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete payment method');
      }
      
      await fetchPaymentMethods();
      setSuccess('Payment method deleted');
    } catch (error: any) {
      console.error('Failed to delete payment method:', error);
      setError(error.message || 'Failed to delete payment method, please try again later');
    } finally {
      setIsDeleting(false);
      setDeletePaymentId(null);
    }
  };

  const confirmDeletePayment = (paymentId: string) => {
    if (window.confirm('Are you sure you want to delete this payment method?')) {
      handleDeletePayment(paymentId);
    }
  };

  const handleSetAsDefault = async (paymentId: string) => {
    try {
      setIsLoading(true);
      setError('');
      setSuccess('');
      
      const payment = paymentMethods.find(p => p.id === paymentId);
      if (!payment) return;
      
      const response = await fetch(`/api/user/payment-methods/${paymentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...payment,
          isDefault: true
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to set default payment method');
      }
      
      await fetchPaymentMethods();
      setSuccess('Default payment method updated');
    } catch (error: any) {
      console.error('Failed to set default payment method:', error);
      setError(error.message || 'Failed to set default payment method, please try again later');
    } finally {
      setIsLoading(false);
    }
  };

  const getPaymentMethodLabel = (type: string) => {
    switch (type) {
      case 'CREDIT_CARD':
        return 'Credit Card';
      case 'PAYPAL':
        return 'PayPal';
      case 'BANK_TRANSFER':
        return 'Bank Transfer';
      default:
        return type;
    }
  };

  if (status === 'loading' || (isLoading && paymentMethods.length === 0)) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Payment Methods | NAMarket</title>
        <meta name="description" content="Manage your payment methods" />
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-64 bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                <FiCreditCard className="text-blue-600 text-2xl" />
              </div>
              <div>
                <p className="font-medium text-gray-900 text-lg">{session?.user?.name}</p>
                <p className="text-sm text-gray-500">{session?.user?.email}</p>
              </div>
            </div>

            <nav className="space-y-2">
              <Link
                href="/account/profile"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md"
              >
                Profile
              </Link>
              <Link
                href="/account/addresses"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md"
              >
                Addresses
              </Link>
              <Link
                href="/account/payment"
                className="block px-4 py-2 bg-blue-50 text-blue-700 rounded-md"
              >
                Payment Methods
              </Link>
              <Link
                href="/account/orders"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md"
              >
                My Orders
              </Link>
            </nav>
          </div>

          <div className="flex-1">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Payment Methods</h1>
                  <p className="text-sm text-gray-500 mt-1">Manage your payment methods</p>
                </div>
                <button
                  onClick={handleAddPayment}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <FiPlus className="mr-2" /> Add Payment Method
                </button>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border-l-4 border-red-400">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <FiAlertCircle className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {success && (
                <div className="p-4 bg-green-50 border-l-4 border-green-400">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <FiCheck className="h-5 w-5 text-green-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-green-700">{success}</p>
                    </div>
                  </div>
                </div>
              )}

              {showPaymentForm ? (
                <div className="p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">
                    {editingPayment ? 'Edit Payment Method' : 'Add New Payment Method'}
                  </h2>
                  <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                      <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                        Payment Method Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="type"
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        <option value="CREDIT_CARD">Credit Card</option>
                        <option value="PAYPAL">PayPal</option>
                        <option value="BANK_TRANSFER">Bank Transfer</option>
                      </select>
                    </div>

                    {formData.type === 'CREDIT_CARD' && (
                      <>
                        <div className="mb-4">
                          <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700">
                            Card Number <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            id="cardNumber"
                            name="cardNumber"
                            value={formData.cardNumber}
                            onChange={handleChange}
                            placeholder="1234 5678 9012 3456"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            maxLength={19}
                            required={formData.type === 'CREDIT_CARD'}
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            {editingPayment ? 'For security reasons, you need to re-enter the card number when editing' : 'Your card number will be securely encrypted'}
                          </p>
                        </div>

                        <div className="mb-4">
                          <label htmlFor="cardExpiry" className="block text-sm font-medium text-gray-700">
                            Expiry Date (MM/YY) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            id="cardExpiry"
                            name="cardExpiry"
                            value={formData.cardExpiry}
                            onChange={handleChange}
                            placeholder="12/25"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            maxLength={5}
                            required={formData.type === 'CREDIT_CARD'}
                          />
                        </div>
                      </>
                    )}

                    <div className="mb-6">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="isDefault"
                          name="isDefault"
                          checked={formData.isDefault}
                          onChange={handleChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-900">
                          Set as default payment method
                        </label>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-6 mb-6">
                      <p className="text-sm text-gray-500">
                        Note: This is a demo system and does not process real payments. Please do not enter real credit card information.
                      </p>
                    </div>

                    <div className="flex space-x-3">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        {isLoading ? 'Saving...' : 'Save Payment Method'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowPaymentForm(false)}
                        className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="p-6">
                  {paymentMethods.length === 0 ? (
                    <div className="text-center py-6">
                      <FiCreditCard className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-lg font-medium text-gray-900">No saved payment methods</h3>
                      <p className="mt-1 text-sm text-gray-500">Add your first payment method.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {paymentMethods.map(payment => (
                        <div 
                          key={payment.id} 
                          className={`border rounded-lg p-4 relative ${payment.isDefault ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                        >
                          {payment.isDefault && (
                            <span className="absolute top-2 right-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Default Method
                            </span>
                          )}
                          <div className="flex items-center mb-3">
                            <FiCreditCard className="text-gray-500 mr-2" />
                            <h3 className="text-lg font-medium text-gray-900">{getPaymentMethodLabel(payment.type)}</h3>
                          </div>
                          {payment.type === 'CREDIT_CARD' && (
                            <div className="mb-3">
                              <p className="text-gray-600">Card Number: {payment.cardNumber}</p>
                              {payment.cardExpiry && <p className="text-gray-600">Expiry Date: {payment.cardExpiry}</p>}
                            </div>
                          )}
                          <div className="flex space-x-3 mt-2">
                            <button
                              onClick={() => handleEditPayment(payment)}
                              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                            >
                              <FiEdit2 className="mr-1" /> Edit
                            </button>
                            <button
                              onClick={() => confirmDeletePayment(payment.id)}
                              disabled={isDeleting && deletePaymentId === payment.id}
                              className="inline-flex items-center text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                            >
                              <FiTrash2 className="mr-1" /> {isDeleting && deletePaymentId === payment.id ? 'Deleting...' : 'Delete'}
                            </button>
                            {!payment.isDefault && (
                              <button
                                onClick={() => handleSetAsDefault(payment.id)}
                                className="inline-flex items-center text-sm text-green-600 hover:text-green-800"
                              >
                                <FiCheck className="mr-1" /> Set as Default
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 