import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const AuthContext = createContext<any>({});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStorageData();
  }, []);

  async function loadStorageData() {
    try {
      const authDataSerialized = await AsyncStorage.getItem('@AuthData');
      if (authDataSerialized) {
        const authData = JSON.parse(authDataSerialized);
        setUser(authData.user);
        setToken(authData.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${authData.token}`;
      }
    } catch (error) {
      console.log("Storage load error", error);
    } finally {
      setLoading(false);
    }
  }

  const login = async (userData: any, userToken: string) => {
    try {
      setUser(userData);
      setToken(userToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;
      await AsyncStorage.setItem('@AuthData', JSON.stringify({ 
        token: userToken, 
        user: userData 
      }));
      console.log("✅ AuthContext Updated");
    } catch (error) {
      console.error("❌ AuthContext Save Error:", error);
      throw error;
    }
  };

  // 🔥 Sahi jagah: Ye function AuthProvider ke andar hona chahiye
  const updateOnboardingStatus = async (status: boolean) => {
    try {
      const updatedUser = { ...user, onboarded: status };
      setUser(updatedUser);
      
      const authDataSerialized = await AsyncStorage.getItem('@AuthData');
      if (authDataSerialized) {
        const authData = JSON.parse(authDataSerialized);
        authData.user.onboarded = status;
        await AsyncStorage.setItem('@AuthData', JSON.stringify(authData));
      }
      console.log("✅ Onboarding status updated in Context");
    } catch (error) {
      console.error("❌ Error updating onboarding status:", error);
    }
  };

  const logout = async () => {
    delete axios.defaults.headers.common['Authorization'];
    await AsyncStorage.removeItem('@AuthData');
    setUser(null);
    setToken(null);
  };

  // Sahi jagah: Return statement AuthProvider ke function ke andar
  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, updateOnboardingStatus }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);