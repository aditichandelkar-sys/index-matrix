import crypto from 'crypto';
import { prisma } from './db';
import { addCredits } from './credit-ledger';

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  priceCents: number; // in USD cents
  popular?: boolean;
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  { id: 'pkg_starter', name: 'Starter Tier', credits: 1000, priceCents: 2900 },
  { id: 'pkg_pro', name: 'Growth / Agency', credits: 3500, priceCents: 7900, popular: true },
  { id: 'pkg_scale', name: 'Scale Master', credits: 10000, priceCents: 19900 },
  { id: 'pkg_enterprise', name: 'Enterprise Power', credits: 25000, priceCents: 39900 },
];

export interface CreateCheckoutResult {
  checkoutUrl?: string;
  orderId: string;
  provider: 'stripe' | 'razorpay' | 'sandbox';
  amountCents: number;
  currency: string;
  keyId?: string;
}

/**
 * Creates a payment session/order for credit purchase
 */
export async function createCheckoutSession(
  userId: string,
  packageId: string
): Promise<CreateCheckoutResult> {
  const pkg = CREDIT_PACKAGES.find((p) => p.id === packageId);
  if (!pkg) {
    throw new Error('Invalid package selected');
  }

  const provider = (process.env.PAYMENT_PROVIDER || 'sandbox').toLowerCase() as 'stripe' | 'razorpay' | 'sandbox';
  const orderId = `order_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

  // Create pending payment record
  await prisma.payment.create({
    data: {
      userId,
      provider,
      providerTxId: orderId,
      amountCents: pkg.priceCents,
      currency: 'usd',
      creditsGranted: pkg.credits,
      status: 'PENDING',
      metadata: JSON.stringify({ packageId: pkg.id, packageName: pkg.name }),
    },
  });

  if (provider === 'sandbox') {
    // Sandbox instant verification link
    return {
      checkoutUrl: `/dashboard/payments?sandbox_verify=${orderId}`,
      orderId,
      provider: 'sandbox',
      amountCents: pkg.priceCents,
      currency: 'usd',
    };
  }

  if (provider === 'stripe') {
    // Return checkout configuration for Stripe
    return {
      orderId,
      provider: 'stripe',
      amountCents: pkg.priceCents,
      currency: 'usd',
      keyId: process.env.STRIPE_PUBLISHABLE_KEY,
    };
  }

  // Razorpay
  return {
    orderId,
    provider: 'razorpay',
    amountCents: pkg.priceCents,
    currency: 'usd',
    keyId: process.env.RAZORPAY_KEY_ID,
  };
}

/**
 * Verifies Stripe Webhook Signature
 */
export function verifyStripeSignature(payload: string, signatureHeader: string, secret: string): boolean {
  if (!secret || !signatureHeader) return false;
  try {
    const parts = signatureHeader.split(',');
    let timestamp = '';
    const signatures: string[] = [];

    for (const part of parts) {
      const [k, v] = part.split('=');
      if (k === 't') timestamp = v;
      if (k === 'v1') signatures.push(v);
    }

    if (!timestamp || signatures.length === 0) return false;

    const signedPayload = `${timestamp}.${payload}`;
    const expected = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');

    return signatures.some((sig) => crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected)));
  } catch {
    return false;
  }
}

/**
 * Verifies Razorpay Webhook Signature
 */
export function verifyRazorpaySignature(payload: string, signature: string, secret: string): boolean {
  if (!secret || !signature) return false;
  try {
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

/**
 * Fulfills a verified payment and grants credits idempotently
 */
export async function fulfillPayment(orderId: string, externalEventId?: string): Promise<{ success: boolean; error?: string }> {
  // Check if webhook event was already processed
  if (externalEventId) {
    const existingEvent = await prisma.webhookEvent.findUnique({
      where: { eventId: externalEventId },
    });
    if (existingEvent && existingEvent.processed) {
      return { success: true }; // Already fulfilled idempotently
    }
  }

  const payment = await prisma.payment.findUnique({
    where: { providerTxId: orderId },
  });

  if (!payment) {
    return { success: false, error: 'Payment record not found' };
  }

  if (payment.status === 'SUCCESS') {
    return { success: true }; // Already credited
  }

  // Update payment status
  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: 'SUCCESS' },
  });

  // Credit user wallet idempotently
  const creditResult = await addCredits({
    userId: payment.userId,
    amount: payment.creditsGranted,
    type: 'PURCHASE',
    idempotencyKey: `payment_credit_${payment.id}`,
    reason: `Purchased package (${payment.creditsGranted} credits)`,
    referenceId: payment.id,
  });

  // Log webhook event
  if (externalEventId) {
    await prisma.webhookEvent.upsert({
      where: { eventId: externalEventId },
      update: { processed: true },
      create: {
        eventId: externalEventId,
        provider: payment.provider,
        eventType: 'payment.success',
        payload: JSON.stringify({ orderId, credits: payment.creditsGranted }),
        processed: true,
      },
    });
  }

  return { success: creditResult.success };
}
