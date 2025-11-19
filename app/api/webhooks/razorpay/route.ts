import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { verifyWebhookSignature } from '@/lib/razorpay';
import { Order } from '@/lib/models';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const isValid = verifyWebhookSignature(body, signature);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    const event = JSON.parse(body);

    // Handle payment.captured event
    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;
      const orderId = payment.order_id;

      const db = await getDatabase();

      // Find order by Razorpay order ID
      const order = await db
        .collection<Order>('orders')
        .findOne({ orderIdRazorpay: orderId });

      if (order && order.status !== 'paid') {
        // Update order status to paid (idempotent)
        await db.collection<Order>('orders').updateOne(
          { _id: order._id },
          {
            $set: {
              razorpayPaymentId: payment.id,
              status: 'paid',
              updatedAt: new Date(),
            },
          }
        );
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

