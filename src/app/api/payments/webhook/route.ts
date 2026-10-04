import { NextRequest, NextResponse } from 'next/server';
import { fulfillPayment, verifyStripeSignature, verifyRazorpaySignature } from '@/lib/payments';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const provider = req.headers.get('x-payment-provider') || process.env.PAYMENT_PROVIDER || 'sandbox';

    if (provider === 'stripe') {
      const sig = req.headers.get('stripe-signature') || '';
      const secret = process.env.STRIPE_WEBHOOK_SECRET || '';
      const isValid = verifyStripeSignature(rawBody, sig, secret);
      if (!isValid && !secret.startsWith('whsec_mock')) {
        return NextResponse.json({ error: 'Invalid Stripe signature' }, { status: 400 });
      }

      const event = JSON.parse(rawBody);
      if (event.type === 'checkout.session.completed') {
        const orderId = event.data?.object?.metadata?.orderId || event.data?.object?.id;
        await fulfillPayment(orderId, event.id);
      }
    } else if (provider === 'razorpay') {
      const sig = req.headers.get('x-razorpay-signature') || '';
      const secret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
      const isValid = verifyRazorpaySignature(rawBody, sig, secret);
      if (!isValid && !secret.startsWith('mock')) {
        return NextResponse.json({ error: 'Invalid Razorpay signature' }, { status: 400 });
      }

      const event = JSON.parse(rawBody);
      const orderId = event.payload?.payment?.entity?.order_id;
      await fulfillPayment(orderId, event.event_id || `rzp_${Date.now()}`);
    } else {
      // Sandbox mode verification
      const body = JSON.parse(rawBody);
      const { orderId } = body;
      if (!orderId) {
        return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
      }
      await fulfillPayment(orderId, `sandbox_${orderId}`);
    }

    return NextResponse.json({ success: true, received: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
