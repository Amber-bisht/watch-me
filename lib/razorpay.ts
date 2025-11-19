import Razorpay from 'razorpay';
import crypto from 'crypto';

// Check and log Razorpay configuration
console.log('🔍 Checking Razorpay configuration...');
console.log('RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID ? `${process.env.RAZORPAY_KEY_ID.substring(0, 10)}...` : '❌ NOT SET');
console.log('RAZORPAY_KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET ? (process.env.RAZORPAY_KEY_SECRET.length > 0 ? '✅ SET (length: ' + process.env.RAZORPAY_KEY_SECRET.length + ')' : '❌ EMPTY') : '❌ NOT SET');

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.error('❌ ERROR: Razorpay credentials not configured!');
  throw new Error('Razorpay credentials not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your environment variables.');
}

// Check if using placeholder values
if (
  process.env.RAZORPAY_KEY_SECRET === 'your_actual_razorpay_secret_here' ||
  process.env.RAZORPAY_KEY_SECRET === '' ||
  process.env.RAZORPAY_KEY_ID === ''
) {
  console.error('❌ ERROR: Razorpay credentials appear to be placeholder values!');
  console.error('⚠️  Please update RAZORPAY_KEY_SECRET with actual credentials from Razorpay dashboard.');
  console.error('Current RAZORPAY_KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET);
}

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export interface RazorpayOrderOptions {
  amount: number; // in paisa
  currency: string;
  receipt: string;
  payment_capture: number;
}

export async function createRazorpayOrder(options: RazorpayOrderOptions) {
  return await razorpay.orders.create(options);
}

export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET!;
  const text = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(text)
    .digest('hex');
  
  return expectedSignature === signature;
}

export function verifyWebhookSignature(
  body: string,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET!;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  
  return expectedSignature === signature;
}

