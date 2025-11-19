import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { requireAdmin } from '@/lib/auth-nextauth';
import { Product } from '@/lib/models';
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

    const product = await db
      .collection<Product>('products')
      .findOne({ _id: new ObjectId(id) });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ product });
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message.includes('Admin access')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
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
      featured,
      isPublished,
    } = body;

    const db = await getDatabase();

    const product = await db
      .collection<Product>('products')
      .findOne({ _id: new ObjectId(id) });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if slug is being changed and if new slug already exists
    if (slug && slug !== product.slug) {
      const existingProduct = await db
        .collection<Product>('products')
        .findOne({ slug, _id: { $ne: new ObjectId(id) } });

      if (existingProduct) {
        return NextResponse.json(
          { error: 'Product with this slug already exists' },
          { status: 400 }
        );
      }
    }

    // Verify collection exists if collectionId is being updated
    if (collectionId) {
      const collection = await db
        .collection('collections')
        .findOne({ _id: new ObjectId(collectionId) });

      if (!collection) {
        return NextResponse.json(
          { error: 'Collection not found' },
          { status: 400 }
        );
      }
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (title !== undefined) updateData.title = title;
    if (slug !== undefined) updateData.slug = slug;
    if (sku !== undefined) updateData.sku = sku;
    if (price !== undefined) updateData.price = parseInt(price) * 100; // Convert to paisa
    if (currency !== undefined) updateData.currency = currency;
    if (collectionId !== undefined) updateData.collectionId = new ObjectId(collectionId);
    if (images !== undefined) updateData.images = Array.isArray(images) ? images : [images];
    if (description !== undefined) updateData.description = description;
    if (specs !== undefined) updateData.specs = specs;
    if (stock !== undefined) updateData.stock = parseInt(stock);
    if (featured !== undefined) updateData.featured = Boolean(featured);
    if (isPublished !== undefined) updateData.isPublished = Boolean(isPublished);

    await db
      .collection<Product>('products')
      .updateOne({ _id: new ObjectId(id) }, { $set: updateData });

    const updatedProduct = await db
      .collection<Product>('products')
      .findOne({ _id: new ObjectId(id) });

    return NextResponse.json({ product: updatedProduct });
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message.includes('Admin access')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
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

    const product = await db
      .collection<Product>('products')
      .findOne({ _id: new ObjectId(id) });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    await db.collection<Product>('products').deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message.includes('Admin access')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}

