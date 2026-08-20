import type { Metadata } from 'next';
import { getServerMessages } from '@/lib/i18n-server';
import { AccountClient } from '@/components/AccountClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const { messages: m } = await getServerMessages();
  return {
    title: m.account.title,
    description: m.account.listHint,
    robots: { index: false, follow: false },
  };
}

export default function AccountPage() {
  return <AccountClient />;
}
