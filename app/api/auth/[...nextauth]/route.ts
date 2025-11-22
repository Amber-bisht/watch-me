import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export interface User {
  _id?: ObjectId;
  email: string;
  name: string;
  image?: string;
  role?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Validate required environment variables
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const nextAuthSecret = process.env.NEXTAUTH_SECRET;

if (!googleClientId || !googleClientSecret) {
  console.error('Missing Google OAuth credentials. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env.local file');
}

if (!nextAuthSecret) {
  console.error('Missing NEXTAUTH_SECRET. Please set it in your .env.local file');
}

export const authOptions: NextAuthOptions = {
  providers: googleClientId && googleClientSecret ? [
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    }),
  ] : [], // Empty providers array if credentials are missing - this will cause a clear error
  callbacks: {
    async signIn({ user, account, profile }) {
      // Only allow Google provider authentication
      if (account?.provider !== 'google') {
        return false;
      }

      try {
        const db = await getDatabase();
        
        // Check if user exists, if not create one
        const existingUser = await db
          .collection<User>('users')
          .findOne({ email: user.email! });

        if (!existingUser) {
          // Create new user with default role 'user'
          await db.collection<User>('users').insertOne({
            email: user.email!,
            name: user.name!,
            image: user.image || undefined,
            role: 'user', // Default role
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        } else {
          // Update user info if needed
          await db.collection<User>('users').updateOne(
            { email: user.email! },
            {
              $set: {
                name: user.name || '',
                image: user.image || undefined,
                updatedAt: new Date(),
              },
            }
          );
        }
      } catch (error) {
        console.error('Error in signIn callback:', error);
        return false;
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user?.email) {
        try {
          const db = await getDatabase();
          const user = await db
            .collection<User>('users')
            .findOne({ email: session.user.email });

          if (user) {
            // Add user ID and role to session
            (session as any).user.id = user._id?.toString();
            (session as any).user.role = user.role || 'user';
          }
        } catch (error) {
          console.error('Error fetching user in session:', error);
        }
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (account && user) {
        token.accessToken = account.access_token;
      }
      return token;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: nextAuthSecret || 'temp-secret-change-in-production', // Use temp secret if not set (will show error)
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

