import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  Alert,
  Platform,
} from 'react-native';
import { Clock, MapPin, Phone, CheckCircle, XCircle, Banknote, ChevronRight } from 'lucide-react-native';
import api from '../api/client';
import { colors } from '../theme/colors';
import { useOrderNotification } from '../context/OrderNotificationContext';

const TABS = [
  { key: '', label: 'All' },
  { key: 'PLACED', label: 'New' },
  { key: 'CONFIRMED', label: 'Accepted' },
  { key: 'PREPARING', label: 'Preparing' },
  { key: 'READY_FOR_DELIVERY', label: 'Out for Delivery' },
  { key: 'DELIVERED', label: 'Delivered' },
];

export default function OrdersScreen({ route, navigation }) {
  const initialFilter = route.params?.filter || '';
  const [activeTab, setActiveTab] = useState(initialFilter);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const notificationCtx = useOrderNotification();
  const lastOrderTimestamp = notificationCtx?.lastOrderTimestamp;

  const fetchOrders = async () => {
    try {
      setRefreshing(true);
      const params = {};
      if (activeTab) params.status = activeTab;
      const res = await api.get('/restaurant/orders', { params });
      setOrders(res.data?.orders || []);
    } catch (err) {
      console.log('Orders error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 6000);
    return () => clearInterval(interval);
  }, [activeTab, lastOrderTimestamp]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await api.patch(`/restaurant/orders/${orderId}/status`, { status: newStatus });
      fetchOrders();
    } catch (err) {
      const msg = err.message || 'Status transition rejected.';
      if (Platform.OS === 'web') {
        window.alert(`Action Failed: ${msg}`);
      } else {
        Alert.alert('Action Failed', msg);
      }
    }
  };

  const handleReject = async (orderId) => {
    let reason = 'Restaurant kitchen at capacity';

    if (Platform.OS === 'web') {
      const input = window.prompt('Enter reason for rejecting order:', reason);
      if (input === null) return; // user cancelled prompt
      reason = input.trim() || reason;
      try {
        await api.patch(`/restaurant/orders/${orderId}/status`, {
          status: 'REJECTED',
          rejectionReason: reason,
        });
        fetchOrders();
      } catch (err) {
        window.alert(`Error: ${err.message}`);
      }
      return;
    }

    if (Alert.prompt) {
      Alert.prompt('Reject Order', 'Enter reason for rejection:', async (input) => {
        if (!input) return;
        try {
          await api.patch(`/restaurant/orders/${orderId}/status`, {
            status: 'REJECTED',
            rejectionReason: input,
          });
          fetchOrders();
        } catch (err) {
          Alert.alert('Error', err.message);
        }
      });
    } else {
      handleUpdateStatus(orderId, 'REJECTED');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Order Management</Text>
      </View>

      {/* Status Filter Tabs */}
      <View style={styles.tabContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={TABS}
          keyExtractor={(item) => item.key}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === item.key && styles.tabBtnActive]}
              onPress={() => setActiveTab(item.key)}
            >
              <Text style={[styles.tabText, activeTab === item.key && styles.tabTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No orders in this category.</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchOrders} />}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.orderCard}>
              <View style={styles.orderTop}>
                <div>
                  <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
                  <Text style={styles.orderTime}>
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </div>
                <View style={styles.amountPill}>
                  <Text style={styles.amountText}>₹{item.finalAmount}</Text>
                  <Text style={styles.codSub}>COD</Text>
                </View>
              </View>

              {/* Customer and Address */}
              <View style={styles.customerBox}>
                <Text style={styles.custName}>👤 {item.customerId?.name} &bull; 📞 {item.deliveryAddress?.phone}</Text>
                <Text style={styles.custAddress} numberOfLines={2}>
                  📍 {item.deliveryAddress?.fullAddress}, {item.deliveryAddress?.city}
                </Text>
              </View>

              {/* Items */}
              <View style={styles.itemsBox}>
                {item.items?.map((it, idx) => (
                  <Text key={idx} style={styles.itemLine}>
                    {it.quantity}x {it.name} (₹{it.subtotal})
                  </Text>
                ))}
              </View>

              {/* Action Buttons based on Order Status */}
              <View style={styles.actionRow}>
                {item.orderStatus === 'PLACED' && (
                  <>
                    <TouchableOpacity
                      style={styles.rejectBtn}
                      onPress={() => handleReject(item._id)}
                    >
                      <Text style={styles.rejectBtnText}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.acceptBtn}
                      onPress={() => handleUpdateStatus(item._id, 'CONFIRMED')}
                    >
                      <Text style={styles.acceptBtnText}>Accept Order</Text>
                    </TouchableOpacity>
                  </>
                )}

                {item.orderStatus === 'CONFIRMED' && (
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleUpdateStatus(item._id, 'PREPARING')}
                  >
                    <Text style={styles.actionBtnText}>Start Preparing</Text>
                  </TouchableOpacity>
                )}

                {item.orderStatus === 'PREPARING' && (
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleUpdateStatus(item._id, 'READY_FOR_DELIVERY')}
                  >
                    <Text style={styles.actionBtnText}>Dispatch (Out for Delivery)</Text>
                  </TouchableOpacity>
                )}

                {item.orderStatus === 'READY_FOR_DELIVERY' && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#059669' }]}
                    onPress={() => handleUpdateStatus(item._id, 'DELIVERED')}
                  >
                    <Text style={styles.actionBtnText}>Mark as Delivered</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.inspectBtn}
                  onPress={() => navigation.navigate('OrderDetail', { orderId: item._id })}
                >
                  <Text style={styles.inspectBtnText}>View Details</Text>
                  <ChevronRight size={14} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  tabContainer: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  tabBtnActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: '#fff',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
    gap: 14,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  orderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
  },
  orderNumber: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
    fontFamily: 'monospace',
  },
  orderTime: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 1,
  },
  amountPill: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.text,
  },
  codSub: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
  },
  customerBox: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  custName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  custAddress: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  itemsBox: {
    paddingVertical: 8,
  },
  itemLine: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  rejectBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  rejectBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.error,
  },
  acceptBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  acceptBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fff',
  },
  actionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fff',
  },
  inspectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    gap: 2,
  },
  inspectBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
  },
});
