import { NextResponse } from 'next/server';
import { paypalPlanId } from '@/lib/paypal';

export const dynamic = 'force-dynamic';

export async function GET() {
  const planId = paypalPlanId() || null;
  return NextResponse.json({ planId });
}
