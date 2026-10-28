import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('swadghar_admin_user');
    const token = localStorage.getItem('swadghar_admin_token');

    if (storedUser && token) {
      try {
        setAdmin(JSON.parse(storedUser));
      } catch (err) {
        localStorage.removeItem('swadghar_admin_user');
        localStorage.removeItem('swadghar_admin_token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data?.user?.role !== 'ADMIN') {
      throw new Error('Access denied. Administrator privileges required.');
    }
    localStorage.setItem('swadghar_admin_token', res.data.token);
    localStorage.setItem('swadghar_admin_user', JSON.stringify(res.data.user));
    setAdmin(res.data.user);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('swadghar_admin_token');
    localStorage.removeItem('swadghar_admin_user');
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout, isAuthenticated: Boolean(admin) }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
