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
} from 'react-native';
import { ShoppingBag, ChevronRight, Clock, Banknote } from 'lucide-react-native';
import api from '../api/client';
import { colors } from '../theme/colors';

export default function OrderHistoryScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    try {
      setRefreshing(true);
      const res = await api.get('/customer/orders');
      setOrders(res.data?.orders || []);
    } catch (err) {
      console.log('Error fetching orders:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'DELIVERED':
        return '#0F8A5F';
      case 'CANCELLED':
      case 'REJECTED':
        return '#EF4444';
      default:
        return colors.primary;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ShoppingBag size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No Orders Yet</Text>
          <Text style={styles.emptySub}>You haven't ordered any delicious food yet.</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={fetchOrders} colors={[colors.primary]} />
          }
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.orderCard}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('OrderDetail', { orderId: item._id })}
            >
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.restaurantName}>{item.restaurantId?.name || 'Restaurant'}</Text>
                  <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
                  {(item.restaurantId?.phone || item.restaurantId?.ownerId?.phone) && (
                    <Text style={styles.restaurantPhoneBadge}>
                      📞 {item.restaurantId?.phone || item.restaurantId?.ownerId?.phone}
                    </Text>
                  )}
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.orderStatus) + '15' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(item.orderStatus) }]}>
                    {item.orderStatus.replace(/_/g, ' ')}
                  </Text>
                </View>
              </View>

              <View style={styles.itemsSummary}>
                {item.items.slice(0, 2).map((it, idx) => (
                  <Text key={idx} style={styles.itemText} numberOfLines={1}>
                    {it.quantity} × {it.name}
                  </Text>
                ))}
                {item.items.length > 2 && (
                  <Text style={styles.moreItemsText}>+{item.items.length - 2} more items</Text>
                )}
              </View>

              <View style={styles.cardBottom}>
                <View style={styles.priceMeta}>
                  <Text style={styles.finalAmount}>₹{item.finalAmount}</Text>
                  <Text style={styles.codLabel}>
                    {item.paymentStatus === 'PAID' ? '✓ Cash Collected' : 'Cash on Delivery Due'}
                  </Text>
                </View>
                <View style={styles.actionRow}>
                  <Text style={styles.viewDetailsText}>Track Order</Text>
                  <ChevronRight size={14} color={colors.primary} />
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    paddingBottom: 10,
  },
  restaurantName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  orderNumber: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: colors.textMuted,
    marginTop: 2,
  },
  restaurantPhoneBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 3,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  itemsSummary: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  itemText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  moreItemsText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    fontStyle: 'italic',
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
  },
  priceMeta: {},
  finalAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  codLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065F46',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewDetailsText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginTop: 12,
  },
  emptySub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
});
