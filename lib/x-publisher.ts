import crypto from 'node:crypto';

const KV_URL = process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const TOKEN_KEY = 'tb:x:oauth:owner';
const ENCRYPTION_CONTEXT = 'trialbeacon-x-oauth-v1';

type StoredToken = {
  accessToken: string;
  refreshToken?: string;
  scope?: string;
  expiresAt: number;
  updatedAt: string;
};

type XTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
  scope?: string;
};

export type XPublisherHealth = {
  configured: boolean;
  storageReachable: boolean;
  authorizationReadable: boolean;
  refreshTokenPresent: boolean;
  refreshNeeded: boolean;
};

function getEncryptionKey(): Buffer {
  const secret = process.env.AUTH_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_SECRET is not configured.');
  }
  return crypto.createHash('sha256').update(`${ENCRYPTION_CONTEXT}:${secret ?? 'local-only'}`).digest();
}

function encode(value: Buffer): string {
  return value.toString('base64').replace(/=+$/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function decode(value: string): Buffer {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(normalized + '='.repeat((4 - (normalized.length % 4)) % 4), 'base64');
}

function seal(value: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return `${encode(iv)}.${encode(cipher.getAuthTag())}.${encode(ciphertext)}`;
}

function open(value: string): string | null {
  try {
    const [ivText, tagText, ciphertextText] = value.split('.');
    if (!ivText || !tagText || !ciphertextText) return null;
    const decipher = crypto.createDecipheriv('aes-256-gcm', getEncryptionKey(), decode(ivText));
    decipher.setAuthTag(decode(tagText));
    return Buffer.concat([decipher.update(decode(ciphertextText)), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
}

function isConfigured(): boolean {
  return Boolean(KV_URL && KV_TOKEN && process.env.X_CLIENT_ID);
}

async function jsonOrEmpty<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    return {} as T;
  }
}

async function upstash(commands: [string, ...string[]][]): Promise<unknown[]> {
  if (!KV_URL || !KV_TOKEN) throw new Error('x_publisher_storage_not_configured');
  const response = await fetch(`${KV_URL.replace(/\/+$/, '')}/pipeline`, {
    method: 'POST',
    headers: { authorization: `Bearer ${KV_TOKEN}`, 'content-type': 'application/json' },
    body: JSON.stringify(commands),
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`upstash_${response.status}`);
  const payload = (await jsonOrEmpty<{ result?: unknown }[] | { result?: unknown[] }>(response));
  return Array.isArray(payload) ? payload.map((item) => item.result) : payload.result ?? [];
}

async function readStoredToken(): Promise<StoredToken | null> {
  if (!isConfigured()) return null;
  const result = (await upstash([['GET', TOKEN_KEY]]))[0];
  if (!result) return null;
  const plaintext = open(String(result));
  if (!plaintext) return null;
  try {
    return JSON.parse(plaintext) as StoredToken;
  } catch {
    return null;
  }
}

async function storeToken(token: XTokenResponse, previous?: StoredToken): Promise<StoredToken> {
  if (!token.access_token) throw new Error('x_access_token_missing');
  const stored: StoredToken = {
    accessToken: token.access_token,
    refreshToken: token.refresh_token ?? previous?.refreshToken,
    scope: token.scope ?? previous?.scope,
    expiresAt: Date.now() + (token.expires_in ?? 7200) * 1000,
    updatedAt: new Date().toISOString(),
  };
  await upstash([['SET', TOKEN_KEY, seal(JSON.stringify(stored)), 'EX', String(60 * 60 * 24 * 90)]]);
  return stored;
}

async function refreshTokenIfNeeded(current: StoredToken): Promise<StoredToken> {
  if (current.expiresAt > Date.now() + 60_000 || !current.refreshToken) return current;
  const response = await fetch('https://api.x.com/2/oauth2/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: current.refreshToken,
      grant_type: 'refresh_token',
      client_id: process.env.X_CLIENT_ID!,
    }),
    cache: 'no-store',
  });
  const token = await jsonOrEmpty<XTokenResponse>(response);
  if (!response.ok || !token.access_token) throw new Error('x_token_refresh_failed');
  return storeToken(token, current);
}

export async function getXPublisherHealth(): Promise<XPublisherHealth> {
  if (!isConfigured()) {
    return {
      configured: false,
      storageReachable: false,
      authorizationReadable: false,
      refreshTokenPresent: false,
      refreshNeeded: false,
    };
  }

  try {
    const token = await readStoredToken();
    if (!token) {
      return {
        configured: true,
        storageReachable: true,
        authorizationReadable: false,
        refreshTokenPresent: false,
        refreshNeeded: false,
      };
    }

    return {
      configured: true,
      storageReachable: true,
      authorizationReadable: true,
      refreshTokenPresent: Boolean(token.refreshToken),
      refreshNeeded: token.expiresAt <= Date.now() + 60_000,
    };
  } catch {
    return {
      configured: true,
      storageReachable: false,
      authorizationReadable: false,
      refreshTokenPresent: false,
      refreshNeeded: false,
    };
  }
}

export async function verifyXPublisherAuthorization(): Promise<void> {
  if (!isConfigured()) throw new Error('x_publisher_not_configured');
  const current = await readStoredToken();
  if (!current) throw new Error('x_account_not_authorized');

  const token = await refreshTokenIfNeeded(current);
  const response = await fetch('https://api.x.com/2/users/me', {
    headers: { authorization: `Bearer ${token.accessToken}` },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`x_authorization_check_failed_${response.status}`);
  await response.body?.cancel();
}

export async function saveAuthorizedToken(token: XTokenResponse): Promise<boolean> {
  if (!isConfigured()) return false;
  await storeToken(token);
  return true;
}

export async function publishXPost(text: string): Promise<{ id: string; text: string }> {
  if (!isConfigured()) throw new Error('x_publisher_not_configured');
  if (text.trim().length === 0 || text.length > 280) throw new Error('x_post_length_invalid');
  const current = await readStoredToken();
  if (!current) throw new Error('x_account_not_authorized');
  const token = await refreshTokenIfNeeded(current);
  const publish = async (accessToken: string) => fetch('https://api.x.com/2/tweets', {
    method: 'POST',
    headers: { authorization: `Bearer ${accessToken}`, 'content-type': 'application/json' },
    body: JSON.stringify({ text }),
    cache: 'no-store',
  });

  let response = await publish(token.accessToken);
  if (response.status === 401 && token.refreshToken) {
    const refreshed = await refreshTokenIfNeeded({ ...token, expiresAt: 0 });
    response = await publish(refreshed.accessToken);
  }

  const payload = await jsonOrEmpty<{ data?: { id?: string; text?: string }; errors?: unknown[] }>(response);
  if (!response.ok || !payload.data?.id || !payload.data.text) throw new Error(`x_publish_failed_${response.status}`);
  return { id: payload.data.id, text: payload.data.text };
}

export function isXPublisherConfigured(): boolean {
  return isConfigured();
}
