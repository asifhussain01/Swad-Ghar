import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
} from 'react-native';
import { ArrowLeft, MapPin, CheckCircle, Plus, Banknote, ShieldCheck } from 'lucide-react-native';
import api from '../api/client';
import { colors } from '../theme/colors';
import { useCart } from '../context/CartContext';

export default function CheckoutScreen({ navigation }) {
  const { cart, fetchCart } = useCart();
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [customerNotes, setCustomerNotes] = useState('');

  // Add Address Modal / Inline fields
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newLabel, setNewLabel] = useState('Home');
  const [newRecipient, setNewRecipient] = useState('Rahul Verma');
  const [newPhone, setNewPhone] = useState('+91 9833445566');
  const [newAddressText, setNewAddressText] = useState('Flat 402, Shanti Kunj Apartments, Gomti Nagar');
  const [newLandmark, setNewLandmark] = useState('Near City Mall');
  const [newCity, setNewCity] = useState('Lucknow');
  const [newPincode, setNewPincode] = useState('226010');

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/customer/addresses');
      const list = res.data || [];
      setAddresses(list);
      if (list.length > 0) {
        const def = list.find((a) => a.isDefault) || list[0];
        setSelectedAddressId(def._id);
        setShowAddAddress(false);
      } else {
        setShowAddAddress(true);
      }
    } catch (err) {
      console.log('Fetch addresses error:', err.message);
      setShowAddAddress(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleSaveAddress = async () => {
    if (!newRecipient.trim() || !newPhone.trim() || !newAddressText.trim()) {
      if (Platform.OS === 'web') {
        window.alert('Please fill recipient name, phone, and address details.');
      } else {
        Alert.alert('Required Fields', 'Please complete all address details.');
      }
      return;
    }

    try {
      const res = await api.post('/customer/addresses', {
        label: newLabel,
        recipientName: newRecipient.trim(),
        phone: newPhone.trim(),
        fullAddress: newAddressText.trim(),
        landmark: newLandmark.trim(),
        city: newCity.trim() || 'Lucknow',
        pincode: newPincode.trim() || '226010',
        isDefault: true,
      });

      setShowAddAddress(false);
      await fetchAddresses();
      setSelectedAddressId(res.data._id);
      return res.data._id;
    } catch (err) {
      if (Platform.OS === 'web') {
        window.alert(`Error: ${err.message || 'Could not save address'}`);
      } else {
        Alert.alert('Error', err.message || 'Could not save address');
      }
      return null;
    }
  };

  const handleConfirmOrder = async () => {
    let targetAddressId = selectedAddressId;

    // If no address selected but form is filled, auto-save address first
    if (!targetAddressId) {
      if (newRecipient.trim() && newPhone.trim() && newAddressText.trim()) {
        targetAddressId = await handleSaveAddress();
      }
    }

    if (!targetAddressId) {
      if (Platform.OS === 'web') {
        window.alert('Please select or add a delivery address to place your order.');
      } else {
        Alert.alert('Select Address', 'Please choose or add a delivery address.');
      }
      return;
    }

    setPlacingOrder(true);
    try {
      const res = await api.post('/customer/orders', {
        addressId: targetAddressId,
        customerNotes,
      });

      await fetchCart(); // Refresh cart to empty state

      if (Platform.OS === 'web') {
        window.alert(
          `🎉 Order Placed Successfully!\n\nOrder #${res.data.orderNumber} for ₹${res.data.finalAmount} has been sent to the restaurant via Cash on Delivery (COD).`
        );
        navigation.replace('OrderDetail', { orderId: res.data._id });
      } else {
        Alert.alert(
          'Order Placed Successfully! 🎉',
          `Order #${res.data.orderNumber} for ₹${res.data.finalAmount} has been sent to the restaurant via Cash on Delivery.`,
          [
            {
              text: 'Track Order',
              onPress: () => navigation.replace('OrderDetail', { orderId: res.data._id }),
            },
          ]
        );
      }
    } catch (err) {
      const msg = err.message || 'Unable to place order';
      if (Platform.OS === 'web') {
        window.alert(`Order Failed: ${msg}`);
      } else {
        Alert.alert('Order Failed', msg);
      }
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout (Cash on Delivery)</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Step 1: Select Delivery Address */}
        <View style={styles.cardSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>1. Delivery Address</Text>
            {!showAddAddress && (
              <TouchableOpacity onPress={() => setShowAddAddress(true)}>
                <Text style={styles.addAddressLink}>+ Add New</Text>
              </TouchableOpacity>
            )}
          </View>

          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : showAddAddress ? (
            <View style={styles.addAddressForm}>
              <Text style={styles.formTitle}>Add New Delivery Address</Text>

              <TextInput
                placeholder="Receiver Name (e.g. Rahul Verma)"
                value={newRecipient}
                onChangeText={setNewRecipient}
                style={styles.input}
              />
              <TextInput
                placeholder="Phone Number (e.g. +91 9876543210)"
                value={newPhone}
                onChangeText={setNewPhone}
                keyboardType="phone-pad"
                style={styles.input}
              />
              <TextInput
                placeholder="House/Flat No., Apartment, Street Address"
                value={newAddressText}
                onChangeText={setNewAddressText}
                style={styles.input}
              />
              <TextInput
                placeholder="Landmark (Optional)"
                value={newLandmark}
                onChangeText={setNewLandmark}
                style={styles.input}
              />
              <View style={styles.formRow}>
                <TextInput
                  placeholder="City"
                  value={newCity}
                  onChangeText={setNewCity}
                  style={[styles.input, { flex: 1 }]}
                />
                <TextInput
                  placeholder="Pincode"
                  value={newPincode}
                  onChangeText={setNewPincode}
                  keyboardType="number-pad"
                  style={[styles.input, { flex: 1 }]}
                />
              </View>

              <View style={styles.formActions}>
                {addresses.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setShowAddAddress(false)}
                    style={styles.cancelAddressBtn}
                  >
                    <Text style={styles.cancelAddressText}>Cancel</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={handleSaveAddress} style={styles.saveAddressBtn}>
                  <Text style={styles.saveAddressText}>Save & Deliver Here</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.addressList}>
              {addresses.map((addr) => {
                const isSelected = selectedAddressId === addr._id;
                return (
                  <TouchableOpacity
                    key={addr._id}
                    style={[styles.addressCard, isSelected && styles.addressCardActive]}
                    onPress={() => setSelectedAddressId(addr._id)}
                  >
                    <View style={styles.addressHeaderRow}>
                      <View style={styles.labelBadge}>
                        <Text style={styles.labelText}>{addr.label}</Text>
                      </View>
                      {isSelected && <CheckCircle size={16} color={colors.primary} />}
                    </View>
                    <Text style={styles.addrRecipient}>{addr.recipientName}</Text>
                    <Text style={styles.addrText}>{addr.fullAddress}</Text>
                    <Text style={styles.addrCity}>
                      {addr.city} - {addr.pincode}
                    </Text>
                    <Text style={styles.addrPhone}>📞 {addr.phone}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Step 2: Payment Method (Locked to Cash on Delivery) */}
        <View style={styles.cardSection}>
          <Text style={styles.sectionHeading}>2. Payment Method</Text>

          <View style={styles.codSelectionCard}>
            <View style={styles.codIconCircle}>
              <Banknote size={22} color="#065F46" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.codTitle}>Cash on Delivery (COD)</Text>
                <View style={styles.activePill}>
                  <Text style={styles.activePillText}>DEFAULT</Text>
                </View>
              </View>
              <Text style={styles.codDesc}>
                Hand over ₹{cart.finalAmount} in exact cash to the restaurant runner upon delivery.
              </Text>
            </View>
            <CheckCircle size={20} color={colors.primary} />
          </View>
        </View>

        {/* Step 3: Cooking Instructions */}
        <View style={styles.cardSection}>
          <Text style={styles.sectionHeading}>3. Delivery Instructions</Text>
          <TextInput
            placeholder="e.g. Ring the doorbell, avoid onions, bring change..."
            value={customerNotes}
            onChangeText={setCustomerNotes}
            style={styles.instructionInput}
            multiline
          />
        </View>

        {/* Step 4: Final Bill Summary */}
        <View style={styles.cardSection}>
          <Text style={styles.sectionHeading}>4. Final Payable Amount</Text>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item Subtotal</Text>
            <Text style={styles.billValue}>₹{cart.itemSubtotal}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Fee</Text>
            <Text style={styles.billValue}>₹{cart.deliveryFee}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Cash Payable upon Delivery</Text>
            <Text style={styles.totalValue}>₹{cart.finalAmount}</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky Confirm Order Button */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomTotalText}>₹{cart.finalAmount}</Text>
          <Text style={styles.bottomCODLabel}>CASH ON DELIVERY</Text>
        </View>
        <TouchableOpacity
          style={styles.confirmBtn}
          activeOpacity={0.85}
          disabled={placingOrder}
          onPress={handleConfirmOrder}
        >
          {placingOrder ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.confirmBtnText}>Confirm Order (COD)</Text>
          )}
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
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  addAddressLink: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  addressList: {
    gap: 10,
  },
  addressCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  addressCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  addressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  labelBadge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  labelText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text,
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
  addAddressForm: {
    gap: 10,
  },
  formTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: colors.text,
    backgroundColor: '#F9FAFB',
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 6,
  },
  cancelAddressBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cancelAddressText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  saveAddressBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveAddressText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  codSelectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    gap: 12,
  },
  codIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  codTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#065F46',
  },
  activePill: {
    backgroundColor: '#065F46',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  activePillText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },
  codDesc: {
    fontSize: 11,
    color: '#047857',
    marginTop: 2,
    lineHeight: 15,
  },
  instructionInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 10,
    fontSize: 12,
    minHeight: 50,
    backgroundColor: '#F9FAFB',
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
  confirmBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    minWidth: 160,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
});
