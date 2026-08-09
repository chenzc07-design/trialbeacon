// Tiny JSON file persistence used ONLY as a fallback when Upstash is not
// configured. On Vercel (read-only FS) Upstash is the configured path, so this
// is never touched there. In writable environments (local dev, the sandbox
// preview) it keeps anonymous counters / payment records alive across server
// restarts so owner dashboards don't blank out.

import { promises as fs } from 'node:fs';
import path from 'node:path';

const DIR = path.join(process.cwd(), '.tb_state');

export async function loadJson<T>(name: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(path.join(DIR, name), 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function saveJson(name: string, data: unknown): Promise<void> {
  try {
    await fs.mkdir(DIR, { recursive: true });
    await fs.writeFile(path.join(DIR, name), JSON.stringify(data), 'utf8');
  } catch {
    /* read-only FS or other error — ignore; Upstash is the path in production */
  }
}
