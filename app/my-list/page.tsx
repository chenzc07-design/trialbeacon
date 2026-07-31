import type { Metadata } from 'next';
import { MyListClient } from '@/components/MyListClient';
import { getServerMessages } from '@/lib/i18n-server';

export async function generateMetadata(): Promise<Metadata> {
  const { messages: m } = await getServerMessages();
  return { title: m.myList.title, description: m.myList.intro };
}

export default function MyListPage() {
  return <MyListClient />;
}
