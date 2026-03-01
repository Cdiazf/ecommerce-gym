const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const USES_NGROK_TUNNEL = API_URL.includes('ngrok-free.app') || API_URL.includes('ngrok.app');

function normalizeHeaders(headers?: HeadersInit): Record<string, string> {
  if (!headers) {
    return {};
  }

  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries());
  }

  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }

  return { ...headers };
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const method = (init?.method ?? 'GET').toUpperCase();
  const requestHeaders = normalizeHeaders(init?.headers);
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(USES_NGROK_TUNNEL ? { 'ngrok-skip-browser-warning': '1' } : {}),
    ...requestHeaders,
  };

  if (!('Content-Type' in headers) && method !== 'GET' && method !== 'HEAD') {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
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

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('text/html')) {
    if (USES_NGROK_TUNNEL) {
      throw new Error(
        'ngrok returned HTML instead of JSON. Recheck the active ngrok tunnel URL and redeploy the frontend with the current VITE_API_URL.',
      );
    }

    throw new Error('Expected JSON response but received HTML.');
  }

  return JSON.parse(bodyText) as T;
}
