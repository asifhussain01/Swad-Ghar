import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Store, MapPin, Clock, Phone, Mail, LogOut, Shield } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useRestaurantAuth } from '../context/RestaurantAuthContext';

export default function ProfileScreen() {
  const { user, restaurant, logout } = useRestaurantAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Restaurant Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Restaurant Info Card */}
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <View style={styles.avatar}>
              <Store size={24} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{restaurant?.name || 'Restaurant'}</Text>
              <Text style={styles.approvalStatus}>
                Status: <Text style={{ fontWeight: '800' }}>{restaurant?.approvalStatus}</Text>
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <MapPin size={16} color={colors.textSecondary} />
            <Text style={styles.detailText}>
              {restaurant?.address?.street}, {restaurant?.address?.city} - {restaurant?.address?.pincode}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Clock size={16} color={colors.textSecondary} />
            <Text style={styles.detailText}>
              Timings: {restaurant?.openingHours?.open || '09:00'} - {restaurant?.openingHours?.close || '23:00'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Phone size={16} color={colors.textSecondary} />
            <Text style={styles.detailText}>Phone: {restaurant?.phone}</Text>
          </View>

          <View style={styles.detailRow}>
            <Mail size={16} color={colors.textSecondary} />
            <Text style={styles.detailText}>Email: {restaurant?.email}</Text>
          </View>
        </View>

        {/* Owner Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Registered Partner</Text>
          <Text style={styles.ownerName}>Name: {user?.name}</Text>
          <Text style={styles.ownerEmail}>Email: {user?.email}</Text>
          <Text style={styles.ownerRole}>Role: RESTAURANT_OWNER</Text>
        </View>

        {/* Logistics Notice */}
        <View style={styles.infoCard}>
          <Shield size={20} color="#065F46" />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>Independent Delivery Notice</Text>
            <Text style={styles.infoSub}>
              All deliveries are managed and dispatched directly by your restaurant staff or local runners. SwadGhar does not operate a third-party rider fleet.
            </Text>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <LogOut size={16} color={colors.error} />
          <Text style={styles.logoutText}>Log Out from Restaurant Partner Portal</Text>
        </TouchableOpacity>
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
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  approvalStatus: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  detailText: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  ownerName: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '600',
  },
  ownerEmail: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  ownerRole: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#065F46',
  },
  infoSub: {
    fontSize: 11,
    color: '#047857',
    marginTop: 2,
    lineHeight: 16,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    paddingVertical: 14,
    borderRadius: 14,
  },
  logoutText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: '800',
  },
});
