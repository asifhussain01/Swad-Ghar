import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Plus, Trash2, Edit3 } from 'lucide-react-native';
import api from '../api/client';
import { colors } from '../theme/colors';

export default function MenuManagementScreen({ navigation }) {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMenu = async () => {
    try {
      setRefreshing(true);
      const res = await api.get('/restaurant/menu');
      setMenu(res.data || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const handleToggleAvailability = async (item) => {
    const updatedStatus = !item.isAvailable;
    try {
      await api.patch(`/restaurant/menu/${item._id}`, { isAvailable: updatedStatus });
      setMenu((prev) =>
        prev.map((i) => (i._id === item._id ? { ...i, isAvailable: updatedStatus } : i))
      );
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not update availability');
    }
  };

  const handleDeleteItem = async (itemId, name) => {
    Alert.alert('Delete Dish', `Are you sure you want to remove "${name}" from your menu?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/restaurant/menu/${itemId}`);
            fetchMenu();
          } catch (err) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Menu Management</Text>
          <Text style={styles.headerSubtitle}>{menu.length} Dishes listed</Text>
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddEditDish', { onSaved: fetchMenu })}
        >
          <Plus size={16} color="#fff" />
          <Text style={styles.addBtnText}>Add Dish</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : menu.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>No dishes added yet</Text>
          <Text style={styles.emptySub}>Tap '+ Add Dish' to build your restaurant menu.</Text>
        </View>
      ) : (
        <FlatList
          data={menu}
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchMenu} />}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.dishCard}>
              <Image source={{ uri: item.imageUrl }} style={styles.dishThumb} />

              <View style={styles.dishInfo}>
                <View style={styles.titleRow}>
                  <View style={[styles.vegBadge, { borderColor: item.isVegetarian ? colors.vegGreen : colors.nonVegRed }]}>
                    <View style={[styles.vegDot, { backgroundColor: item.isVegetarian ? colors.vegGreen : colors.nonVegRed }]} />
                  </View>
                  <Text style={styles.dishName} numberOfLines={1}>{item.name}</Text>
                </View>

                <Text style={styles.categoryPill}>{item.category}</Text>
                <Text style={styles.dishPrice}>₹{item.discountPrice || item.price}</Text>

                <View style={styles.stockSwitchRow}>
                  <Text style={[styles.stockText, { color: item.isAvailable ? '#059669' : colors.textMuted }]}>
                    {item.isAvailable ? 'In Stock' : 'Sold Out'}
                  </Text>
                  <Switch
                    value={item.isAvailable}
                    onValueChange={() => handleToggleAvailability(item)}
                    trackColor={{ false: '#CBD5E1', true: '#86EFAC' }}
                    thumbColor={item.isAvailable ? '#059669' : '#94A3B8'}
                  />
                </View>
              </View>

              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => navigation.navigate('AddEditDish', { dish: item, onSaved: fetchMenu })}
                >
                  <Edit3 size={15} color={colors.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#FEE2E2' }]}
                  onPress={() => handleDeleteItem(item._id, item.name)}
                >
                  <Trash2 size={15} color={colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
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
  headerSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  addBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  emptySub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  dishCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    gap: 12,
  },
  dishThumb: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
  },
  dishInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
  dishName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  categoryPill: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 1,
  },
  dishPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
    marginTop: 2,
  },
  stockSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  stockText: {
    fontSize: 10,
    fontWeight: '800',
  },
  cardActions: {
    flexDirection: 'column',
    gap: 8,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
