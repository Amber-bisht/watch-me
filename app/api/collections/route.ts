import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { Collection } from '@/lib/models';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = await getDatabase();
    const collections = await db
      .collection<Collection>('collections')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ collections });
  } catch (error) {
    console.error('Error fetching collections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collections' },
      { status: 500 }
    );
  }
}

