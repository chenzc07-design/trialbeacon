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
  regionDisplay,
  localizeStatus,
  localizePhase,
  localizeStudyType,
  FREE_EXPORT_LIMIT,
  SIGNED_IN_EXPORT_LIMIT,
} from './discussion-list';
import { t } from './i18n-runtime';
import type { Locale } from './i18n-runtime';
import type { Messages } from './messages/en';
import { summariseCountries } from './regions';

export interface DiscussionPdfInput {
  items: UpdateItem[];
  signedIn: boolean;
  locale: Locale;
  messages: Messages;
  /** Reserved for a future paid tier; "pro" adds detail fields and comparison. */
  variant?: 'free' | 'pro';
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

function fmtDatetime(locale: string): string {
  return new Date().toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

/** Build the off-screen HTML for capture. Reuses the .dl-* classes. */
function renderListHtml(
  data: DiscussionItem[],
  locale: Locale,
  m: Messages,
  variant: 'free' | 'pro'
): string {
  const today = new Date().toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const generatedAt = fmtDatetime(locale);

  const items = data
    .map((it, i) => {
      const status = localizeStatus(it.status, locale);
      const phase = localizePhase(it.phase, locale);
      const studyType = localizeStudyType(it.studyType, locale);
      const enrollment =
        it.enrollment != null ? String(it.enrollment) : null;
      const region = regionDisplay(it, m);
      const locations =
        it.countries && it.countries.length > 0
          ? summariseCountries(it.countries, 3)
          : null;

      const chips: string[] = [];
      if (status)
        chips.push(`<span class="dl-chip">${escapeHtml(status)}</span>`);
      if (phase)
        chips.push(`<span class="dl-chip">${escapeHtml(phase)}</span>`);
      if (studyType)
        chips.push(`<span class="dl-chip">${escapeHtml(studyType)}</span>`);
      if (enrollment)
        chips.push(
          `<span class="dl-chip">${escapeHtml(m.discussionList.fieldEnrollment)} ${escapeHtml(
            enrollment
          )}</span>`
        );
      const chipsHtml = chips.join('<span class="dl-meta-dot">·</span>');

      // Pro-only fields are rendered only when explicitly requested and only
      // when the source actually provides them.
      const proRows: string[] = [];
      if (variant === 'pro') {
        if (it.interventions && it.interventions.length > 0) {
          proRows.push(
            `<div class="dl-meta-line"><span class="dl-meta-label">${escapeHtml(
              m.trial.interventions
            )}：</span><span>${escapeHtml(
              summariseCountries(it.interventions, 4)
            )}</span></div>`
          );
        }
        if (it.sponsor) {
          proRows.push(
            `<div class="dl-meta-line"><span class="dl-meta-label">${escapeHtml(
              m.trial.sponsor
            )}：</span><span>${escapeHtml(it.sponsor)}</span></div>`
          );
        }
        if (it.ageRange || it.sex) {
          const parts = [it.ageRange, it.sex].filter(Boolean) as string[];
          proRows.push(
            `<div class="dl-meta-line"><span class="dl-meta-label">${escapeHtml(
              m.trial.eligibility
            )}：</span><span>${escapeHtml(parts.join(' · '))}</span></div>`
          );
        }
      }

      return `
      <li class="dl-item">
        <div class="dl-item-head">
          <span class="dl-num">${i + 1}</span>
          <div class="dl-item-head-text">
            <div class="dl-nct">${escapeHtml(it.id)}</div>
            <div class="dl-item-title">${escapeHtml(it.title)}</div>
          </div>
        </div>
        <div class="dl-meta">
          <div class="dl-meta-line dl-source-line">
            <span class="dl-meta-label">${escapeHtml(
              m.discussionList.fieldSource
            )}：</span>
            <span class="dl-source">${escapeHtml(it.source)}</span>
            <span class="dl-meta-sep">|</span>
            <span class="dl-meta-label">${escapeHtml(
              m.discussionList.fieldRegion
            )}：</span>
            <span>${escapeHtml(region)}</span>
          </div>
          ${chipsHtml ? `<div class="dl-meta-line dl-chips">${chipsHtml}</div>` : ''}
          ${locations ? `<div class="dl-meta-line"><span class="dl-meta-label">${escapeHtml(m.discussionList.fieldLocations)}：</span><span>${escapeHtml(locations)}</span></div>` : ''}
          ${it.date ? `<div class="dl-meta-line"><span class="dl-meta-label">${escapeHtml(m.discussionList.fieldUpdated)}：</span><span>${escapeHtml(fmtDate(it.date, locale))}</span></div>` : ''}
          ${it.hasPublicContact ? `<div class="dl-meta-line dl-contact">${escapeHtml(m.discussionList.fieldContact)}</div>` : ''}
          ${proRows.join('')}
          <div class="dl-meta-line dl-link-line">
            <span class="dl-meta-label">${escapeHtml(
              m.discussionList.fieldLink
            )}：</span>
            <span class="dl-link" data-url="${escapeHtml(it.url)}">${escapeHtml(
              it.url
            )}</span>
            <span class="dl-linkprompt">（${escapeHtml(
              m.discussionList.linkPrompt
            )}）</span>
          </div>
        </div>
      </li>`;
    })
    .join('');

  const prompt = `
    <section class="dl-prompt">
      <h2 class="dl-prompt-heading">${escapeHtml(
        m.discussionList.promptHeading
      )}</h2>
      <p class="dl-prompt-intro">${escapeHtml(
        m.discussionList.promptIntro
      )}</p>
      <ol class="dl-prompt-list">
        ${m.discussionList.promptLines
          .map((l) => `<li>${escapeHtml(l)}</li>`)
          .join('')}
      </ol>
    </section>`;

  const proCta =
    variant === 'free'
      ? `<div class="dl-pro-cta">${escapeHtml(
          m.discussionList.proBadge
        )} · ${escapeHtml(m.discussionList.proCta)}</div>`
      : '';

  return `
    <div class="dl-header" style="margin-bottom:10px;">
      <p class="dl-header-brand">${escapeHtml(m.discussionList.header)}</p>
      <p class="dl-header-meta">${t(m, 'discussionList.generatedOn', {
        date: today,
      })} · ${t(m, 'discussionList.recordCount', { n: data.length })}${
        variant === 'pro'
          ? ` · <span class="dl-pro-badge">${escapeHtml(
              m.discussionList.proBadge
            )}</span>`
          : ''
      }</p>
    </div>
    <h1 class="dl-title">${escapeHtml(m.discussionList.title)}</h1>
    <p class="dl-subtitle">${escapeHtml(m.discussionList.subtitle)}</p>
    <ol class="dl-items">${items}</ol>
    ${prompt}
    ${proCta}
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
  const variant = input.variant ?? 'free';
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
      ${renderListHtml(data, input.locale, input.messages, variant)}
    </div>
    <div id="pdf-footer" class="dl-footer" style="padding:10px 44px 14px;margin:0;">
      <div>${escapeHtml(input.messages.discussionList.footerDisclaimer)}</div>
      <div style="margin-top:4px;">${escapeHtml(
        t(input.messages, 'discussionList.dataNotice', {})
      )} · ${escapeHtml(
        t(input.messages, 'discussionList.generatedAt', {
          datetime: fmtDatetime(input.locale),
        })
      )}</div>
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
