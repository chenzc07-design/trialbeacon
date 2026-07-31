import { NextResponse } from 'next/server';
import {
  subscriptionStore,
  EMAIL_PATTERN,
  MAX_CANCERS,
} from '@/lib/subscriptions';
import { CANCERS } from '@/lib/cancers';
import type { Region } from '@/lib/types';

const VALID_SLUGS = new Set(CANCERS.map((c) => c.slug));
const VALID_REGIONS = new Set(['US', 'EU', 'CN']);

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { email, cancers, regions } = (body ?? {}) as {
    email?: string;
    cancers?: string[];
    regions?: string[];
  };

  if (!email || !EMAIL_PATTERN.test(email)) {
    return NextResponse.json(
      { error: 'Please enter a valid email address.' },
      { status: 400 }
    );
  }

  const cancerList = Array.isArray(cancers)
    ? cancers.filter((c) => VALID_SLUGS.has(c))
    : [];
  if (cancerList.length === 0) {
    return NextResponse.json(
      { error: 'Please choose at least one cancer type.' },
      { status: 400 }
    );
  }
  if (cancerList.length > MAX_CANCERS) {
    return NextResponse.json(
      { error: `You can follow up to ${MAX_CANCERS} cancer types.` },
      { status: 400 }
    );
  }

  const regionList = (
    Array.isArray(regions)
      ? regions.filter((r) => VALID_REGIONS.has(r))
      : []
  ) as Region[];

  const sub = await subscriptionStore.upsert({
    email,
    cancers: cancerList,
    regions: regionList.length ? regionList : ['US', 'EU', 'CN'],
  });

  // Email delivery integration point:
  // when an email provider is configured, send the double opt-in
  // confirmation here (see lib/email.ts for the weekly digest template).
  return NextResponse.json({
    ok: true,
    subscription: { cancers: sub.cancers, regions: sub.regions },
  });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email') ?? '';
  if (!EMAIL_PATTERN.test(email)) {
    return NextResponse.json(
      { error: 'Please provide a valid email address.' },
      { status: 400 }
    );
  }
  const removed = await subscriptionStore.remove(email);
  return NextResponse.json({ ok: true, removed });
}
