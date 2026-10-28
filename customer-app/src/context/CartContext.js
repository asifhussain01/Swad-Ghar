import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState({
    restaurant: null,
    items: [],
    itemSubtotal: 0,
    deliveryFee: 0,
    finalAmount: 0,
    itemCount: 0,
  });
  const [loading, setLoading] = useState(false);

  const fetchCart = async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const res = await api.get('/customer/cart');
      setCart(res.data);
    } catch (err) {
      console.log('Cart fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      setCart({
        restaurant: null,
        items: [],
        itemSubtotal: 0,
        deliveryFee: 0,
        finalAmount: 0,
        itemCount: 0,
      });
    }
  }, [isAuthenticated]);

  const updateQuantity = async (menuItemId, quantity) => {
    try {
      const res = await api.post('/customer/cart/items', { menuItemId, quantity });
      setCart(res.data);
      return res.data;
    } catch (err) {
      alert(err.message || 'Failed to update item in cart');
      throw err;
    }
  };

  const removeItem = async (menuItemId) => {
    try {
      const res = await api.delete(`/customer/cart/items/${menuItemId}`);
      setCart(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const clearCart = async () => {
    try {
      const res = await api.delete('/customer/cart');
      setCart(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const getItemQuantity = (menuItemId) => {
    const item = cart.items?.find((i) => i.menuItemId === menuItemId);
    return item ? item.quantity : 0;
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        fetchCart,
        updateQuantity,
        removeItem,
        clearCart,
        getItemQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
