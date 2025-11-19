import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { Product } from '@/lib/models';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const db = await getDatabase();
    
    const product = await db
      .collection<Product>('products')
      .findOne({ slug, isPublished: true }); // Only show published products to public

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

