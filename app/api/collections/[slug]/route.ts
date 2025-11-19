import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { Collection, Product } from '@/lib/models';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const db = await getDatabase();
    
    const collection = await db
      .collection<Collection>('collections')
      .findOne({ slug });

    if (!collection) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      );
    }

    const products = await db
      .collection<Product>('products')
      .find({ collectionId: collection._id })
      .toArray();

    return NextResponse.json({
      collection,
      products,
    });
  } catch (error) {
    console.error('Error fetching collection:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collection' },
      { status: 500 }
    );
  }
}

