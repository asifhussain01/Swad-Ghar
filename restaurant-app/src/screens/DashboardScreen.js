import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Image,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import {
  Store,
  ShoppingBag,
  Clock,
  CheckCircle,
  Banknote,
  AlertCircle,
  ChevronRight,
  TrendingUp,
  Volume2,
} from 'lucide-react-native';
import api from '../api/client';
import { colors } from '../theme/colors';
import { useRestaurantAuth } from '../context/RestaurantAuthContext';
import { useOrderNotification } from '../context/OrderNotificationContext';

export default function DashboardScreen({ navigation }) {
  const { restaurant, fetchMyRestaurant } = useRestaurantAuth();
  const notificationCtx = useOrderNotification();
  const lastOrderTimestamp = notificationCtx?.lastOrderTimestamp;
  const [reports, setReports] = useState(null);
  const [activeOrders, setActiveOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOpen, setIsOpen] = useState(restaurant?.isOpen ?? true);

  const loadDashboard = async () => {
    try {
      setRefreshing(true);
      const [repRes, ordRes] = await Promise.all([
        api.get('/restaurant/reports'),
        api.get('/restaurant/orders', { params: { limit: 10 } }),
      ]);
      setReports(repRes.data);
      setActiveOrders(ordRes.data?.orders || []);
      if (restaurant) {
        setIsOpen(restaurant.isOpen);
      }
    } catch (err) {
      console.log('Dashboard load error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 6000);
    return () => clearInterval(interval);
  }, [lastOrderTimestamp]);

  const handleToggleOpen = async (val) => {
    setIsOpen(val);
    try {
      await api.patch('/restaurant/me', { isOpen: val });
      await fetchMyRestaurant();
    } catch (err) {
      setIsOpen(!val);
      alert('Could not update open status: ' + err.message);
    }
  };

  const summary = reports?.summary || {};
  const countsByStatus = reports?.ordersByStatus || {};

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar with Kitchen Toggle */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Image
            source={require('../../assets/icon.png')}
            style={{ width: 34, height: 34, borderRadius: 17, marginRight: 10 }}
          />
          <View>
            <Text style={styles.restaurantName} numberOfLines={1}>
              {restaurant?.name || 'My Kitchen'}
            </Text>
            <Text style={styles.restaurantSub}>
              Partner Portal &bull; {restaurant?.address?.city || 'Local Delivery'}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity
            onPress={() => notificationCtx?.testRingSound && notificationCtx.testRingSound()}
            style={styles.testRingBtn}
            activeOpacity={0.7}
          >
            <Volume2 size={15} color="#EA580C" />
            <Text style={styles.testRingText}>Test Ring</Text>
          </TouchableOpacity>

          <View style={styles.openSwitchContainer}>
            <Text style={[styles.switchLabel, { color: isOpen ? colors.success : colors.textMuted }]}>
              {isOpen ? 'ONLINE' : 'OFFLINE'}
            </Text>
            <Switch
              value={isOpen}
              onValueChange={handleToggleOpen}
              trackColor={{ false: '#CBD5E1', true: '#86EFAC' }}
              thumbColor={isOpen ? colors.success : '#94A3B8'}
            />
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadDashboard} />}
      >
        {/* Verification Status Banner */}
        {restaurant?.approvalStatus !== 'APPROVED' && (
          <View
            style={[
              styles.statusBanner,
              { backgroundColor: restaurant?.approvalStatus === 'PENDING' ? '#FFFBEB' : '#FEF2F2' },
            ]}
          >
            <AlertCircle
              size={20}
              color={restaurant?.approvalStatus === 'PENDING' ? '#D97706' : colors.error}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.statusBannerTitle,
                  { color: restaurant?.approvalStatus === 'PENDING' ? '#92400E' : colors.error },
                ]}
              >
                Verification Status: {restaurant?.approvalStatus}
              </Text>
              <Text style={styles.statusBannerSub}>
                {restaurant?.approvalStatus === 'PENDING'
                  ? 'Your restaurant documents are under administrative review.'
                  : restaurant?.rejectionReason || 'Account suspended.'}
              </Text>
            </View>
          </View>
        )}

        {/* Primary Metric Tiles */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <View style={styles.metricTop}>
              <Text style={styles.metricLabel}>TODAY'S ORDERS</Text>
              <ShoppingBag size={16} color={colors.primary} />
            </View>
            <Text style={styles.metricValue}>{summary.todayOrdersCount || 0}</Text>
            <Text style={styles.metricSub}>Placed today</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricTop}>
              <Text style={styles.metricLabel}>CASH COLLECTED</Text>
              <Banknote size={16} color="#059669" />
            </View>
            <Text style={[styles.metricValue, { color: '#059669' }]}>
              ₹{(summary.todaySales || 0).toLocaleString()}
            </Text>
            <Text style={styles.metricSub}>Confirmed COD cash</Text>
          </View>
        </View>

        {/* Order Workflow Queues */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Live Kitchen Queues</Text>

          <View style={styles.queueGrid}>
            <TouchableOpacity
              style={[styles.queueBox, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}
              onPress={() => navigation.navigate('OrdersTab', { filter: 'PLACED' })}
            >
              <Text style={[styles.queueCount, { color: '#1D4ED8' }]}>{countsByStatus.placed || 0}</Text>
              <Text style={styles.queueLabel}>New Orders</Text>
              <Text style={styles.queueSub}>Requires Action</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.queueBox, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}
              onPress={() => navigation.navigate('OrdersTab', { filter: 'PREPARING' })}
            >
              <Text style={[styles.queueCount, { color: '#B45309' }]}>{countsByStatus.preparing || 0}</Text>
              <Text style={styles.queueLabel}>Preparing</Text>
              <Text style={styles.queueSub}>Cooking in kitchen</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.queueBox, { backgroundColor: '#FAF5FF', borderColor: '#E9D5FF' }]}
              onPress={() => navigation.navigate('OrdersTab', { filter: 'READY_FOR_DELIVERY' })}
            >
              <Text style={[styles.queueCount, { color: '#7E22CE' }]}>{countsByStatus.readyForDelivery || 0}</Text>
              <Text style={styles.queueLabel}>Out for Delivery</Text>
              <Text style={styles.queueSub}>Self-arranged runner</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Incoming Orders */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>Recent Incoming Orders</Text>
            <TouchableOpacity onPress={() => navigation.navigate('OrdersTab')}>
              <Text style={styles.viewAllLink}>View All</Text>
            </TouchableOpacity>
          </View>

          {activeOrders.length === 0 ? (
            <Text style={styles.emptyText}>No live orders at this moment.</Text>
          ) : (
            activeOrders.slice(0, 4).map((ord) => (
              <TouchableOpacity
                key={ord._id}
                style={styles.orderRow}
                onPress={() => navigation.navigate('OrderDetail', { orderId: ord._id })}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.orderNumber}>#{ord.orderNumber}</Text>
                  <Text style={styles.orderCustomer}>{ord.customerId?.name} ({ord.customerId?.phone})</Text>
                  <Text style={styles.orderItems}>
                    {ord.items?.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                  </Text>
                </View>

                <View style={styles.orderRight}>
                  <Text style={styles.orderAmount}>₹{ord.finalAmount}</Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{ord.orderStatus.replace(/_/g, ' ')}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    maxWidth: 200,
  },
  restaurantSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  testRingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  testRingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EA580C',
  },
  openSwitchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  switchLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  statusBannerTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  statusBannerSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.text,
    marginTop: 6,
  },
  metricSub: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAllLink: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  queueGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  queueBox: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  queueCount: {
    fontSize: 20,
    fontWeight: '900',
  },
  queueLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.text,
    marginTop: 2,
    textAlign: 'center',
  },
  queueSub: {
    fontSize: 9,
    color: colors.textSecondary,
    marginTop: 1,
    textAlign: 'center',
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 8,
  },
  orderNumber: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
    fontFamily: 'monospace',
  },
  orderCustomer: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 1,
  },
  orderItems: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  orderRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  orderAmount: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.text,
  },
  badge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  emptyText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: 10,
  },
});
