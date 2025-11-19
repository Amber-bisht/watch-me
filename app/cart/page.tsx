'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  getCart,
  removeFromCart,
  updateCartItem,
  getCartTotal,
  clearCart,
  CartItem,
} from '@/lib/cart';

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    updateCart();
  }, []);

  function updateCart() {
    const cartItems = getCart();
    setCart(cartItems);
    setTotal(getCartTotal());
  }

  function handleRemove(productId: string) {
    removeFromCart(productId);
    updateCart();
    window.dispatchEvent(new Event('cartUpdated'));
  }

  function handleUpdateQty(productId: string, qty: number) {
    updateCartItem(productId, qty);
    updateCart();
    window.dispatchEvent(new Event('cartUpdated'));
  }

  function handleCheckout() {
    if (cart.length === 0) {
      alert('Your cart is empty');
      return;
    }
    router.push('/checkout');
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-3xl font-bold mb-4">Your Cart is Empty</h1>
            <p className="text-gray-600 mb-8">
              Start shopping to add items to your cart
            </p>
            <Link
              href="/all"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Browse Watches
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-8">Shopping Cart</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md p-6">
                {cart.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center gap-4 pb-6 mb-6 border-b last:border-0"
                  >
                    <Link href={`/products/${item.slug}`}>
                      <div className="relative w-24 h-24 rounded-lg overflow-hidden">
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </Link>
                    
                    <div className="flex-grow">
                      <Link
                        href={`/products/${item.slug}`}
                        className="font-semibold hover:text-blue-600"
                      >
                        {item.title}
                      </Link>
                      <p className="text-gray-600">
                        ₹{(item.price / 100).toFixed(2)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateQty(item.productId, item.qty - 1)}
                        className="w-8 h-8 border rounded-md hover:bg-gray-100"
                      >
                        -
                      </button>
                      <span className="w-12 text-center">{item.qty}</span>
                      <button
                        onClick={() => handleUpdateQty(item.productId, item.qty + 1)}
                        className="w-8 h-8 border rounded-md hover:bg-gray-100"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right">
                      <p className="font-bold">
                        ₹{((item.price * item.qty) / 100).toFixed(2)}
                      </p>
                      <button
                        onClick={() => handleRemove(item.productId)}
                        className="text-red-600 text-sm hover:text-red-800 mt-1"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-20">
                <h2 className="text-xl font-bold mb-4">Order Summary</h2>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{(total / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span>Free</span>
                  </div>
                  <div className="border-t pt-2 mt-2 flex justify-between text-xl font-bold">
                    <span>Total</span>
                    <span>₹{(total / 100).toFixed(2)}</span>
                  </div>
                </div>
                <button
                  onClick={handleCheckout}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  Proceed to Checkout
                </button>
                <Link
                  href="/all"
                  className="block text-center text-blue-600 hover:text-blue-800 mt-4"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

