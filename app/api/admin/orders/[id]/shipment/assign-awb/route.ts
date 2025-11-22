import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { requireAdmin } from '@/lib/auth-nextauth';
import { Order } from '@/lib/models';
import { assignAWB } from '@/lib/shiprocket';
import { ObjectId } from 'mongodb';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const assignAWBSchema = z.object({
  courierId: z.number().optional(),
});

/**
 * Assign AWB (Air Waybill) to a shipment
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

    if (order.awbCode) {
      return NextResponse.json(
        { error: 'AWB already assigned to this shipment' },
        { status: 400 }
      );
    }

    // Parse request body for optional courier ID
    let courierId: number | undefined;
    try {
      const body = await request.json();
      const validated = assignAWBSchema.parse(body);
      courierId = validated.courierId;
    } catch {
      // No courier ID provided, use default
    }

    // Assign AWB
    const shipmentId = parseInt(order.shiprocketShipmentId);
    let awbResponse;
    try {
      awbResponse = await assignAWB(shipmentId, courierId);
    } catch (error: any) {
      console.error('Error assigning AWB:', error);
      return NextResponse.json(
        {
          error: 'Failed to assign AWB',
          details: error.message,
        },
        { status: 500 }
      );
    }

    // Update order with AWB details
    await db.collection<Order>('orders').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          awbCode: awbResponse.response.awb_code,
          courierName: awbResponse.response.courier_name,
          trackingUrl: `https://shiprocket.co/tracking/${awbResponse.response.awb_code}`,
          status: 'shipped',
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      success: true,
      awb: {
        awbCode: awbResponse.response.awb_code,
        courierName: awbResponse.response.courier_name,
      },
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.error('Error assigning AWB:', error);
    return NextResponse.json(
      { error: 'Failed to assign AWB', details: error.message },
      { status: 500 }
    );
  }
}
