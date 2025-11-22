import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { Order } from '@/lib/models';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

/**
 * Shiprocket Webhook Handler
 * Handles various shipment status updates from Shiprocket
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Verify webhook authenticity if Shiprocket provides signature
    // For now, we'll trust the webhook from Shiprocket IP ranges
    // In production, verify webhook signature if available

    const db = await getDatabase();

    // Handle different webhook events
    const event = body.event || body.status || body.shipment_status;
    const shipmentId = body.shipment_id || body.shipment?.id;

    if (!shipmentId) {
      console.error('Shiprocket webhook: Missing shipment_id');
      return NextResponse.json(
        { error: 'Missing shipment_id' },
        { status: 400 }
      );
    }

    // Find order by Shiprocket shipment ID
    const order = await db.collection<Order>('orders').findOne({
      shiprocketShipmentId: shipmentId.toString(),
    });

    if (!order) {
      console.error(
        `Shiprocket webhook: Order not found for shipment_id: ${shipmentId}`
      );
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Update order based on webhook event
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Handle different status updates
    if (body.status_code || body.shipment_status) {
      const statusCode = body.status_code || body.shipment_status;
      updateData.shippingStatus = statusCode;

      // Map Shiprocket status to order status
      if (
        statusCode === 'DL' ||
        statusCode === 'Delivered' ||
        statusCode === 'DELIVERED'
      ) {
        // Delivered
        updateData.status = 'shipped'; // Keep as shipped in our system
      } else if (
        statusCode === 'PP' ||
        statusCode === 'Picked Up' ||
        statusCode === 'PICKEDUP'
      ) {
        // Picked up
        if (!updateData.pickupScheduledDate) {
          updateData.pickupScheduledDate = new Date();
        }
      } else if (
        statusCode === 'OT' ||
        statusCode === 'Out For Delivery' ||
        statusCode === 'OUT_FOR_DELIVERY'
      ) {
        // Out for delivery
        // No status change needed
      } else if (
        statusCode === 'RTO' ||
        statusCode === 'Return To Origin' ||
        statusCode === 'RETURN_TO_ORIGIN'
      ) {
        // Return to origin
        updateData.status = 'cancelled';
      }
    }

    // Update AWB code if provided
    if (body.awb_code || body.awbCode) {
      const awbCode = body.awb_code || body.awbCode;
      updateData.awbCode = awbCode;
      updateData.trackingUrl = `https://shiprocket.co/tracking/${awbCode}`;
      if (!order.awbCode) {
        updateData.status = 'shipped';
      }
    }

    // Update courier name if provided
    if (body.courier_name || body.courierName) {
      updateData.courierName =
        body.courier_name || body.courierName;
    }

    // Update order in database
    await db.collection<Order>('orders').updateOne(
      { _id: order._id },
      {
        $set: updateData,
      }
    );

    console.log(
      `Shiprocket webhook processed: shipment_id=${shipmentId}, event=${event}`
    );

    return NextResponse.json({ received: true, processed: true });
  } catch (error) {
    console.error('Error processing Shiprocket webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}
