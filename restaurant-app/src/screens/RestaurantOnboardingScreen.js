import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
} from 'react-native';
import { Store, LogOut, ArrowRight } from 'lucide-react-native';
import api from '../api/client';
import { colors } from '../theme/colors';
import { useRestaurantAuth } from '../context/RestaurantAuthContext';

export default function RestaurantOnboardingScreen() {
  const { user, logout, fetchMyRestaurant } = useRestaurantAuth();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [cuisineInput, setCuisineInput] = useState('North Indian, Biryani');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('Lucknow');
  const [pincode, setPincode] = useState('226001');
  const [deliveryFee, setDeliveryFee] = useState('30');
  const [prepTime, setPrepTime] = useState('25');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim() || !street.trim() || !city.trim() || !pincode.trim()) {
      const msg = 'Please fill out all required restaurant information.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Required Fields', msg);
      return;
    }

    setSubmitting(true);
    try {
      const cuisineType = cuisineInput.split(',').map((c) => c.trim()).filter(Boolean);

      await api.post('/restaurant/register', {
        name: name.trim(),
        description: description.trim(),
        phone: phone.trim(),
        email: email.trim() || user?.email,
        cuisineType: cuisineType.length > 0 ? cuisineType : ['North Indian'],
        address: {
          street: street.trim(),
          city: city.trim(),
          pincode: pincode.trim(),
        },
        deliveryFee: Number(deliveryFee) || 30,
        estimatedPrepTimeMinutes: Number(prepTime) || 25,
      });

      const successMsg =
        '🎉 Restaurant Application Submitted!\n\nYour restaurant application is now pending review. The administrator can approve it from the Admin Web Portal.';
      if (Platform.OS === 'web') window.alert(successMsg);
      else Alert.alert('Application Submitted', successMsg);

      await fetchMyRestaurant();
    } catch (err) {
      const errorMsg = err.message || 'Failed to submit application';
      if (Platform.OS === 'web') window.alert(`Error: ${errorMsg}`);
      else Alert.alert('Submission Error', errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Store size={22} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Register Your Restaurant</Text>
          <Text style={styles.headerSub}>Join SwadGhar as a partner</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <LogOut size={16} color={colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.instruction}>
          Welcome, {user?.name || 'Partner'}! Submit your restaurant profile to start receiving food orders in your locality.
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>Restaurant Name *</Text>
          <TextInput
            placeholder="e.g. Royal Awadh Rasoi"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            placeholder="Authentic local dishes, homestyle meals..."
            value={description}
            onChangeText={setDescription}
            style={styles.input}
          />

          <Text style={styles.label}>Contact Phone Number *</Text>
          <TextInput
            placeholder="+91 9876543210"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            style={styles.input}
          />

          <Text style={styles.label}>Cuisines (Comma-separated) *</Text>
          <TextInput
            placeholder="Biryani, North Indian, Thali"
            value={cuisineInput}
            onChangeText={setCuisineInput}
            style={styles.input}
          />

          <Text style={styles.label}>Street Address *</Text>
          <TextInput
            placeholder="Shop 14, Main Market Road"
            value={street}
            onChangeText={setStreet}
            style={styles.input}
          />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>City *</Text>
              <TextInput
                placeholder="Lucknow"
                value={city}
                onChangeText={setCity}
                style={styles.input}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Pincode *</Text>
              <TextInput
                placeholder="226001"
                value={pincode}
                onChangeText={setPincode}
                keyboardType="numeric"
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Flat Delivery Fee (₹)</Text>
              <TextInput
                placeholder="30"
                value={deliveryFee}
                onChangeText={setDeliveryFee}
                keyboardType="numeric"
                style={styles.input}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Avg Prep Time (Mins)</Text>
              <TextInput
                placeholder="25"
                value={prepTime}
                onChangeText={setPrepTime}
                keyboardType="numeric"
                style={styles.input}
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.submitBtnText}>Submit for Admin Approval</Text>
                <ArrowRight size={16} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
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
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  headerSub: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  logoutBtn: {
    padding: 8,
  },
  content: {
    padding: 16,
    gap: 14,
  },
  instruction: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    backgroundColor: '#F8FAFC',
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
});
