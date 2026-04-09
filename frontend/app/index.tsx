import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from './context/AuthContext';

export default function SplashScreen() {
  const router = useRouter();
  const { token, isLoading } = useAuth();
  const [isReady, setIsReady] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Entrance Animations
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }),
    ]).start();

    // 2. Floating Loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -10, duration: 2000, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();

    // 3. 3 Seconds Wait
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // 4. 🔥 Navigation Logic
  useEffect(() => {
    if (isReady && !isLoading) {
      console.log("--- Splash Screen Auth Check ---");
      console.log("Current Token Status:", token ? "Token Found ✅" : "No Token ❌");

      if (token) {
        // Agar login session active hai toh Home
        router.replace('/(tabs)/home');
      } else {
        // Naya user ya logged out user ke liye Login (Yahi aap chahti thi)
        router.replace('/(auth)/login');
      }
    }
  }, [isReady, isLoading, token]);

  return (
    <LinearGradient colors={['#4F46E5', '#06B6D4']} style={styles.container}>
      <StatusBar style="light" translucent />

      <Animated.Image
        source={require('../assets/images/splash-illustration.png')}
        style={[styles.illustration, { transform: [{ translateY: floatAnim }] }]}
        resizeMode="contain"
      />

      <Animated.View style={[styles.logoWrap, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>SB</Text>
        </View>
        <Text style={styles.appName}>StudyBuddy</Text>
        <Text style={styles.tagline}>Learn smarter. Grow faster.</Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  illustration: { width: '80%', height: 220, marginBottom: 30 },
  logoWrap: { alignItems: 'center' },
  logoBox: { width: 84, height: 84, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.18)', justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  logoText: { color: '#FFF', fontSize: 34, fontWeight: '800' },
  appName: { fontSize: 34, fontWeight: '700', color: '#FFF' },
  tagline: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 6 },
});