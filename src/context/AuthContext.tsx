import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { DEMO_USERS } from '../services/mockData';
import { agroApi, store } from '../services/api';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  authLoading: boolean;
  isBackendConnected: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<User>;
  logout: () => void;
  switchDemoRole: (targetRole: UserRole) => void;
  updateProfile: (updated: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;

    void agroApi.checkBackendHealth().then((connected) => {
      if (!cancelled) setIsBackendConnected(connected);
    });

    const restoreSession = async () => {
      const token = localStorage.getItem('agro_auth_token');

      if (!token) {
        localStorage.removeItem('agro_active_user');
        if (!cancelled) {
          setUser(null);
          setAuthLoading(false);
        }
        return;
      }

      try {
        const verifiedUser = await agroApi.getCurrentUser();
        if (!cancelled) {
          setUser(verifiedUser);
          localStorage.setItem('agro_active_user', JSON.stringify(verifiedUser));
        }
      } catch {
        localStorage.removeItem('agro_auth_token');
        localStorage.removeItem('agro_active_user');
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    };

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (email: string, password: string, role: UserRole): Promise<User> => {
    const res = await agroApi.login(email, password, role);
    localStorage.setItem('agro_auth_token', res.token);
    localStorage.setItem('agro_active_user', JSON.stringify(res.user));
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('agro_active_user');
    localStorage.removeItem('agro_auth_token');
  };

  const switchDemoRole = (targetRole: UserRole) => {
    if (!import.meta.env.DEV) return;

    // Demo users are frontend-only; do not retain a real backend session.
    localStorage.removeItem('agro_auth_token');

    const targetUser =
      store.users.find((u) => u.role === targetRole) ||
      DEMO_USERS.find((u) => u.role === targetRole) ||
      DEMO_USERS[0];

    setUser(targetUser);
    localStorage.setItem('agro_active_user', JSON.stringify(targetUser));
  };

  const updateProfile = (updated: Partial<User>) => {
    if (!user) return;
    const newUser = { ...user, ...updated };
    setUser(newUser);
    localStorage.setItem('agro_active_user', JSON.stringify(newUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user ? user.role : null,
        isAuthenticated: !!user,
        authLoading,
        isBackendConnected,
        login,
        logout,
        switchDemoRole,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};



