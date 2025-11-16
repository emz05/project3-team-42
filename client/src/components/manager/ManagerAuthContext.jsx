import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

const STORAGE_KEY = 'managerAuthUser';

export const MANAGER_WHITELIST = [
  'reveille.bubbletea@gmail.com',
  'mairaathar1@gmail.com',
  'atharmaira@tamu.edu',
  'em_ily@tamu.edu',
  'nikolaisteen@tamu.edu',
  'keerthanyaaarun@tamu.edu',
];

const whitelistSet = new Set(MANAGER_WHITELIST.map((email) => email.toLowerCase()));

const ManagerAuthContext = createContext(null);

const loadStoredUser = () => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const email = parsed?.email?.toLowerCase();
    if (email && whitelistSet.has(email)) {
      return parsed;
    }
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    sessionStorage.removeItem(STORAGE_KEY);
  }
  return null;
};

export const ManagerAuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => loadStoredUser());

  const login = useCallback((profile) => {
    const normalizedEmail = profile?.email?.toLowerCase();
    if (!normalizedEmail || !whitelistSet.has(normalizedEmail)) {
      return false;
    }

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

  const logout = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

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

export const useManagerAuth = () => {
  const context = useContext(ManagerAuthContext);
  if (!context) {
    throw new Error('useManagerAuth must be used within a ManagerAuthProvider');
  }
  return context;
};
