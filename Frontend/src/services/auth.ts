/**
 * Auth API Service
 * Handles authentication requests with backend API.
 */

import { notifyError } from '../stores/notification';

/**
 * Returns the base URL for API requests.
 * In production on the client side, dynamically uses the current client domain (window.location.origin).
 * In dev or SSR, falls back to PUBLIC_API_URL or http://localhost:5294.
 */
export function getApiBaseUrl(): string {
  if (import.meta.env.PROD && typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/+$/, '').replace("https://", "https://api.").replace("www.", "");
  }
  return (import.meta.env.PUBLIC_API_URL || 'http://localhost:5294').replace(/\/+$/, '');
}

/**
 * Dynamic API_BASE_URL proxy that evaluates getApiBaseUrl() at runtime.
 */
export const API_BASE_URL = new Proxy(Object(''), {
  get(_target, prop) {
    const current = getApiBaseUrl();
    if (prop === Symbol.toPrimitive || prop === 'toString' || prop === 'valueOf') {
      return () => current;
    }
    const val = (current as any)[prop];
    if (typeof val === 'function') {
      return val.bind(current);
    }
    return val;
  },
}) as unknown as string;

export interface GoogleCredentialPayload {
  JWT: string;
}

export interface GoogleCodePayload {
  code: string;
}

export interface AuthResponse<T = unknown> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

/**
 * Generic helper to send authentication payloads to the backend.
 */
export async function sendAuthPayload<T = unknown>(
  endpoint: string,
  payload: Record<string, unknown>
): Promise<AuthResponse<T>> {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/${normalizedEndpoint}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    let data: T | undefined;
    let error: string | undefined;

    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        const json = await res.json();
        if (res.ok) {
          data = json as T;
        } else {
          const detail = (json as Record<string, unknown>)?.detail;
          error = typeof detail === 'string' && detail.trim() ? detail : 'Internal error';
        }
      } catch {
        if (!res.ok) {
          error = 'Internal error';
        }
      }
    } else {
      const text = await res.text();
      if (!res.ok) {
        try {
          const parsed = JSON.parse(text);
          const detail = parsed?.detail;
          error = typeof detail === 'string' && detail.trim() ? detail : 'Internal error';
        } catch {
          error = 'Internal error';
        }
      }
    }

    if (!res.ok) {
      if (!error) {
        error = 'Internal error';
      }
      notifyError(error);
    }

    return {
      ok: res.ok,
      status: res.status,
      data,
      error,
    };
  } catch (err) {
    const error = 'Internal error';
    notifyError(error);
    return {
      ok: false,
      status: 0,
      error,
    };
  }
}

/**
 * Sends Google One Tap / Credential JWT to backend.
 * Payload sent as { JWT: string }
 */
export async function sendGoogleCredential<T = unknown>(jwt: string): Promise<AuthResponse<T>> {
  const payload: GoogleCredentialPayload = { JWT: jwt };
  return sendAuthPayload<T>('auth/login', payload as unknown as Record<string, unknown>);
}

/**
 * Sends Google Auth Code to backend.
 * Payload sent as { code: string }
 */
export async function sendGoogleCode<T = unknown>(code: string): Promise<AuthResponse<T>> {
  const payload: GoogleCodePayload = { code };
  return sendAuthPayload<T>('auth/login', payload as unknown as Record<string, unknown>);
}

export interface UserProfile {
  name: string;
  email: string;
  picture: string;
}

/**
 * Fetches current authenticated user profile from /admin/me.
 * Returns null if unauthorized or failed.
 */
export async function getCurrentUser(): Promise<UserProfile | null> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/admin/me`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!res.ok) {
      return null;
    }

    const data = (await res.json()) as UserProfile;
    return data;
  } catch {
    return null;
  }
}

/**
 * Calls /auth/logout to clear the session cookie.
 */
export async function logoutUser(): Promise<boolean> {
  try {
    const baseUrl = getApiBaseUrl();
    let res = await fetch(`${baseUrl}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });

    // Fallback if backend expects GET for logout
    if (res.status === 405) {
      res = await fetch(`${baseUrl}/auth/logout`, {
        method: 'GET',
        credentials: 'include',
      });
    }

    return res.ok;
  } catch {
    return false;
  }
}

