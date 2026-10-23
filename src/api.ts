import type { Session } from './session';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(url: string, options: { method?: string; body?: unknown; token?: string } = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (options.token) headers.Authorization = `Bearer ${options.token}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new ApiError(0, 'No hay conexión. Revisa el internet del televisor.');
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new ApiError(response.status, (data && data.message) || 'El servidor no respondió como esperábamos. Intenta de nuevo.');
  }
  return data as T;
}

const cloud = import.meta.env.VITE_CLOUD_API_URL.replace(/\/$/, '');

export interface PairingCode {
  code: string;
  expires_in: number;
}

export interface PairingStatus {
  status: 'pending' | 'claimed';
  instance_url: string | null;
}

export const cloudApi = {
  createPairing: (secretHash: string) =>
    request<PairingCode>(`${cloud}/api/tv/pairings`, { method: 'POST', body: { secret_hash: secretHash } }),
  pairing: (code: string, secret: string) =>
    request<PairingStatus>(`${cloud}/api/tv/pairings/${code}?secret=${encodeURIComponent(secret)}`),
};

export interface Instance {
  name: string;
  logo_url: string | null;
}

export interface TvActivation {
  token: string;
  customer: { first_name: string | null; full_name: string | null };
}

export interface Category {
  id: number;
  name: string;
}

export interface Channel {
  id: number;
  name: string;
  logo: string | null;
  category_id: number | null;
  number: number | null;
}

/** status: "active", "suspended" (sin canales, con message) o "none" (el plan no tiene TV). */
export interface TvGuide {
  status: 'active' | 'suspended' | 'none';
  message: string | null;
  categories: Category[];
  channels: Channel[];
}

export interface ChannelStream {
  name: string;
  url: string;
}

const app = (base: string) => `${base.replace(/\/$/, '')}/api/app/v1`;

export const instanceApi = {
  instance: (base: string) => request<Instance>(`${app(base)}/instance`),
  activate: (base: string, code: string, secret: string, deviceName: string) =>
    request<TvActivation>(`${app(base)}/tv/activate`, { method: 'POST', body: { code, secret, device_name: deviceName } }),
  guide: (s: Session) => request<TvGuide>(`${app(s.instanceUrl)}/tv`, { token: s.token }),
  play: (s: Session, channelId: number) => request<ChannelStream>(`${app(s.instanceUrl)}/tv/channels/${channelId}/play`, { token: s.token }),
  logout: (s: Session) => request<null>(`${app(s.instanceUrl)}/auth/logout`, { method: 'POST', token: s.token }),
};
