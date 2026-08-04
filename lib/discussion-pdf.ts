// Client-side, real PDF generation for the neutral "doctor discussion list".
//
// This produces an actual downloadable .pdf file (not a print dialog) so the
// visitor gets the file directly. The list content is rendered into an
// off-screen DOM node using the same neutral markup as the printable page,
// captured with html2canvas, then laid out into an A4 jsPDF document with the
// disclaimer pinned to the bottom of EVERY page.
//
// Chinese / non-Latin text is rasterised by the browser (no font embedding
// needed), so it renders exactly as on screen. The module never ranks,
// recommends, scores, interprets, or adds any analysis — only the source
// fields are reproduced.

import type { UpdateItem } from './types';
import {
  buildDiscussionItem,
  type DiscussionItem,
  discussionFilename,
  regionShort,
  FREE_EXPORT_LIMIT,
  SIGNED_IN_EXPORT_LIMIT,
} from './discussion-list';
import { t } from './i18n-runtime';
import type { Locale } from './i18n-runtime';
import type { Messages } from './messages/en';

export interface DiscussionPdfInput {
  items: UpdateItem[];
  signedIn: boolean;
  locale: Locale;
  messages: Messages;
}

export interface DiscussionPdfResult {
  limit: number;
  truncated: boolean;
  count: number;
}

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[c] as string
  );
}

