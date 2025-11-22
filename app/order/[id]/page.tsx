'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Order } from '@/lib/models';

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [orderId, setOrderId] = useState<string>('');

  useEffect(() => {
    params.then((p) => setOrderId(p.id));
  }, [params]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  useEffect(() => {
    if (session && orderId) {
      fetchOrder();
    }
  }, [session, orderId]);

  async function fetchOrder() {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/orders/${orderId}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data.order);
      }
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!session || !order) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
            <Link
              href="/profile"
              className="text-blue-600 hover:text-blue-800 font-semibold"
            >
              Back to Profile
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
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

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-grow py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6">
            <Link
              href="/profile"
              className="text-blue-600 hover:text-blue-800 font-semibold mb-4 inline-block"
            >
              ← Back to Profile
            </Link>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Order #{order._id?.toString().slice(-8).toUpperCase()}
                </h1>
                <p className="text-gray-600">
                  Placed on{' '}
                  {new Date(order.createdAt!).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <span
                className={`px-4 py-2 rounded-full text-sm font-bold border ${getStatusBadgeColor(
                  order.status
                )}`}
              >
                {order.status.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Order Items</h2>
            <div className="space-y-4">
              {order.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center pb-4 border-b last:border-b-0"
                >
                  <div>
                    <p className="font-semibold text-gray-900">{item.title}</p>
                    <p className="text-sm text-gray-600">Quantity: {item.qty}</p>
                    <p className="text-sm text-gray-600">
                      Price: ₹ {(item.price / 100).toFixed(2)} each
                    </p>
                  </div>
                  <p className="font-bold text-gray-900">
                    ₹ {((item.price * item.qty) / 100).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t">
              <div className="flex justify-between items-center text-lg">
                <span className="font-semibold text-gray-900">Total Amount:</span>
                <span className="font-bold text-2xl text-gray-900">
                  ₹ {(order.amount / 100).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Customer Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Contact Details</h3>
                <p className="text-gray-900">{order.customer.name}</p>
                <p className="text-gray-600">{order.customer.email}</p>
                <p className="text-gray-600">{order.customer.phone}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Shipping Address</h3>
                <p className="text-gray-900">{order.customer.address.street}</p>
                <p className="text-gray-900">
                  {order.customer.address.city}, {order.customer.address.state}
                </p>
                <p className="text-gray-900">{order.customer.address.zipCode}</p>
                <p className="text-gray-900">{order.customer.address.country}</p>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          {order.orderIdRazorpay && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold mb-4 text-gray-900">
                Payment Information
              </h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="text-gray-900 font-medium">Razorpay</span>
                </div>
                {order.orderIdRazorpay && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order ID:</span>
                    <span className="text-gray-900 font-mono text-sm">
                      {order.orderIdRazorpay}
                    </span>
                  </div>
                )}
                {order.razorpayPaymentId && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment ID:</span>
                    <span className="text-gray-900 font-mono text-sm">
                      {order.razorpayPaymentId}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Shipping Information */}
          {order.shiprocketShipmentId && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-900">
                Shipping Information
              </h2>
              <div className="space-y-3">
                {order.awbCode && (
                  <div>
                    <span className="text-gray-600 font-medium">
                      Tracking Number:
                    </span>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-gray-900 font-mono text-lg font-bold">
                        {order.awbCode}
                      </span>
                      {order.trackingUrl && (
                        <a
                          href={order.trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 font-medium underline"
                        >
                          Track Shipment →
                        </a>
                      )}
                    </div>
                  </div>
                )}
                {order.courierName && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Courier:</span>
                    <span className="text-gray-900 font-medium">
                      {order.courierName}
                    </span>
                  </div>
                )}
                {order.shippingStatus && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping Status:</span>
                    <span className="text-gray-900 font-medium capitalize">
                      {order.shippingStatus.replace(/_/g, ' ').toLowerCase()}
                    </span>
                  </div>
                )}
                {order.pickupScheduledDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pickup Scheduled:</span>
                    <span className="text-gray-900">
                      {new Date(
                        order.pickupScheduledDate
                      ).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                )}
                {!order.awbCode && order.shiprocketShipmentId && (
                  <div className="text-sm text-gray-500 italic">
                    Shipment created. Tracking number will be available soon.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

