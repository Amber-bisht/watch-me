import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { verifyPaymentSignature } from '@/lib/razorpay';
import { Order } from '@/lib/models';
import { ObjectId } from 'mongodb';
import { z } from 'zod';

const verifySchema = z.object({
  orderId: z.string(),
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string(),
  razorpaySignature: z.string(),
});

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = verifySchema.parse(body);

    // Verify signature
    const isValid = verifyPaymentSignature(
      validated.razorpayOrderId,
      validated.razorpayPaymentId,
      validated.razorpaySignature
    );

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid payment signature' },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Update order status
    const result = await db.collection<Order>('orders').updateOne(
      { _id: new ObjectId(validated.orderId) },
      {
        $set: {
          razorpayPaymentId: validated.razorpayPaymentId,
          razorpaySignature: validated.razorpaySignature,
          status: 'paid',
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      orderId: validated.orderId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}

