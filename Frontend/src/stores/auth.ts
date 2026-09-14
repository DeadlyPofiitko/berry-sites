import { atom } from 'nanostores';
import { getCurrentUser, type UserProfile } from '../services/auth';

/**
 * Nano store holding currently logged-in user profile.
 * null if unauthenticated or not yet checked.
 */
export const $currentUser = atom<UserProfile | null>(null);

/**
 * Nano store indicating whether the current user is authenticated.
 */
export const $isAuthenticated = atom<boolean>(false);

/**
 * Nano store indicating whether initial auth check has completed.
 */
export const $authInitialized = atom<boolean>(false);

let authCheckPromise: Promise<UserProfile | null> | null = null;

/**
 * Fetches current user profile from backend (/admin/me) and updates stores.
 * Deduplicates in-flight requests.
 */
export async function fetchCurrentUser(): Promise<UserProfile | null> {
  if (authCheckPromise) {
    return authCheckPromise;
  }

  authCheckPromise = (async () => {
    try {
      const user = await getCurrentUser();
      $currentUser.set(user);
      $isAuthenticated.set(Boolean(user));
      return user;
    } catch {
      $currentUser.set(null);
      $isAuthenticated.set(false);
      return null;
    } finally {
      $authInitialized.set(true);
      authCheckPromise = null;
    }
  })();

  return authCheckPromise;
}

/**
 * Clears auth state in store (used on logout).
 */
export function clearAuthState(): void {
  $currentUser.set(null);
  $isAuthenticated.set(false);
  $authInitialized.set(true);
}
