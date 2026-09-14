import React, { useEffect } from 'react';
import { getCurrentUser } from '../services/auth';

/**
 * Checks the current authentication state on the login page.
 * If a valid user session exists, automatically redirects to the admin dashboard.
 */
const AuthRedirect: React.FC = () => {
  useEffect(() => {
    (async () => {
      try {
        const profile = await getCurrentUser();
        if (profile) {
          // User already authenticated – redirect to dashboard admin
          window.location.href = '/dashboard/admin';
        }
      } catch (e) {
        // Silently ignore errors; the login page will remain displayed.
      }
    })();
  }, []);

  // This component renders nothing – it only performs the redirect check.
  return null;
};

export default AuthRedirect;
