import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserSession, Role } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: UserSession | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  quickSwitchRole: (role: Role) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const DEMO_CREDENTIALS: Record<Role, { email: string; pass: string; title: string; subtitle: string }> = {
  INSTITUTION_ADMIN: {
    email: 'principal@delhitechnical.edu.in',
    pass: 'Inst@123',
    title: 'Institution Administrator',
    subtitle: 'Delhi Institute of Engineering & Advanced Tech'
  },
  REVIEWER: {
    email: 'reviewer1@aicte.gov.in',
    pass: 'Reviewer@123',
    title: 'Expert Scrutiny Reviewer',
    subtitle: 'Prof. Arvind Sharma (Scrutiny Committee)'
  },
  APPROVING_AUTHORITY: {
    email: 'approver@aicte.gov.in',
    pass: 'Approver@123',
    title: 'Approving Authority',
    subtitle: 'Dr. Rajeshwar Rao (Regional Committee)'
  },
  SYSTEM_ADMIN: {
    email: 'admin@aicte.gov.in',
    pass: 'Admin@123',
    title: 'System Administrator',
    subtitle: 'AICTE Council HQ'
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem('aicte_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('aicte_access_token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function verifySession() {
      if (token) {
        try {
          const profile = await api.auth.getMe();
          setUser(profile);
          localStorage.setItem('aicte_user', JSON.stringify(profile));
        } catch {
          logout();
        }
      }
      setIsLoading(false);
    }
    verifySession();
  }, [token]);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const resp = await api.auth.login({ email, password: pass });
      localStorage.setItem('aicte_access_token', resp.access_token);
      localStorage.setItem('aicte_user', JSON.stringify(resp.user));
      setToken(resp.access_token);
      setUser(resp.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('aicte_access_token');
    localStorage.removeItem('aicte_user');
    setToken(null);
    setUser(null);
  };

  const quickSwitchRole = async (role: Role) => {
    const creds = DEMO_CREDENTIALS[role];
    if (creds) {
      await login(creds.email, creds.pass);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, quickSwitchRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
