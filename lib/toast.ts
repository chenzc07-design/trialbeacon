export type ToastKind = 'ok' | 'error';

/**
 * Tiny dependency-free toast. Appends a self-removing pill to a shared fixed
 * root at the bottom of the viewport. Used by the cancer follow button so a
 * follow/unfollow gives light, non-blocking feedback without a provider.
 */
export function showToast(message: string, kind: ToastKind = 'ok'): void {
  if (typeof document === 'undefined') return;

  const ROOT_ID = 'tb-toast-root';
  let root = document.getElementById(ROOT_ID) as HTMLDivElement | null;
  if (!root) {
    root = document.createElement('div');
    root.id = ROOT_ID;
    root.className =
      'fixed inset-x-0 bottom-6 z-[100] flex flex-col items-center gap-2 px-4 pointer-events-none';
    document.body.appendChild(root);
  }

  const el = document.createElement('div');
  el.className = `pointer-events-auto rounded-xl px-4 py-2.5 text-sm font-medium shadow-card-hover transition-all duration-300 ${
    kind === 'error' ? 'bg-[#7a3030] text-white' : 'bg-ink-950 text-white'
  }`;
  el.textContent = message;
  el.style.opacity = '0';
  el.style.transform = 'translateY(8px)';
  root.appendChild(el);

  requestAnimationFrame(() => {
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';
  });

  window.setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(8px)';
    window.setTimeout(() => el.remove(), 300);
  }, 2200);
}
