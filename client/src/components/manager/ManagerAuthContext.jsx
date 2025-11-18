/*
 * ManagerAuthContext.jsx
 * -----------------------
 * - Provides global auth state for manager login using Google OAuth.
 * - Stores authorized manager profiles in sessionStorage.
 * - Ensures only whitelisted emails can access manager routes.
 * - Exposes login/logout helpers and an `isAuthorized` flag.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

const STORAGE_KEY = 'managerAuthUser';

// List of Google accounts allowed to access manager dashboard
export const MANAGER_WHITELIST = [
  'reveille.bubbletea@gmail.com',
  'mairaathar1@gmail.com',
  'atharmaira@tamu.edu',
  'em_ily@tamu.edu',
  'nikolaisteen@tamu.edu',
  'keerthanyaaarun@tamu.edu',
];

// Normalize whitelist for quick lookup
const whitelistSet = new Set(MANAGER_WHITELIST.map((email) => email.toLowerCase()));

const ManagerAuthContext = createContext(null);

// Loads previously authorized manager from sessionStorage (if still valid)
const loadStoredUser = () => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const email = parsed?.email?.toLowerCase();

    // Only restore if the stored user is still on the whitelist
    if (email && whitelistSet.has(email)) {
      return parsed;
    }

    // Otherwise clear invalid stored data
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    sessionStorage.removeItem(STORAGE_KEY);
  }
  return null;
};

// Wraps app sections that require manager authorization
export const ManagerAuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => loadStoredUser());

  // Attempts to log in using Google profile data
  const login = useCallback((profile) => {
    const normalizedEmail = profile?.email?.toLowerCase();
    if (!normalizedEmail || !whitelistSet.has(normalizedEmail)) {
      return false; // reject non-approved emails
    }

    // Sanitize stored data
    const sanitizedProfile = {
      email: profile.email,
      name: profile.name || '',
      picture: profile.picture || '',
      sub: profile.sub || '',
    };

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizedProfile));
    setUser(sanitizedProfile);
    return true;
  }, []);

  // Clears stored manager session
  const logout = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  // Memoized auth object so components re-render only when user changes
  const contextValue = useMemo(
    () => ({
      user,
      isAuthorized: Boolean(user),
      login,
      logout,
    }),
    [user, login, logout],
  );

  return (
    <ManagerAuthContext.Provider value={contextValue}>
      {children}
    </ManagerAuthContext.Provider>
  );
};

// Hook for accessing manager auth state + helpers
export const useManagerAuth = () => {
  const context = useContext(ManagerAuthContext);
  if (!context) {
    throw new Error('useManagerAuth must be used within a ManagerAuthProvider');
  }
  return context;
};
