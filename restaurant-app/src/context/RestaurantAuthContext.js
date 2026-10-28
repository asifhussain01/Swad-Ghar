import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { setAuthHeader } from '../api/client';

const RestaurantAuthContext = createContext(null);

export const RestaurantAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMyRestaurant = async () => {
    try {
      const res = await api.get('/restaurant/me');
      setRestaurant(res.data);
    } catch (err) {
      console.log('No restaurant profile yet:', err.message);
      setRestaurant(null);
    }
  };

  useEffect(() => {
    // Check if token is persisted or initialize clean state
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data?.user?.role !== 'RESTAURANT_OWNER') {
      throw new Error('Access denied. Please log in with a Restaurant Owner account.');
    }
    setUser(res.data.user);
    setToken(res.data.token);
    setAuthHeader(res.data.token);
    await fetchMyRestaurant();
    return res.data;
  };

  const logout = () => {
    setUser(null);
    setRestaurant(null);
    setToken(null);
    setAuthHeader(null);
  };

  return (
    <RestaurantAuthContext.Provider
      value={{
        user,
        restaurant,
        token,
        loading,
        login,
        logout,
        fetchMyRestaurant,
        isAuthenticated: Boolean(user),
      }}
    >
      {children}
    </RestaurantAuthContext.Provider>
  );
};

export const useRestaurantAuth = () => useContext(RestaurantAuthContext);
