import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';
import { User, Dataset } from '../types';

interface AuthContextType {
  user: User | null;
  activeDataset: Dataset | null;
  datasets: Dataset[];
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  setActiveDataset: (dataset: Dataset | null) => void;
  refreshDatasets: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [activeDataset, setActiveDataset] = useState<Dataset | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshDatasets = async () => {
    try {
      const list = await api.getDatasets();
      setDatasets(list);
      if (list.length > 0 && !activeDataset) {
        setActiveDataset(list[0]);
      }
    } catch (e) {
      console.error('Failed to load datasets:', e);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('readmit_token');
      if (token) {
        try {
          const profile = await api.getMe();
          setUser(profile);
          await refreshDatasets();
        } catch {
          localStorage.removeItem('readmit_token');
          setUser(null);
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password);
    localStorage.setItem('readmit_token', res.access_token);
    setUser(res.user);
    await refreshDatasets();
  };

  const register = async (data: any) => {
    const res = await api.register(data);
    localStorage.setItem('readmit_token', res.access_token);
    setUser(res.user);
    await refreshDatasets();
  };

  const logout = () => {
    localStorage.removeItem('readmit_token');
    setUser(null);
    setActiveDataset(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        activeDataset,
        datasets,
        isLoading,
        login,
        register,
        logout,
        setActiveDataset,
        refreshDatasets
      }}
    >
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
