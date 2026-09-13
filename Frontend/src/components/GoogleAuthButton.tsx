import React, { useState } from 'react';
import {
  GoogleOAuthProvider,
  useGoogleLogin,
  useGoogleOneTapLogin,
  type CredentialResponse,
} from '@react-oauth/google';
import { sendGoogleCredential, sendGoogleCode } from '../services/auth';

export interface GoogleAuthButtonProps {
  clientId: string;
  redirectUrl?: string;
  onSuccess?: (data?: unknown) => void;
  onError?: (error: unknown) => void;
}

function LoginButton({
  redirectUrl = '/dashboard',
  onSuccess,
  onError,
}: Omit<GoogleAuthButtonProps, 'clientId'>) {
  const [isLoading, setIsLoading] = useState(false);

  const handleAuthResult = (result: { ok: boolean; data?: unknown; error?: string }) => {
    if (result.ok) {
      if (onSuccess) {
        onSuccess(result.data);
      } else {
        window.location.href = redirectUrl;
      }
    } else {
      console.error('Backend rejected authentication:', result.error);
      onError?.(result.error);
    }
  };

  // 1. Google One Tap Login (vrací JWT credential/id_token)
  useGoogleOneTapLogin({
    onSuccess: async (credentialResponse: CredentialResponse) => {
      if (!credentialResponse.credential) return;
      setIsLoading(true);
      try {
        const result = await sendGoogleCredential(credentialResponse.credential);
        handleAuthResult(result);
      } catch (err) {
        console.error('Network or server error during auth:', err);
        onError?.(err);
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => {
      console.warn('Google One Tap prompt closed or failed to display');
    },
  });

  // 2. Klasický Popup Login s autorizačním kódem
  const loginWithCode = useGoogleLogin({
    flow: 'auth-code',
    onSuccess: async (codeResponse) => {
      setIsLoading(true);
      try {
        const result = await sendGoogleCode(codeResponse.code);
        handleAuthResult(result);
      } catch (err) {
        console.error('Network or server error during auth:', err);
        onError?.(err);
      } finally {
        setIsLoading(false);
      }
    },
    onError: (errorResponse) => {
      console.error('Google Popup login failed:', errorResponse);
      onError?.(errorResponse);
    },
  });

  return (
    <button
      type="button"
      onClick={() => loginWithCode()}
      disabled={isLoading}
      className="google-signin-btn"
      aria-label="Sign in with Google"
    >
      <div className="google-icon-wrapper">
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill="#4285F4"
            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.28 14.27A7.18 7.18 0 0 1 4.9 12c0-.79.14-1.57.38-2.27V6.58H1.25A11.97 11.97 0 0 0 0 12c0 1.92.45 3.74 1.25 5.42l4.03-3.15z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
          />
        </svg>
      </div>
      <span className="google-btn-text">
        {isLoading ? 'Signing in...' : 'Sign in with Google'}
      </span>

      <style>{`
        .google-signin-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          background-color: #ffffff;
          color: #3c4043;
          border: 1px solid #dadce0;
          border-radius: 4px;
          font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-size: 14px;
          font-weight: 500;
          letter-spacing: 0.25px;
          padding: 8px 16px;
          cursor: pointer;
          transition: background-color 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
          box-shadow: 0 1px 2px rgba(60, 64, 67, 0.08);
          outline: none;
          min-height: 40px;
          width: 100%;
          max-width: 320px;
        }

        .google-signin-btn:hover:not(:disabled) {
          background-color: #f8fafd;
          border-color: #c2e7ff;
          box-shadow: 0 1px 3px rgba(60, 64, 67, 0.2);
        }

        .google-signin-btn:active:not(:disabled) {
          background-color: #f1f3f4;
          box-shadow: 0 1px 2px rgba(60, 64, 67, 0.15);
        }

        .google-signin-btn:focus-visible {
          border-color: #4285f4;
          box-shadow: 0 0 0 2px rgba(66, 133, 244, 0.3);
        }

        .google-signin-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          box-shadow: none;
        }

        .google-icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          flex-shrink: 0;
        }

        .google-btn-text {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `}</style>
    </button>
  );
}

export default function GoogleAuthButton({
  clientId,
  redirectUrl = '/dashboard',
  onSuccess,
  onError,
}: GoogleAuthButtonProps) {
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <LoginButton
        redirectUrl={redirectUrl}
        onSuccess={onSuccess}
        onError={onError}
      />
    </GoogleOAuthProvider>
  );
}