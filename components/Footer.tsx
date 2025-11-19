'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Footer() {
  const [email, setEmail] = useState('');

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle email subscription
    console.log('Email submitted:', email);
    setEmail('');
  };

  return (
    <footer className="bg-black text-white mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Footer Content - 4 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand Information Column */}
          <div>
            <Link href="/" className="flex flex-col items-start mb-4">
              <div className="relative w-12 h-12 mb-2">
                {/* Intertwined B Logo */}
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
            <p className="text-sm text-gray-300 leading-relaxed">
              A Place Where You Can Find Premium and High-Quality Watches All
              Around the UAE. Let's Upgrade Your Lifestyle with Royal Bliz.
            </p>
          </div>

          {/* Menu Links Column */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide mb-4">
              MENU
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:opacity-70 transition">
                  HOME
                </Link>
              </li>
              <li>
                <Link href="/all" className="hover:opacity-70 transition">
                  PRODUCTS
                </Link>
              </li>
              <li>
                <Link href="/collections" className="hover:opacity-70 transition">
                  CATEGORIES
                </Link>
              </li>
              <li>
                <Link href="/warranty" className="hover:opacity-70 transition">
                  WARRANTY
                </Link>
              </li>
              <li>
                <Link
                  href="/customer-care"
                  className="hover:opacity-70 transition"
                >
                  CUSTOMER CARE
                </Link>
              </li>
              <li>
                <Link href="/about-us" className="hover:opacity-70 transition">
                  ABOUT US
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Care Column */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide mb-4">
              COSTUMER CARE
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/privacy-policy"
                  className="hover:opacity-70 transition"
                >
                  PRIVACY POLICY
                </Link>
              </li>
              <li>
                <Link
                  href="/returns-exchange"
                  className="hover:opacity-70 transition"
                >
                  Returns & Exchange Policy
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="hover:opacity-70 transition">
                  REFUND POLICY
                </Link>
              </li>
              <li>
                <Link href="/shipping-policy" className="hover:opacity-70 transition">
                  SHIPPING POLICY
                </Link>
              </li>
              <li>
                <Link
                  href="/terms-services"
                  className="hover:opacity-70 transition"
                >
                  TERMS AND SERVICES
                </Link>
              </li>
              <li>
                <Link href="/faqs" className="hover:opacity-70 transition">
                  FAQS
                </Link>
              </li>
              <li>
                <Link href="/blogs" className="hover:opacity-70 transition">
                  BLOGS
                </Link>
              </li>
            </ul>
          </div>

          {/* Sign Up and Social Media Column */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide mb-4">
              SIGN UP AND SAVE
            </h4>
            <p className="text-sm text-gray-300 mb-4">
              Subscribe to get special offers, free giveaways, and
              once-in-a-lifetime deals.
            </p>
            <form onSubmit={handleEmailSubmit} className="mb-6">
              <div className="flex items-center border-b border-white pb-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="bg-transparent text-white placeholder-gray-400 flex-1 outline-none text-sm"
                  required
                />
                <button
                  type="submit"
                  className="ml-2 hover:opacity-70 transition"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </button>
              </div>
            </form>
            {/* Social Media Icons */}
            <div className="flex items-center space-x-4">
              {/* Instagram */}
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-70 transition"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              {/* Facebook */}
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-70 transition"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              {/* YouTube */}
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-70 transition"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
              {/* X (Twitter) */}
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-70 transition"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              {/* Pinterest */}
              <a
                href="https://pinterest.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-70 transition"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.372 0 12s5.373 12 12 12c5.302 0 9.917-3.176 11.827-7.73-.163-.693-.37-1.763-.785-2.502-.852-1.19-1.8-2.002-2.75-2.002-.58 0-1.113.298-1.51.78-.378.46-.49 1.067-.36 1.676.13.61.442 1.2.89 1.678.36.38.78.66 1.22.85.18.08.36.14.54.19.18.05.36.08.54.1.36.04.72.06 1.08.04v-.02c-.18-.36-.38-.72-.6-1.06-.22-.34-.46-.66-.72-.96-.52-.6-1.12-1.14-1.8-1.6-.68-.46-1.44-.82-2.26-1.08-.82-.26-1.7-.38-2.64-.38-1.1 0-2.14.2-3.12.6-.98.4-1.82.98-2.52 1.74-.7.76-1.24 1.66-1.62 2.7-.38 1.04-.57 2.16-.57 3.36 0 1.2.2 2.32.6 3.36.4 1.04.98 1.94 1.74 2.7.76.76 1.66 1.34 2.7 1.74 1.04.4 2.16.6 3.36.6.82 0 1.6-.12 2.34-.36.74-.24 1.42-.58 2.04-1.02.62-.44 1.16-.98 1.62-1.62.46-.64.82-1.38 1.08-2.22.26-.84.38-1.76.38-2.76 0-1-.12-1.96-.36-2.88-.24-.92-.6-1.78-1.08-2.58-.48-.8-1.08-1.52-1.8-2.16-.72-.64-1.56-1.14-2.52-1.5-.96-.36-2.04-.54-3.24-.54z" />
                </svg>
              </a>
              {/* TikTok */}
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-70 transition"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 pt-8">
          {/* Payment Methods */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
            {/* American Express */}
            <div className="h-8 w-12 bg-white rounded flex items-center justify-center">
              <span className="text-xs font-bold text-blue-600">AE</span>
            </div>
            {/* Apple Pay */}
            <div className="h-8 w-12 bg-black border border-white rounded flex items-center justify-center">
              <span className="text-xs text-white">AP</span>
            </div>
            {/* Discover */}
            <div className="h-8 w-12 bg-orange-500 rounded flex items-center justify-center">
              <span className="text-xs font-bold text-white">D</span>
            </div>
            {/* Google Pay */}
            <div className="h-8 w-12 bg-white rounded flex items-center justify-center">
              <span className="text-xs font-bold text-gray-800">GP</span>
            </div>
            {/* JCB */}
            <div className="h-8 w-12 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-xs font-bold text-white">JCB</span>
            </div>
            {/* Mastercard */}
            <div className="h-8 w-12 bg-white rounded flex items-center justify-center">
              <span className="text-xs font-bold text-red-600">MC</span>
            </div>
            {/* Visa */}
            <div className="h-8 w-12 bg-blue-700 rounded flex items-center justify-center">
              <span className="text-xs font-bold text-white">VISA</span>
            </div>
            {/* Tabby */}
            <div className="h-8 w-12 bg-green-500 rounded flex items-center justify-center">
              <span className="text-xs font-bold text-white">Tabby</span>
            </div>
            {/* Tamara */}
            <div className="h-8 w-12 bg-purple-600 rounded flex items-center justify-center">
              <span className="text-xs font-bold text-white">Tamara</span>
            </div>
          </div>

          {/* Copyright and Developer Info */}
          <div className="text-center text-sm space-y-2">
            <p>© 2025 royalbliz</p>
            <p className="text-gray-400">Developed by flylight group</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

