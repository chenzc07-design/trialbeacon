import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const form = await request.formData();
  const suppliedToken = String(form.get('token') || '').trim();
  const expectedTokens = [process.env.STATS_TOKEN, process.env.OWNER_TOKEN].filter(
    (value): value is string => Boolean(value),
  );
  const valid = Boolean(suppliedToken && expectedTokens.includes(suppliedToken));
  const destination = new URL('/admin/monitor', request.url);

  if (!valid) {
    destination.searchParams.set('error', 'invalid');
    return NextResponse.redirect(destination, 303);
  }

  const response = NextResponse.redirect(destination, 303);
  response.cookies.set('tb_admin_monitor', 'authenticated', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/admin/monitor',
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set('tb_admin_monitor', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/admin/monitor',
    maxAge: 0,
  });
  return response;
}
