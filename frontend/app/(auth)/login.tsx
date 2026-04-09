import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { StudyBuddyAPI } from '../../services/api-client'; 
import { useAuth } from '../context/AuthContext'; 

export default function LoginScreen() {
  const router = useRouter();
  // Hum AuthContext se login function nikaal rahe hain
  const { login: authLogin }: any = useAuth(); 

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // --- Animations ---
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true })
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -10, duration: 2000, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2000, useNativeDriver: true })
      ])
    ).start();
  }, []);

  // --- Login Handler ---
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Info', 'Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      console.log("📡 Sending Login request to backend...");
      
      const response = await StudyBuddyAPI.login({ 
        email: email.trim().toLowerCase(), 
        password 
      });
      
      // response.token aur response.user backend se aana chahiye
      if (response && response.token) {
        console.log("✅ Backend validated credentials.");
        
        // 🔥 AuthContext mein data save karein
        await authLogin(response.user, response.token);
        
        console.log("🚀 Login Successful! Navigating to Home...");
        
        // Turant Home/Dashboard par bhejein
        router.replace("/(tabs)/home"); 
      }
    } catch (error: any) {
      // Backend se jo error message aa raha hai (Invalid credentials etc.)
      const serverErrorMessage = error.response?.data?.error || "Invalid email or password";
      console.log("❌ Login failed:", serverErrorMessage);
      Alert.alert('Login Failed', serverErrorMessage);
    } finally {
      setLoading(false);
    }
  };

  const pressIn = () => {
    Animated.spring(buttonScale, { toValue: 0.96, useNativeDriver: true }).start();
  };

  const pressOut = () => {
    Animated.spring(buttonScale, { toValue: 1, friction: 4, useNativeDriver: true }).start();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          
          <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
            <Image 
              source={require('../../assets/images/study.png')} 
              style={styles.image} 
              resizeMode="contain"
            />
          </Animated.View>

          <Text style={styles.title}>Welcome Back ✨</Text>
          <Text style={styles.subtitle}>Let’s continue your learning journey</Text>

          <View style={styles.inputBox}>
            <Mail size={20} color="#4F46E5" />
            <TextInput
              placeholder="Email address"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputBox}>
            <Lock size={20} color="#4F46E5" />
            <TextInput
              placeholder="Password"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={20} color="#6B7280" /> : <Eye size={20} color="#6B7280" />}
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            onPress={() => router.push('/(auth)/forgot-password')}
            style={styles.forgotBtn}
          >
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              style={[styles.button, loading && { opacity: 0.7 }]}
              activeOpacity={0.8}
              onPressIn={pressIn}
              onPressOut={pressOut}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.buttonText}>Log In</Text>
              )}
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.footer}>
            <Text style={{ color: '#6B7280' }}>New here? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
              <Text style={styles.link}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  image: { width: 220, height: 220, alignSelf: 'center', marginBottom: 10 },
  title: { fontSize: 30, fontWeight: '800', color: '#111827', textAlign: 'center' },
  subtitle: { fontSize: 15, color: '#6B7280', textAlign: 'center', marginBottom: 30 },
  inputBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFF', 
    borderRadius: 16, 
    paddingHorizontal: 16, 
    height: 56, 
    borderWidth: 1.5, 
    borderColor: '#E5E7EB', 
    marginBottom: 16, 
    gap: 10 
  },
  input: { flex: 1, fontSize: 16, color: '#111827' },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 20, marginTop: -8 },
  forgotText: { color: '#4F46E5', fontWeight: '600', fontSize: 14 },
  button: { 
    backgroundColor: '#4F46E5', 
    height: 56, 
    borderRadius: 16, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 10,
    elevation: 3
  },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
  link: { color: '#4F46E5', fontWeight: '700' }
});