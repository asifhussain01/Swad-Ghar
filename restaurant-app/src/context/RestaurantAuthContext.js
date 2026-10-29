import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { setAuthHeader } from '../api/client';
import storage from '../utils/storage';

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
      if (res.data) {
        await storage.setItem('swadghar_partner_restaurant', res.data);
      }
    } catch (err) {
      console.log('No restaurant profile yet:', err.message);
      setRestaurant(null);
    }
  };

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedToken = await storage.getItem('swadghar_partner_token');
        const storedUser = await storage.getItem('swadghar_partner_user');
        const storedRestaurant = await storage.getItem('swadghar_partner_restaurant');
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(storedUser);
          setAuthHeader(storedToken);
          if (storedRestaurant) {
            setRestaurant(storedRestaurant);
          }
          // Refresh restaurant profile in background without blocking UI
          fetchMyRestaurant();
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
    if (res.data?.user?.role !== 'RESTAURANT_OWNER') {
      throw new Error('Access denied. Please log in with a Restaurant Owner account.');
    }
    setUser(res.data.user);
    setToken(res.data.token);
    setAuthHeader(res.data.token);
    await storage.setItem('swadghar_partner_token', res.data.token);
    await storage.setItem('swadghar_partner_user', res.data.user);
    await fetchMyRestaurant();
    return res.data;
  };

  const logout = async () => {
    setUser(null);
    setRestaurant(null);
    setToken(null);
    setAuthHeader(null);
    await storage.removeItem('swadghar_partner_token');
    await storage.removeItem('swadghar_partner_user');
    await storage.removeItem('swadghar_partner_restaurant');
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
