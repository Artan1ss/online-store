import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { FiUser, FiEdit, FiSave, FiX } from 'react-icons/fi';
import Link from 'next/link';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => {
    // Check if user is logged in
    if (status === 'unauthenticated') {
      router.push('/auth/login?redirect=/account/profile');
      return;
    }

    // If logged in, fetch user profile
    if (status === 'authenticated') {
      fetchUserProfile();
    }
  }, [status, router]);

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/users/profile');
      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }
      const data = await response.json();
      setProfile(data);
      setName(data.name);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError('Unable to load user profile. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateName = async () => {
    if (!name.trim()) {
      setError('Name cannot be empty');
      return;
    }

    try {
      setError('');
      setSuccess('');
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update profile');
      }

      const data = await response.json();
      setProfile(data.user);
      setSuccess('Name updated successfully!');
      setIsEditingName(false);
    } catch (error: any) {
      setError(error.message || 'An error occurred while updating profile');
    }
  };

  const cancelEditing = () => {
    setIsEditingName(false);
    if (profile) {
      setName(profile.name);
    }
    setError('');
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Profile | NAMarket</title>
        <meta name="description" content="Manage your profile" />
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-64 bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                <FiUser className="text-blue-600 text-2xl" />
              </div>
              <div>
                <p className="font-medium text-gray-900 text-lg">{profile?.name}</p>
                <p className="text-sm text-gray-500">{profile?.email}</p>
              </div>
            </div>

            <nav className="space-y-2">
              <Link
                href="/account/profile"
                className="block px-4 py-2 bg-blue-50 text-blue-700 rounded-md"
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

          <div className="flex-1 bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile</h1>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-md text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-50 text-green-700 border border-green-200 rounded-md text-sm">
                {success}
              </div>
            )}

            <div className="space-y-6">
              {/* Name */}
              <div className="border-b border-gray-200 pb-4">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-medium text-gray-900">Name</h2>
                  {!isEditingName && (
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
                    >
                      <FiEdit className="mr-1" /> Edit
                    </button>
                  )}
                </div>

                {isEditingName ? (
                  <div>
                    <div className="flex">
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                      <button
                        onClick={handleUpdateName}
                        className="ml-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <FiSave className="mr-1" /> Save
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="ml-2 inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <FiX className="mr-1" /> Cancel
                      </button>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">Enter your name</p>
                  </div>
                ) : (
                  <p className="text-gray-800">{profile?.name}</p>
                )}
              </div>

              {/* Email */}
              <div className="border-b border-gray-200 pb-4">
                <h2 className="text-lg font-medium text-gray-900 mb-2">Email</h2>
                <p className="text-gray-800">{profile?.email}</p>
                <p className="mt-1 text-sm text-gray-500">Your email address, used for login and notifications</p>
              </div>

              {/* Account Information */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-2">Account Information</h2>
                <p className="text-gray-800">
                  Registration Date: {profile && new Date(profile.createdAt).toLocaleDateString('en-CA')}
                </p>
                <p className="text-gray-800">
                  User Role: {profile?.role === 'ADMIN' ? 'Administrator' : 'Regular User'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 