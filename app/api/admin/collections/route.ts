import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { requireAdmin } from '@/lib/auth-nextauth';
import { Collection } from '@/lib/models';

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
        { slug: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [collections, total] = await Promise.all([
      db
        .collection<Collection>('collections')
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection<Collection>('collections').countDocuments(query),
    ]);

    return NextResponse.json({
      collections,
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

    console.error('Error fetching collections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collections' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { title, slug, description, image, meta } = body;

    if (!title || !slug || !description || !image) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Check if slug already exists
    const existingCollection = await db
      .collection<Collection>('collections')
      .findOne({ slug });

    if (existingCollection) {
      return NextResponse.json(
        { error: 'Collection with this slug already exists' },
        { status: 400 }
      );
    }

    const collection: Collection = {
      title,
      slug,
      description,
      image,
      meta: meta || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection<Collection>('collections').insertOne(collection);

    return NextResponse.json({
      collection: { ...collection, _id: result.insertedId },
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message.includes('Admin access')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Error creating collection:', error);
    return NextResponse.json(
      { error: 'Failed to create collection' },
      { status: 500 }
    );
  }
}

