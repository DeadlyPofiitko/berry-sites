/**
 * Auth API Service
 * Handles authentication requests with backend API.
 */

import { notifyError } from '../stores/notification';

export const API_BASE_URL =
  import.meta.env.PUBLIC_API_URL || 'http://localhost:5294';

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
  const url = `${API_BASE_URL}/${normalizedEndpoint}`;
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
