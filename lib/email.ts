import type { UpdateItem } from './types';
import { SOURCES } from './sources';

/**
 * Weekly digest template (plain text).
 *
 * Kept deliberately minimal: a short list of links, nothing else. When an
 * email provider (Resend, Postmark, SES…) is configured, feed this string to
 * the provider inside a scheduled job (e.g. a cron route or worker).
 */
export function renderWeeklyDigest(opts: {
  cancerLabels: string[];
  items: UpdateItem[];
  unsubscribeUrl: string;
  siteUrl: string;
}): { subject: string; text: string } {
  const { cancerLabels, items, unsubscribeUrl, siteUrl } = opts;

  const lines: string[] = [];
  lines.push('TrialBeacon — weekly update');
  lines.push(`Topics you follow: ${cancerLabels.join(', ')}`);
  lines.push('');

  if (items.length === 0) {
    lines.push('No new official records were indexed for your topics this week.');
  } else {
    for (const item of items) {
      const src = SOURCES[item.source];
      const date = item.date ?? 'ongoing';
      lines.push(`- [${src.label} · ${item.region} · ${date}]`);
      lines.push(`  ${item.title}`);
      lines.push(`  ${item.url}`);
      lines.push('');
    }
  }

  lines.push('---');
  lines.push(
    'TrialBeacon does not provide medical advice and does not recommend, rank'
  );
  lines.push(
    'or evaluate any treatment or trial. Please discuss any information in'
  );
  lines.push(
    'this email with your doctor, and always rely on the original official page.'
  );
  lines.push('');
  lines.push(`Browse all updates: ${siteUrl}`);
  lines.push(`Unsubscribe: ${unsubscribeUrl}`);

  return {
    subject: `TrialBeacon weekly update — ${cancerLabels.join(', ')}`,
    text: lines.join('\n'),
  };
}
