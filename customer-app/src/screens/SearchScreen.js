import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Search, ArrowLeft, Star, Clock } from 'lucide-react-native';
import api from '../api/client';
import { colors } from '../theme/colors';

export default function SearchScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (text) => {
    setQuery(text);
    if (!text.trim()) {
      setResults([]);
      return;
    }
    try {
      setLoading(true);
      const res = await api.get('/customer/restaurants', { params: { search: text } });
      setResults(res.data || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Search size={18} color={colors.textMuted} />
          <TextInput
            placeholder="Search restaurants, Biryani, Thali, Pizza..."
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={handleSearch}
            autoFocus
            style={styles.searchInput}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : results.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>
            {query.length > 0 ? 'No matching restaurants found' : 'Search for dishes or restaurants'}
          </Text>
          <Text style={styles.emptySub}>
            Try searching for "Biryani", "Zaika", "Dhaba" or "Paneer"
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.resultItem}
              onPress={() => navigation.navigate('RestaurantDetail', { restaurantId: item._id })}
            >
              <Image source={{ uri: item.logoUrl }} style={styles.thumb} />
              <View style={{ flex: 1 }}>
                <Text style={styles.restName}>{item.name}</Text>
                <Text style={styles.cuisines}>{item.cuisineType?.join(', ')}</Text>
                <View style={styles.metaRow}>
                  <Text style={styles.rating}>★ {item.avgRating || 4.5}</Text>
                  <Text style={styles.metaDivider}>&bull;</Text>
                  <Text style={styles.prepTime}>{item.estimatedPrepTimeMinutes || 25} mins</Text>
                  <Text style={styles.metaDivider}>&bull;</Text>
                  <Text style={styles.fee}>₹{item.deliveryFee} Del.</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
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
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchBar: {
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  thumb: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
  },
  restName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  cuisines: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  rating: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F8A5F',
  },
  metaDivider: {
    color: colors.textMuted,
  },
  prepTime: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  fee: {
    fontSize: 11,
    color: colors.textMuted,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  emptySub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
});
