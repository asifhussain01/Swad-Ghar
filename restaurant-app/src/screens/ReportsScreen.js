import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { Banknote, ShoppingBag, CheckCircle, TrendingUp } from 'lucide-react-native';
import api from '../api/client';
import { colors } from '../theme/colors';

export default function ReportsScreen() {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReports = async () => {
    try {
      setRefreshing(true);
      const res = await api.get('/restaurant/reports');
      setReports(res.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const summary = reports?.summary || {};
  const statusCounts = reports?.ordersByStatus || {};

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sales & Order Reports</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchReports} />}
      >
        {/* Total Cash Collected Tile */}
        <View style={styles.highlightCard}>
          <Text style={styles.highlightSub}>CONFIRMED CASH RECEIVED (COD)</Text>
          <Text style={styles.highlightValue}>
            ₹{(summary.totalRevenuePaid || 0).toLocaleString()}
          </Text>
          <Text style={styles.highlightDesc}>
            Physical cash confirmed by your restaurant
          </Text>
        </View>

        {/* Secondary Financial Counters */}
        <View style={styles.row}>
          <View style={styles.tile}>
            <Text style={styles.tileLabel}>Today's Sales (COD)</Text>
            <Text style={[styles.tileVal, { color: '#059669' }]}>
              ₹{(summary.todaySales || 0).toLocaleString()}
            </Text>
          </View>

          <View style={styles.tile}>
            <Text style={styles.tileLabel}>Pending Cash Due</Text>
            <Text style={[styles.tileVal, { color: '#D97706' }]}>
              ₹{(summary.pendingCashCollection || 0).toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Volume Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Volume Breakdown</Text>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Lifetime Total Orders</Text>
            <Text style={styles.statVal}>{summary.totalOrders || 0}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Successfully Delivered</Text>
            <Text style={[styles.statVal, { color: '#059669' }]}>{summary.completedOrders || 0}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Today's Orders</Text>
            <Text style={styles.statVal}>{summary.todayOrdersCount || 0}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Cancelled / Declined</Text>
            <Text style={[styles.statVal, { color: colors.error }]}>{statusCounts.cancelled || 0}</Text>
          </View>
        </View>

        {/* Notice */}
        <View style={styles.noticeCard}>
          <Text style={styles.noticeText}>
            💡 Reminder: SwadGhar does not deduct gateway commissions. All cash is retained directly by your restaurant upon delivery.
          </Text>
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
  highlightCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 20,
  },
  highlightSub: {
    fontSize: 11,
    fontWeight: '800',
    color: '#34D399',
    letterSpacing: 0.5,
  },
  highlightValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    marginTop: 6,
  },
  highlightDesc: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  tile: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tileLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  tileVal: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  statVal: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  noticeCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 12,
  },
  noticeText: {
    fontSize: 11,
    color: '#92400E',
    lineHeight: 16,
  },
});
