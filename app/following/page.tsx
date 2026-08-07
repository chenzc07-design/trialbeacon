import type { Metadata } from 'next';
import { getServerMessages } from '@/lib/i18n-server';
import { FollowingClient } from '@/components/FollowingClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const { messages: m } = await getServerMessages();
  return { title: m.following.title, description: m.following.intro };
}

export default function FollowingPage() {
  return <FollowingClient />;
}
