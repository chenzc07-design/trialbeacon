import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { sendEmail, isEmailConfigured } from '@/lib/mailer';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * Designated test mailbox. When the signed-in person has no verified address
 * on their session, the test email falls back to this address so the button
 * still produces a real, deliverable message.
 */
const DESIGNATED_TEST_EMAIL = '2064749343@qq.com';

/**
 * "Send a test email" endpoint for the update-reminder (alerts) page.
 *
 * Unlike /api/digest/test (Pro-only, builds a real digest from the person's
 * followed records), this sends a small, self-contained plain-text test message
 * to any signed-in visitor — no Pro plan, no followed records required. It
 * really calls the configured mail provider. The recipient is the signed-in
 * person's own address, or the designated test mailbox when that is empty.
 */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (!isEmailConfigured()) {
    return NextResponse.json(
      { error: 'email_not_configured', configured: false },
      { status: 503 }
    );
  }

  const recipient = (user.email && user.email.trim()) || DESIGNATED_TEST_EMAIL;
  const siteUrl = process.env.SITE_URL ?? 'https://trialbeacon.cn';
  const unsubscribeUrl = `${siteUrl}/unsubscribe`;

  const subject = 'TrialBeacon 测试邮件 · Weekly update test';
  const text = buildTestText({ siteUrl, unsubscribeUrl });

  const delivered = await sendEmail({ to: recipient, subject, text });
  if (!delivered) {
    return NextResponse.json(
      { error: 'send_failed', delivered: false, to: recipient },
      { status: 502 }
    );
  }

  return NextResponse.json({
    ok: true,
    delivered: true,
    configured: true,
    to: recipient,
  });
}

function buildTestText(opts: { siteUrl: string; unsubscribeUrl: string }): string {
  const { unsubscribeUrl } = opts;
  return [
    'TrialBeacon 周更新 · 测试邮件',
    'TrialBeacon weekly update — test email',
    '',
    '这封邮件用于确认你能正常收到 TrialBeacon 的更新提醒。点击「发送测试邮件」后，系统会立即向你发出此测试周摘要。',
    'This message confirms you can receive TrialBeacon update alerts. It is sent the moment you click "Send a test email".',
    '',
    '以下为示例公开记录（仅作格式演示，并非真实更新）：',
    'Sample public records (format demo only — not real updates):',
    '',
    '1. Osimertinib With or Without Bevacizumab in EGFR-Mutant NSCLC',
    '   https://clinicaltrials.gov/study/NCT02227271',
    '',
    '2. Pembrolizumab Plus Chemotherapy for Advanced Non-Small Cell Lung Cancer',
    '   https://clinicaltrials.gov/study/NCT03600883',
    '',
    '每周我们会向你发送你关注的癌种与记录的公开更新摘要。本邮件不含任何推荐或解读，只列出官方记录链接。',
    'Each week we send a plain summary of newly indexed official records for the topics you follow. No recommendations, no interpretation — links only.',
    '',
    `退订 / Unsubscribe：如果你不想再收到此类邮件，可随时点击退订：${unsubscribeUrl}`,
    'If you no longer wish to receive these emails, unsubscribe anytime: ' + unsubscribeUrl,
    '',
    'TrialBeacon 团队 / The TrialBeacon team',
  ].join('\n');
}
