import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import api from '../api/client';
import { colors } from '../theme/colors';

export default function AddEditDishScreen({ route, navigation }) {
  const dish = route.params?.dish;
  const onSaved = route.params?.onSaved;

  const [name, setName] = useState(dish?.name || '');
  const [description, setDescription] = useState(dish?.description || '');
  const [category, setCategory] = useState(dish?.category || 'Biryani');
  const [price, setPrice] = useState(dish?.price ? String(dish.price) : '');
  const [discountPrice, setDiscountPrice] = useState(dish?.discountPrice ? String(dish.discountPrice) : '');
  const [imageUrl, setImageUrl] = useState(dish?.imageUrl || '');
  const [isVegetarian, setIsVegetarian] = useState(dish?.isVegetarian ?? true);
  const [prepTimeMinutes, setPrepTimeMinutes] = useState(
    dish?.prepTimeMinutes ? String(dish.prepTimeMinutes) : '20'
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !category.trim() || !price) {
      Alert.alert('Required Fields', 'Please enter Dish Name, Category, and Price.');
      return;
    }

    const numPrice = parseFloat(price);
    const numDisc = discountPrice ? parseFloat(discountPrice) : null;

    if (numDisc && numDisc >= numPrice) {
      Alert.alert('Invalid Pricing', 'Discount price must be less than regular price.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        category: category.trim(),
        price: numPrice,
        discountPrice: numDisc,
        imageUrl: imageUrl.trim() || undefined,
        isVegetarian,
        prepTimeMinutes: parseInt(prepTimeMinutes) || 20,
      };

      if (dish?._id) {
        await api.patch(`/restaurant/menu/${dish._id}`, payload);
      } else {
        await api.post('/restaurant/menu', payload);
      }

      if (onSaved) onSaved();
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to save dish');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{dish ? 'Edit Dish' : 'Add New Dish'}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.label}>Dish Name *</Text>
          <TextInput
            placeholder="e.g. Special Awadhi Dum Biryani"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />

          <Text style={styles.label}>Category *</Text>
          <TextInput
            placeholder="e.g. Biryani, North Indian, Thali, Snacks"
            value={category}
            onChangeText={setCategory}
            style={styles.input}
          />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Regular Price (₹) *</Text>
              <TextInput
                placeholder="220"
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
                style={styles.input}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Offer Price (₹, Optional)</Text>
              <TextInput
                placeholder="199"
                value={discountPrice}
                onChangeText={setDiscountPrice}
                keyboardType="numeric"
                style={styles.input}
              />
            </View>
          </View>

          <Text style={styles.label}>Estimated Prep Time (Minutes)</Text>
          <TextInput
            placeholder="20"
            value={prepTimeMinutes}
            onChangeText={setPrepTimeMinutes}
            keyboardType="numeric"
            style={styles.input}
          />

          <Text style={styles.label}>Dish Image URL</Text>
          <TextInput
            placeholder="https://images.unsplash.com/photo-..."
            value={imageUrl}
            onChangeText={setImageUrl}
            style={styles.input}
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            placeholder="Describe spices, portion size, ingredients..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            style={[styles.input, { height: 70 }]}
          />

          <View style={styles.vegSwitchRow}>
            <View>
              <Text style={styles.vegTitle}>Vegetarian Food Indicator</Text>
              <Text style={styles.vegSub}>Display green veg dot on menu listings</Text>
            </View>
            <Switch
              value={isVegetarian}
              onValueChange={setIsVegetarian}
              trackColor={{ false: '#CBD5E1', true: '#86EFAC' }}
              thumbColor={isVegetarian ? colors.vegGreen : '#94A3B8'}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>{dish ? 'Save Changes' : 'Add to Menu'}</Text>
          )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
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
  vegSwitchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  vegTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  vegSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
});
