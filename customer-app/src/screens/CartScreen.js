import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { ArrowLeft, Trash2, Plus, Minus, ShoppingBag, Banknote } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useCart } from '../context/CartContext';

export default function CartScreen({ navigation }) {
  const { cart, updateQuantity, clearCart } = useCart();

  if (!cart.items || cart.items.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => (navigation.canGoBack?.() ? navigation.goBack() : navigation.navigate('Home'))}
            style={styles.backButton}
          >
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your Cart</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <ShoppingBag size={40} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySub}>Add some delicious dishes from restaurants near you!</Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.browseButtonText}>Browse Restaurants</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => (navigation.canGoBack?.() ? navigation.goBack() : navigation.navigate('Home'))}
          style={styles.backButton}
        >
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Order Summary</Text>
          <Text style={styles.headerRestaurant}>{cart.restaurant?.name}</Text>
        </View>
        <TouchableOpacity onPress={clearCart} style={styles.clearButton}>
          <Trash2 size={16} color={colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* COD Reminder Pill */}
        <View style={styles.codAlert}>
          <Banknote size={18} color="#065F46" />
          <View style={{ flex: 1 }}>
            <Text style={styles.codAlertTitle}>Cash on Delivery Only (COD)</Text>
            <Text style={styles.codAlertSub}>Pay ₹{cart.finalAmount} in physical cash upon meal delivery.</Text>
          </View>
        </View>

        {/* Cart Items List */}
        <View style={styles.cardSection}>
          <Text style={styles.sectionHeading}>Items Selected</Text>
          {cart.items.map((item) => (
            <View key={item.menuItemId} style={styles.itemRow}>
              <View style={styles.itemMeta}>
                <View style={[styles.vegBadge, { borderColor: item.isVegetarian ? colors.vegGreen : colors.nonVegRed }]}>
                  <View style={[styles.vegDot, { backgroundColor: item.isVegetarian ? colors.vegGreen : colors.nonVegRed }]} />
                </View>
                <View>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemPrice}>₹{item.price} each</Text>
                </View>
              </View>

              <View style={styles.itemRight}>
                <View style={styles.qtyBox}>
                  <TouchableOpacity
                    onPress={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                    style={styles.qtyBtn}
                  >
                    <Minus size={12} color={colors.primary} />
                  </TouchableOpacity>
                  <Text style={styles.qtyValue}>{item.quantity}</Text>
                  <TouchableOpacity
                    onPress={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                    style={styles.qtyBtn}
                  >
                    <Plus size={12} color={colors.primary} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.itemTotal}>₹{item.subtotal}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Bill Breakdown */}
        <View style={styles.cardSection}>
          <Text style={styles.sectionHeading}>Bill Details</Text>
          
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item Subtotal</Text>
            <Text style={styles.billValue}>₹{cart.itemSubtotal}</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Restaurant Delivery Fee</Text>
            <Text style={styles.billValue}>₹{cart.deliveryFee}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>To Pay (Cash on Delivery)</Text>
            <Text style={styles.totalValue}>₹{cart.finalAmount}</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Sticky Checkout Action */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomTotalText}>₹{cart.finalAmount}</Text>
          <Text style={styles.bottomCODLabel}>CASH ON DELIVERY</Text>
        </View>
        <TouchableOpacity
          style={styles.checkoutBtn}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Checkout')}
        >
          <Text style={styles.checkoutBtnText}>Select Address & Pay</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  headerRestaurant: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  clearButton: {
    padding: 8,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  codAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    padding: 12,
    borderRadius: 12,
    gap: 10,
  },
  codAlertTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#065F46',
  },
  codAlertSub: {
    fontSize: 11,
    color: '#047857',
    marginTop: 1,
  },
  cardSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  vegBadge: {
    width: 14,
    height: 14,
    borderRadius: 3,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vegDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  itemPrice: {
    fontSize: 11,
    color: colors.textMuted,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  qtyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
    gap: 8,
    backgroundColor: '#fff',
  },
  qtyBtn: {
    padding: 2,
  },
  qtyValue: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  itemTotal: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
    minWidth: 45,
    textAlign: 'right',
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
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
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomTotalText: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text,
  },
  bottomCODLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#065F46',
  },
  checkoutBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  checkoutBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  emptySub: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  browseButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
});
