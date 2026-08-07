import type { UpdateItem } from './types';
import { SOURCES } from './sources';
import type { Messages } from './messages/en';
import type { Locale } from './i18n-runtime';
import { t } from './i18n-runtime';

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function itemMeta(item: UpdateItem): string {
  const src = SOURCES[item.source]?.label ?? item.source;
  const date = item.date ?? 'ongoing';
  return `${src} · ${item.region} · ${date}`;
}

function itemText(item: UpdateItem): string[] {
  const date = item.date ?? 'ongoing';
  const src = SOURCES[item.source]?.label ?? item.source;
  return [
    `- [${src} · ${item.region} · ${date}]`,
    `  ${item.title}`,
    `  ${item.url}`,
    '',
  ];
}

function itemHtml(item: UpdateItem): string {
  return `
    <tr>
      <td style="padding:14px 0;border-top:1px solid #eef1f5;">
        <a href="${esc(item.url)}" style="color:#1f3a5f;font-weight:600;font-size:15px;line-height:1.4;text-decoration:none;">${esc(item.title)}</a>
        <div style="margin-top:4px;color:#6b7280;font-size:12.5px;">${esc(itemMeta(item))}</div>
      </td>
    </tr>`;
}

/**
 * Weekly digest template.
 *
 * Neutral by design: it only organises public official records the person
 * follows — saved records that changed, plus new/updated public records for
 * followed cancer types. No recommendations, no ranking, no interpretation.
 * Rendered in the recipient's language with both a plain-text and an HTML
 * body. When no changes exist, the caller may skip sending entirely.
 */
export function renderWeeklyDigest(opts: {
  m: Messages;
  locale: Locale;
  cancerLabels: string[];
  recordItems: UpdateItem[];
  cancerItems: UpdateItem[];
  followingUrl: string;
  generateUrl: string;
  unsubscribeUrl: string;
  siteUrl: string;
}): { subject: string; text: string; html: string } {
  const { m, locale, cancerLabels, recordItems, cancerItems, followingUrl, generateUrl, unsubscribeUrl, siteUrl } =
    opts;

  const hasContent = recordItems.length > 0 || cancerItems.length > 0;
  const topics = cancerLabels.length ? cancerLabels.join(', ') : '—';

  // ---- plain text ----
  const text: string[] = [];
  text.push(m.digest.subjectPrefix);
  text.push(`Topics you follow: ${topics}`);
  text.push('');
  text.push(m.digest.intro);
  text.push('');
  if (!hasContent) {
    text.push(m.digest.noChanges);
  } else {
    if (recordItems.length) {
      text.push(m.digest.recordUpdates);
      text.push(m.digest.recordUpdatesHint);
      for (const item of recordItems) text.push(...itemText(item));
    }
    if (cancerItems.length) {
      text.push(m.digest.cancerActivity);
      text.push(m.digest.cancerActivityHint);
      for (const item of cancerItems) text.push(...itemText(item));
    }
  }
  text.push('---');
  text.push(m.digest.footerNote);
  text.push('');
  text.push(`${m.digest.openFollow}: ${followingUrl}`);
  text.push(`${m.digest.generateList}: ${generateUrl}`);
  text.push(`${m.digest.unsubscribe}: ${unsubscribeUrl}`);
  const textBody = text.join('\n');

  // ---- html ----
  const viewedOn = new Date().toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const recordSection = hasContent && recordItems.length
    ? `
    <div style="margin-top:22px;">
      <h2 style="margin:0 0 4px;font-size:15px;color:#0f1b2d;">${esc(m.digest.recordUpdates)}</h2>
      <p style="margin:0 0 6px;font-size:13px;color:#6b7280;">${esc(m.digest.recordUpdatesHint)}</p>
      <table role="presentation" style="width:100%;border-collapse:collapse;">${recordItems
        .map(itemHtml)
        .join('')}</table>
    </div>`
    : '';

  const cancerSection = hasContent && cancerItems.length
    ? `
    <div style="margin-top:22px;">
      <h2 style="margin:0 0 4px;font-size:15px;color:#0f1b2d;">${esc(m.digest.cancerActivity)}</h2>
      <p style="margin:0 0 6px;font-size:13px;color:#6b7280;">${esc(m.digest.cancerActivityHint)}</p>
      <table role="presentation" style="width:100%;border-collapse:collapse;">${cancerItems
        .map(itemHtml)
        .join('')}</table>
    </div>`
    : '';

  const emptySection = !hasContent
    ? `<p style="margin:18px 0 0;font-size:14px;color:#374151;">${esc(m.digest.noChanges)}</p>`
    : '';

  const html = `<!doctype html>
<html lang="${esc(locale)}">
  <body style="margin:0;background:#f5f7fa;font-family:system-ui,-apple-system,'Segoe UI',Roboto,'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;">
    <div style="max-width:600px;margin:0 auto;padding:24px 16px;">
      <div style="background:#ffffff;border:1px solid #e6eaf0;border-radius:14px;padding:24px;">
        <p style="margin:0;font-size:12px;letter-spacing:0.04em;text-transform:uppercase;color:#9aa3af;">TrialBeacon</p>
        <h1 style="margin:6px 0 0;font-size:20px;color:#0f1b2d;">${esc(m.digest.subjectPrefix)}</h1>
        <p style="margin:4px 0 0;font-size:13px;color:#6b7280;">${esc(t(m, 'digest.topics', { topics }))}</p>

        <p style="margin:18px 0 0;font-size:14px;line-height:1.6;color:#374151;">${esc(m.digest.intro)}</p>

        ${recordSection}
        ${cancerSection}
        ${emptySection}

        <div style="margin-top:26px;display:flex;gap:10px;flex-wrap:wrap;">
          <a href="${esc(followingUrl)}" style="display:inline-block;background:#1f3a5f;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:10px 18px;border-radius:10px;">${esc(m.digest.openFollow)}</a>
          <a href="${esc(generateUrl)}" style="display:inline-block;background:#ffffff;color:#1f3a5f;border:1px solid #cdd6e2;text-decoration:none;font-size:14px;font-weight:600;padding:10px 18px;border-radius:10px;">${esc(m.digest.generateList)}</a>
        </div>

        <p style="margin:24px 0 0;padding-top:16px;border-top:1px solid #eef1f5;font-size:12px;line-height:1.6;color:#8a93a0;">${esc(m.digest.footerNote)}</p>
        <p style="margin:8px 0 0;font-size:12px;color:#8a93a0;">${esc(t(m, 'digest.viewedOn', { date: viewedOn }))} · <a href="${esc(unsubscribeUrl)}" style="color:#8a93a0;">${esc(m.digest.unsubscribe)}</a></p>
      </div>
      <p style="margin:10px 0 0;text-align:center;font-size:11px;color:#aab1bb;"><a href="${esc(siteUrl)}" style="color:#aab1bb;">TrialBeacon</a></p>
    </div>
  </body>
</html>`;

  const subject = cancerLabels.length
    ? `${m.digest.subjectPrefix} — ${cancerLabels.join(', ')}`
    : m.digest.subjectPrefix;

  return { subject, text: textBody, html };
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
