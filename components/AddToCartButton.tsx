'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addToCart, getCart } from '@/lib/cart';
import { Product } from '@/lib/models';

interface AddToCartButtonProps {
  product: Product;
}

export default function AddToCartButton({ product }: AddToCartButtonProps) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);

  function handleAddToCart() {
    if (product.stock <= 0) {
      alert('This product is out of stock');
      return;
    }

    setAdding(true);
    
    addToCart({
      productId: product._id!.toString(),
      title: product.title,
      price: product.price,
      image: product.images[0] || '/placeholder-watch.jpg',
      slug: product.slug,
    });

    // Dispatch custom event to update cart count
    window.dispatchEvent(new Event('cartUpdated'));

    setAdding(false);
    
    // Show feedback
    const button = document.getElementById('add-to-cart-btn');
    if (button) {
      const originalText = button.textContent;
      button.textContent = 'Added to Cart!';
      setTimeout(() => {
        button.textContent = originalText;
      }, 2000);
    }
  }

  function handleBuyNow() {
    handleAddToCart();
    setTimeout(() => {
      router.push('/checkout');
    }, 500);
  }

  if (product.stock <= 0) {
    return (
      <button
        disabled
        className="w-full border-2 border-gray-400 text-gray-400 px-8 py-4 rounded-lg font-bold text-lg cursor-not-allowed"
      >
        OUT OF STOCK
      </button>
    );
  }

  return (
    <div className="space-y-4">
      <button
        id="add-to-cart-btn"
        onClick={handleAddToCart}
        disabled={adding}
        className="w-full border-2 border-gray-900 text-gray-900 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-900 hover:text-white transition-all duration-300 disabled:opacity-50"
      >
        {adding ? 'ADDED TO CART!' : 'ADD TO CART'}
      </button>
      <button
        onClick={handleBuyNow}
        disabled={adding}
        className="w-full bg-gray-900 text-white border-2 border-gray-900 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-800 hover:border-gray-800 transition-all duration-300 disabled:opacity-50"
      >
        BUY NOW
      </button>
    </div>
  );
}

