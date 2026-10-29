/**
 * Browser API client.
 * Requests go to same-origin `/api/v1/*` (proxied by Next.js to Express on port 5050)
 * with automatic fallback to `http://localhost:5050/api/v1/*` with `credentials: 'include'`.
 */
export class ApiError extends Error {
  constructor(message, { status = 0, code = 'NETWORK_ERROR', details } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const DIRECT_BACKEND_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api/v1';

function buildQuery(params) {
  if (!params) return '';
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    qs.set(k, String(v));
  });
  const s = qs.toString();
  return s ? `?${s}` : '';
}

export async function apiRequest(path, { method = 'GET', body, params, signal } = {}) {
  const query = buildQuery(params);
  const fetchOpts = {
    method,
    signal,
    credentials: 'include',
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  };

  let res;
  try {
    res = await fetch(`/api/v1${path}${query}`, fetchOpts);
    // If Next.js rewrite hit macOS ControlCenter on old port 5000 (403/502 with non-JSON body), retry direct 5050
    if (res.status === 403 || res.status === 502 || res.status === 504) {
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        res = await fetch(`${DIRECT_BACKEND_BASE}${path}${query}`, fetchOpts);
      }
    }
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    try {
      res = await fetch(`${DIRECT_BACKEND_BASE}${path}${query}`, fetchOpts);
    } catch {
      throw new ApiError(
        'Unable to reach the server. Please check your connection or that the API is running.'
      );
    }
  }

  let payload = null;
  const text = await res.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!res.ok) {
    const e = payload?.error || {};
    const fallback =
      res.status >= 500
        ? 'The server is unavailable right now. Please try again shortly.'
        : 'Request failed.';
    throw new ApiError(e.message || fallback, {
      status: res.status,
      code: e.code || 'HTTP_ERROR',
      details: e.details,
    });
  }
  return payload ?? {};
}

export const api = {
  get: (path, params, opts) => apiRequest(path, { ...opts, params }),
  post: (path, body, opts) => apiRequest(path, { ...opts, method: 'POST', body: body ?? {} }),
  patch: (path, body, opts) => apiRequest(path, { ...opts, method: 'PATCH', body: body ?? {} }),
  del: (path, opts) => apiRequest(path, { ...opts, method: 'DELETE' }),
};

/** Map API validation details onto react-hook-form fields. */
export function applyServerErrors(err, setError) {
  if (!(err instanceof ApiError) || !Array.isArray(err.details)) return false;
  let applied = false;
  err.details.forEach((d) => {
    const field = Array.isArray(d.path) ? d.path[0] : d.field || d.path;
    if (field) {
      setError(String(field), { type: 'server', message: d.message });
      applied = true;
    }
  });
  return applied;
}
