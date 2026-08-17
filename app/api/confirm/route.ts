import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/subscriptions';

export const dynamic = 'force-dynamic';

type Locale = 'en' | 'zh' | 'de' | 'fr' | 'ja' | 'ko';

const copy: Record<Locale, {
  confirmedTitle: string;
  confirmedHeading: string;
  confirmedBody: string;
  invalidTitle: string;
  invalidHeading: string;
  invalidBody: string;
  back: string;
}> = {
  en: {
    confirmedTitle: 'Confirmed · TrialBeacon',
    confirmedHeading: 'You are confirmed',
    confirmedBody: 'TrialBeacon will send one plain weekly email with links to newly indexed official records. You can unsubscribe from any email.',
    invalidTitle: 'Link invalid · TrialBeacon',
    invalidHeading: "This link didn't work",
    invalidBody: 'The confirmation link is invalid or has expired. Try subscribing again.',
    back: 'Back to TrialBeacon →',
  },
  zh: {
    confirmedTitle: '订阅已确认 · TrialBeacon',
    confirmedHeading: '订阅已确认',
    confirmedBody: 'TrialBeacon 每周会发送一封简洁邮件，提供新收录官方记录的链接。你可以随时通过邮件取消订阅。',
    invalidTitle: '链接无效 · TrialBeacon',
    invalidHeading: '链接无法使用',
    invalidBody: '确认链接无效或已过期，请重新订阅。',
    back: '返回 TrialBeacon →',
  },
  de: {
    confirmedTitle: 'Bestätigt · TrialBeacon',
    confirmedHeading: 'Bestätigt',
    confirmedBody: 'TrialBeacon sendet wöchentlich eine schlichte E-Mail mit Links zu neu erfassten offiziellen Datensätzen. Sie können sich jederzeit abmelden.',
    invalidTitle: 'Ungültiger Link · TrialBeacon',
    invalidHeading: 'Dieser Link funktioniert nicht',
    invalidBody: 'Der Bestätigungslink ist ungültig oder abgelaufen. Bitte abonnieren Sie erneut.',
    back: 'Zurück zu TrialBeacon →',
  },
  fr: {
    confirmedTitle: 'Confirmation · TrialBeacon',
    confirmedHeading: 'Abonnement confirmé',
    confirmedBody: 'TrialBeacon enverra chaque semaine un e-mail simple avec des liens vers les nouvelles notices officielles indexées. Vous pouvez vous désabonner à tout moment.',
    invalidTitle: 'Lien invalide · TrialBeacon',
    invalidHeading: "Ce lien n'a pas fonctionné",
    invalidBody: "Le lien de confirmation est invalide ou a expiré. Veuillez vous réabonner.",
    back: 'Retour à TrialBeacon →',
  },
  ja: {
    confirmedTitle: '確認完了 · TrialBeacon',
    confirmedHeading: '購読が確認されました',
    confirmedBody: 'TrialBeacon から、公式記録の新着リンクをまとめた簡潔なメールを週 1 回お送りします。メールからいつでも配信停止できます。',
    invalidTitle: '無効なリンク · TrialBeacon',
    invalidHeading: 'このリンクは利用できません',
    invalidBody: '確認リンクが無効か、有効期限が切れています。もう一度購読してください。',
    back: 'TrialBeacon に戻る →',
  },
  ko: {
    confirmedTitle: '확인 완료 · TrialBeacon',
    confirmedHeading: '구독이 확인되었습니다',
    confirmedBody: 'TrialBeacon은 새로 색인된 공식 기록 링크를 담은 간단한 주간 이메일을 한 통씩 보냅니다. 이메일에서 언제든 구독을 취소할 수 있습니다.',
    invalidTitle: '잘못된 링크 · TrialBeacon',
    invalidHeading: '이 링크를 사용할 수 없습니다',
    invalidBody: '확인 링크가 잘못되었거나 만료되었습니다. 다시 구독해 주세요.',
    back: 'TrialBeacon으로 돌아가기 →',
  },
};

function getLocale(req: NextRequest): Locale {
  const header = req.headers.get('accept-language')?.toLowerCase() ?? '';
  if (header.includes('zh')) return 'zh';
  if (header.includes('de')) return 'de';
  if (header.includes('fr')) return 'fr';
  if (header.includes('ja')) return 'ja';
  if (header.includes('ko')) return 'ko';
  return 'en';
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char] ?? char);
}

/**
 * Double opt-in confirmation. A subscriber clicks the link in their
 * confirmation email; this flips `confirmed` to true so the weekly digest
 * job will include them. Renders a tiny page (not a redirect) so it works
 * from any email client without extra routing.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  const confirmed = token ? await store.confirm(token) : null;
  const locale = getLocale(req);
  const text = copy[locale];
  const title = confirmed ? text.confirmedTitle : text.invalidTitle;
  const heading = confirmed ? text.confirmedHeading : text.invalidHeading;
  const body = confirmed ? text.confirmedBody : text.invalidBody;

  const html = `<!doctype html><html lang="${locale}"><head><meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>body{font-family:system-ui,sans-serif;background:#f7f9fb;color:#0f172a;display:grid;place-items:center;min-height:100vh;margin:0}main{background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:40px 48px;text-align:center;max-width:420px}h1{font-size:20px;margin:0 0 8px}a{color:#1e3350;font-weight:600}</style>
</head><body><main>
<h1>${escapeHtml(heading)}</h1>
<p style="color:#475569;line-height:1.6;margin:0 0 20px">${escapeHtml(body)}</p>
<a href="/alerts">${escapeHtml(text.back)}</a>
</main></body></html>`;

  return new NextResponse(html, {
    status: confirmed ? 200 : 400,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}
