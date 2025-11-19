'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Order } from '@/lib/models';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'addresses'>('profile');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchOrders();
    }
  }, [session]);

  async function fetchOrders() {
    try {
      setLoading(true);
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'paid':
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'shipped':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const activeOrders = orders.filter(o => ['pending', 'paid', 'confirmed', 'shipped'].includes(o.status));
  const completedOrders = orders.filter(o => !['pending', 'paid', 'confirmed', 'shipped'].includes(o.status));

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-grow py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-8 text-gray-900">My Account</h1>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="mb-6 pb-6 border-b">
                  <div className="w-20 h-20 bg-gray-900 text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-3">
                    {session.user?.email?.[0].toUpperCase()}
                  </div>
                  <p className="text-center font-semibold text-gray-900">
                    {session.user?.email}
                  </p>
                </div>

                <nav className="space-y-2">
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`w-full text-left px-4 py-3 rounded-lg font-medium transition ${
                      activeTab === 'profile'
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Profile Information
                  </button>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className={`w-full text-left px-4 py-3 rounded-lg font-medium transition ${
                      activeTab === 'orders'
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Order History
                  </button>
                  <button
                    onClick={() => setActiveTab('addresses')}
                    className={`w-full text-left px-4 py-3 rounded-lg font-medium transition ${
                      activeTab === 'addresses'
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Saved Addresses
                  </button>
                  <div className="pt-4 border-t border-gray-200">
                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="w-full text-left px-4 py-3 rounded-lg font-medium text-red-600 hover:bg-red-50 transition"
                    >
                      Sign Out
                    </button>
                  </div>
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Profile Information Tab */}
              {activeTab === 'profile' && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-2xl font-bold mb-6 text-gray-900">Profile Information</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <p className="text-gray-900 font-medium">{session.user?.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Account Type
                      </label>
                      <p className="text-gray-900 font-medium">Customer</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Member Since
                      </label>
                      <p className="text-gray-900 font-medium">
                        {new Date().toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Order History Tab */}
              {activeTab === 'orders' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-2xl font-bold mb-6 text-gray-900">Order History</h2>

                    {loading ? (
                      <div className="text-center py-8 text-gray-500">Loading orders...</div>
                    ) : orders.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500 mb-4">You haven't placed any orders yet.</p>
                        <Link
                          href="/all"
                          className="inline-block bg-gray-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition"
                        >
                          Start Shopping
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Active Orders */}
                        {activeOrders.length > 0 && (
                          <div>
                            <h3 className="text-lg font-semibold mb-4 text-gray-900">
                              Active Orders ({activeOrders.length})
                            </h3>
                            <div className="space-y-4">
                              {activeOrders.map((order) => (
                                <div
                                  key={order._id?.toString()}
                                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                                >
                                  <div className="flex justify-between items-start mb-3">
                                    <div>
                                      <p className="font-semibold text-gray-900">
                                        Order #{order._id?.toString().slice(-8).toUpperCase()}
                                      </p>
                                      <p className="text-sm text-gray-600">
                                        {new Date(order.createdAt!).toLocaleDateString('en-US', {
                                          year: 'numeric',
                                          month: 'long',
                                          day: 'numeric',
                                        })}
                                      </p>
                                    </div>
                                    <span
                                      className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeColor(
                                        order.status
                                      )}`}
                                    >
                                      {order.status.toUpperCase()}
                                    </span>
                                  </div>

                                  <div className="mb-3">
                                    <p className="text-sm text-gray-600">
                                      {order.items.length} item(s)
                                    </p>
                                    <div className="text-sm text-gray-700 mt-1">
                                      {order.items.map((item, idx) => (
                                        <div key={idx}>• {item.title} (Qty: {item.qty})</div>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="flex justify-between items-center pt-3 border-t">
                                    <p className="font-bold text-lg text-gray-900">
                                      ₹ {(order.amount / 100).toFixed(2)}
                                    </p>
                                    <Link
                                      href={`/order/${order._id?.toString()}`}
                                      className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition"
                                    >
                                      View Details →
                                    </Link>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Past Orders */}
                        {completedOrders.length > 0 && (
                          <div className="pt-6 border-t">
                            <h3 className="text-lg font-semibold mb-4 text-gray-900">
                              Past Orders ({completedOrders.length})
                            </h3>
                            <div className="space-y-4">
                              {completedOrders.map((order) => (
                                <div
                                  key={order._id?.toString()}
                                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition opacity-75"
                                >
                                  <div className="flex justify-between items-start mb-3">
                                    <div>
                                      <p className="font-semibold text-gray-900">
                                        Order #{order._id?.toString().slice(-8).toUpperCase()}
                                      </p>
                                      <p className="text-sm text-gray-600">
                                        {new Date(order.createdAt!).toLocaleDateString('en-US', {
                                          year: 'numeric',
                                          month: 'long',
                                          day: 'numeric',
                                        })}
                                      </p>
                                    </div>
                                    <span
                                      className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeColor(
                                        order.status
                                      )}`}
                                    >
                                      {order.status.toUpperCase()}
                                    </span>
                                  </div>

                                  <div className="mb-3">
                                    <p className="text-sm text-gray-600">
                                      {order.items.length} item(s)
                                    </p>
                                  </div>

                                  <div className="flex justify-between items-center pt-3 border-t">
                                    <p className="font-bold text-lg text-gray-900">
                                      ₹ {(order.amount / 100).toFixed(2)}
                                    </p>
                                    <Link
                                      href={`/order/${order._id?.toString()}`}
                                      className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition"
                                    >
                                      View Details →
                                    </Link>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Saved Addresses Tab */}
              {activeTab === 'addresses' && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-2xl font-bold mb-6 text-gray-900">Saved Addresses</h2>
                  
                  {orders.length > 0 ? (
                    <div className="space-y-4">
                      {/* Get unique addresses from orders */}
                      {Array.from(
                        new Map(
                          orders.map((order) => [
                            JSON.stringify(order.customer.address),
                            order.customer,
                          ])
                        ).values()
                      ).map((customer, idx) => (
                        <div
                          key={idx}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                              Default
                            </span>
                          </div>
                          <div className="text-sm text-gray-700 space-y-1">
                            <p>{customer.address.street}</p>
                            <p>
                              {customer.address.city}, {customer.address.state}{' '}
                              {customer.address.zipCode}
                            </p>
                            <p>{customer.address.country}</p>
                          </div>
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Phone:</span> {customer.phone}
                            </p>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Email:</span> {customer.email}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">No saved addresses yet.</p>
                      <p className="text-sm text-gray-600">
                        Addresses will be saved when you place your first order.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

