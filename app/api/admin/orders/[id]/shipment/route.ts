import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { requireAdmin } from '@/lib/auth-nextauth';
import { Order, Product } from '@/lib/models';
import {
  createShipment,
  assignAWB,
  schedulePickup,
  getTracking,
  generateLabel,
  generateInvoice,
  getPickupAddress,
  CreateShipmentPayload,
} from '@/lib/shiprocket';
import { ObjectId } from 'mongodb';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Schema for create shipment request
const createShipmentSchema = z.object({
  weight: z.number().optional(),
  length: z.number().optional(),
  breadth: z.number().optional(),
  height: z.number().optional(),
});

/**
 * Create a shipment in Shiprocket for an order
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('[POST /api/admin/orders/[id]/shipment] Request received');
    
    await requireAdmin();
    console.log('[POST /api/admin/orders/[id]/shipment] Admin authenticated');

    const { id } = await params;
    console.log('[POST /api/admin/orders/[id]/shipment] Order ID:', id);

    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      console.error('[POST /api/admin/orders/[id]/shipment] Invalid order ID format:', id);
      return NextResponse.json(
        { error: 'Invalid order ID format' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    console.log('[POST /api/admin/orders/[id]/shipment] Database connected');

    // Get order
    const order = await db
      .collection<Order>('orders')
      .findOne({ _id: new ObjectId(id) });

    if (!order) {
      console.error('[POST /api/admin/orders/[id]/shipment] Order not found:', id);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    console.log('[POST /api/admin/orders/[id]/shipment] Order found, status:', order.status);

    // Check if order is already shipped
    if (order.shiprocketShipmentId) {
      console.warn('[POST /api/admin/orders/[id]/shipment] Shipment already exists:', order.shiprocketShipmentId);
      return NextResponse.json(
        { error: 'Shipment already created for this order' },
        { status: 400 }
      );
    }

    // Check if order is paid/confirmed
    if (order.status !== 'paid' && order.status !== 'confirmed') {
      console.warn('[POST /api/admin/orders/[id]/shipment] Order status invalid for shipment:', order.status);
      return NextResponse.json(
        {
          error: 'Order must be paid or confirmed before creating shipment',
          currentStatus: order.status,
        },
        { status: 400 }
      );
    }

    // Get pickup address
    const pickupAddress = getPickupAddress();
    if (!pickupAddress.pincode) {
      return NextResponse.json(
        { error: 'Pickup address not configured. Please set SHIPROCKET_PICKUP_* environment variables.' },
        { status: 500 }
      );
    }

    // Get request body for weight/dimensions
    let weight = 0.5; // default weight in kg
    let length = 10; // default in cm
    let breadth = 10;
    let height = 10;

    try {
      const body = await request.json();
      const validated = createShipmentSchema.parse(body);
      weight = validated.weight || weight;
      length = validated.length || length;
      breadth = validated.breadth || breadth;
      height = validated.height || height;
    } catch {
      // Use defaults if body is not provided or invalid
    }

    // Get product details for order items
    const orderItems = [];
    for (const item of order.items) {
      const product = await db
        .collection<Product>('products')
        .findOne({ _id: new ObjectId(item.productId) });

      if (product) {
        orderItems.push({
          name: item.title,
          sku: product.sku || `SKU-${item.productId}`,
          units: item.qty,
          selling_price: item.price / 100, // Convert from paisa to rupees
        });
      }
    }

    // Prepare shipment payload
    const shipmentPayload: CreateShipmentPayload = {
      order_id: order._id?.toString() || '',
      order_date: order.createdAt
        ? new Date(order.createdAt).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      pickup_location: pickupAddress.pincode,
      billing_customer_name: order.customer.name.split(' ')[0] || order.customer.name,
      billing_last_name: order.customer.name.split(' ').slice(1).join(' ') || '',
      billing_address: order.customer.address.street,
      billing_address_2: '',
      billing_city: order.customer.address.city,
      billing_pincode: order.customer.address.zipCode,
      billing_state: order.customer.address.state,
      billing_country: order.customer.address.country,
      billing_email: order.customer.email,
      billing_phone: order.customer.phone,
      shipping_is_billing: true,
      shipping_customer_name: order.customer.name.split(' ')[0] || order.customer.name,
      shipping_last_name: order.customer.name.split(' ').slice(1).join(' ') || '',
      shipping_address: order.customer.address.street,
      shipping_address_2: '',
      shipping_city: order.customer.address.city,
      shipping_pincode: order.customer.address.zipCode,
      shipping_state: order.customer.address.state,
      shipping_country: order.customer.address.country,
      shipping_email: order.customer.email,
      shipping_phone: order.customer.phone,
      order_items: orderItems,
      payment_method: order.status === 'paid' ? 'Prepaid' : 'COD',
      sub_total: order.amount / 100, // Convert from paisa to rupees
      length,
      breadth,
      height,
      weight,
    };

    // Create shipment in Shiprocket
    console.log('[POST /api/admin/orders/[id]/shipment] Creating shipment in Shiprocket...');
    let shipmentResponse;
    try {
      shipmentResponse = await createShipment(shipmentPayload);
      console.log('[POST /api/admin/orders/[id]/shipment] Shipment created successfully:', {
        shipmentId: shipmentResponse.shipment_id,
        orderId: shipmentResponse.order_id,
        awbCode: shipmentResponse.awb_code,
      });
    } catch (error: any) {
      console.error('[POST /api/admin/orders/[id]/shipment] Error creating Shiprocket shipment:', {
        error: error.message,
        stack: error.stack,
        response: error.response?.data || error.response,
      });
      return NextResponse.json(
        {
          error: 'Failed to create shipment in Shiprocket',
          details: error.message || 'Unknown error',
        },
        { status: 500 }
      );
    }

    // Update order with shipment details
    const updateData: any = {
      shiprocketShipmentId: shipmentResponse.shipment_id.toString(),
      shiprocketOrderId: shipmentResponse.order_id.toString(),
      courierName: shipmentResponse.courier_name || undefined,
      trackingUrl: shipmentResponse.awb_code
        ? `https://shiprocket.co/tracking/${shipmentResponse.awb_code}`
        : undefined,
      awbCode: shipmentResponse.awb_code || undefined,
      shippingStatus: shipmentResponse.status_code || 'pending',
      pickupAddress,
      updatedAt: new Date(),
    };

    // If AWB is already assigned, mark as shipped
    if (shipmentResponse.awb_code) {
      updateData.status = 'shipped';
    }

    console.log('[POST /api/admin/orders/[id]/shipment] Updating order with shipment details...');
    await db.collection<Order>('orders').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: updateData,
      }
    );
    console.log('[POST /api/admin/orders/[id]/shipment] Order updated successfully');

    const response = {
      success: true,
      shipment: {
        shipmentId: shipmentResponse.shipment_id,
        orderId: shipmentResponse.order_id,
        awbCode: shipmentResponse.awb_code,
        courierName: shipmentResponse.courier_name,
        status: shipmentResponse.status_code,
      },
    };

    console.log('[POST /api/admin/orders/[id]/shipment] Response prepared successfully');
    return NextResponse.json(response);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      console.error('[POST /api/admin/orders/[id]/shipment] Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.error('[POST /api/admin/orders/[id]/shipment] Error creating shipment:', {
      error: error.message,
      stack: error.stack,
      name: error.name,
    });
    return NextResponse.json(
      {
        error: 'Failed to create shipment',
        details: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Get shipment details and tracking info
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('[GET /api/admin/orders/[id]/shipment] Request received');
    
    await requireAdmin();
    console.log('[GET /api/admin/orders/[id]/shipment] Admin authenticated');

    const { id } = await params;
    console.log('[GET /api/admin/orders/[id]/shipment] Order ID:', id);

    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      console.error('[GET /api/admin/orders/[id]/shipment] Invalid order ID format:', id);
      return NextResponse.json(
        { error: 'Invalid order ID format' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    console.log('[GET /api/admin/orders/[id]/shipment] Database connected');

    const order = await db
      .collection<Order>('orders')
      .findOne({ _id: new ObjectId(id) });

    if (!order) {
      console.error('[GET /api/admin/orders/[id]/shipment] Order not found:', id);
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    console.log('[GET /api/admin/orders/[id]/shipment] Order found, status:', order.status);

    if (!order.shiprocketShipmentId) {
      console.warn('[GET /api/admin/orders/[id]/shipment] No shipment ID found for order:', id);
      return NextResponse.json(
        { error: 'No shipment created for this order' },
        { status: 404 }
      );
    }

    console.log('[GET /api/admin/orders/[id]/shipment] Shipment ID:', order.shiprocketShipmentId);

    // Get tracking info if AWB code exists
    let trackingInfo = null;
    if (order.awbCode) {
      console.log('[GET /api/admin/orders/[id]/shipment] Fetching tracking for AWB:', order.awbCode);
      try {
        trackingInfo = await getTracking(order.awbCode);
        console.log('[GET /api/admin/orders/[id]/shipment] Tracking info retrieved successfully');
      } catch (error: any) {
        console.error('[GET /api/admin/orders/[id]/shipment] Error fetching tracking:', {
          awbCode: order.awbCode,
          error: error.message,
          stack: error.stack,
        });
        // Continue without tracking info rather than failing the entire request
      }
    } else {
      console.log('[GET /api/admin/orders/[id]/shipment] No AWB code available for tracking');
    }

    const response = {
      shipment: {
        shipmentId: order.shiprocketShipmentId,
        orderId: order.shiprocketOrderId,
        awbCode: order.awbCode,
        courierName: order.courierName,
        shippingStatus: order.shippingStatus,
        trackingUrl: order.trackingUrl,
        pickupScheduledDate: order.pickupScheduledDate,
      },
      tracking: trackingInfo,
    };

    console.log('[GET /api/admin/orders/[id]/shipment] Response prepared successfully');
    return NextResponse.json(response);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      console.error('[GET /api/admin/orders/[id]/shipment] Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.error('[GET /api/admin/orders/[id]/shipment] Error fetching shipment:', {
      error: error.message,
      stack: error.stack,
      name: error.name,
    });
    return NextResponse.json(
      {
        error: 'Failed to fetch shipment',
        details: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
