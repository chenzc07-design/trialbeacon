import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const u = await getCurrentUser();
  if (!u) return NextResponse.json({ user: null });
  return NextResponse.json({
    user: {
      id: u.id,
      email: u.email,
      provider: u.provider,
      myList: u.myList,
      alertCancers: u.alertCancers,
      alertRegions: u.alertRegions,
      alertEnabled: u.alertEnabled,
      plan: u.plan,
      proUntil: u.proUntil,
      paypalSubscriptionId: u.paypalSubscriptionId,
    },
  });
}
