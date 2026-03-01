const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const USES_NGROK_TUNNEL = API_URL.includes('ngrok-free.app') || API_URL.includes('ngrok.app');

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(USES_NGROK_TUNNEL ? { 'ngrok-skip-browser-warning': '1' } : {}),
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${response.status} ${response.statusText}: ${body}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const bodyText = await response.text();
  if (!bodyText.trim()) {
    return undefined as T;
  }

  return JSON.parse(bodyText) as T;
}
