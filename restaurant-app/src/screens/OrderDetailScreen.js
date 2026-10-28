import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
} from 'react-native';
import { ArrowLeft, CheckCircle2, Phone, MapPin, Banknote, ShieldAlert } from 'lucide-react-native';
import api from '../api/client';
import { colors } from '../theme/colors';

export default function OrderDetailScreen({ route, navigation }) {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmingCash, setConfirmingCash] = useState(false);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await api.get('/restaurant/orders');
      const found = res.data?.orders?.find((o) => o._id === orderId);
      setOrder(found || null);
    } catch (err) {
      console.log('Error fetching order detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const handleConfirmCash = async () => {
    if (!order) return;

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        `Confirm Cash Collection:\n\nHave you or your runner physically collected ₹${order.finalAmount} in cash from the customer for Order #${order.orderNumber}?`
      );
      if (!confirmed) return;

      setConfirmingCash(true);
      try {
        await api.patch(`/restaurant/orders/${order._id}/confirm-payment`);
        window.alert('✓ Cash Collection Confirmed!\n\nPayment status updated to PAID.');
        fetchOrder();
      } catch (err) {
        window.alert(`Error: ${err.message || 'Could not record cash collection'}`);
      } finally {
        setConfirmingCash(false);
      }
      return;
    }

    Alert.alert(
      'Confirm Cash Collection',
      `Have you or your runner physically collected ₹${order.finalAmount} in cash from the customer?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Confirm Cash Received',
          onPress: async () => {
            setConfirmingCash(true);
            try {
              await api.patch(`/restaurant/orders/${order._id}/confirm-payment`);
              Alert.alert('Cash Collection Confirmed', 'Payment status updated to PAID with audit log entry.');
              fetchOrder();
            } catch (err) {
              Alert.alert('Error', err.message || 'Could not record cash collection');
            } finally {
              setConfirmingCash(false);
            }
          },
        },
      ]
    );
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      await api.patch(`/restaurant/orders/${order._id}/status`, { status: newStatus });
      if (Platform.OS === 'web') {
        window.alert(`Order status updated to: ${newStatus.replace(/_/g, ' ')}`);
      } else {
        Alert.alert('Success', `Order status updated to ${newStatus.replace(/_/g, ' ')}`);
      }
      fetchOrder();
    } catch (err) {
      const msg = err.message || 'Status transition failed';
      if (Platform.OS === 'web') {
        window.alert(`Action Failed: ${msg}`);
      } else {
        Alert.alert('Action Failed', msg);
      }
    }
  };

  if (loading || !order) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order #{order.orderNumber}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* COD Cash Collection Block */}
        <View style={[styles.card, styles.codCard]}>
          <View style={styles.codTop}>
            <View style={styles.codIconCircle}>
              <Banknote size={24} color="#065F46" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.codTitle}>Cash on Delivery (COD)</Text>
              <Text style={styles.codAmountText}>Cash to Collect: ₹{order.finalAmount}</Text>
            </View>
            <View
              style={[
                styles.paidStatusBadge,
                { backgroundColor: order.paymentStatus === 'PAID' ? '#10B981' : '#F59E0B' },
              ]}
            >
              <Text style={styles.paidStatusText}>
                {order.paymentStatus === 'PAID' ? 'PAID' : 'PENDING'}
              </Text>
            </View>
          </View>

          {order.paymentStatus !== 'PAID' ? (
            <TouchableOpacity
              style={styles.confirmCashBtn}
              activeOpacity={0.85}
              disabled={confirmingCash}
              onPress={handleConfirmCash}
            >
              <Text style={styles.confirmCashText}>
                {confirmingCash ? 'Recording...' : '💵 Confirm Cash Received (₹' + order.finalAmount + ')'}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.cashCollectedNote}>
              <CheckCircle2 size={16} color="#065F46" />
              <Text style={styles.cashCollectedText}>
                Cash collected & verified on {new Date(order.paidAt || order.updatedAt).toLocaleTimeString()}
              </Text>
            </View>
          )}
        </View>

        {/* Order Lifecycle Workflow Controls */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Kitchen Workflow Status</Text>
          <View style={styles.currentStatusRow}>
            <Text style={styles.currentStatusLabel}>Current State:</Text>
            <Text style={styles.currentStatusValue}>{order.orderStatus.replace(/_/g, ' ')}</Text>
          </View>

          <View style={styles.workflowBtns}>
            {order.orderStatus === 'PLACED' && (
              <TouchableOpacity
                style={styles.wfBtn}
                onPress={() => handleUpdateStatus('CONFIRMED')}
              >
                <Text style={styles.wfBtnText}>Accept Order</Text>
              </TouchableOpacity>
            )}
            {order.orderStatus === 'CONFIRMED' && (
              <TouchableOpacity
                style={styles.wfBtn}
                onPress={() => handleUpdateStatus('PREPARING')}
              >
                <Text style={styles.wfBtnText}>Start Preparing Food</Text>
              </TouchableOpacity>
            )}
            {order.orderStatus === 'PREPARING' && (
              <TouchableOpacity
                style={styles.wfBtn}
                onPress={() => handleUpdateStatus('READY_FOR_DELIVERY')}
              >
                <Text style={styles.wfBtnText}>Food Ready - Send Delivery Runner</Text>
              </TouchableOpacity>
            )}
            {order.orderStatus === 'READY_FOR_DELIVERY' && (
              <TouchableOpacity
                style={[styles.wfBtn, { backgroundColor: '#059669' }]}
                onPress={() => handleUpdateStatus('DELIVERED')}
              >
                <Text style={styles.wfBtnText}>Mark Order as Delivered</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Customer & Address Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Customer & Delivery Destination</Text>
          <Text style={styles.custName}>{order.deliveryAddress?.recipientName}</Text>
          <Text style={styles.custPhone}>📞 {order.deliveryAddress?.phone}</Text>
          <Text style={styles.custAddress}>{order.deliveryAddress?.fullAddress}</Text>
          <Text style={styles.custCity}>
            {order.deliveryAddress?.city} - {order.deliveryAddress?.pincode}
          </Text>
          {order.customerNotes ? (
            <View style={styles.notesBox}>
              <Text style={styles.notesTitle}>Special Request:</Text>
              <Text style={styles.notesText}>{order.customerNotes}</Text>
            </View>
          ) : null}
        </View>

        {/* Ordered Food Items */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Items to Prepare</Text>
          {order.items?.map((it, idx) => (
            <View key={idx} style={styles.itemRow}>
              <Text style={styles.itemName}>{it.quantity} × {it.name}</Text>
              <Text style={styles.itemPrice}>₹{it.subtotal}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Customer Bill (COD):</Text>
            <Text style={styles.totalValue}>₹{order.finalAmount}</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  codCard: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  codTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  codIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  codTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#065F46',
  },
  codAmountText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#065F46',
    marginTop: 2,
  },
  paidStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  paidStatusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
  },
  confirmCashBtn: {
    backgroundColor: '#059669',
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmCashText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  cashCollectedNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#A7F3D0',
  },
  cashCollectedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 10,
  },
  currentStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  currentStatusLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  currentStatusValue: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.primary,
  },
  workflowBtns: {
    marginTop: 12,
  },
  wfBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  wfBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  custName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  custPhone: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
    marginTop: 2,
  },
  custAddress: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  custCity: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  notesBox: {
    marginTop: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FEF3C7',
  },
  notesTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#92400E',
  },
  notesText: {
    fontSize: 11,
    color: '#78350F',
    marginTop: 1,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  itemName: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '600',
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  totalValue: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.primary,
  },
});
