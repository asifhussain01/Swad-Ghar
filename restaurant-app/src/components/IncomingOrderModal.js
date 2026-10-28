import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Animated,
} from 'react-native';
import {
  BellRing,
  Phone,
  MapPin,
  Banknote,
  CheckCircle2,
  VolumeX,
  ChevronRight,
  Clock,
  Utensils,
} from 'lucide-react-native';
import { colors } from '../theme/colors';

export default function IncomingOrderModal({
  order,
  visible,
  onAccept,
  onViewDetails,
  onDismiss,
  onMute,
  isRinging,
}) {
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    if (visible) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [visible]);

  if (!order) return null;

  const address = order.deliveryAddress || {};
  const items = order.items || [];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Pulsing Bell Header */}
          <View style={styles.header}>
            <Animated.View
              style={[
                styles.iconBadge,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              <BellRing size={28} color="#fff" />
            </Animated.View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>NEW ORDER RECEIVED!</Text>
              <Text style={styles.orderNumberText}>
                Order #{order.orderNumber || order.orderId}
              </Text>
            </View>
            {isRinging && (
              <TouchableOpacity
                onPress={onMute}
                style={styles.muteButton}
                activeOpacity={0.7}
              >
                <VolumeX size={18} color="#EF4444" />
                <Text style={styles.muteButtonText}>Mute</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* COD Payment Alert Banner */}
          <View style={styles.codBanner}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Banknote size={24} color="#15803D" style={{ marginRight: 8 }} />
              <View>
                <Text style={styles.codTitle}>Cash on Delivery (COD)</Text>
                <Text style={styles.codSubtitle}>Collect cash upon delivery</Text>
              </View>
            </View>
            <Text style={styles.codAmount}>₹{order.finalAmount}</Text>
          </View>

          {/* Order Details Scroll Area */}
          <ScrollView style={styles.bodyScroll} showsVerticalScrollIndicator={false}>
            {/* Customer & Address Details */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>DELIVERY ADDRESS</Text>
              <Text style={styles.recipientName}>
                {address.recipientName || 'Customer'}
              </Text>

              {address.phone ? (
                <View style={styles.infoRow}>
                  <Phone size={14} color={colors.textMuted} style={styles.rowIcon} />
                  <Text style={styles.infoText}>{address.phone}</Text>
                </View>
              ) : null}

              <View style={styles.infoRow}>
                <MapPin size={14} color={colors.textMuted} style={styles.rowIcon} />
                <Text style={styles.infoText} numberOfLines={2}>
                  {address.fullAddress || 'Local Address'}
                  {address.landmark ? ` (${address.landmark})` : ''}
                </Text>
              </View>

              {order.customerNotes ? (
                <View style={styles.notesBox}>
                  <Text style={styles.notesLabel}>Customer Note:</Text>
                  <Text style={styles.notesText}>{order.customerNotes}</Text>
                </View>
              ) : null}
            </View>

            {/* Food Items Snapshot */}
            <View style={styles.sectionCard}>
              <View style={styles.itemsHeaderRow}>
                <Text style={styles.sectionTitle}>ORDERED ITEMS ({items.length})</Text>
                <Clock size={14} color={colors.textMuted} />
              </View>

              {items.map((item, idx) => (
                <View key={item.menuItemId || idx} style={styles.itemRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <View
                      style={[
                        styles.vegBadge,
                        { borderColor: item.isVegetarian ? '#22C55E' : '#EF4444' },
                      ]}
                    >
                      <View
                        style={[
                          styles.vegDot,
                          { backgroundColor: item.isVegetarian ? '#22C55E' : '#EF4444' },
                        ]}
                      />
                    </View>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {item.name}
                    </Text>
                  </View>
                  <Text style={styles.itemQty}>x {item.quantity}</Text>
                  <Text style={styles.itemPrice}>₹{item.subtotal || item.price * item.quantity}</Text>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.footerActions}>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={onAccept}
              activeOpacity={0.8}
            >
              <CheckCircle2 size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.acceptButtonText}>ACCEPT & PREPARE</Text>
            </TouchableOpacity>

            <View style={styles.secondaryActions}>
              <TouchableOpacity
                style={styles.detailsButton}
                onPress={onViewDetails}
                activeOpacity={0.8}
              >
                <Text style={styles.detailsButtonText}>View Full Order</Text>
                <ChevronRight size={16} color={colors.primary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dismissButton}
                onPress={onDismiss}
                activeOpacity={0.8}
              >
                <Text style={styles.dismissButtonText}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    zIndex: 99999,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 25,
    elevation: 20,
    overflow: 'hidden',
  },
  header: {
    backgroundColor: '#0F172A',
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EA580C',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    color: '#FDBA74',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  orderNumberText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  muteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  muteButtonText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  codBanner: {
    backgroundColor: '#F0FDF4',
    borderBottomWidth: 1,
    borderColor: '#DCFCE7',
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  codTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534',
  },
  codSubtitle: {
    fontSize: 11,
    color: '#15803D',
    marginTop: 1,
  },
  codAmount: {
    fontSize: 22,
    fontWeight: '900',
    color: '#15803D',
  },
  bodyScroll: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  sectionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  recipientName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  rowIcon: {
    marginRight: 6,
  },
  infoText: {
    fontSize: 13,
    color: '#475569',
    flex: 1,
  },
  notesBox: {
    marginTop: 10,
    padding: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  notesLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  notesText: {
    fontSize: 12,
    color: '#78350F',
    marginTop: 2,
  },
  itemsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  vegBadge: {
    width: 14,
    height: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderRadius: 3,
  },
  vegDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  itemQty: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    marginHorizontal: 12,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  footerActions: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
  },
  acceptButton: {
    backgroundColor: '#16A34A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  detailsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 10,
  },
  detailsButtonText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
    marginRight: 4,
  },
  dismissButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  dismissButtonText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
});
