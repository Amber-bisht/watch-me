import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { requireAdmin } from '@/lib/auth-nextauth';
import { Order } from '@/lib/models';
import { schedulePickup } from '@/lib/shiprocket';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

/**
 * Schedule pickup for a shipment
 */
export async function POST(
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

    // Schedule pickup
    const shipmentId = parseInt(order.shiprocketShipmentId);
    let pickupResponse;
    try {
      pickupResponse = await schedulePickup(shipmentId);
    } catch (error: any) {
      console.error('Error scheduling pickup:', error);
      return NextResponse.json(
        {
          error: 'Failed to schedule pickup',
          details: error.message,
        },
        { status: 500 }
      );
    }

    // Update order with pickup scheduled date
    await db.collection<Order>('orders').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          pickupScheduledDate: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: pickupResponse.message || 'Pickup scheduled successfully',
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.error('Error scheduling pickup:', error);
    return NextResponse.json(
      { error: 'Failed to schedule pickup', details: error.message },
      { status: 500 }
    );
  }
}
