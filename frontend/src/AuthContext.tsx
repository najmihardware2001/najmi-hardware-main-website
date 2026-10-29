import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, type UserProfile } from './services/api';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  switchTestUser: (role: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  refresh: async () => {},
  switchTestUser: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const expired=()=>{setUser(null);setLoading(false)};
    window.addEventListener('najmi:admin-session-expired',expired);
    async function loadUser() {
      const token = api.getToken();
      if (token) {
        try {
          const res = await api.getMe();
          if (res.success) {
            setUser(res.user);
          }
        } catch {
          api.setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    }
    loadUser();
    return()=>window.removeEventListener('najmi:admin-session-expired',expired);
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await api.login(email, pass);
    setUser(res.user);
  };

  const refresh = async () => {
    const res = await api.getMe();
    if (res.success) setUser(res.user);
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  const switchTestUser = async (role: string) => {
    if (import.meta.env.PROD) {
      console.warn('Test user switching is strictly disabled in production builds.');
      return;
    }
    const roleEmailMap: Record<string, string> = {
      OWNER: 'owner@najmi.com.kw',
      MANAGER: 'manager@najmi.com.kw',
      CASHIER: 'cashier@najmi.com.kw',
      WHOLESALE_SALES: 'sales@najmi.com.kw',
      INVENTORY_STAFF: 'inventory@najmi.com.kw',
      ACCOUNTANT: 'accountant@najmi.com.kw',
    };
    const email = roleEmailMap[role] || 'owner@najmi.com.kw';
    const devPassword = import.meta.env.VITE_DEV_ADMIN_PASSWORD;
    if (!devPassword) {
      console.warn('Auto-login disabled: VITE_DEV_ADMIN_PASSWORD is not configured.');
      return;
    }
    await login(email, devPassword);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh, switchTestUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
