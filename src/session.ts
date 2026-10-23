/** Lo que el televisor recuerda entre encendidos: a qué ISP se vinculó y su sesión. */
export interface Session {
  instanceUrl: string;
  instanceName: string;
  logoUrl: string | null;
  token: string;
  customerName: string | null;
}

const KEY = 'ispgo-tv-session';

export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function saveSession(session: Session): void {
  localStorage.setItem(KEY, JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem(KEY);
}
