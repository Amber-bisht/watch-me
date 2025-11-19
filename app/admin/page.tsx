'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';

function AdminLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'authenticated') {
      const userRole = (session.user as any)?.role;
      const callbackUrl = searchParams.get('callbackUrl') || '/admin/orders';
      
      // Check if callback URL is for admin pages
      const isAdminPage = callbackUrl.startsWith('/admin');
      
      if (isAdminPage) {
        // For admin pages, require admin role
        if (userRole === 'admin') {
          // Only redirect if we're not already on the target page
          if (window.location.pathname !== callbackUrl) {
            router.push(callbackUrl);
          }
        } else {
          // User is logged in but not admin
          alert('You do not have admin access. Please contact an administrator to grant you admin role.');
        }
      } else {
        // For non-admin pages (like checkout), allow any authenticated user
        if (window.location.pathname !== callbackUrl) {
          router.push(callbackUrl);
        }
      }
    }
  }, [session, status, router, searchParams]);

  async function handleGoogleSignIn() {
    // Get the callback URL from query params, default to /admin/orders
    const callbackUrl = searchParams.get('callbackUrl') || '/admin/orders';
    await signIn('google', { callbackUrl });
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="text-lg text-white">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="bg-gray-900 border border-gray-800 rounded-lg shadow-md p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center text-white">
          {searchParams.get('callbackUrl')?.startsWith('/admin') ? 'Admin Login' : 'Login'}
        </h1>
        <p className="text-gray-400 text-center mb-6">
          {searchParams.get('callbackUrl')?.startsWith('/admin')
            ? 'Sign in with your Google account to access the admin panel'
            : 'Sign in with your Google account to continue'}
        </p>

        <button
          onClick={handleGoogleSignIn}
          className="w-full bg-white border-2 border-white text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Sign in with Google
        </button>

        {searchParams.get('callbackUrl')?.startsWith('/admin') && (
          <p className="text-sm text-gray-500 text-center mt-4">
            Note: You need admin role assigned in the database to access admin features
          </p>
        )}
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="text-lg text-white">Loading...</div>
        </div>
      </div>
    }>
      <AdminLoginContent />
    </Suspense>
  );
}

