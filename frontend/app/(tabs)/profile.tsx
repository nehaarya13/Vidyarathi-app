import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView,
  Switch, Image, StatusBar, Alert, Modal, ActivityIndicator, TextInput, Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router'; 
import { useTheme } from '../context/ThemeContext'; // Using global theme
import { 
  User, Clock, LogOut, Camera, ChevronRight, 
  Moon, Sun, Globe, GraduationCap, Edit3, 
  ShieldCheck, HelpCircle, X, CheckCircle2, AtSign, Headphones
} from 'lucide-react-native';

// 🔥 CONFIG: Update with your Ngrok URL (pointing to Port 5000)
const API_BASE_URL = "https://YOUR_NGROK_SUBDOMAIN.ngrok-free.app"; 

export default function ProfileScreen() {
  const router = useRouter(); 
  const { isDarkMode, setIsDarkMode } = useTheme(); // Using Context if available
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<null | 'level' | 'time' | 'lang' | 'id'>(null);
  const [tempId, setTempId] = useState(''); 

  const [userData, setUserData] = useState({
    id: '', 
    name: 'User',
    userId: 'user_ai',
    email: 'user@example.com',
    image: null,
    level: 'College',
    studyTime: 'Evening',
    language: 'English',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const theme = {
    bg: isDarkMode ? '#0F172A' : '#F8FAFC',
    card: isDarkMode ? '#1E293B' : '#FFFFFF',
    text: isDarkMode ? '#F8FAFC' : '#1E293B',
    subText: isDarkMode ? '#94A3B8' : '#64748B',
    accent: '#6366F1',
    border: isDarkMode ? '#334155' : '#F1F5F9',
    logoutBg: isDarkMode ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2'
  };

  // --- 1. LOAD PROFILE DATA ---
  const loadProfile = async () => {
    try {
      const savedData = await AsyncStorage.getItem('user_profile_final');
      let currentUserId = '';
      
      if (savedData) {
        const parsed = JSON.parse(savedData);
        setUserData(parsed);
        currentUserId = parsed.id || parsed._id;
      }

      if (currentUserId) {
        const response = await fetch(`${API_BASE_URL}/api/auth/get-profile/${currentUserId}`);
        const result = await response.json();
        
        if (result.success) {
          const freshData = { ...result.user, id: result.user._id };
          setUserData(freshData);
          await AsyncStorage.setItem('user_profile_final', JSON.stringify(freshData));
        }
      }
    } catch (e) { 
      console.log("Backend connection failed. Using local data."); 
    } finally { 
      setLoading(false); 
    }
  };

  // --- 2. SYNC WITH BACKEND ---
  const syncWithBackend = async (newData: any) => {
    try {
      setUserData(newData);
      await AsyncStorage.setItem('user_profile_final', JSON.stringify(newData));

      const userId = newData.id || newData._id;
      if (!userId) return;

      await fetch(`${API_BASE_URL}/api/auth/update-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          level: newData.level,
          studyTime: newData.studyTime,
          language: newData.language,
          name: newData.name,
          userIdTag: newData.userId 
        }),
      });
    } catch (e) { 
      console.error("Sync Error:", e);
    }
  };

  const handleSignOut = async () => {
    Alert.alert("Sign Out", "Are you sure you want to log out of your account?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Log Out", 
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.clear();
          router.replace('/(auth)/login'); 
        } 
      }
    ]);
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true, aspect: [1, 1], quality: 0.5,
    });
    if (!result.canceled) {
      syncWithBackend({ ...userData, image: result.assets[0].uri });
    }
  };

  if (loading) return (
    <View style={[styles.center, {backgroundColor: theme.bg}]}>
      <ActivityIndicator size="large" color={theme.accent} />
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 30}}>
        
        {/* Profile Header */}
        <View style={styles.headerSection}>
          <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
            {userData.image ? (
              <Image source={{ uri: userData.image }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, {backgroundColor: theme.accent, justifyContent: 'center', alignItems: 'center'}]}>
                <Text style={{fontSize: 40, color: '#FFF', fontWeight: 'bold'}}>{userData.name[0]}</Text>
              </View>
            )}
            <View style={[styles.camBadge, {backgroundColor: theme.accent, borderColor: theme.bg}]}><Camera size={14} color="#FFF" /></View>
          </TouchableOpacity>
          
          <Text style={[styles.userName, {color: theme.text}]}>{userData.name}</Text>
          
          <TouchableOpacity 
            style={[styles.userIdBadge, {backgroundColor: theme.card}]} 
            onPress={() => { setTempId(userData.userId); setActiveModal('id'); }}
          >
            <AtSign size={12} color={theme.subText} />
            <Text style={[styles.userIdText, {color: theme.subText}]}>{userData.userId}</Text>
            <Edit3 size={12} color={theme.subText} style={{marginLeft: 5}} />
          </TouchableOpacity>
        </View>

        {/* 1. Learning Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>LEARNING PREFERENCES</Text>
          <View style={[styles.card, {backgroundColor: theme.card}]}>
            <TouchableOpacity style={[styles.row, {borderBottomColor: theme.border}]} onPress={() => setActiveModal('level')}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, {backgroundColor: isDarkMode ? '#312E81' : '#EEF2FF'}]}><GraduationCap size={20} color="#6366F1" /></View>
                <View>
                   <Text style={[styles.rowLabel, {color: theme.text}]}>Education Level</Text>
                   <Text style={styles.rowSub}>{userData.level}</Text>
                </View>
              </View>
              <ChevronRight size={18} color={theme.subText} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.row} onPress={() => setActiveModal('time')}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, {backgroundColor: isDarkMode ? '#431407' : '#FFF7ED'}]}><Clock size={20} color="#F59E0B" /></View>
                <View>
                  <Text style={[styles.rowLabel, {color: theme.text}]}>Preferred Study Time</Text>
                  <Text style={styles.rowSub}>{userData.studyTime}</Text>
                </View>
              </View>
              <ChevronRight size={18} color={theme.subText} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. App Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>APP SETTINGS</Text>
          <View style={[styles.card, {backgroundColor: theme.card}]}>
            <View style={[styles.row, {borderBottomColor: theme.border}]}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, {backgroundColor: theme.border}]}>
                  {isDarkMode ? <Moon size={20} color="#94A3B8" /> : <Sun size={20} color="#F59E0B" />}
                </View>
                <Text style={[styles.rowLabel, {color: theme.text}]}>Dark Mode</Text>
              </View>
              <Switch 
                value={isDarkMode} 
                onValueChange={(v) => { 
                  setIsDarkMode(v); 
                  AsyncStorage.setItem('theme_mode', v ? 'dark' : 'light'); 
                }} 
                trackColor={{ false: '#CBD5E1', true: '#6366F1' }}
              />
            </View>

            <TouchableOpacity style={styles.row} onPress={() => setActiveModal('lang')}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, {backgroundColor: isDarkMode ? '#064E3B' : '#ECFDF5'}]}><Globe size={20} color="#10B981" /></View>
                <Text style={[styles.rowLabel, {color: theme.text}]}>AI Output Language</Text>
              </View>
              <Text style={{color: theme.subText, marginRight: 5}}>{userData.language}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>HELP & SUPPORT</Text>
          <View style={[styles.card, {backgroundColor: theme.card}]}>
            <TouchableOpacity style={[styles.row, {borderBottomColor: theme.border}]} onPress={() => router.push('/support/faq')}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, {backgroundColor: theme.border}]}><HelpCircle size={20} color={theme.subText} /></View>
                <Text style={[styles.rowLabel, {color: theme.text}]}>Help Center (FAQs)</Text>
              </View>
              <ChevronRight size={18} color={theme.subText} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.row, {borderBottomColor: theme.border}]} onPress={() => router.push('/support/contact')}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, {backgroundColor: theme.border}]}><Headphones size={20} color={theme.subText} /></View>
                <Text style={[styles.rowLabel, {color: theme.text}]}>Contact Support</Text>
              </View>
              <ChevronRight size={18} color={theme.subText} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.row} onPress={() => router.push('/support/privacy')}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, {backgroundColor: theme.border}]}><ShieldCheck size={20} color={theme.subText} /></View>
                <Text style={[styles.rowLabel, {color: theme.text}]}>Privacy Center</Text>
              </View>
              <ChevronRight size={18} color={theme.subText} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={[styles.logoutBtn, {backgroundColor: theme.logoutBg}]} onPress={handleSignOut}>
          <LogOut size={18} color="#EF4444" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* MODALS */}
      <Modal visible={!!activeModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, {backgroundColor: theme.card}]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, {color: theme.text}]}>
                Update {activeModal === 'id' ? 'Username' : 'Selection'}
              </Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}><X size={24} color={theme.text}/></TouchableOpacity>
            </View>
            
            {activeModal === 'id' && (
              <View>
                <TextInput 
                  style={[styles.idInput, {color: theme.text, borderColor: theme.border}]}
                  value={tempId}
                  onChangeText={setTempId}
                  placeholder="Enter unique username"
                  placeholderTextColor={theme.subText}
                  autoCapitalize="none"
                />
                <TouchableOpacity 
                  style={[styles.saveBtn, {backgroundColor: theme.accent}]} 
                  onPress={() => { syncWithBackend({...userData, userId: tempId}); setActiveModal(null); }}
                >
                  <Text style={styles.saveBtnText}>Confirm Change</Text>
                </TouchableOpacity>
              </View>
            )}

            {activeModal === 'level' && ['School', 'College', 'Professional'].map(opt => (
              <TouchableOpacity key={opt} style={[styles.optRow, {borderBottomColor: theme.border}]} onPress={() => { syncWithBackend({...userData, level: opt}); setActiveModal(null); }}>
                <Text style={{color: theme.text, fontSize: 16, fontWeight: '600'}}>{opt}</Text>
                {userData.level === opt && <CheckCircle2 size={20} color="#10B981" />}
              </TouchableOpacity>
            ))}

            {activeModal === 'time' && ['Morning', 'Afternoon', 'Evening', 'Night'].map(opt => (
              <TouchableOpacity key={opt} style={[styles.optRow, {borderBottomColor: theme.border}]} onPress={() => { syncWithBackend({...userData, studyTime: opt}); setActiveModal(null); }}>
                <Text style={{color: theme.text, fontSize: 16, fontWeight: '600'}}>{opt}</Text>
                {userData.studyTime === opt && <CheckCircle2 size={20} color="#10B981" />}
              </TouchableOpacity>
            ))}

            {activeModal === 'lang' && ['English', 'Hindi', 'Hinglish'].map(opt => (
              <TouchableOpacity key={opt} style={[styles.optRow, {borderBottomColor: theme.border}]} onPress={() => { syncWithBackend({...userData, language: opt}); setActiveModal(null); }}>
                <Text style={{color: theme.text, fontSize: 16, fontWeight: '600'}}>{opt}</Text>
                {userData.language === opt && <CheckCircle2 size={20} color="#10B981" />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerSection: { alignItems: 'center', paddingVertical: 40 },
  avatarContainer: { position: 'relative' },
  avatar: { width: 110, height: 110, borderRadius: 40 },
  camBadge: { position: 'absolute', bottom: 0, right: 0, padding: 8, borderRadius: 15, borderWidth: 4 },
  userName: { fontSize: 24, fontWeight: '800', marginTop: 15 },
  userIdBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginTop: 8 },
  userIdText: { fontSize: 14, fontWeight: '600', marginLeft: 4 },
  section: { paddingHorizontal: 20, marginTop: 25 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: '#94A3B8', marginBottom: 12, letterSpacing: 1.5 },
  card: { borderRadius: 24, overflow: 'hidden', ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 }, android: { elevation: 2 } }) },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, borderBottomWidth: 0.5 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  rowLabel: { fontSize: 15, fontWeight: '700' },
  rowSub: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  logoutBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', margin: 30, padding: 20, borderRadius: 22 },
  logoutText: { color: '#EF4444', fontWeight: '800', marginLeft: 8, fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 25, paddingBottom: 60 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25, alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  idInput: { borderWidth: 1.5, borderRadius: 18, padding: 18, fontSize: 16, marginBottom: 20, fontWeight: '600' },
  saveBtn: { padding: 18, borderRadius: 18, alignItems: 'center' },
  saveBtnText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
  optRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 20, borderBottomWidth: 0.5 }
});