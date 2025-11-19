import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { requireAdmin } from '@/lib/auth-nextauth';
import { Product } from '@/lib/models';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');

    const db = await getDatabase();
    const query: any = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      db
        .collection<Product>('products')
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection<Product>('products').countDocuments(query),
    ]);

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message.includes('Admin access')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();
    const {
      title,
      slug,
      sku,
      price,
      currency = 'INR',
      collectionId,
      images,
      description,
      specs,
      stock,
      featured = false,
      isPublished = false,
    } = body;

    if (!title || !slug || !sku || !price || !collectionId || !images || !description || stock === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Check if slug already exists
    const existingProduct = await db
      .collection<Product>('products')
      .findOne({ slug });

    if (existingProduct) {
      return NextResponse.json(
        { error: 'Product with this slug already exists' },
        { status: 400 }
      );
    }

    // Verify collection exists
    const collection = await db
      .collection('collections')
      .findOne({ _id: new ObjectId(collectionId) });

    if (!collection) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 400 }
      );
    }

    const product: Product = {
      title,
      slug,
      sku,
      price: parseInt(price) * 100, // Convert to paisa
      currency,
      collectionId: new ObjectId(collectionId),
      images: Array.isArray(images) ? images : [images],
      description,
      specs: specs || {},
      stock: parseInt(stock),
      featured: Boolean(featured),
      isPublished: Boolean(isPublished),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection<Product>('products').insertOne(product);

    return NextResponse.json({
      product: { ...product, _id: result.insertedId },
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message.includes('Admin access')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}

