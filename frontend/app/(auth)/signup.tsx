import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  Animated,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Mail, Lock, Eye, EyeOff, User, ArrowRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { StudyBuddyAPI } from '../../services/api-client';

export default function SignupScreen() {
  const router = useRouter();
  const { signup } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  // Animations
  const mascotScale = useRef(new Animated.Value(1)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(mascotScale, {
      toValue: isPasswordFocused ? 0.9 : 1,
      useNativeDriver: true,
    }).start();
  }, [isPasswordFocused]);

  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;

  const handleSignup = async () => {
    // 1. Client-side Validation
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill all fields');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 🔥 FIX: Backend ko userData object bhejna hai exactly jaisa api-client expect kar raha hai
      const userData = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password
      };

      console.log("Attempting signup with:", userData);

      const res = await StudyBuddyAPI.signup(userData);
      
      // Agar backend user aur token bhej raha hai
      if (res.user && res.token) {
        signup(res.user, res.token);
      } else {
        // Agar response success hai par data nahi hai
        setError("Unexpected server response. Please try again.");
      }

    } catch (e: any) {
      // 🛠️ Advanced Error Debugging
      const serverMessage = e.response?.data?.message || e.response?.data?.error;
      const networkError = e.message === 'Network Error' ? "Server not reachable. Check IP or Wi-Fi." : null;
      
      setError(serverMessage || networkError || 'Signup failed');
      console.error("Signup Error Details:", e.response?.data || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          
          <View style={styles.mainContent}>
            {/* 🧸 Interactive Mascot */}
            <Animated.View style={{ transform: [{ scale: mascotScale }] }}>
              <Image
                source={
                  isPasswordFocused
                    ? require('../../assets/images/mascot-closed.png')
                    : require('../../assets/images/mascot-open.png')
                }
                style={styles.mascot}
              />
            </Animated.View>

            <Text style={styles.microText}>
              {isPasswordFocused ? "Safe & Secure Encryption 🤫" : "Join the mastery club 🚀"}
            </Text>

            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join thousands of high-achievers today</Text>

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Input Fields */}
            <View style={styles.inputBox}>
              <User size={20} color="#6366F1" />
              <TextInput 
                placeholder="Full Name" 
                style={styles.input} 
                value={name} 
                onChangeText={(val) => { setName(val); setError(null); }} 
              />
            </View>

            <View style={styles.inputBox}>
              <Mail size={20} color="#6366F1" />
              <TextInput
                placeholder="Email address"
                style={styles.input}
                value={email}
                onChangeText={(val) => { setEmail(val); setError(null); }}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputBox}>
              <Lock size={20} color="#6366F1" />
              <TextInput
                placeholder="Password"
                style={styles.input}
                value={password}
                secureTextEntry={!showPassword}
                onChangeText={(val) => { setPassword(val); setError(null); }}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={20} color="#6B7280" /> : <Eye size={20} color="#6B7280" />}
              </TouchableOpacity>
            </View>

            <View style={styles.inputBox}>
              <Lock size={20} color="#6366F1" />
              <TextInput
                placeholder="Confirm Password"
                style={styles.input}
                value={confirmPassword}
                secureTextEntry={!showConfirm}
                onChangeText={(val) => { setConfirmPassword(val); setError(null); }}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
              />
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                {showConfirm ? <EyeOff size={20} color="#6B7280" /> : <Eye size={20} color="#6B7280" />}
              </TouchableOpacity>
            </View>

            {/* Password Strength */}
            <View style={styles.strengthRow}>
              {[1, 2, 3].map((i) => (
                <View
                  key={i}
                  style={[styles.strengthBar, strength >= i && {
                      backgroundColor: strength === 1 ? '#EF4444' : strength === 2 ? '#F59E0B' : '#22C55E',
                  }]}
                />
              ))}
            </View>

            {/* Premium Button */}
            <Animated.View style={{ transform: [{ scale: buttonScale }], width: '100%', marginTop: 25 }}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleSignup}
                onPressIn={() => Animated.spring(buttonScale, { toValue: 0.96, useNativeDriver: true }).start()}
                onPressOut={() => Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true }).start()}
                disabled={loading}
              >
                <LinearGradient
                  colors={['#4F46E5', '#7C3AED']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.premiumButton}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <View style={styles.buttonContent}>
                      <Text style={styles.buttonText}>Get Started</Text>
                      <ArrowRight size={20} color="#FFF" style={{ marginLeft: 10 }} />
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={{ color: '#6B7280', fontSize: 15 }}>Already a member? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text style={styles.link}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollContainer: { flexGrow: 1, paddingBottom: 40 },
  mainContent: { padding: 24, alignItems: 'center' },
  mascot: { width: 140, height: 140, marginTop: 10 },
  microText: { fontSize: 12, color: '#6366F1', fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  title: { fontSize: 32, fontWeight: '800', color: '#111827', letterSpacing: -0.5 },
  subtitle: { fontSize: 16, color: '#6B7280', marginBottom: 15, textAlign: 'center' },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    height: 60,
    marginTop: 15,
    width: '100%',
  },
  input: { flex: 1, fontSize: 16, marginLeft: 10, color: '#111827' },
  strengthRow: { flexDirection: 'row', width: '100%', gap: 6, marginTop: 12, paddingHorizontal: 4 },
  strengthBar: { flex: 1, height: 5, backgroundColor: '#E5E7EB', borderRadius: 10 },
  premiumButton: {
    height: 62,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonContent: { flexDirection: 'row', alignItems: 'center' },
  buttonText: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  footer: { flexDirection: 'row', marginTop: 30, alignItems: 'center' },
  link: { color: '#4F46E5', fontWeight: '800', fontSize: 15 },
  errorContainer: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    padding: 12,
    borderRadius: 12,
    width: '100%',
    marginTop: 15,
  },
  errorText: { color: '#E11D48', textAlign: 'center', fontWeight: '600', fontSize: 14 },
});