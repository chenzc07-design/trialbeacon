import type { Metadata } from 'next';
import { getServerMessages } from '@/lib/i18n-server';
import { proSeo } from '@/lib/public-copy';

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getServerMessages();
  return proSeo(locale);
}

export default function ProLayout({ children }: { children: React.ReactNode }) {
  return children;
}
