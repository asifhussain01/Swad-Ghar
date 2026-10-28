import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { setAuthHeader } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    setUser(res.data.user);
    setToken(res.data.token);
    setAuthHeader(res.data.token);
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
    return res.data;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setAuthHeader(null);
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
