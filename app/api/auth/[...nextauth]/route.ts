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

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
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
    signIn: '/admin',
    error: '/admin',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

