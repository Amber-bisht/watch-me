import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { createRazorpayOrder } from '@/lib/razorpay';
import { Order, Product } from '@/lib/models';
import { ObjectId } from 'mongodb';
import { z } from 'zod';

const checkoutSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string(),
      qty: z.number().min(1),
    })
  ),
  customer: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(10),
    address: z.object({
      street: z.string().min(1),
      city: z.string().min(1),
      state: z.string().min(1),
      zipCode: z.string().min(1),
      country: z.string().min(1),
    }),
  }),
});

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = checkoutSchema.parse(body);

    const db = await getDatabase();

    // Verify products and calculate total
    let totalAmount = 0;
    const orderItems = [];

    for (const item of validated.items) {
      const product = await db
        .collection<Product>('products')
        .findOne({ _id: new ObjectId(item.productId) });

      if (!product) {
        return NextResponse.json(
          { error: `Product ${item.productId} not found` },
          { status: 404 }
        );
      }

      if (product.stock < item.qty) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product.title}` },
          { status: 400 }
        );
      }

      orderItems.push({
        productId: product._id,
        title: product.title,
        price: product.price,
        qty: item.qty,
      });

      totalAmount += product.price * item.qty;
    }

    // Create order in database
    const order: Order = {
      items: orderItems,
      amount: totalAmount,
      currency: 'INR',
      customer: validated.customer,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection<Order>('orders').insertOne(order);
    const orderId = result.insertedId.toString();

    // Create Razorpay order
    let razorpayOrder;
    try {
      razorpayOrder = await createRazorpayOrder({
        amount: totalAmount, // in paisa
        currency: 'INR',
        receipt: `receipt_${orderId}`,
        payment_capture: 1,
      });
    } catch (razorpayError: any) {
      console.error('❌ Razorpay API Error:', razorpayError);
      console.error('Error Status Code:', razorpayError.statusCode);
      console.error('Error Details:', JSON.stringify(razorpayError.error, null, 2));
      
      // Check if it's an authentication error
      if (razorpayError.statusCode === 401 || razorpayError.error?.code === 'BAD_REQUEST_ERROR') {
        console.error('🔑 Authentication failed - checking credentials...');
        console.error('RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID ? 'Set' : 'NOT SET');
        console.error('RAZORPAY_KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET ? `Set (length: ${process.env.RAZORPAY_KEY_SECRET.length})` : 'NOT SET');
        
        if (process.env.RAZORPAY_KEY_SECRET === 'your_actual_razorpay_secret_here') {
          console.error('❌ RAZORPAY_KEY_SECRET is still set to placeholder value!');
        }
        
        return NextResponse.json(
          { 
            error: 'Payment gateway authentication failed. Please check Razorpay credentials in environment variables.',
            details: 'RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be valid and match your Razorpay account. Check console for details.'
          },
          { status: 500 }
        );
      }
      
      // Re-throw other Razorpay errors
      throw razorpayError;
    }

    // Update order with Razorpay order ID
    await db.collection<Order>('orders').updateOne(
      { _id: result.insertedId },
      {
        $set: {
          orderIdRazorpay: razorpayOrder.id,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      orderId: orderId,
      razorpayOrderId: razorpayOrder.id,
      amount: totalAmount,
      currency: 'INR',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

