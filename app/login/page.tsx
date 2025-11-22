'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  // Function to clean and normalize malformed URLs
  function cleanCallbackUrl(url: string | null): string | null {
    if (!url) return null;
    
    try {
      // First, decode URL encoding
      let decoded = decodeURIComponent(url);
      
      // Handle spaces and split if there are multiple URLs concatenated
      // e.g., "https://htpp https://htpp//localhost:5000/error?error=OAuthSignin"
      if (decoded.includes(' ')) {
        // If there's a space, take the last part (usually the actual URL)
        const parts = decoded.split(' ');
        decoded = parts[parts.length - 1];
      }
      
      // Fix common malformations
      let cleaned = decoded
        .replace(/https?:\/\/htpp/gi, '') // Remove "htpp" typo patterns
        .replace(/htpp/gi, '') // Remove standalone "htpp"
        .replace(/https?:\/\//gi, '') // Remove all http/https protocols temporarily
        .replace(/\/\/+/g, '/') // Replace multiple slashes with single slash
        .replace(/\s+/g, '') // Remove any remaining spaces
        .replace(/^\/+/, '/'); // Ensure starts with single slash
      
      // If it contains localhost, extract the path
      if (cleaned.includes('localhost')) {
        // Extract path after localhost:port
        const match = cleaned.match(/localhost(?::\d+)?(\/.*)/);
        if (match) {
          cleaned = match[1] || '/admin/orders';
        } else {
          // If we can't parse it, default to safe path
          return '/admin/orders';
        }
      }
      
      // If it's an error URL, return null (we'll handle error separately)
      if (cleaned.includes('/error')) {
        return null; // Return null so we can handle error from query params instead
      }
      
      // Validate it's a proper path
      if (!cleaned.startsWith('/')) {
        return '/admin/orders';
      }
      
      return cleaned;
    } catch (e) {
      console.error('Error cleaning callback URL:', e);
      return '/admin/orders';
    }
  }

  useEffect(() => {
    if (status === 'authenticated') {
      const userRole = (session.user as any)?.role;
      
      // Check if we have an external callback URL stored in sessionStorage
      const externalCallbackUrl = sessionStorage.getItem('externalCallbackUrl');
      let rawCallbackUrl = externalCallbackUrl || searchParams.get('callbackUrl') || '/admin/orders';
      
      // Clean up sessionStorage after reading
      if (externalCallbackUrl) {
        sessionStorage.removeItem('externalCallbackUrl');
      }
      
      // Clean malformed URLs - if it's null (error URL), use default
      const cleanedCallbackUrl = cleanCallbackUrl(rawCallbackUrl);
      let callbackUrl = cleanedCallbackUrl || '/admin/orders';
      
      // Don't redirect to error pages
      if (callbackUrl.includes('/error')) {
        callbackUrl = '/admin/orders';
      }
      
      // Check if callback URL is absolute (starts with http:// or https://)
      const isAbsoluteUrl = callbackUrl.startsWith('http://') || callbackUrl.startsWith('https://');
      
      // Extract path from absolute URL for admin check, or use the callbackUrl directly if relative
      let urlPath: string;
      if (isAbsoluteUrl) {
        try {
          urlPath = new URL(callbackUrl).pathname;
        } catch (e) {
          // If URL parsing fails, use cleaned callback
          urlPath = callbackUrl;
        }
      } else {
        urlPath = callbackUrl;
      }
      
      // Check if callback URL is for admin pages
      const isAdminPage = urlPath.startsWith('/admin');
      
      if (isAdminPage) {
        // For admin pages, require admin role
        if (userRole === 'admin') {
          // Handle redirect for absolute URLs vs relative URLs
          if (isAbsoluteUrl) {
            // For absolute URLs, use window.location for full redirect
            window.location.href = callbackUrl;
          } else {
            // For relative URLs, use router.push
            if (window.location.pathname !== callbackUrl) {
              router.push(callbackUrl);
            }
          }
        } else {
          // User is logged in but not admin
          alert('You do not have admin access. Please contact an administrator to grant you admin role.');
        }
      } else {
        // For non-admin pages (like checkout), allow any authenticated user
        if (isAbsoluteUrl) {
          // For absolute URLs, use window.location for full redirect
          window.location.href = callbackUrl;
        } else {
          // For relative URLs, use router.push
          if (window.location.pathname !== callbackUrl) {
            router.push(callbackUrl);
          }
        }
      }
    }
  }, [session, status, router, searchParams]);

  async function handleGoogleSignIn() {
    try {
      // Get the callback URL from query params, default to /admin/orders
      const rawCallbackUrl = searchParams.get('callbackUrl');
      
      // Clean malformed URLs (like the error URL with typos)
      let callbackUrl = cleanCallbackUrl(rawCallbackUrl) || '/admin/orders';
      
      // Don't use error URLs as callback - redirect to admin orders instead
      if (!callbackUrl || callbackUrl.includes('/error')) {
        callbackUrl = '/admin/orders';
      }
      
      // App runs on port 5000 - get current origin
      const currentOrigin = window.location.origin; // This will be http://localhost:5000
      
      // Check if callback URL is absolute (starts with http:// or https://)
      const isAbsoluteUrl = callbackUrl.startsWith('http://') || callbackUrl.startsWith('https://');
      
      // If callback URL is absolute, check if it's the same origin
      if (isAbsoluteUrl) {
        try {
          const callbackUrlObj = new URL(callbackUrl);
          
          // If same origin (same protocol, host, port = 5000), convert to relative path
          if (callbackUrlObj.origin === currentOrigin) {
            // Same origin - convert to relative URL for NextAuth
            callbackUrl = callbackUrlObj.pathname + (callbackUrlObj.search || '');
            await signIn('google', { callbackUrl });
          } else {
            // Different origin (e.g., port 3000) - store in sessionStorage and redirect back here first
            sessionStorage.setItem('externalCallbackUrl', callbackUrl);
            // Redirect back to this page after auth, then handle external redirect
            callbackUrl = window.location.pathname;
            await signIn('google', { callbackUrl });
          }
        } catch (e) {
          // If URL parsing fails, use default callback
          callbackUrl = '/admin/orders';
          await signIn('google', { callbackUrl });
        }
      } else {
        // Relative URL - use as-is for NextAuth (app is on port 5000)
        await signIn('google', { callbackUrl });
      }
    } catch (error) {
      console.error('Error signing in:', error);
      alert('An error occurred during sign in. Please try again.');
      // Redirect to login page with error
      router.push('/login?error=OAuthSignin');
    }
  }

  // Show error message if present (ignore "undefined" string)
  const rawError = searchParams.get('error');
  const error = rawError && rawError !== 'undefined' ? rawError : null;
  
  // Clean up URL if error is undefined or empty
  useEffect(() => {
    const urlError = searchParams.get('error');
    if (urlError === 'undefined' || urlError === '' || !urlError) {
      const url = new URL(window.location.href);
      url.searchParams.delete('error');
      // Also clean up malformed callback URLs
      const callbackUrl = url.searchParams.get('callbackUrl');
      if (callbackUrl && (callbackUrl.includes('htpp') || callbackUrl.includes('/error') || callbackUrl.includes('undefined'))) {
        url.searchParams.delete('callbackUrl');
      }
      // Only update if we actually removed something
      if (urlError || (callbackUrl && (callbackUrl.includes('htpp') || callbackUrl.includes('/error') || callbackUrl.includes('undefined')))) {
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [searchParams]);
  
  const errorMessages: Record<string, string> = {
    OAuthSignin: 'Error initiating OAuth sign-in. Please check your Google OAuth configuration.',
    OAuthCallback: 'Error processing OAuth callback. Please try again.',
    OAuthCreateAccount: 'Could not create OAuth account. Please try again.',
    EmailCreateAccount: 'Could not create email account.',
    Callback: 'Error in callback. Please try again.',
    OAuthAccountNotLinked: 'To confirm your identity, sign in with the same account you used originally.',
    EmailSignin: 'Check your email for a sign-in link.',
    CredentialsSignin: 'Invalid credentials.',
    SessionRequired: 'Please sign in to access this page.',
    Default: 'An authentication error occurred.',
  };

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
          {(() => {
            const callbackUrl = searchParams.get('callbackUrl') || '';
            const cleaned = cleanCallbackUrl(callbackUrl) || '';
            const urlPath = cleaned.startsWith('/error') ? '/admin/orders' : cleaned;
            return urlPath.startsWith('/admin') ? 'Admin Login' : 'Login';
          })()}
        </h1>
        <p className="text-gray-400 text-center mb-6">
          {(() => {
            const callbackUrl = searchParams.get('callbackUrl') || '';
            const cleaned = cleanCallbackUrl(callbackUrl) || '';
            const urlPath = cleaned.startsWith('/error') ? '/admin/orders' : cleaned;
            return urlPath.startsWith('/admin')
              ? 'Sign in with your Google account to access the admin panel'
              : 'Sign in with your Google account to continue';
          })()}
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg">
            <p className="text-red-200 text-sm text-center mb-2">
              {errorMessages[error] || errorMessages.Default}
            </p>
            {error === 'OAuthSignin' && (
              <p className="text-red-300 text-xs text-center mb-2 mt-2">
                ⚠️ Please ensure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set in your .env.local file
              </p>
            )}
            <button
              onClick={() => {
                // Clear error from URL and reload
                const url = new URL(window.location.href);
                url.searchParams.delete('error');
                url.searchParams.delete('callbackUrl'); // Clear malformed callback URL too
                window.location.href = url.toString();
              }}
              className="text-red-300 hover:text-red-100 text-xs underline mx-auto block mt-2"
            >
              Clear error and try again
            </button>
          </div>
        )}

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

        {(() => {
          const callbackUrl = searchParams.get('callbackUrl') || '';
          const cleaned = cleanCallbackUrl(callbackUrl) || '';
          const urlPath = cleaned.startsWith('/error') ? '/admin/orders' : cleaned;
          return urlPath.startsWith('/admin');
        })() && (
          <p className="text-sm text-gray-500 text-center mt-4">
            Note: You need admin role assigned in the database to access admin features
          </p>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="text-lg text-white">Loading...</div>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}

