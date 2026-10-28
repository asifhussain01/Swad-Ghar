import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Platform, Alert } from 'react-native';
import io from 'socket.io-client';
import { useRestaurantAuth } from './RestaurantAuthContext';
import { getSocketURL } from '../api/client';
import api from '../api/client';
import { orderRingtone } from '../utils/orderRingtone';
import IncomingOrderModal from '../components/IncomingOrderModal';
import { navigationRef } from '../navigation/navigationRef';

const OrderNotificationContext = createContext(null);

export const OrderNotificationProvider = ({ children }) => {
  const { user, restaurant, fetchMyRestaurant } = useRestaurantAuth();
  const [incomingOrder, setIncomingOrder] = useState(null);
  const [lastOrderTimestamp, setLastOrderTimestamp] = useState(Date.now());
  const [isRinging, setIsRinging] = useState(false);
  const knownOrderIdsRef = useRef(new Set());
  const initialLoadDoneRef = useRef(false);

  const userId = user?._id || user?.id;
  const restaurantId = restaurant?._id || restaurant?.id;

  // Auto-fetch restaurant profile if user is authenticated but restaurant is not yet loaded
  useEffect(() => {
    if (user && !restaurant && fetchMyRestaurant) {
      fetchMyRestaurant();
    }
  }, [user, restaurant]);

  // Pre-seed known order IDs so existing placed orders don't trigger loud ringing on initial app startup
  useEffect(() => {
    if (!restaurantId) return;

    api.get('/restaurant/orders', { params: { status: 'PLACED', limit: 20 } })
      .then((res) => {
        const orders = res?.data?.orders || [];
        orders.forEach((o) => {
          if (o?._id) knownOrderIdsRef.current.add(o._id.toString());
        });
        initialLoadDoneRef.current = true;
      })
      .catch(() => {
        initialLoadDoneRef.current = true;
      });
  }, [restaurantId]);

  // Real-time WebSocket connection & Background Heartbeat
  useEffect(() => {
    if (!restaurantId || !userId) return;

    const socketUrl = getSocketURL();
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 25,
      reconnectionDelay: 1500,
      timeout: 10000,
    });

    const joinRooms = () => {
      socket.emit('join_restaurant_room', restaurantId.toString());
      socket.emit('join_user_room', userId.toString());
    };

    socket.on('connect', () => {
      joinRooms();
    });

    socket.on('reconnect', () => {
      joinRooms();
    });

    const triggerNewOrder = (orderData) => {
      if (!orderData) return;
      const orderIdStr = (orderData.orderId || orderData._id || '').toString();

      if (orderIdStr) {
        knownOrderIdsRef.current.add(orderIdStr);
      }

      setIncomingOrder(orderData);
      setLastOrderTimestamp(Date.now());
      setIsRinging(true);
      orderRingtone.startRingtone();
    };

    // 1. Direct real-time kitchen room event
    socket.on('new_incoming_order', (orderData) => {
      triggerNewOrder(orderData);
    });

    // 2. Direct real-time owner user room event
    socket.on('notification', async (notif) => {
      setLastOrderTimestamp(Date.now());
      if (notif?.type === 'NEW_ORDER' && notif?.referenceId) {
        const refIdStr = notif.referenceId.toString();
        if (!knownOrderIdsRef.current.has(refIdStr)) {
          knownOrderIdsRef.current.add(refIdStr);
          try {
            const ordRes = await api.get(`/restaurant/orders/${refIdStr}`);
            if (ordRes?.data) {
              triggerNewOrder({
                orderId: ordRes.data._id,
                orderNumber: ordRes.data.orderNumber,
                finalAmount: ordRes.data.finalAmount,
                itemCount: ordRes.data.items ? ordRes.data.items.length : 0,
                items: ordRes.data.items || [],
                deliveryAddress: ordRes.data.deliveryAddress,
                customerNotes: ordRes.data.customerNotes || '',
                paymentMethod: ordRes.data.paymentMethod || 'COD',
                paymentStatus: ordRes.data.paymentStatus || 'PENDING',
                createdAt: ordRes.data.createdAt,
              });
            }
          } catch (e) {
            // Ignore
          }
        }
      }
    });

    // 3. Fail-Safe 3.5-Second Live Heartbeat
    // Polls for PLACED orders every 3.5 seconds in the background
    // Guarantees orders show up automatically without any manual page refresh!
    const pollInterval = setInterval(async () => {
      if (!initialLoadDoneRef.current) return;

      try {
        const res = await api.get('/restaurant/orders', {
          params: { status: 'PLACED', limit: 5 },
        });
        const orders = res?.data?.orders || [];
        if (orders.length > 0) {
          for (const ord of orders) {
            const ordIdStr = ord._id.toString();
            if (!knownOrderIdsRef.current.has(ordIdStr)) {
              knownOrderIdsRef.current.add(ordIdStr);
              triggerNewOrder({
                orderId: ord._id,
                orderNumber: ord.orderNumber,
                finalAmount: ord.finalAmount,
                itemCount: ord.items ? ord.items.length : 0,
                items: ord.items || [],
                deliveryAddress: ord.deliveryAddress,
                customerNotes: ord.customerNotes || '',
                paymentMethod: ord.paymentMethod || 'COD',
                paymentStatus: ord.paymentStatus || 'PENDING',
                createdAt: ord.createdAt,
              });
              break;
            }
          }
        }
      } catch (e) {
        // Silent poll ignore
      }
    }, 3500);

    return () => {
      clearInterval(pollInterval);
      orderRingtone.stopRingtone();
      socket.disconnect();
    };
  }, [restaurantId, userId]);

  const testRingSound = () => {
    orderRingtone.testRing();
  };

  const muteRingtone = () => {
    orderRingtone.stopRingtone();
    setIsRinging(false);
  };

  const dismissIncomingOrder = () => {
    orderRingtone.stopRingtone();
    setIsRinging(false);
    setIncomingOrder(null);
  };

  const viewDetailsIncomingOrder = () => {
    const orderId = incomingOrder?.orderId || incomingOrder?._id;
    dismissIncomingOrder();

    if (orderId && navigationRef.isReady()) {
      navigationRef.navigate('OrderDetail', { orderId });
    }
  };

  const acceptIncomingOrder = async () => {
    const orderId = incomingOrder?.orderId || incomingOrder?._id;
    if (!orderId) return;

    muteRingtone();

    try {
      await api.patch(`/restaurant/orders/${orderId}/status`, {
        status: 'CONFIRMED',
      });
      setLastOrderTimestamp(Date.now());
      dismissIncomingOrder();

      if (navigationRef.isReady()) {
        navigationRef.navigate('OrderDetail', { orderId });
      }
    } catch (err) {
      const msg = err.message || 'Could not accept order.';
      if (Platform.OS === 'web') {
        window.alert(`Error: ${msg}`);
      } else {
        Alert.alert('Error', msg);
      }
    }
  };

  return (
    <OrderNotificationContext.Provider
      value={{
        incomingOrder,
        lastOrderTimestamp,
        isRinging,
        muteRingtone,
        testRingSound,
      }}
    >
      {children}
      <IncomingOrderModal
        order={incomingOrder}
        visible={Boolean(incomingOrder)}
        onAccept={acceptIncomingOrder}
        onViewDetails={viewDetailsIncomingOrder}
        onDismiss={dismissIncomingOrder}
        onMute={muteRingtone}
        isRinging={isRinging}
      />
    </OrderNotificationContext.Provider>
  );
};

export const useOrderNotification = () => useContext(OrderNotificationContext);
