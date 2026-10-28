import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
} from 'react-native';
import { colors } from '../theme/colors';
import { useRestaurantAuth } from '../context/RestaurantAuthContext';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useRestaurantAuth();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      const msg = 'Please enter your registered email and password.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Required', msg);
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password.trim());
    } catch (err) {
      const msg = err.message || 'Invalid credentials';
      if (Platform.OS === 'web') window.alert(`Login Failed: ${msg}`);
      else Alert.alert('Login Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.brandBox}>
          <Image
            source={require('../../assets/icon.png')}
            style={styles.brandLogo}
          />
          <Text style={styles.brandTitle}>SwadGhar Partner</Text>
          <Text style={styles.brandSub}>Kitchen Management & COD Settlement</Text>
        </View>

        <Text style={styles.title}>Restaurant Owner Login</Text>
        <Text style={styles.sub}>Manage live orders, menu catalog, and verify cash receipts.</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Registered Partner Email</Text>
          <TextInput
            placeholder="partner@example.com"
            placeholderTextColor="#94A3B8"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            placeholder="••••••••••••"
            placeholderTextColor="#94A3B8"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
          />

          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.loginBtnText}>Log In to Kitchen Portal</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Register')}
            style={styles.registerLink}
          >
            <Text style={styles.registerLinkText}>
              Want to partner with us? <Text style={styles.registerHighlight}>Register here</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },
  brandBox: {
    alignItems: 'center',
    marginBottom: 24,
  },
  brandLogo: {
    width: 68,
    height: 68,
    borderRadius: 34,
    marginBottom: 10,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.primary,
  },
  brandSub: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  sub: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: 24,
  },
  form: {
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
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 13,
    backgroundColor: '#F8FAFC',
    color: colors.text,
  },
  loginBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  registerLink: {
    alignItems: 'center',
    marginTop: 16,
  },
  registerLinkText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  registerHighlight: {
    color: colors.primary,
    fontWeight: '800',
  },
});
