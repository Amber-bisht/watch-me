import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { requireAdmin } from '@/lib/auth-nextauth';
import { Collection } from '@/lib/models';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const db = await getDatabase();

    const collection = await db
      .collection<Collection>('collections')
      .findOne({ _id: new ObjectId(id) });

    if (!collection) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ collection });
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message.includes('Admin access')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Error fetching collection:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collection' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const body = await request.json();
    const { title, slug, description, image, meta } = body;

    const db = await getDatabase();

    const collection = await db
      .collection<Collection>('collections')
      .findOne({ _id: new ObjectId(id) });

    if (!collection) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      );
    }

    // Check if slug is being changed and if new slug already exists
    if (slug && slug !== collection.slug) {
      const existingCollection = await db
        .collection<Collection>('collections')
        .findOne({ slug, _id: { $ne: new ObjectId(id) } });

      if (existingCollection) {
        return NextResponse.json(
          { error: 'Collection with this slug already exists' },
          { status: 400 }
        );
      }
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (title !== undefined) updateData.title = title;
    if (slug !== undefined) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;
    if (image !== undefined) updateData.image = image;
    if (meta !== undefined) updateData.meta = meta;

    await db
      .collection<Collection>('collections')
      .updateOne({ _id: new ObjectId(id) }, { $set: updateData });

    const updatedCollection = await db
      .collection<Collection>('collections')
      .findOne({ _id: new ObjectId(id) });

    return NextResponse.json({ collection: updatedCollection });
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message.includes('Admin access')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Error updating collection:', error);
    return NextResponse.json(
      { error: 'Failed to update collection' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const db = await getDatabase();

    const collection = await db
      .collection<Collection>('collections')
      .findOne({ _id: new ObjectId(id) });

    if (!collection) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      );
    }

    // Check if any products are using this collection
    const productsCount = await db
      .collection('products')
      .countDocuments({ collectionId: new ObjectId(id) });

    if (productsCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete collection. ${productsCount} product(s) are using this collection.` },
        { status: 400 }
      );
    }

    await db.collection<Collection>('collections').deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ message: 'Collection deleted successfully' });
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message.includes('Admin access')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Error deleting collection:', error);
    return NextResponse.json(
      { error: 'Failed to delete collection' },
      { status: 500 }
    );
  }
}

