'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/lib/models';
import { addToCart } from '@/lib/cart';

interface ProductCardProps {
  product: Product;
  showAddToCart?: boolean;
}

export default function ProductCard({ product, showAddToCart = false }: ProductCardProps) {
  const [selectedColor, setSelectedColor] = useState(0);
  const [adding, setAdding] = useState(false);

  const colors = product.colors || [
    { name: product.specs?.color || 'Default', hex: '#10B981' }
  ];

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (product.stock <= 0) {
      alert('This product is out of stock');
      return;
    }

    setAdding(true);
    
    addToCart({
      productId: product._id!.toString(),
      title: product.title,
      price: product.price,
      image: product.images[selectedColor] || product.images[0] || '/placeholder-watch.jpg',
      slug: product.slug,
    });

    window.dispatchEvent(new Event('cartUpdated'));
    
    setTimeout(() => {
      setAdding(false);
    }, 1500);
  };

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col"
    >
      {/* Product Image */}
      <div className="relative h-72 bg-gray-50 flex items-center justify-center p-6">
        <div className="relative w-full h-full">
          <Image
            src={product.images[selectedColor] || product.images[0] || '/placeholder-watch.jpg'}
            alt={product.title}
            fill
            className="object-contain group-hover:scale-110 transition-transform duration-300"
          />
        </div>
      </div>

      {/* Product Info */}
      <div className="p-6 flex flex-col items-center text-center flex-grow">
        <h3 className="text-lg font-bold mb-3 text-gray-900 line-clamp-2">
          {product.title}
        </h3>
        
        <p className="text-2xl font-bold text-gray-900 mb-4">
          ₹ {(product.price / 100).toFixed(2)}
        </p>

        {/* Color Selector */}
        {colors.length > 1 && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              Color: {colors[selectedColor].name}
            </p>
            <div className="flex gap-2 justify-center">
              {colors.map((color, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedColor(idx);
                  }}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    selectedColor === idx
                      ? 'border-gray-900 ring-2 ring-gray-400'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
            </div>
          </div>
        )}

        {/* Add to Cart Button */}
        {showAddToCart && (
          <button
            onClick={handleAddToCart}
            disabled={adding || product.stock <= 0}
            className="w-full border-2 border-gray-900 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-900 hover:text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {adding ? 'ADDED!' : product.stock <= 0 ? 'OUT OF STOCK' : 'ADD TO CART'}
          </button>
        )}
      </div>
    </Link>
  );
}

