'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { Order } from '@/lib/models';

export default function AdminOrdersPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      // Save the current URL and redirect to login
      const currentUrl = window.location.pathname + window.location.search;
      router.push(`/login?callbackUrl=${encodeURIComponent(currentUrl)}`);
      return;
    }
    if (sessionStatus === 'authenticated') {
      const userRole = (session?.user as any)?.role;
      if (userRole !== 'admin') {
        alert('You do not have admin access');
        router.push('/login');
        return;
      }
      fetchOrders();
    }
  }, [sessionStatus, session, router, page, search, statusFilter]);

  async function fetchOrders() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
      });

      const res = await fetch(`/api/admin/orders?${params}`);
      
      if (res.status === 401) {
        router.push('/login');
        return;
      }

      const data = await res.json();
      setOrders(data.orders || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }

  function getStatusColor(status: string) {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-900 text-yellow-300',
      paid: 'bg-blue-900 text-blue-300',
      confirmed: 'bg-green-900 text-green-300',
      shipped: 'bg-purple-900 text-purple-300',
      cancelled: 'bg-red-900 text-red-300',
    };
    return colors[status] || 'bg-gray-800 text-gray-300';
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="bg-gray-900 shadow-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
              <div className="flex space-x-2">
                <Link href="/admin/orders" className="px-3 py-1 text-blue-400 font-semibold border-b-2 border-blue-400">
                  Orders
                </Link>
                <Link href="/admin/products" className="px-3 py-1 text-gray-400 hover:text-white">
                  Products
                </Link>
                <Link href="/admin/collections" className="px-3 py-1 text-gray-400 hover:text-white">
                  Collections
                </Link>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/admin' })}
              className="text-red-400 hover:text-red-300"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gray-900 rounded-lg shadow-md p-6 mb-6 border border-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-white">Search</label>
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Order ID, Name, Email..."
                className="w-full border border-gray-700 bg-gray-800 text-white rounded-md px-3 py-2 placeholder-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-white">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full border border-gray-700 bg-gray-800 text-white rounded-md px-3 py-2"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="confirmed">Confirmed</option>
                <option value="shipped">Shipped</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-white">Loading...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No orders found</div>
        ) : (
          <>
            <div className="bg-gray-900 rounded-lg shadow-md overflow-hidden border border-gray-800">
              <table className="min-w-full divide-y divide-gray-800">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-900 divide-y divide-gray-800">
                  {orders.map((order) => (
                    <tr key={order._id?.toString()} className="hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-white">
                        {order._id?.toString().slice(-8)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="text-white">{order.customer.name}</div>
                        <div className="text-gray-400">{order.customer.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        ₹{(order.amount / 100).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString()
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          href={`/admin/orders/${order._id?.toString()}`}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-4 mt-6">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-700 bg-gray-800 text-white rounded-md disabled:opacity-50 hover:bg-gray-700"
                >
                  Previous
                </button>
                <span className="text-white">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-gray-700 bg-gray-800 text-white rounded-md disabled:opacity-50 hover:bg-gray-700"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

