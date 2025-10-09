// src/context/AuthContext.tsx
import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useMemo,
  useEffect,
} from 'react';
import { Role, UserProfile } from '../types';
import { supabase } from '../src/supabase';

interface AuthContextType {
  user: UserProfile | null;
  setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const Ctx = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Custom login function that checks staff_table
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Get user from staff_table
      const { data: staffData, error } = await supabase
        .from('staff_table')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !staffData) {
        console.error('User not found:', error);
        return false;
      }

      // Check password from database
      const isValidPassword = password === staffData.password;
      
      if (!isValidPassword) {
        console.error('Invalid password');
        return false;
      }

      // Set user in context
      const userData = {
        id: staffData.id,
        email: staffData.email,
        name: staffData.name,
        role: staffData.role as Role,
        password: staffData.password,
      };
      
      setUser(userData);
      
      // Store in localStorage for persistence across refreshes
      localStorage.setItem('user', JSON.stringify(userData));

      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  // Check for existing session on app load
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const value = useMemo(
    () => ({ user, setUser, login, logout, loading }),
    [user, loading]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
