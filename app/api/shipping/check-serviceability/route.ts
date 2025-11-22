import { NextResponse } from 'next/server';
import { checkServiceability } from '@/lib/shiprocket';

export const dynamic = 'force-dynamic';

/**
 * Check shipping serviceability for a pincode
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pincode = searchParams.get('pincode');
    const weight = searchParams.get('weight');

    if (!pincode) {
      return NextResponse.json(
        { error: 'Pincode is required' },
        { status: 400 }
      );
    }

    const weightInKg = weight ? parseFloat(weight) : 0.5; // Default 0.5 kg

    if (isNaN(weightInKg) || weightInKg <= 0) {
      return NextResponse.json(
        { error: 'Invalid weight. Must be a positive number in kg' },
        { status: 400 }
      );
    }

    try {
      const response = await checkServiceability(pincode, weightInKg);

      return NextResponse.json({
        success: true,
        serviceable: response.status === 200,
        couriers: response.data?.available_courier_companies || [],
      });
    } catch (error: any) {
      console.error('Error checking serviceability:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to check serviceability',
          details: error.message,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in serviceability check:', error);
    return NextResponse.json(
      { error: 'Failed to check serviceability', details: error.message },
      { status: 500 }
    );
  }
}
