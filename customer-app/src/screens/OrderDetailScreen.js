import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  SafeAreaView,
  Platform,
  Linking,
  Image,
} from 'react-native';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  ChefHat,
  Truck,
  PackageCheck,
  XCircle,
  Star,
  Banknote,
  MapPin,
  Phone,
  PhoneCall,
  Store,
  User,
} from 'lucide-react-native';
import io from 'socket.io-client';
import api, { getSocketURL } from '../api/client';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

const TIMELINE_STEPS = [
  { key: 'PLACED', label: 'Order Placed', icon: Clock },
  { key: 'CONFIRMED', label: 'Accepted by Kitchen', icon: CheckCircle2 },
  { key: 'PREPARING', label: 'Cooking in Progress', icon: ChefHat },
  { key: 'READY_FOR_DELIVERY', label: 'Out for Delivery (By Restaurant)', icon: Truck },
  { key: 'DELIVERED', label: 'Delivered', icon: PackageCheck },
];

const CANCEL_REASONS = [
  'Placed order by mistake',
  'Want to change food items',
  'Incorrect delivery address',
  'Changed my mind',
  'Taking longer than expected',
];

export default function OrderDetailScreen({ route, navigation }) {
  const { orderId } = route.params;
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  // Cancellation modal states
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState(CANCEL_REASONS[0]);

  // Review modal states
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/customer/orders/${orderId}`);
      setOrder(res.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();

    if (!user?._id) return;
    const socket = io(getSocketURL(), {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
    });

    socket.on('connect', () => {
      socket.emit('join_user_room', user._id);
    });

    socket.on('order_status_update', (data) => {
      if (data?.orderId === orderId) {
        fetchOrderDetail();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [orderId, user?._id]);

  const handleCancelOrder = () => {
    setShowCancelModal(true);
  };

  const executeCancel = async (reason) => {
    const finalReason = (reason && reason.trim()) || 'Customer requested cancellation';
    setCancelling(true);
    try {
      const res = await api.patch(`/customer/orders/${orderId}/cancel`, {
        cancellationReason: finalReason,
      });
      setShowCancelModal(false);
      if (res?.data) {
        setOrder(res.data);
      }
      if (Platform.OS === 'web') {
        window.alert('Your order was cancelled successfully.');
      } else {
        Alert.alert('Order Cancelled', 'Your order was cancelled successfully.');
      }
      fetchOrderDetail();
    } catch (err) {
      const msg = err.message || 'Cannot cancel order.';
      if (Platform.OS === 'web') {
        window.alert(`Unable to Cancel: ${msg}`);
      } else {
        Alert.alert('Unable to Cancel', msg);
      }
    } finally {
      setCancelling(false);
    }
  };

  const handleSubmitReview = async () => {
    setSubmittingReview(true);
    try {
      await api.post('/customer/reviews', {
        orderId: order._id,
        rating,
        comment,
      });
      setShowReviewModal(false);
      Alert.alert('Thank You!', 'Your review has been published for the restaurant.');
    } catch (err) {
      Alert.alert('Review Error', err.message || 'Could not submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ textAlign: 'center', marginTop: 40 }}>Order not found</Text>
      </SafeAreaView>
    );
  }

  // Find step index in pipeline
  const currentStepIndex = TIMELINE_STEPS.findIndex((s) => s.key === order.orderStatus);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Order #{order.orderNumber}</Text>
          <Text style={styles.headerSubtitle}>{order.restaurantId?.name}</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Status Card & Live Timeline */}
        <View style={styles.cardSection}>
          <View style={styles.statusHeader}>
            <View>
              <Text style={styles.statusLabel}>Current Status</Text>
              <Text style={styles.statusValue}>{order.orderStatus.replace(/_/g, ' ')}</Text>
            </View>
            <View
              style={[
                styles.paymentPill,
                { backgroundColor: order.paymentStatus === 'PAID' ? '#ECFDF5' : '#FFFBEB' },
              ]}
            >
              <Banknote size={14} color={order.paymentStatus === 'PAID' ? '#065F46' : '#92400E'} />
              <Text
                style={[
                  styles.paymentPillText,
                  { color: order.paymentStatus === 'PAID' ? '#065F46' : '#92400E' },
                ]}
              >
                COD: {order.paymentStatus}
              </Text>
            </View>
          </View>

          {/* Timeline Visualizer */}
          {order.orderStatus === 'CANCELLED' || order.orderStatus === 'REJECTED' ? (
            <View style={styles.cancelledBox}>
              <XCircle size={20} color={colors.error} />
              <View style={{ flex: 1 }}>
                <Text style={styles.cancelledTitle}>Order {order.orderStatus}</Text>
                <Text style={styles.cancelledReason}>
                  {order.cancellationReason || order.rejectionReason || 'Order was stopped.'}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.timelineContainer}>
              {TIMELINE_STEPS.map((step, idx) => {
                const StepIcon = step.icon;
                const isCompleted = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;

                return (
                  <View key={step.key} style={styles.timelineRow}>
                    <View style={styles.timelineLeft}>
                      <View
                        style={[
                          styles.timelineCircle,
                          isCompleted && styles.timelineCircleDone,
                          isCurrent && styles.timelineCircleCurrent,
                        ]}
                      >
                        <StepIcon size={12} color={isCompleted ? '#fff' : colors.textMuted} />
                      </View>
                      {idx < TIMELINE_STEPS.length - 1 && (
                        <View
                          style={[
                            styles.timelineLine,
                            idx < currentStepIndex && styles.timelineLineDone,
                          ]}
                        />
                      )}
                    </View>
                    <View style={styles.timelineContent}>
                      <Text
                        style={[
                          styles.timelineStepTitle,
                          isCompleted && styles.timelineStepTitleDone,
                        ]}
                      >
                        {step.label}
                      </Text>
                      {isCurrent && (
                        <Text style={styles.timelineStepCurrentLabel}>Active step right now</Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Cancel Button (Available ONLY if orderStatus === 'PLACED') */}
          {order.orderStatus === 'PLACED' && (
            <TouchableOpacity
              onPress={handleCancelOrder}
              disabled={cancelling}
              style={styles.cancelBtn}
            >
              <Text style={styles.cancelBtnText}>
                {cancelling ? 'Cancelling...' : 'Cancel Order'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Restaurant & Owner Contact Card */}
        <View style={styles.cardSection}>
          <View style={styles.restaurantCardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              {order.restaurantId?.logoUrl ? (
                <Image
                  source={{ uri: order.restaurantId.logoUrl }}
                  style={styles.restaurantAvatar}
                />
              ) : (
                <View style={styles.restaurantIconFallback}>
                  <Store size={22} color={colors.primary} />
                </View>
              )}
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={styles.restaurantCardTitle} numberOfLines={1}>
                  {order.restaurantId?.name || 'Restaurant'}
                </Text>
                <Text style={styles.restaurantOwnerName}>
                  👤 Owner: {order.restaurantId?.ownerId?.name || 'Authorized Kitchen Partner'}
                </Text>
              </View>
            </View>

            {/* Quick Call Button */}
            {(order.restaurantId?.phone || order.restaurantId?.ownerId?.phone) && (
              <TouchableOpacity
                onPress={() => {
                  const phoneNum = order.restaurantId?.phone || order.restaurantId?.ownerId?.phone;
                  Linking.openURL(`tel:${phoneNum}`);
                }}
                style={styles.callOwnerBtn}
                activeOpacity={0.8}
              >
                <PhoneCall size={14} color="#fff" style={{ marginRight: 5 }} />
                <Text style={styles.callOwnerText}>Call</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.restaurantContactList}>
            {/* Phone Number Row */}
            <View style={styles.contactRow}>
              <Phone size={15} color={colors.primary} style={styles.contactIcon} />
              <View style={{ flex: 1 }}>
                <Text style={styles.contactSubLabel}>Restaurant / Kitchen Phone</Text>
                <TouchableOpacity
                  onPress={() => {
                    const phoneNum = order.restaurantId?.phone || order.restaurantId?.ownerId?.phone;
                    if (phoneNum) Linking.openURL(`tel:${phoneNum}`);
                  }}
                >
                  <Text style={styles.contactPhoneText}>
                    {order.restaurantId?.phone || order.restaurantId?.ownerId?.phone || 'Not provided'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Owner Direct Mobile (if distinct) */}
            {order.restaurantId?.ownerId?.phone &&
              order.restaurantId?.phone &&
              order.restaurantId?.ownerId?.phone !== order.restaurantId?.phone && (
                <View style={styles.contactRow}>
                  <User size={15} color="#10B981" style={styles.contactIcon} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contactSubLabel}>Owner Personal Mobile</Text>
                    <TouchableOpacity
                      onPress={() => Linking.openURL(`tel:${order.restaurantId.ownerId.phone}`)}
                    >
                      <Text style={styles.contactPhoneText}>{order.restaurantId.ownerId.phone}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

            {/* Kitchen Address Row */}
            {order.restaurantId?.address && (
              <View style={styles.contactRow}>
                <MapPin size={15} color={colors.textSecondary} style={styles.contactIcon} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.contactSubLabel}>Kitchen Location</Text>
                  <Text style={styles.contactAddressText}>
                    {order.restaurantId.address.street}
                    {order.restaurantId.address.landmark ? `, Near ${order.restaurantId.address.landmark}` : ''}
                    {order.restaurantId.address.city ? `, ${order.restaurantId.address.city}` : ''}
                    {order.restaurantId.address.pincode ? ` - ${order.restaurantId.address.pincode}` : ''}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Direct Delivery Notice */}
          <View style={styles.deliveryArrangementNotice}>
            <Text style={styles.deliveryNoticeText}>
              🛵 <Text style={{ fontWeight: '700' }}>Direct Delivery:</Text> This restaurant arranges delivery directly. Call the kitchen owner above for delivery updates or address directions.
            </Text>
          </View>
        </View>

        {/* Review Action Card (if DELIVERED) */}
        {order.orderStatus === 'DELIVERED' && (
          <View style={styles.cardSection}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionHeading}>Rate Your Food Experience</Text>
                <Text style={styles.rateSub}>Help others discover the best tastes from {order.restaurantId?.name}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowReviewModal(true)}
                style={styles.rateButton}
              >
                <Star size={14} color="#fff" />
                <Text style={styles.rateButtonText}>Write Review</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Ordered Dishes (Frozen Snapshot) */}
        <View style={styles.cardSection}>
          <Text style={styles.sectionHeading}>Ordered Items (Frozen Snapshot)</Text>
          {order.items.map((item, idx) => (
            <View key={idx} style={styles.itemRow}>
              <View style={styles.itemMeta}>
                <View style={[styles.vegBadge, { borderColor: item.isVegetarian ? colors.vegGreen : colors.nonVegRed }]}>
                  <View style={[styles.vegDot, { backgroundColor: item.isVegetarian ? colors.vegGreen : colors.nonVegRed }]} />
                </View>
                <Text style={styles.itemName}>
                  {item.name} × {item.quantity}
                </Text>
              </View>
              <Text style={styles.itemSubtotal}>₹{item.subtotal}</Text>
            </View>
          ))}

          <View style={styles.divider} />
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item Subtotal</Text>
            <Text style={styles.billValue}>₹{order.itemSubtotal}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Fee (Arranged by Restaurant)</Text>
            <Text style={styles.billValue}>₹{order.deliveryFee}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total COD Due</Text>
            <Text style={styles.totalValue}>₹{order.finalAmount}</Text>
          </View>
        </View>

        {/* Delivery Destination */}
        <View style={styles.cardSection}>
          <Text style={styles.sectionHeading}>Delivery Address (Snapshot)</Text>
          <View style={styles.addressBox}>
            <MapPin size={16} color={colors.primary} style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.addrRecipient}>
                {order.deliveryAddress?.recipientName} ({order.deliveryAddress?.label})
              </Text>
              <Text style={styles.addrText}>{order.deliveryAddress?.fullAddress}</Text>
              <Text style={styles.addrCity}>
                {order.deliveryAddress?.city} - {order.deliveryAddress?.pincode}
              </Text>
              <Text style={styles.addrPhone}>📞 {order.deliveryAddress?.phone}</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Review Modal */}
      {showReviewModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Rate Your Meal</Text>
            <Text style={styles.modalSub}>How did you like the food from {order.restaurantId?.name}?</Text>

            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((val) => (
                <TouchableOpacity key={val} onPress={() => setRating(val)}>
                  <Star
                    size={32}
                    color={val <= rating ? '#F59E0B' : '#E5E7EB'}
                    fill={val <= rating ? '#F59E0B' : 'transparent'}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              placeholder="Write a comment about taste, portion, or packaging..."
              value={comment}
              onChangeText={setComment}
              multiline
              style={styles.reviewInput}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setShowReviewModal(false)}
                style={styles.cancelModalBtn}
              >
                <Text style={styles.cancelModalText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmitReview}
                disabled={submittingReview}
                style={styles.submitReviewBtn}
              >
                <Text style={styles.submitReviewText}>
                  {submittingReview ? 'Submitting...' : 'Post Review'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Cancel Order Confirmation Modal */}
      {showCancelModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <View style={styles.cancelIconCircle}>
                <XCircle size={24} color="#EF4444" />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[styles.modalTitle, { textAlign: 'left' }]}>Cancel Order?</Text>
                <Text style={[styles.modalSub, { textAlign: 'left', marginTop: 2 }]}>
                  Order #{order.orderNumber} &bull; ₹{order.finalAmount} COD
                </Text>
              </View>
            </View>

            <Text style={styles.reasonPromptTitle}>Reason for cancellation:</Text>

            {/* Quick Reason Pills */}
            <View style={styles.reasonsContainer}>
              {CANCEL_REASONS.map((r) => (
                <TouchableOpacity
                  key={r}
                  onPress={() => setCancelReason(r)}
                  style={[
                    styles.reasonPill,
                    cancelReason === r && styles.reasonPillSelected,
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.reasonPillText,
                      cancelReason === r && styles.reasonPillTextSelected,
                    ]}
                  >
                    {r}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              placeholder="Or write custom reason (optional)..."
              value={cancelReason}
              onChangeText={setCancelReason}
              style={styles.cancelCustomInput}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setShowCancelModal(false)}
                disabled={cancelling}
                style={styles.keepOrderBtn}
              >
                <Text style={styles.keepOrderText}>Keep Order</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => executeCancel(cancelReason)}
                disabled={cancelling}
                style={styles.confirmCancelBtn}
              >
                {cancelling ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.confirmCancelText}>Yes, Cancel</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  cardSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  statusLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  statusValue: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.primary,
    marginTop: 2,
  },
  paymentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 6,
  },
  paymentPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  timelineContainer: {
    paddingTop: 16,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timelineLeft: {
    alignItems: 'center',
    width: 24,
  },
  timelineCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  timelineCircleDone: {
    backgroundColor: colors.primary,
  },
  timelineCircleCurrent: {
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.primaryLight,
  },
  timelineLine: {
    width: 2,
    height: 28,
    backgroundColor: '#E5E7EB',
    marginVertical: 2,
  },
  timelineLineDone: {
    backgroundColor: colors.primary,
  },
  timelineContent: {
    flex: 1,
    paddingTop: 1,
  },
  timelineStepTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  timelineStepTitleDone: {
    color: colors.text,
    fontWeight: '700',
  },
  timelineStepCurrentLabel: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '700',
    marginTop: 1,
  },
  cancelledBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
    gap: 10,
  },
  cancelledTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.error,
  },
  cancelledReason: {
    fontSize: 11,
    color: '#991B1B',
    marginTop: 2,
  },
  cancelBtn: {
    marginTop: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: colors.error,
    fontSize: 12,
    fontWeight: '800',
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 12,
  },
  rateSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    maxWidth: 200,
  },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F8A5F',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  rateButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  vegBadge: {
    width: 12,
    height: 12,
    borderRadius: 2,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vegDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  itemName: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '600',
  },
  itemSubtotal: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 8,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  billLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  billValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.primary,
  },
  addressBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 12,
  },
  addrRecipient: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  addrText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  addrCity: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  addrPhone: {
    fontSize: 11,
    color: colors.text,
    fontWeight: '600',
    marginTop: 4,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 360,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  modalSub: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginVertical: 18,
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    fontSize: 12,
    minHeight: 70,
    backgroundColor: '#F9FAFB',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  cancelModalBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  cancelModalText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  submitReviewBtn: {
    backgroundColor: '#0F8A5F',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  submitReviewText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  cancelIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reasonPromptTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  reasonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  reasonPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  reasonPillSelected: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  reasonPillText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },
  reasonPillTextSelected: {
    color: '#DC2626',
    fontWeight: '700',
  },
  cancelCustomInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 10,
    fontSize: 12,
    backgroundColor: '#F8FAFC',
    marginBottom: 12,
  },
  keepOrderBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  keepOrderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  confirmCancelBtn: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  confirmCancelText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  restaurantCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  restaurantAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E2E8F0',
  },
  restaurantIconFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  restaurantCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  restaurantOwnerName: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  callOwnerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16A34A',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  callOwnerText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  restaurantContactList: {
    paddingTop: 10,
    gap: 10,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  contactIcon: {
    marginTop: 2,
  },
  contactSubLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contactPhoneText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284C7',
    marginTop: 1,
  },
  contactAddressText: {
    fontSize: 12,
    color: colors.text,
    lineHeight: 16,
    marginTop: 1,
  },
  deliveryArrangementNotice: {
    marginTop: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  deliveryNoticeText: {
    fontSize: 11,
    color: '#1E40AF',
    lineHeight: 16,
  },
});
