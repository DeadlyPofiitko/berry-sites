import React, { useEffect, useState } from 'react';
import { getCurrentUser, logoutUser, type UserProfile as UserProfileType } from '../services/auth';
import { clearAuthState } from '../stores/auth';
import { Avatar, Button } from './ui';
import './UserProfile.css';

function LogoutIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

export const UserProfile: React.FC = () => {
  const [user, setUser] = useState<UserProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    async function checkAuth() {
      const profile = await getCurrentUser();
      if (isCancelled) return;

      if (!profile) {
        // Not logged in or unauthorized -> redirect to home
        window.location.href = '/';
        return;
      }

      setUser(profile);
      setLoading(false);
    }

    checkAuth();

    return () => {
      isCancelled = true;
    };
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logoutUser();
      clearAuthState();
      try {
        localStorage.removeItem('auth_token');
      } catch {}
      window.location.href = '/';
    } finally {
      setLoggingOut(false);
    }
  };

  if (loading || !user) {
    return null;
  }

  const userInitial = user.name ? user.name[0].toUpperCase() : (user.email ? user.email[0].toUpperCase() : 'U');

  return (
    <div className="user-profile-bar">
      <div className="user-profile-bar__info">
          <Avatar
            src={user.picture}
            alt={user.name || user.email}
            fallback={userInitial}
            size="md"
          />
        <div className="user-profile-bar__details">
          <span className="user-profile-bar__name">{user.name || user.email}</span>
          {user.name && user.email && (
            <span className="user-profile-bar__email">{user.email}</span>
          )}
        </div>

      </div>

      <div className="user-profile-bar__actions">
        <Button
          variant="outline"
          color="red"
          size="xs"
          loading={loggingOut}
          onClick={handleLogout}
          leftSection={<LogoutIcon />}
        >
          Logout
        </Button>
      </div>
    </div>
  );
};

export default UserProfile;
