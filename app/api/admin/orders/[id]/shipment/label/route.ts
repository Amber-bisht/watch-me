import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { requireAdmin } from '@/lib/auth-nextauth';
import { Order } from '@/lib/models';
import { generateLabel } from '@/lib/shiprocket';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

/**
 * Generate shipping label PDF
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const db = await getDatabase();

    const order = await db
      .collection<Order>('orders')
      .findOne({ _id: new ObjectId(id) });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (!order.shiprocketShipmentId) {
      return NextResponse.json(
        { error: 'No shipment created for this order' },
        { status: 400 }
      );
    }

    // Generate label
    const shipmentId = parseInt(order.shiprocketShipmentId);
    let labelResponse;
    try {
      labelResponse = await generateLabel(shipmentId);
    } catch (error: any) {
      console.error('Error generating label:', error);
      return NextResponse.json(
        {
          error: 'Failed to generate label',
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      labelUrl: labelResponse.label_url,
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.error('Error generating label:', error);
    return NextResponse.json(
      { error: 'Failed to generate label', details: error.message },
      { status: 500 }
    );
  }
}
