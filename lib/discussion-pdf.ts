// Client-side, real PDF generation for the neutral "doctor discussion list".
//
// This produces an actual downloadable .pdf file (not a print dialog) so the
// visitor gets the file directly. The list content is rendered into an
// off-screen DOM node using the same neutral markup as the printable page,
// captured with html2canvas, then laid out into an A4 jsPDF document with the
// brand header and disclaimer pinned to the top and bottom of EVERY page.
//
// Chinese / non-Latin text is rasterised by the browser (no font embedding
// needed), so it renders exactly as on screen. The module never ranks,
// recommends, scores, interprets, or adds any analysis — only the source
// fields are reproduced, each record clearly labelled as a trial registration
// or a guideline / regulatory entry.

import type { UpdateItem } from './types';
import {
  buildDiscussionItem,
  guideTypeLabel,
  type DiscussionItem,
  discussionFilename,
  regionDisplay,
  localizeStatus,
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
  /** Reserved for a future paid tier. The neutral list never shows upsell. */
  variant?: 'free' | 'pro';
  /**
   * Optional explicit per-list record cap. When omitted, falls back to the
   * auth-based cap (5 for free, 10 for signed-in). A single-unlock credit or
   * Pro plan passes its actual allowance (10) here so a guest who just paid
   * can export a full list without being re-capped at the free ceiling.
   */
  recordLimit?: number;
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

/** Locale-neutral YYYY-MM-DD (matches the printable spec). */
function fmtYMD(d: Date): string {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${da}`;
}

function fmtYMDfromISO(iso?: string): string | null {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return fmtYMD(d);
}

/** Build the off-screen HTML for capture. Reuses the .dl-* classes. */
function renderListHtml(data: DiscussionItem[], locale: Locale, m: Messages): string {
  const ymd = fmtYMD(new Date());

  const items = data
    .map((it) => {
      const isTrial = it.recordType === 'trial';
      const tag = isTrial
        ? m.discussionList.typeTrial
        : m.discussionList.typeGuideline;

      const titleBlock = `
        <div class="dl-row dl-row-title"><span class="dl-k">${escapeHtml(
          m.discussionList.fieldTitle
        )}：</span></div>
        <div class="dl-title-val">${escapeHtml(it.title)}</div>`;

      const linkBlock = `<div class="dl-link-muted"><span class="dl-k">${escapeHtml(
        m.discussionList.fieldLink
      )}：</span><a class="dl-link" data-url="${escapeHtml(
        it.url
      )}">${escapeHtml(it.url)}</a></div>`;

      if (isTrial) {
        const status = localizeStatus(it.status, locale);
        const region = regionDisplay(it, m);
        const dateStr = fmtYMDfromISO(it.firstPosted) ?? fmtYMDfromISO(it.date ?? undefined);

        const rows: string[] = [];
        rows.push(
          `<div class="dl-row"><span class="dl-k">${escapeHtml(
            m.discussionList.fieldSource
          )}：</span><span class="dl-source">${escapeHtml(it.source)}</span></div>`
        );
        rows.push(
          `<div class="dl-row"><span class="dl-k">${escapeHtml(
            m.discussionList.fieldId
          )}：</span><span class="dl-id">${escapeHtml(it.id)}</span></div>`
        );
        rows.push(
          `<div class="dl-row"><span class="dl-k">${escapeHtml(
            m.discussionList.fieldRegion
          )}：</span><span>${escapeHtml(region)}</span></div>`
        );
        if (status)
          rows.push(
            `<div class="dl-row"><span class="dl-k">${escapeHtml(
              m.discussionList.fieldStatus
            )}：</span><span>${escapeHtml(status)}</span></div>`
          );
        if (dateStr)
          rows.push(
            `<div class="dl-row"><span class="dl-k">${escapeHtml(
              m.discussionList.fieldDate
            )}：</span><span>${escapeHtml(dateStr)}</span></div>`
          );

        return `
        <li class="dl-item dl-item-trial">
          <div class="dl-rectag">${escapeHtml(tag)}</div>
          <div class="dl-block">
            ${titleBlock}
            ${rows.join('')}
            <div class="dl-note-inline">${escapeHtml(m.discussionList.trialNote)}</div>
            <div class="dl-verify">${escapeHtml(m.discussionList.verifyById)}</div>
            ${linkBlock}
          </div>
        </li>`;
      }

      // Guideline / regulatory entry.
      const gType = guideTypeLabel(it.guideKind, m) ?? '';
      const rows: string[] = [];
      rows.push(
        `<div class="dl-row"><span class="dl-k">${escapeHtml(
          m.discussionList.fieldSource
        )}：</span><span class="dl-source">${escapeHtml(it.source)}</span></div>`
      );
      rows.push(
        `<div class="dl-row"><span class="dl-k">${escapeHtml(
          m.discussionList.fieldGuideType
        )}：</span><span>${escapeHtml(gType)}</span></div>`
      );

      return `
        <li class="dl-item dl-item-guide">
          <div class="dl-rectag">${escapeHtml(tag)}</div>
          <div class="dl-block">
            ${titleBlock}
            ${rows.join('')}
            <div class="dl-note-inline">${escapeHtml(m.discussionList.guideNote)}</div>
            ${linkBlock}
          </div>
        </li>`;
    })
    .join('');

  const prompt = `
    <section class="dl-prompt">
      <h2 class="dl-prompt-heading">${escapeHtml(m.discussionList.promptHeading)}</h2>
      <ol class="dl-prompt-list">
        ${m.discussionList.promptLines.map((l) => `<li>${escapeHtml(l)}</li>`).join('')}
      </ol>
      <p class="dl-prompt-foot">${escapeHtml(m.discussionList.promptFoot)}</p>
    </section>`;

  return `
    <div class="dl-title">${escapeHtml(m.discussionList.title)}</div>
    <div class="dl-intro"><span class="dl-intro-h">${escapeHtml(
      m.discussionList.introHeading
    )}</span>${escapeHtml(m.discussionList.introBody)}</div>
    <div class="dl-meta-top">
      <span>${escapeHtml(t(m, 'discussionList.generatedDate', { date: ymd }))}</span>
      <span>${escapeHtml(
        t(m, 'discussionList.recordCount', { n: data.length })
      )}</span>
    </div>
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
  const limit =
    input.recordLimit ?? (input.signedIn ? SIGNED_IN_EXPORT_LIMIT : FREE_EXPORT_LIMIT);
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
    <div id="pdf-header" style="padding:0 44px 8px;">
      <div class="dl-pdf-brand">${escapeHtml(input.messages.discussionList.pageHeaderBrand)}</div>
      <div class="dl-pdf-tag">${escapeHtml(input.messages.discussionList.pageHeaderTag)}</div>
    </div>
    <div id="pdf-content" style="padding:14px 44px 12px;">
      ${renderListHtml(data, input.locale, input.messages)}
    </div>
    <div id="pdf-footer" class="dl-footer" style="padding:8px 44px 12px;margin:0;">
      <div>${escapeHtml(input.messages.discussionList.footer)}</div>
    </div>
  `;
  document.body.appendChild(host);

  try {
    // Wait for fonts so that CJK fallbacks do not substitute glyphs mid-capture
    // and create gaps around Latin punctuation (e.g. ClinicalTrials.gov).
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

    const contentEl = host.querySelector<HTMLElement>('#pdf-content');
    const footerEl = host.querySelector<HTMLElement>('#pdf-footer');
    const headerEl = host.querySelector<HTMLElement>('#pdf-header');
    if (!contentEl || !footerEl || !headerEl) {
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
    const headerCanvas = await html2canvas(headerEl, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
    });

    // Capture link bounding boxes so we can overlay real PDF hyperlink
    // annotations on top of the rasterised URLs.
    const contentRect = contentEl.getBoundingClientRect();
    const linkEls = Array.from(host.querySelectorAll<HTMLElement>('.dl-link'));
    const links = linkEls
      .map((el) => {
        const rect = el.getBoundingClientRect();
        return {
          url: el.getAttribute('data-url') || el.innerText,
          x: rect.left - contentRect.left,
          y: rect.top - contentRect.top,
          w: rect.width,
          h: rect.height,
        };
      })
      .filter((l) => l.url && l.w > 0 && l.h > 0);

    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 36;
    const contentW = pageW - margin * 2;

    const headerH = (headerCanvas.height / headerCanvas.width) * contentW;
    const footerH = (footerCanvas.height / footerCanvas.width) * contentW;
    const top = margin + headerH + 6;
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
      // Pinned header at the top of every page.
      pdf.addImage(
        headerCanvas.toDataURL('image/jpeg', 0.95),
        'JPEG',
        margin,
        margin,
        contentW,
        headerH
      );
      pdf.addImage(pageImg, 'JPEG', margin, top, contentW, sliceH);
      pdf.addImage(
        footerCanvas.toDataURL('image/jpeg', 0.95),
        'JPEG',
        margin,
        pageH - margin - footerH,
        contentW,
        footerH
      );

      // Overlay clickable link annotations for any URL that appears on this page.
      for (const l of links) {
        const linkTop = l.y / pxPerPt;
        const linkBottom = (l.y + l.h) / pxPerPt;
        const overlapTop = Math.max(linkTop, pos);
        const overlapBottom = Math.min(linkBottom, pos + sliceH);
        if (overlapBottom > overlapTop + 0.5) {
          pdf.link(
            margin + l.x / pxPerPt,
            top + (overlapTop - pos),
            l.w / pxPerPt,
            overlapBottom - overlapTop,
            { url: l.url }
          );
        }
      }

      pos += sliceH;
      first = false;
    }

    // Page numbers: use a numeric format that the default PDF font supports.
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(100, 116, 139); // slate-500
      const label = `${i} / ${totalPages}`;
      const textW = pdf.getTextWidth(label);
      pdf.text(label, pageW - margin - textW, pageH - margin + 10);
    }

    pdf.save(discussionFilename(input.locale));
    return { limit, truncated, count: data.length };
  } finally {
    document.body.removeChild(host);
  }
}
