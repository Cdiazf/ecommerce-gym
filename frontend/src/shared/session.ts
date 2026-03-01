import type { UserRole } from './types';

export type TokenPayload = {
  username?: string;
  role?: UserRole;
};

export function getPayloadFromToken(token: string): TokenPayload {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return {};
    }

    const raw = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const normalized = raw.padEnd(Math.ceil(raw.length / 4) * 4, '=');
    const decoded = atob(normalized);
    return JSON.parse(decoded) as TokenPayload;
  } catch {
    return {};
  }
}
