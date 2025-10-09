// src/context/AuthContext.tsx
import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useMemo,
} from 'react';
import { UserProfile, Role } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>; // ✅ needed by App.tsx
  login: (role: Role) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mockUsers: Record<Role, UserProfile> = {
  [Role.Admin]: {
    uid: 'admin-01',
    email: 'admin@bounty.farm',
    role: Role.Admin,
    name: 'Admin User',
  },
  [Role.HatcheryClerk]: {
    uid: 'clerk-01',
    email: 'hatchery.clerk@bounty.farm',
    role: Role.HatcheryClerk,
    name: 'Hatchery Clerk',
  },
  [Role.SalesClerk]: {
    uid: 'sales-01',
    email: 'sales.clerk@bounty.farm',
    role: Role.SalesClerk,
    name: 'Sales Clerk',
  },
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);

  const login = (role: Role) => {
    const mockUser = mockUsers[role];
    if (mockUser) setUser(mockUser);
  };

  const logout = () => setUser(null);

  const value = useMemo(
    () => ({ user, setUser, login, logout }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
