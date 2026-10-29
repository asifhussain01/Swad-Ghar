import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { setAuthHeader } from '../api/client';
import storage from '../utils/storage';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore persisted session when app opens
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedToken = await storage.getItem('swadghar_customer_token');
        const storedUser = await storage.getItem('swadghar_customer_user');
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(storedUser);
          setAuthHeader(storedToken);
        }
      } catch (err) {
        console.log('Session restore error:', err);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    setUser(res.data.user);
    setToken(res.data.token);
    setAuthHeader(res.data.token);
    await storage.setItem('swadghar_customer_token', res.data.token);
    await storage.setItem('swadghar_customer_user', res.data.user);
    return res.data;
  };

  const register = async (name, email, phone, password) => {
    const res = await api.post('/auth/register', {
      name,
      email,
      phone,
      password,
      role: 'CUSTOMER',
    });
    setUser(res.data.user);
    setToken(res.data.token);
    setAuthHeader(res.data.token);
    await storage.setItem('swadghar_customer_token', res.data.token);
    await storage.setItem('swadghar_customer_user', res.data.user);
    return res.data;
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    setAuthHeader(null);
    await storage.removeItem('swadghar_customer_token');
    await storage.removeItem('swadghar_customer_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        isAuthenticated: Boolean(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
