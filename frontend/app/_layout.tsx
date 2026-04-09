import { useEffect, useState, useRef } from 'react';
import { Stack, useRouter, usePathname } from 'expo-router';
import { AuthProvider, useAuth } from './context/AuthContext'; // Path check kar lena apne hisab se
import { View, ActivityIndicator } from 'react-native';

function NavigationProtector() {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(false);
  const lastNavigatedPath = useRef('');

  useEffect(() => {
    setIsReady(true);
  }, []);

  useEffect(() => {
    // 1. Wait until app is ready and auth state is loaded
    if (!isReady || isLoading) return;

    const isLoggedIn = !!token;
    const isOnboardingPage = pathname.includes('onboarding');
    const isAuthGroup = pathname.includes('(auth)');
    const isTabsGroup = pathname.includes('(tabs)');
    
    // User status: Check if onboarded field is false
    const isNewUser = isLoggedIn && (user?.onboarded === false || user?.onboarded === undefined);

    let targetPath: string | null = null;

    // 2. Navigation Decision Logic (Step-by-Step)
    if (!isLoggedIn) {
      // 🟢 Logged Out: Private access protection
      if (isTabsGroup || isOnboardingPage || pathname === '/' || pathname === '/index') {
        targetPath = '/(auth)/login';
      }
    } else {
      // 🔵 Logged In
      if (isNewUser) {
        // Force onboarding if not completed
        if (!isOnboardingPage) {
          console.log("🚀 Redirecting to Onboarding...");
          targetPath = '/(auth)/onboarding';
        }
      } else {
        // User is fully onboarded, keep them away from login/onboarding
        if (isAuthGroup || isOnboardingPage || pathname === '/' || pathname === '/index') {
          console.log("🏠 Moving to Home Dashboard...");
          targetPath = '/(tabs)/home';
        }
      }
    }

    // 3. Loop Guard & Execution
    if (targetPath && targetPath !== pathname && targetPath !== lastNavigatedPath.current) {
      lastNavigatedPath.current = targetPath;
      
      // Using setTimeout to ensure the router is mounted
      const timer = setTimeout(() => {
        try {
          router.replace(targetPath as any);
        } catch (e) {
          console.error("❌ Navigation Error:", e);
        }
      }, 0);
      
      return () => clearTimeout(timer);
    }
  }, [token, user?.onboarded, pathname, isLoading, isReady]);

  // Loading Screen while checking auth
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="index" /> 
      <Stack.Screen name="(auth)" options={{ gestureEnabled: false }} />
      <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
    </Stack>
  );
}

// 4. Main Entry Point
export default function RootLayout() {
  return (
    <AuthProvider>
        <NavigationProtector />
    </AuthProvider>
  );
}