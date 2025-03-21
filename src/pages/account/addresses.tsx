import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { FiPlus, FiMapPin, FiEdit2, FiTrash2, FiCheck, FiAlertCircle } from 'react-icons/fi';

interface Address {
  id: string;
  fullName: string;
  phone: string | null;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AddressesPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteAddressId, setDeleteAddressId] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    postalCode: '',
    isDefault: false
  });

  useEffect(() => {
    // Check if user is logged in
    if (status === 'unauthenticated') {
      router.push('/auth/login?redirect=/account/addresses');
      return;
    }

    if (status === 'authenticated') {
      fetchAddresses();
    }
  }, [status, router]);

  const fetchAddresses = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      console.log('Fetching address list...');
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          const response = await fetch('/api/user/addresses');
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error(`Address API error response (attempt ${retryCount + 1}/${maxRetries}):`, response.status, errorData);
            
            // If it's a 401 or 404 error, no need to retry
            if (response.status === 401 || response.status === 404) {
              throw new Error(errorData.error || `Failed to get address list (${response.status})`);
            }
            
            // For other errors, we can retry
            retryCount++;
            if (retryCount < maxRetries) {
              console.log(`Will retry in 2 seconds... (${retryCount}/${maxRetries})`);
              await new Promise(resolve => setTimeout(resolve, 2000));
              continue;
            }
            
            throw new Error(errorData.error || `Failed to get address list after ${maxRetries} attempts (${response.status})`);
          }

          const data = await response.json();
          console.log('Retrieved address list:', data.length);
          setAddresses(data);
          break; // Successfully retrieved data, exit loop
          
        } catch (fetchError) {
          retryCount++;
          
          if (retryCount >= maxRetries) {
            throw fetchError; // Reached maximum retries, throw error
          }
          
          console.log(`Failed to fetch addresses, will retry in 2 seconds... (${retryCount}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
    } catch (error: any) {
      console.error('Error fetching address list:', error);
      setError(error.message || 'Unable to load address list, please try again later.');
      // Set empty array even if there's an error
      setAddresses([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleAddAddress = () => {
    setEditingAddress(null);
    setFormData({
      fullName: '',
      phone: '',
      address: '',
      city: '',
      country: '',
      postalCode: '',
      isDefault: false
    });
    setShowAddressForm(true);
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setFormData({
      fullName: address.fullName,
      phone: address.phone || '',
      address: address.address,
      city: address.city,
      country: address.country,
      postalCode: address.postalCode,
      isDefault: address.isDefault
    });
    setShowAddressForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.address || !formData.city || !formData.country || !formData.postalCode) {
      setError('Please fill in all required fields');
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      setSuccess('');
      
      const url = editingAddress 
        ? `/api/user/addresses/${editingAddress.id}` 
        : '/api/user/addresses';
      
      const method = editingAddress ? 'PUT' : 'POST';
      
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
      
      await fetchAddresses();
      setSuccess(editingAddress ? 'Address updated' : 'New address added');
      setShowAddressForm(false);
      setEditingAddress(null);
    } catch (error: any) {
      console.error('Failed to save address:', error);
      setError(error.message || 'Operation failed, please try again later');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    try {
      setIsDeleting(true);
      setDeleteAddressId(addressId);
      setError('');
      setSuccess('');
      
      const response = await fetch(`/api/user/addresses/${addressId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete address');
      }
      
      await fetchAddresses();
      setSuccess('Address deleted');
    } catch (error: any) {
      console.error('Failed to delete address:', error);
      setError(error.message || 'Error occurred while deleting address, please try again later');
    } finally {
      setIsDeleting(false);
      setDeleteAddressId(null);
    }
  };

  const confirmDeleteAddress = (addressId: string) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      handleDeleteAddress(addressId);
    }
  };

  const handleSetAsDefault = async (addressId: string) => {
    try {
      setIsLoading(true);
      setError('');
      setSuccess('');
      
      const address = addresses.find(a => a.id === addressId);
      if (!address) return;
      
      const response = await fetch(`/api/user/addresses/${addressId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...address,
          isDefault: true
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to set default address');
      }
      
      await fetchAddresses();
      setSuccess('Default address updated');
    } catch (error: any) {
      console.error('Failed to set default address:', error);
      setError(error.message || 'Operation failed, please try again later');
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading' || (isLoading && addresses.length === 0)) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Address Management | NAMarket</title>
        <meta name="description" content="Manage your shipping addresses" />
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-64 bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                <FiMapPin className="text-blue-600 text-2xl" />
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
                className="block px-4 py-2 bg-blue-50 text-blue-700 rounded-md"
              >
                Address Management
              </Link>
              <Link
                href="/account/payment"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md"
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
                  <h1 className="text-2xl font-bold text-gray-900">Address Management</h1>
                  <p className="text-sm text-gray-500 mt-1">Manage your shipping addresses</p>
                </div>
                <button
                  onClick={handleAddAddress}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <FiPlus className="mr-2" /> Add Address
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

              {showAddressForm ? (
                <div className="p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">
                    {editingAddress ? 'Edit Address' : 'Add New Address'}
                  </h2>
                  <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="fullName"
                          id="fullName"
                          value={formData.fullName}
                          onChange={handleChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          id="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                    </div>
                    <div className="mb-4">
                      <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                        Address <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        name="address"
                        id="address"
                        value={formData.address}
                        onChange={handleChange}
                        rows={2}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                          City <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="city"
                          id="city"
                          value={formData.city}
                          onChange={handleChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                          Country/Region <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="country"
                          id="country"
                          value={formData.country}
                          onChange={handleChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">
                          Postal Code <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="postalCode"
                          id="postalCode"
                          value={formData.postalCode}
                          onChange={handleChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          required
                        />
                      </div>
                    </div>
                    <div className="mb-6">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="isDefault"
                          id="isDefault"
                          checked={formData.isDefault}
                          onChange={handleChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-900">
                          Set as Default Address
                        </label>
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        {isLoading ? 'Saving...' : 'Save Address'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddressForm(false)}
                        className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="p-6">
                  {addresses.length === 0 ? (
                    <div className="text-center py-6">
                      <FiMapPin className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-lg font-medium text-gray-900">No Saved Addresses</h3>
                      <p className="mt-1 text-sm text-gray-500">Add your first shipping address.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {addresses.map(address => (
                        <div 
                          key={address.id} 
                          className={`border rounded-lg p-4 relative ${address.isDefault ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                        >
                          {address.isDefault && (
                            <span className="absolute top-2 right-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Default Address
                            </span>
                          )}
                          <div className="mb-2">
                            <h3 className="text-lg font-medium text-gray-900">{address.fullName}</h3>
                            {address.phone && <p className="text-gray-600">{address.phone}</p>}
                          </div>
                          <p className="text-gray-800 mb-1">{address.address}</p>
                          <p className="text-gray-800 mb-3">{address.city}, {address.country} {address.postalCode}</p>
                          <div className="flex space-x-3 mt-2">
                            <button
                              onClick={() => handleEditAddress(address)}
                              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                            >
                              <FiEdit2 className="mr-1" /> Edit
                            </button>
                            <button
                              onClick={() => confirmDeleteAddress(address.id)}
                              disabled={isDeleting && deleteAddressId === address.id}
                              className="inline-flex items-center text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                            >
                              <FiTrash2 className="mr-1" /> {isDeleting && deleteAddressId === address.id ? 'Deleting...' : 'Delete'}
                            </button>
                            {!address.isDefault && (
                              <button
                                onClick={() => handleSetAsDefault(address.id)}
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