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

/**
 * Double opt-in confirmation email.
 *
 * Sent once, immediately after a subscription is created. Contains one link
 * that flips the subscriber to `confirmed: true`. Nothing else is asked for.
 */
export function renderConfirmEmail(opts: {
  confirmUrl: string;
  siteUrl: string;
}): { subject: string; text: string } {
  const { confirmUrl, siteUrl } = opts;
  const lines: string[] = [];
  lines.push('Confirm your TrialBeacon weekly alerts');
  lines.push('');
  lines.push(
    'You (or someone using this address) asked to receive a weekly email'
  );
  lines.push('listing newly indexed official cancer-trial records.');
  lines.push('');
  lines.push(`Confirm here: ${confirmUrl}`);
  lines.push('');
  lines.push(
    'If you did not request this, ignore this email — nothing will be sent'
  );
  lines.push('and your address will not be kept.');
  lines.push('');
  lines.push(
    'TrialBeacon does not provide medical advice and does not recommend, rank'
  );
  lines.push('or evaluate any treatment or trial. Always rely on the original page.');
  lines.push('');
  lines.push(`TrialBeacon: ${siteUrl}`);

  return {
    subject: 'Confirm your TrialBeacon weekly alerts',
    text: lines.join('\n'),
  };
}
