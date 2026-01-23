import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        const profile = await api.getProfile();
        setUser(profile);
      } catch (error) {
        console.error('Auth check failed:', error);
        api.logout();
      }
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    await api.login(email, password);
    const profile = await api.getProfile();
    setUser(profile);
  };

  const register = async (email, password, secretQuestion, secretAnswer, name) => {
    await api.register(email, password, secretQuestion, secretAnswer, name);
    const profile = await api.getProfile();
    setUser(profile);
  };

  const logout = () => {
    api.logout();
    setUser(null);
  };

  const updateProfile = async (profileData) => {
    const updated = await api.updateProfile(profileData);
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