function fmtDate(iso: string, locale: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/** Only the source-provided fields, joined — no interpretation. */
function statusLine(it: DiscussionItem, locale: string): string {
  const parts = [
    it.phase,
    it.status,
    it.date ? fmtDate(it.date, locale) : null,
  ].filter(Boolean);
  return parts.join(' · ');
}

/** Build the off-screen HTML for capture. Reuses the .dl-* classes. */
function renderListHtml(
  data: DiscussionItem[],
  locale: Locale,
  m: Messages
): string {
  const today = new Date().toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const items = data
    .map((it, i) => {
      const status = statusLine(it, locale) || '—';
      return `
      <li class="dl-item">
        <div class="dl-item-head">
          <span class="dl-num">${i + 1}</span>
          <span class="dl-item-title">${escapeHtml(it.title)}</span>
        </div>
        <dl class="dl-meta">
          <div class="dl-meta-row">
            <dt>${m.discussionList.fieldSource}</dt>
            <dd>${escapeHtml(it.source)}</dd>
          </div>
          <div class="dl-meta-row">
            <dt>${m.discussionList.fieldRegion}</dt>
            <dd>${regionShort(it.region)}</dd>
          </div>
          <div class="dl-meta-row">
            <dt>${m.discussionList.fieldStatus}</dt>
            <dd>${escapeHtml(status)}</dd>
          </div>
          <div class="dl-meta-row">
            <dt>${m.discussionList.fieldLink}</dt>
            <dd>
              <span class="dl-link">${escapeHtml(it.url)}</span>
              <span class="dl-linkprompt">（${m.discussionList.linkPrompt}）</span>
            </dd>
          </div>
        </dl>
      </li>`;
    })
    .join('');

  const prompt = `
    <section style="margin-top:22px;border-top:1px solid #e2e8f0;padding-top:14px;">
      <h2 style="margin:0 0 4px;font-size:12pt;font-weight:600;color:#0f172a;">${escapeHtml(
        m.discussionList.promptHeading
      )}</h2>
      <p style="margin:0 0 8px;font-size:9.5pt;color:#64748b;">${escapeHtml(
        m.discussionList.promptIntro
      )}</p>
      <ol style="margin:0;padding-left:18px;font-size:10pt;line-height:1.6;color:#0f1b2d;">
        ${m.discussionList.promptLines
          .map((l) => `<li style="margin-bottom:6px;">${escapeHtml(l)}</li>`)
          .join('')}
      </ol>
    </section>`;

  return `
    <div class="dl-header" style="margin-bottom:10px;">
      <p class="dl-header-brand">${escapeHtml(m.discussionList.header)}</p>
      <p class="dl-header-meta">${t(m, 'discussionList.generatedOn', {
        date: today,
      })} · ${t(m, 'discussionList.recordCount', { n: data.length })}</p>
    </div>
    <h1 class="dl-title">${escapeHtml(m.discussionList.title)}</h1>
    <p class="dl-subtitle">${escapeHtml(m.discussionList.subtitle)}</p>
    <ol class="dl-items">${items}</ol>
    ${prompt}
  `;
}

/**
 * Generate a real, downloadable PDF of the discussion list and trigger the
 * browser's "save file" flow. Caps records by auth state. Throws if the
 * capture/pdf libraries fail, so the caller can fall back to the printable
 * page.
 */
export async function downloadDiscussionListPdf(
  input: DiscussionPdfInput
): Promise<DiscussionPdfResult> {
  const limit = input.signedIn ? SIGNED_IN_EXPORT_LIMIT : FREE_EXPORT_LIMIT;
  const truncated = input.items.length > limit;
  const capped = truncated ? input.items.slice(0, limit) : input.items;
  const data = capped.map(buildDiscussionItem);

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return { limit, truncated, count: data.length };
  }

  const [{ jsPDF }, html2canvasMod] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
  ]);
  const html2canvas = html2canvasMod.default;

  // Off-screen render container (rendered, not display:none, so html2canvas
  // can read it). Width mirrors an A4 sheet at ~96dpi.
  const host = document.createElement('div');
  host.style.position = 'fixed';
  host.style.left = '-10000px';
  host.style.top = '0';
  host.style.width = '794px';
  host.style.background = '#ffffff';
  host.style.color = '#0f1b2d';
  host.style.fontFamily =
    'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif';
  host.innerHTML = `
    <div id="pdf-content" style="padding:40px 44px 28px;">
      ${renderListHtml(data, input.locale, input.messages)}
    </div>
    <div id="pdf-footer" class="dl-footer" style="padding:10px 44px 14px;margin:0;">${escapeHtml(
      input.messages.discussionList.footerDisclaimer
    )}</div>
  `;
  document.body.appendChild(host);

  try {
    const contentEl = host.querySelector<HTMLElement>('#pdf-content');
    const footerEl = host.querySelector<HTMLElement>('#pdf-footer');
    if (!contentEl || !footerEl) {
      throw new Error('PDF render nodes missing');
    }

    const contentCanvas = await html2canvas(contentEl, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
    });
    const footerCanvas = await html2canvas(footerEl, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
    });

    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 36;
    const contentW = pageW - margin * 2;

    // Footer is pinned to the bottom of every page.
    const footerH = (footerCanvas.height / footerCanvas.width) * contentW;
    const top = margin;
    const bottom = pageH - margin - footerH - 8;
    const availH = bottom - top;

    // Content is one tall image; scale it to the page width.
    const pxPerPt = contentCanvas.width / contentW;
    const scaledH = contentCanvas.height / pxPerPt;

    let pos = 0;
    let first = true;
    while (pos < scaledH - 0.5) {
      const sliceH = Math.min(availH, scaledH - pos);
      const srcY = pos * pxPerPt;
      const srcH = sliceH * pxPerPt;

      // Crop this page's slice out of the full content canvas.
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = contentCanvas.width;
      pageCanvas.height = Math.max(1, Math.ceil(srcH));
      const ctx = pageCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        ctx.drawImage(
          contentCanvas,
          0,
          srcY,
          contentCanvas.width,
          srcH,
          0,
          0,
          contentCanvas.width,
          srcH
        );
      }
      const pageImg = pageCanvas.toDataURL('image/jpeg', 0.95);

      if (!first) pdf.addPage();
      pdf.addImage(pageImg, 'JPEG', margin, top, contentW, sliceH);
      pdf.addImage(
        footerCanvas.toDataURL('image/jpeg', 0.95),
        'JPEG',
        margin,
        pageH - margin - footerH,
        contentW,
        footerH
      );

      pos += sliceH;
      first = false;
    }

    pdf.save(discussionFilename(input.locale));
    return { limit, truncated, count: data.length };
  } finally {
    document.body.removeChild(host);
  }
}
