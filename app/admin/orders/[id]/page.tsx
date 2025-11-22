'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { Order } from '@/lib/models';

export default function AdminOrderDetailPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [shipmentLoading, setShipmentLoading] = useState(false);

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
        router.push('/login');
        return;
      }
      fetchOrder();
    }
  }, [orderId, sessionStatus, session, router]);

  async function fetchOrder() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`);
      
      if (res.status === 401) {
        router.push('/login');
        return;
      }

      const data = await res.json();
      setOrder(data.order);
      setNewStatus(data.order?.status || '');
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusUpdate() {
    if (!order || newStatus === order.status) return;

    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        await fetchOrder();
        alert('Order status updated successfully');
      } else {
        alert('Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      alert('An error occurred');
    } finally {
      setUpdating(false);
    }
  }

  async function handleCreateShipment() {
    if (!order) return;

    setShipmentLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/shipment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (res.ok) {
        await fetchOrder();
        alert('Shipment created successfully');
      } else {
        alert(data.error || 'Failed to create shipment');
      }
    } catch (error) {
      console.error('Error creating shipment:', error);
      alert('An error occurred');
    } finally {
      setShipmentLoading(false);
    }
  }

  async function handleAssignAWB() {
    if (!order) return;

    setShipmentLoading(true);
    try {
      const res = await fetch(
        `/api/admin/orders/${orderId}/shipment/assign-awb`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const data = await res.json();
      if (res.ok) {
        await fetchOrder();
        alert('AWB assigned successfully');
      } else {
        alert(data.error || 'Failed to assign AWB');
      }
    } catch (error) {
      console.error('Error assigning AWB:', error);
      alert('An error occurred');
    } finally {
      setShipmentLoading(false);
    }
  }

  async function handleSchedulePickup() {
    if (!order) return;

    setShipmentLoading(true);
    try {
      const res = await fetch(
        `/api/admin/orders/${orderId}/shipment/schedule-pickup`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const data = await res.json();
      if (res.ok) {
        await fetchOrder();
        alert('Pickup scheduled successfully');
      } else {
        alert(data.error || 'Failed to schedule pickup');
      }
    } catch (error) {
      console.error('Error scheduling pickup:', error);
      alert('An error occurred');
    } finally {
      setShipmentLoading(false);
    }
  }

  async function handleGenerateLabel() {
    if (!order) return;

    try {
      const res = await fetch(`/api/admin/orders/${orderId}/shipment/label`);
      const data = await res.json();

      if (res.ok && data.labelUrl) {
        window.open(data.labelUrl, '_blank');
      } else {
        alert(data.error || 'Failed to generate label');
      }
    } catch (error) {
      console.error('Error generating label:', error);
      alert('An error occurred');
    }
  }

  async function handleGenerateInvoice() {
    if (!order) return;

    try {
      const res = await fetch(`/api/admin/orders/${orderId}/shipment/invoice`);
      const data = await res.json();

      if (res.ok && data.invoiceUrl) {
        window.open(data.invoiceUrl, '_blank');
      } else {
        alert(data.error || 'Failed to generate invoice');
      }
    } catch (error) {
      console.error('Error generating invoice:', error);
      alert('An error occurred');
    }
  }

  async function handleRefreshTracking() {
    if (!order) return;

    setShipmentLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/shipment`);
      const data = await res.json();

      if (res.ok) {
        await fetchOrder();
        alert('Tracking information refreshed');
      } else {
        alert(data.error || 'Failed to refresh tracking');
      }
    } catch (error) {
      console.error('Error refreshing tracking:', error);
      alert('An error occurred');
    } finally {
      setShipmentLoading(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Order not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="bg-gray-900 shadow-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-white">Order Details</h1>
            <div className="flex items-center gap-4">
              <Link
                href="/admin/orders"
                className="text-blue-400 hover:text-blue-300"
              >
                Back to Orders
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: '/admin' })}
                className="text-red-400 hover:text-red-300"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-gray-900 border border-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 text-white">Order Information</h2>
              <div className="space-y-2">
                <div>
                  <span className="text-gray-400">Order ID:</span>
                  <span className="ml-2 font-mono text-white">{order._id?.toString()}</span>
                </div>
                <div>
                  <span className="text-gray-400">Status:</span>
                  <span
                    className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Amount:</span>
                  <span className="ml-2 font-semibold text-white">
                    ₹{(order.amount / 100).toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Created:</span>
                  <span className="ml-2 text-white">
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleString()
                      : '-'}
                  </span>
                </div>
                {order.orderIdRazorpay && (
                  <div>
                    <span className="text-gray-400">Razorpay Order ID:</span>
                    <span className="ml-2 font-mono text-sm text-white">
                      {order.orderIdRazorpay}
                    </span>
                  </div>
                )}
                {order.razorpayPaymentId && (
                  <div>
                    <span className="text-gray-400">Payment ID:</span>
                    <span className="ml-2 font-mono text-sm text-white">
                      {order.razorpayPaymentId}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 text-white">Customer Details</h2>
              <div className="space-y-2">
                <div>
                  <span className="text-gray-400">Name:</span>
                  <span className="ml-2 text-white">{order.customer.name}</span>
                </div>
                <div>
                  <span className="text-gray-400">Email:</span>
                  <span className="ml-2 text-white">{order.customer.email}</span>
                </div>
                <div>
                  <span className="text-gray-400">Phone:</span>
                  <span className="ml-2 text-white">{order.customer.phone}</span>
                </div>
                <div>
                  <span className="text-gray-400">Address:</span>
                  <div className="ml-2 mt-1 text-white">
                    {order.customer.address.street}
                    <br />
                    {order.customer.address.city}, {order.customer.address.state}{' '}
                    {order.customer.address.zipCode}
                    <br />
                    {order.customer.address.country}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-900 border border-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 text-white">Order Items</h2>
              <div className="space-y-4">
                {order.items.map((item, idx) => (
                  <div key={idx} className="border-b border-gray-800 pb-4 last:border-0">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-semibold text-white">{item.title}</p>
                        <p className="text-sm text-gray-400">
                          Quantity: {item.qty}
                        </p>
                      </div>
                      <p className="font-semibold text-white">
                        ₹{((item.price * item.qty) / 100).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
                <div className="pt-4 border-t border-gray-800">
                  <div className="flex justify-between text-lg font-bold text-white">
                    <span>Total</span>
                    <span>₹{(order.amount / 100).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipment Information */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 text-white">
                Shipment Information
              </h2>
              {!order.shiprocketShipmentId ? (
                <div className="space-y-4">
                  <p className="text-gray-400 text-sm">
                    No shipment created yet. Create a shipment to enable
                    shipping tracking.
                  </p>
                  {(order.status === 'paid' || order.status === 'confirmed') && (
                    <button
                      onClick={handleCreateShipment}
                      disabled={shipmentLoading}
                      className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
                    >
                      {shipmentLoading ? 'Creating...' : 'Create Shipment'}
                    </button>
                  )}
                  {(order.status !== 'paid' && order.status !== 'confirmed') && (
                    <p className="text-yellow-400 text-sm">
                      Order must be paid or confirmed before creating shipment.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div>
                      <span className="text-gray-400">Shipment ID:</span>
                      <span className="ml-2 font-mono text-sm text-white">
                        {order.shiprocketShipmentId}
                      </span>
                    </div>
                    {order.shiprocketOrderId && (
                      <div>
                        <span className="text-gray-400">Shiprocket Order ID:</span>
                        <span className="ml-2 font-mono text-sm text-white">
                          {order.shiprocketOrderId}
                        </span>
                      </div>
                    )}
                    {order.awbCode && (
                      <div>
                        <span className="text-gray-400">AWB Code:</span>
                        <span className="ml-2 font-mono text-sm text-white">
                          {order.awbCode}
                        </span>
                        {order.trackingUrl && (
                          <a
                            href={order.trackingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 text-blue-400 hover:text-blue-300 underline"
                          >
                            Track
                          </a>
                        )}
                      </div>
                    )}
                    {order.courierName && (
                      <div>
                        <span className="text-gray-400">Courier:</span>
                        <span className="ml-2 text-white">
                          {order.courierName}
                        </span>
                      </div>
                    )}
                    {order.shippingStatus && (
                      <div>
                        <span className="text-gray-400">Shipping Status:</span>
                        <span className="ml-2 text-white">
                          {order.shippingStatus}
                        </span>
                      </div>
                    )}
                    {order.pickupScheduledDate && (
                      <div>
                        <span className="text-gray-400">Pickup Scheduled:</span>
                        <span className="ml-2 text-white">
                          {new Date(order.pickupScheduledDate).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-gray-800 space-y-2">
                    {!order.awbCode && (
                      <button
                        onClick={handleAssignAWB}
                        disabled={shipmentLoading}
                        className="w-full bg-purple-600 text-white px-4 py-2 rounded-md font-medium hover:bg-purple-700 transition disabled:opacity-50 text-sm"
                      >
                        {shipmentLoading ? 'Processing...' : 'Assign AWB'}
                      </button>
                    )}
                    <button
                      onClick={handleSchedulePickup}
                      disabled={shipmentLoading}
                      className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md font-medium hover:bg-indigo-700 transition disabled:opacity-50 text-sm"
                    >
                      {shipmentLoading ? 'Processing...' : 'Schedule Pickup'}
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={handleGenerateLabel}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition text-sm"
                      >
                        Generate Label
                      </button>
                      <button
                        onClick={handleGenerateInvoice}
                        className="bg-green-600 text-white px-4 py-2 rounded-md font-medium hover:bg-green-700 transition text-sm"
                      >
                        Generate Invoice
                      </button>
                    </div>
                    {order.awbCode && (
                      <button
                        onClick={handleRefreshTracking}
                        disabled={shipmentLoading}
                        className="w-full bg-gray-600 text-white px-4 py-2 rounded-md font-medium hover:bg-gray-700 transition disabled:opacity-50 text-sm"
                      >
                        {shipmentLoading ? 'Refreshing...' : 'Refresh Tracking'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 text-white">
                Update Status
              </h2>
              <div className="space-y-4">
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full border border-gray-700 bg-gray-800 text-white rounded-md px-3 py-2"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="shipped">Shipped</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <button
                  onClick={handleStatusUpdate}
                  disabled={updating || newStatus === order.status}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {updating ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

