import { atom } from 'nanostores';

export type NotificationType = 'error' | 'success' | 'info' | 'warning';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  message: string;
  detail?: string;
  duration?: number;
  createdAt: number;
}

/**
 * Nano store holding active notifications
 */
export const $notifications = atom<NotificationItem[]>([]);

/**
 * Dispatches a notification to the store.
 */
export function notify(
  message: string,
  type: NotificationType = 'info',
  options?: { detail?: string; duration?: number }
): string {
  const id = Math.random().toString(36).substring(2, 9);
  const duration = options?.duration ?? (type === 'error' ? 5000 : 4000);

  const item: NotificationItem = {
    id,
    type,
    message,
    detail: options?.detail,
    duration,
    createdAt: Date.now(),
  };

  $notifications.set([...$notifications.get(), item]);

  if (duration > 0 && typeof window !== 'undefined') {
    setTimeout(() => {
      dismissNotification(id);
    }, duration);
  }

  return id;
}

/**
 * Helper to notify error
 */
export function notifyError(
  message: string,
  options?: { detail?: string; duration?: number }
): string {
  return notify(message, 'error', options);
}

/**
 * Helper to notify success
 */
export function notifySuccess(
  message: string,
  options?: { detail?: string; duration?: number }
): string {
  return notify(message, 'success', options);
}

/**
 * Dismisses a single notification by id
 */
export function dismissNotification(id: string): void {
  $notifications.set($notifications.get().filter((n) => n.id !== id));
}

/**
 * Clears all active notifications
 */
export function clearAllNotifications(): void {
  $notifications.set([]);
}
