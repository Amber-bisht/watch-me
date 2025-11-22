import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { requireAdmin } from '@/lib/auth-nextauth';
import { Order } from '@/lib/models';
import { generateInvoice } from '@/lib/shiprocket';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

/**
 * Generate invoice PDF
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

    // Generate invoice
    const shipmentId = parseInt(order.shiprocketShipmentId);
    let invoiceResponse;
    try {
      invoiceResponse = await generateInvoice(shipmentId);
    } catch (error: any) {
      console.error('Error generating invoice:', error);
      return NextResponse.json(
        {
          error: 'Failed to generate invoice',
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      invoiceUrl: invoiceResponse.invoice_url,
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.error('Error generating invoice:', error);
    return NextResponse.json(
      { error: 'Failed to generate invoice', details: error.message },
      { status: 500 }
    );
  }
}
