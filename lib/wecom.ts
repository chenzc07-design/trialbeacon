/**
 * 企业微信群机器人（Webhook）推送。
 *
 * 企业微信的「群机器人」提供一个 webhook 地址，POST 一条 JSON 即可把消息发到
 * 群里。这里只发 markdown 文本，用于把 /api/changes 的官方记录变更摘要推给群。
 *
 * 配置：在环境变量里设置 WECOM_WEBHOOK_URL（群机器人地址）。未设置时所有发送
 * 静默跳过（dry-run），不影响网站其它功能。
 *
 * 合规：只转发官方记录的原文链接与中性摘要，不做任何推荐/解读。
 */

export interface WecomResult {
  ok: boolean;
  reason?: string;
}

const WECOM_LIMIT = 3800; // 企业微信 markdown 内容上限约 4096 字节，留余量

export function isWecomConfigured(): boolean {
  return Boolean(process.env.WECOM_WEBHOOK_URL);
}

/**
 * 发送一条 markdown 消息到企业微信群。
 * content 会被截断到安全长度。返回是否成功（未配置也返回 ok:false）。
 */
export async function sendWecomMarkdown(content: string): Promise<WecomResult> {
  const url = process.env.WECOM_WEBHOOK_URL;
  if (!url) return { ok: false, reason: 'WECOM_WEBHOOK_URL not set' };

  const safe = content.length > WECOM_LIMIT ? content.slice(0, WECOM_LIMIT) + '…' : content;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ msgtype: 'markdown', markdown: { content: safe } }),
      signal: AbortSignal.timeout(8000),
    });
    const json = (await res.json()) as { errcode?: number };
    return { ok: res.ok && json.errcode === 0 };
  } catch (e) {
    return { ok: false, reason: String(e) };
  }
}

/** 把若干条记录格式化成企业微信 markdown 摘要。 */
export function renderWecomDigest(opts: {
  heading: string;
  items: { title: string; url: string; region?: string; date?: string | null }[];
  unsubscribeNote?: string;
}): string {
  const lines: string[] = [`> **${opts.heading}**`];
  for (const it of opts.items.slice(0, 20)) {
    const meta = [it.region, it.date].filter(Boolean).join(' · ');
    lines.push(`- [${meta}] [${it.title}](${it.url})`);
  }
  if (opts.items.length === 0) lines.push('- 本期无新增官方记录');
  if (opts.unsubscribeNote) lines.push(`\n${opts.unsubscribeNote}`);
  return lines.join('\n');
}
