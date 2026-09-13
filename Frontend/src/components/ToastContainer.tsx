import React from 'react';
import { useStore } from '@nanostores/react';
import {
  $notifications,
  dismissNotification,
  type NotificationItem,
} from '../stores/notification';

function ErrorIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="toast-icon toast-icon-error"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function SuccessIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="toast-icon toast-icon-success"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="toast-icon toast-icon-info"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ToastCard({ notification }: { notification: NotificationItem }) {
  const { id, type, message, detail, duration } = notification;

  return (
    <div
      className={`toast-item toast-item-${type}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="toast-content-wrapper">
        <div className="toast-icon-container">
          {type === 'error' && <ErrorIcon />}
          {type === 'success' && <SuccessIcon />}
          {type === 'info' && <InfoIcon />}
          {type === 'warning' && <InfoIcon />}
        </div>
        <div className="toast-text-container">
          <div className="toast-message">{message}</div>
          {detail && <div className="toast-detail">{detail}</div>}
        </div>
        <button
          type="button"
          className="toast-close-btn"
          onClick={() => dismissNotification(id)}
          aria-label="Close notification"
        >
          <CloseIcon />
        </button>
      </div>

      {duration && duration > 0 ? (
        <div
          className="toast-progress-bar"
          style={{ animationDuration: `${duration}ms` }}
        />
      ) : null}
    </div>
  );
}

export default function ToastContainer() {
  const notifications = useStore($notifications);

  if (!notifications || notifications.length === 0) {
    return null;
  }

  return (
    <div className="toast-viewport" aria-label="Notifications">
      {notifications.map((n) => (
        <ToastCard key={n.id} notification={n} />
      ))}

      <style>{`
        .toast-viewport {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 99999;
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: 100%;
          max-width: 380px;
          pointer-events: none;
          box-sizing: border-box;
        }

        @media (max-width: 480px) {
          .toast-viewport {
            top: 12px;
            right: 12px;
            left: 12px;
            max-width: calc(100% - 24px);
          }
        }

        .toast-item {
          pointer-events: auto;
          position: relative;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-radius: 12px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          box-shadow:
            0 10px 25px -5px rgba(0, 0, 0, 0.1),
            0 8px 10px -6px rgba(0, 0, 0, 0.06);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          animation: toastSlideIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          transition: transform 0.2s ease, opacity 0.2s ease;
        }

        @keyframes toastSlideIn {
          from {
            opacity: 0;
            transform: translateY(-12px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .toast-item-error {
          border-color: rgba(239, 68, 68, 0.25);
        }

        .toast-item-success {
          border-color: rgba(16, 185, 129, 0.25);
        }

        .toast-item-info,
        .toast-item-warning {
          border-color: rgba(59, 130, 246, 0.25);
        }

        .toast-content-wrapper {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 16px;
        }

        .toast-icon-container {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
        }

        .toast-item-error .toast-icon-container {
          background: #fee2e2;
          color: #ef4444;
        }

        .toast-item-success .toast-icon-container {
          background: #d1fae5;
          color: #10b981;
        }

        .toast-item-info .toast-icon-container,
        .toast-item-warning .toast-icon-container {
          background: #dbeafe;
          color: #3b82f6;
        }

        .toast-text-container {
          flex: 1;
          min-width: 0;
        }

        .toast-message {
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
          line-height: 1.4;
          word-break: break-word;
        }

        .toast-detail {
          margin-top: 4px;
          font-size: 13px;
          font-weight: 400;
          color: #4b5563;
          line-height: 1.4;
          word-break: break-word;
        }

        .toast-close-btn {
          flex-shrink: 0;
          background: transparent;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          padding: 4px;
          margin: -2px -4px 0 0;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.15s ease, background-color 0.15s ease;
        }

        .toast-close-btn:hover {
          color: #374151;
          background-color: rgba(0, 0, 0, 0.05);
        }

        .toast-progress-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          height: 3px;
          width: 100%;
          background: rgba(0, 0, 0, 0.08);
          animation-name: toastProgress;
          animation-timing-function: linear;
          animation-fill-mode: forwards;
        }

        .toast-item-error .toast-progress-bar {
          background: #ef4444;
        }

        .toast-item-success .toast-progress-bar {
          background: #10b981;
        }

        .toast-item-info .toast-progress-bar {
          background: #3b82f6;
        }

        @keyframes toastProgress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
}
