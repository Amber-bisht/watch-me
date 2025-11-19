'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { getCartItemCount } from '@/lib/cart';
import { Collection } from '@/lib/models';

export default function Navbar() {
  const [cartCount, setCartCount] = useState(0);
  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const { data: session } = useSession();

  useEffect(() => {
    const updateCartCount = () => {
      setCartCount(getCartItemCount());
    };

    updateCartCount();
    window.addEventListener('storage', updateCartCount);
    window.addEventListener('cartUpdated', updateCartCount);

    return () => {
      window.removeEventListener('storage', updateCartCount);
      window.removeEventListener('cartUpdated', updateCartCount);
    };
  }, []);

  useEffect(() => {
    // Fetch collections for dropdown
    async function fetchCollections() {
      try {
        const res = await fetch('/api/collections');
        const data = await res.json();
        setCollections(data.collections || []);
      } catch (error) {
        console.error('Error fetching collections:', error);
      }
    }
    fetchCollections();
  }, []);

  return (
    <nav className="bg-black text-white sticky top-0 z-50">
      {/* Top Bar with Logo and Icons */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Search Icon - Left */}
          <button className="p-2 hover:opacity-70 transition">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>

          {/* Logo - Center */}
          <Link href="/" className="flex flex-col items-center">
            <div className="relative w-14 h-14 mb-1">
              {/* Intertwined B Logo - Stylized */}
              <svg
                viewBox="0 0 100 100"
                className="w-full h-full"
                fill="currentColor"
                stroke="currentColor"
                strokeWidth="1"
              >
                {/* Upright B */}
                <path d="M20 10 L20 90 L45 90 Q60 90 60 75 Q60 60 45 60 L20 60 Z" />
                <path d="M20 60 L45 60 Q60 60 60 45 Q60 30 45 30 L20 30 Z" />
                <path d="M20 30 L45 30 Q60 30 60 15 Q60 10 50 10 L20 10 Z" />
                {/* Inverted B (overlapping) */}
                <path d="M80 10 L80 90 L55 90 Q40 90 40 75 Q40 60 55 60 L80 60 Z" />
                <path d="M80 60 L55 60 Q40 60 40 45 Q40 30 55 30 L80 30 Z" />
                <path d="M80 30 L55 30 Q40 30 40 15 Q40 10 50 10 L80 10 Z" />
              </svg>
            </div>
            <span className="text-sm font-semibold tracking-wide uppercase">
              ROYAL BLIZ
            </span>
          </Link>

          {/* User and Cart Icons - Right */}
          <div className="flex items-center space-x-4">
            {session ? (
              <Link
                href="/profile"
                className="p-2 hover:opacity-70 transition"
                title="My Profile"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </Link>
            ) : (
              <button
                onClick={() => signIn()}
                className="p-2 hover:opacity-70 transition"
                title="Sign In"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </button>
            )}
            <Link
              href="/cart"
              className="relative p-2 hover:opacity-70 transition"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-white text-black text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center space-x-8 py-3">
            <Link
              href="/"
              className="text-sm font-semibold uppercase tracking-wide hover:opacity-70 transition"
            >
              HOME
            </Link>
            <Link
              href="/all"
              className="text-sm font-semibold uppercase tracking-wide hover:opacity-70 transition"
            >
              PRODUCTS
            </Link>
            {/* Collections Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setCollectionsOpen(true)}
              onMouseLeave={() => setCollectionsOpen(false)}
            >
              <button className="text-sm font-semibold uppercase tracking-wide hover:opacity-70 transition flex items-center space-x-1">
                <span>COLLECTIONS</span>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {collectionsOpen && (
                <div className="absolute top-full left-0 mt-2 bg-black border border-gray-800 min-w-[200px] py-2 shadow-xl">
                  <Link
                    href="/collections"
                    className="block px-4 py-2 text-sm uppercase hover:bg-gray-900 transition font-semibold"
                  >
                    All Collections
                  </Link>
                  <div className="border-t border-gray-800 my-1"></div>
                  {collections.map((collection) => (
                    <Link
                      key={collection._id?.toString()}
                      href={`/collections/${collection.slug}`}
                      className="block px-4 py-2 text-sm hover:bg-gray-900 transition"
                    >
                      {collection.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <Link
              href="/warranty"
              className="text-sm font-semibold uppercase tracking-wide hover:opacity-70 transition"
            >
              WARRANTY
            </Link>
            <Link
              href="/customer-care"
              className="text-sm font-semibold uppercase tracking-wide hover:opacity-70 transition"
            >
              CUSTOMER CARE
            </Link>
            <Link
              href="/about-us"
              className="text-sm font-semibold uppercase tracking-wide hover:opacity-70 transition"
            >
              ABOUT US
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

