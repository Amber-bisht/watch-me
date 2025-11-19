import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  image?: string;
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return null;
  }

  return {
    id: (session.user as any).id || '',
    email: session.user.email!,
    name: session.user.name!,
    role: (session.user as any).role || 'user',
    image: session.user.image || undefined,
  };
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getAuthUser();
  
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  return user;
}

export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireAuth();
  
  if (user.role !== 'admin') {
    throw new Error('Forbidden: Admin access required');
  }
  
  return user;
}

export async function getUserRole(email: string): Promise<string | null> {
  try {
    const db = await getDatabase();
    const user = await db
      .collection('users')
      .findOne({ email });

    return user?.role || null;
  } catch (error) {
    console.error('Error fetching user role:', error);
    return null;
  }
}

