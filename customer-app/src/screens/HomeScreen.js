import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import {
  Search,
  MapPin,
  Star,
  Clock,
  ChevronDown,
  ShoppingBag,
  SlidersHorizontal,
} from 'lucide-react-native';
import api from '../api/client';
import { colors } from '../theme/colors';
import { useCart } from '../context/CartContext';

export default function HomeScreen({ navigation }) {
  const { cart } = useCart();
  const [restaurants, setRestaurants] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [pureVeg, setPureVeg] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadCategories = async () => {
    try {
      const res = await api.get('/customer/categories');
      setCategories(res.data || []);
    } catch (e) {
      // Ignore
    }
  };

  const loadRestaurants = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      const params = {};
      if (selectedCategory !== 'All') params.cuisine = selectedCategory;
      if (pureVeg) params.isVegetarian = 'true';
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await api.get('/customer/restaurants', { params });
      setRestaurants(res.data || []);
    } catch (err) {
      console.log('Error loading restaurants:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadRestaurants();
  }, [selectedCategory, pureVeg]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Location Bar */}
      <View style={styles.header}>
        <View style={styles.locationContainer}>
          <Image
            source={require('../../assets/icon.png')}
            style={{ width: 34, height: 34, borderRadius: 17 }}
          />
          <View>
            <View style={styles.locationTitleRow}>
              <Text style={styles.locationCity}>Lucknow</Text>
              <ChevronDown size={14} color={colors.text} />
            </View>
            <Text style={styles.locationSub}>Gomti Nagar, Hazratganj & nearby</Text>
          </View>
        </View>

        <View style={styles.codBadge}>
          <Text style={styles.codBadgeText}>COD Only</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadRestaurants(true)} colors={[colors.primary]} />}
      >
        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchBox}>
            <Search size={18} color={colors.textMuted} />
            <TextInput
              placeholder="Search for 'Biryani', 'Thali' or restaurant..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={() => loadRestaurants(true)}
              returnKeyType="search"
              style={styles.searchInput}
            />
          </View>
        </View>

        {/* Quick Filter Pill: Pure Veg */}
        <View style={styles.quickFilters}>
          <TouchableOpacity
            style={[styles.filterPill, pureVeg && styles.filterPillActive]}
            onPress={() => setPureVeg(!pureVeg)}
          >
            <View style={[styles.vegDot, pureVeg && { backgroundColor: '#fff' }]} />
            <Text style={[styles.filterPillText, pureVeg && styles.filterPillTextActive]}>
              Pure Veg
            </Text>
          </TouchableOpacity>
        </View>

        {/* Categories Bar */}
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>What's on your mind?</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesList}>
          <TouchableOpacity
            style={[styles.categoryCard, selectedCategory === 'All' && styles.categoryCardActive]}
            onPress={() => setSelectedCategory('All')}
          >
            <Text style={[styles.categoryText, selectedCategory === 'All' && styles.categoryTextActive]}>
              🔥 All
            </Text>
          </TouchableOpacity>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat._id}
              style={[styles.categoryCard, selectedCategory === cat.name && styles.categoryCardActive]}
              onPress={() => setSelectedCategory(cat.name)}
            >
              <Text style={[styles.categoryText, selectedCategory === cat.name && styles.categoryTextActive]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Restaurant Listings */}
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>
            {restaurants.length} Restaurants delivering to you
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : restaurants.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No restaurants found</Text>
            <Text style={styles.emptySub}>Try searching for a different dish or category.</Text>
          </View>
        ) : (
          restaurants.map((rest) => (
            <TouchableOpacity
              key={rest._id}
              activeOpacity={0.85}
              style={styles.restaurantCard}
              onPress={() => navigation.navigate('RestaurantDetail', { restaurantId: rest._id })}
            >
              <Image source={{ uri: rest.coverImageUrl || rest.logoUrl }} style={styles.restaurantImage} />
              
              <View style={styles.prepTimeTag}>
                <Clock size={12} color="#fff" />
                <Text style={styles.prepTimeText}>{rest.estimatedPrepTimeMinutes || 25} MINS</Text>
              </View>

              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <Text style={styles.restaurantName} numberOfLines={1}>{rest.name}</Text>
                  <View style={styles.ratingBadge}>
                    <Text style={styles.ratingText}>★ {rest.avgRating || 4.5}</Text>
                  </View>
                </View>

                <Text style={styles.cuisineText} numberOfLines={1}>
                  {rest.cuisineType?.join(' • ')}
                </Text>

                <View style={styles.cardFooter}>
                  <Text style={styles.addressText} numberOfLines={1}>
                    📍 {rest.address?.city || 'Lucknow'}
                  </Text>
                  <Text style={styles.deliveryFeeText}>
                    ₹{rest.deliveryFee || 25} Delivery Fee
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Bottom Cart Bar */}
      {cart.items && cart.items.length > 0 && (
        <View style={styles.floatingCartContainer}>
          <TouchableOpacity
            style={styles.floatingCart}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('Cart')}
          >
            <View>
              <Text style={styles.cartCountText}>{cart.itemCount} ITEMS ADDED</Text>
              <Text style={styles.cartTotalText}>₹{cart.finalAmount} plus COD</Text>
            </View>
            <View style={styles.viewCartAction}>
              <Text style={styles.viewCartText}>View Cart</Text>
              <ShoppingBag size={16} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f1',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationCity: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  locationSub: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  codBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#ECFDF5',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  codBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },
  searchSection: {
    paddingHorizontal: 16,
    marginTop: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
  },
  quickFilters: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 10,
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
    gap: 6,
  },
  filterPillActive: {
    backgroundColor: colors.vegGreen,
    borderColor: colors.vegGreen,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  filterPillTextActive: {
    color: '#fff',
  },
  vegDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.vegGreen,
  },
  sectionTitleRow: {
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  categoriesList: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 4,
  },
  categoryCard: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  categoryCardActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  categoryTextActive: {
    color: '#fff',
  },
  restaurantCard: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  restaurantImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#E5E7EB',
  },
  prepTimeTag: {
    position: 'absolute',
    top: 120,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  prepTimeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  cardContent: {
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    flex: 1,
  },
  ratingBadge: {
    backgroundColor: '#0F8A5F',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  ratingText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  cuisineText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  addressText: {
    fontSize: 11,
    color: colors.textMuted,
    flex: 1,
  },
  deliveryFeeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  emptySub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  floatingCartContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  floatingCart: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  cartCountText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cartTotalText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  viewCartAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viewCartText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
});
