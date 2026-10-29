import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { ArrowLeft, Clock, MapPin, ShoppingBag, Plus, Minus } from 'lucide-react-native';
import api from '../api/client';
import { colors } from '../theme/colors';
import { useCart } from '../context/CartContext';

export default function RestaurantDetailScreen({ route, navigation }) {
  const { restaurantId } = route.params;
  const { cart, updateQuantity, getItemQuantity } = useCart();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await api.get(`/customer/restaurants/${restaurantId}`);
        setData(res.data);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [restaurantId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const restaurant = data?.restaurant || {};
  const groupedMenu = data?.groupedMenu || {};

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => (navigation.canGoBack?.() ? navigation.goBack() : navigation.navigate('Home'))}
          style={styles.backButton}
        >
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle} numberOfLines={1}>{restaurant.name}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Restaurant Hero Card */}
        <View style={styles.restaurantHero}>
          <Image source={{ uri: restaurant.coverImageUrl }} style={styles.coverImage} />
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>{restaurant.name}</Text>
            <Text style={styles.heroCuisines}>{restaurant.cuisineType?.join(', ')}</Text>
            <Text style={styles.heroAddress}>📍 {restaurant.address?.street}, {restaurant.address?.city}</Text>

            <View style={styles.heroBadges}>
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingText}>★ {restaurant.avgRating || 4.5}</Text>
                <Text style={styles.ratingCount}>({restaurant.totalRatings || 0} reviews)</Text>
              </View>
              <View style={styles.badgeDivider} />
              <View style={styles.timeBadge}>
                <Clock size={12} color={colors.textSecondary} />
                <Text style={styles.timeText}>{restaurant.estimatedPrepTimeMinutes || 25} mins</Text>
              </View>
              <View style={styles.badgeDivider} />
              <Text style={styles.feeText}>₹{restaurant.deliveryFee || 25} Delivery</Text>
            </View>
          </View>
        </View>

        {/* Menu Items Grouped by Category */}
        <View style={styles.menuSection}>
          <Text style={styles.menuHeader}>Recommended & Menu</Text>

          {Object.keys(groupedMenu).map((catName) => (
            <View key={catName} style={styles.categoryBlock}>
              <Text style={styles.categoryHeading}>{catName}</Text>

              {groupedMenu[catName].map((item) => {
                const quantity = getItemQuantity(item._id);

                return (
                  <View key={item._id} style={styles.dishCard}>
                    <View style={styles.dishInfo}>
                      {/* Veg / Non-Veg Icon */}
                      <View style={[styles.vegBadge, { borderColor: item.isVegetarian ? colors.vegGreen : colors.nonVegRed }]}>
                        <View style={[styles.vegDot, { backgroundColor: item.isVegetarian ? colors.vegGreen : colors.nonVegRed }]} />
                      </View>

                      <Text style={styles.dishName}>{item.name}</Text>
                      <View style={styles.priceRow}>
                        <Text style={styles.dishPrice}>₹{item.discountPrice || item.price}</Text>
                        {item.discountPrice && (
                          <Text style={styles.originalPrice}>₹{item.price}</Text>
                        )}
                      </View>
                      {item.description ? (
                        <Text style={styles.dishDesc} numberOfLines={2}>
                          {item.description}
                        </Text>
                      ) : null}
                    </View>

                    {/* Dish Image + Add Button Container */}
                    <View style={styles.dishAction}>
                      <Image source={{ uri: item.imageUrl }} style={styles.dishImage} />

                      {!item.isAvailable ? (
                        <View style={styles.soldOutBadge}>
                          <Text style={styles.soldOutText}>Sold Out</Text>
                        </View>
                      ) : quantity === 0 ? (
                        <TouchableOpacity
                          style={styles.addButton}
                          activeOpacity={0.8}
                          onPress={() => updateQuantity(item._id, 1)}
                        >
                          <Text style={styles.addButtonText}>ADD</Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.qtyControl}>
                          <TouchableOpacity
                            onPress={() => updateQuantity(item._id, quantity - 1)}
                            style={styles.qtyButton}
                          >
                            <Minus size={14} color={colors.primary} />
                          </TouchableOpacity>
                          <Text style={styles.qtyText}>{quantity}</Text>
                          <TouchableOpacity
                            onPress={() => updateQuantity(item._id, quantity + 1)}
                            style={styles.qtyButton}
                          >
                            <Plus size={14} color={colors.primary} />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          ))}
        </View>

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
              <Text style={styles.cartTotalText}>₹{cart.finalAmount} (Cash on Delivery)</Text>
            </View>
            <View style={styles.viewCartAction}>
              <Text style={styles.viewCartText}>Proceed to Cart</Text>
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f1',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    maxWidth: 220,
  },
  restaurantHero: {
    borderBottomWidth: 8,
    borderBottomColor: '#F8F9FA',
  },
  coverImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#E5E7EB',
  },
  heroContent: {
    padding: 16,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  heroCuisines: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  heroAddress: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  heroBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F8A5F',
  },
  ratingCount: {
    fontSize: 11,
    color: colors.textMuted,
  },
  badgeDivider: {
    width: 1,
    height: 12,
    backgroundColor: '#E5E7EB',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  feeText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  menuSection: {
    padding: 16,
  },
  menuHeader: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 16,
  },
  categoryBlock: {
    marginBottom: 24,
  },
  categoryHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 12,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dishCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
    gap: 12,
  },
  dishInfo: {
    flex: 1,
  },
  vegBadge: {
    width: 14,
    height: 14,
    borderRadius: 3,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  vegDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dishName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  dishPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  originalPrice: {
    fontSize: 11,
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  dishDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  dishAction: {
    alignItems: 'center',
    width: 100,
  },
  dishImage: {
    width: 96,
    height: 84,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
  },
  addButton: {
    position: 'absolute',
    bottom: -8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  qtyControl: {
    position: 'absolute',
    bottom: -8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  qtyButton: {
    padding: 2,
  },
  qtyText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  soldOutBadge: {
    position: 'absolute',
    bottom: -8,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  soldOutText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
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
