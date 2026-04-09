import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Linking, 
  SafeAreaView, ScrollView, TextInput, Alert, KeyboardAvoidingView, 
  Platform, ActivityIndicator, StatusBar 
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext'; // Ensure this path is correct
import { 
  ArrowLeft, MessageCircle, Mail, Send, User, 
  AtSign, MessageSquare, Sparkles 
} from 'lucide-react-native';

export default function ContactSupport() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeField, setActiveField] = useState<string | null>(null);

  // --- 1. DYNAMIC DATA LOADING ---
  useEffect(() => {
    const preFillProfile = async () => {
      try {
        const savedData = await AsyncStorage.getItem('user_profile_final');
        if (savedData) {
          const parsed = JSON.parse(savedData);
          setForm(prev => ({
            ...prev,
            name: parsed.name || '',
            email: parsed.email || ''
          }));
        }
      } catch (e) {
        console.log("Pre-fill error:", e);
      }
    };
    preFillProfile();
  }, []);

  const theme = {
    bg: isDarkMode ? '#0F172A' : '#FFFFFF',
    card: isDarkMode ? '#1E293B' : '#F8FAFC',
    text: isDarkMode ? '#F8FAFC' : '#1E293B',
    subText: isDarkMode ? '#94A3B8' : '#64748B',
    accent: '#6366F1',
    border: isDarkMode ? '#334155' : '#E2E8F0',
  };

  // --- 2. WHATSAPP HANDLER WITH SAFETY ---
  const handleWhatsApp = async () => {
    const phone = "919508021644";
    const msg = "Hello StudyBuddy Support! I need help with...";
    const url = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(msg)}`;
    
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("WhatsApp Not Found", "Please install WhatsApp or contact us via Email.");
      }
    } catch (err) {
      Alert.alert("Error", "Could not open WhatsApp.");
    }
  };

  // --- 3. FORM SUBMISSION ---
  const handleFormSubmit = () => {
    if (!form.message.trim() || !form.name.trim()) {
      Alert.alert("Empty Fields", "Please fill in your name and message so we can help you better! ✨");
      return;
    }
    
    setIsSubmitting(true);
    
    // Yahan aap apna backend fetch call daal sakte hain (Ngrok:5000)
    setTimeout(() => {
      setIsSubmitting(false);
      setForm(prev => ({ ...prev, message: '' })); // Only clear message
      Alert.alert(
        "Message Sent!", 
        "Thanks for reaching out. Our team will review your message shortly.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    }, 2000);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        style={{flex: 1}}
      >
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={[styles.iconCircle, {backgroundColor: theme.card}]}
          >
            <ArrowLeft size={22} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Contact Us</Text>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={{ padding: 25 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.heroSection}>
            <Sparkles size={32} color={theme.accent} style={{ marginBottom: 10 }} />
            <Text style={[styles.heroTitle, { color: theme.text }]}>Let's talk.</Text>
            <Text style={[styles.heroSub, { color: theme.subText }]}>
              Have a feature request or found a bug? We're all ears.
            </Text>
          </View>

          {/* Form UI */}
          <View style={styles.formContainer}>
            
            {/* Name Input */}
            <View style={[
              styles.inputWrapper, 
              { backgroundColor: theme.card, borderColor: activeField === 'name' ? theme.accent : theme.border }
            ]}>
              <User size={18} color={activeField === 'name' ? theme.accent : theme.subText} style={styles.inputIcon} />
              <TextInput 
                placeholder="Your Name" 
                placeholderTextColor={theme.subText}
                style={[styles.input, { color: theme.text }]}
                value={form.name}
                onFocus={() => setActiveField('name')}
                onBlur={() => setActiveField(null)}
                onChangeText={(t) => setForm({...form, name: t})}
                returnKeyType="next"
              />
            </View>

            {/* Email Input */}
            <View style={[
              styles.inputWrapper, 
              { backgroundColor: theme.card, borderColor: activeField === 'email' ? theme.accent : theme.border }
            ]}>
              <AtSign size={18} color={activeField === 'email' ? theme.accent : theme.subText} style={styles.inputIcon} />
              <TextInput 
                placeholder="Email Address" 
                placeholderTextColor={theme.subText}
                style={[styles.input, { color: theme.text }]}
                value={form.email}
                onFocus={() => setActiveField('email')}
                onBlur={() => setActiveField(null)}
                onChangeText={(t) => setForm({...form, email: t})}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="next"
              />
            </View>

            {/* Message Input */}
            <View style={[
              styles.inputWrapper, 
              styles.textAreaWrapper, 
              { backgroundColor: theme.card, borderColor: activeField === 'msg' ? theme.accent : theme.border }
            ]}>
              <MessageSquare size={18} color={activeField === 'msg' ? theme.accent : theme.subText} style={[styles.inputIcon, {marginTop: 18}]} />
              <TextInput 
                placeholder="How can we help you?" 
                placeholderTextColor={theme.subText}
                style={[styles.input, styles.textArea, { color: theme.text }]}
                multiline
                value={form.message}
                onFocus={() => setActiveField('msg')}
                onBlur={() => setActiveField(null)}
                onChangeText={(t) => setForm({...form, message: t})}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity 
              activeOpacity={0.8}
              style={[styles.submitBtn, { backgroundColor: theme.accent }]}
              onPress={handleFormSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <View style={styles.btnRow}>
                  <Text style={styles.submitBtnText}>Send Feedback</Text>
                  <Send size={18} color="#FFF" />
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Alternative Methods */}
          <View style={styles.dividerContainer}>
            <View style={[styles.line, { backgroundColor: theme.border }]} />
            <Text style={[styles.dividerText, { color: theme.subText }]}>OR REACH OUT VIA</Text>
            <View style={[styles.line, { backgroundColor: theme.border }]} />
          </View>

          <View style={styles.footerRow}>
            <TouchableOpacity 
              style={[styles.socialBtn, {backgroundColor: '#25D366'}]}
              onPress={handleWhatsApp}
            >
              <MessageCircle size={20} color="#FFF" />
              <Text style={styles.socialBtnText}>WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.socialBtn, {backgroundColor: isDarkMode ? '#334155' : '#1E293B'}]}
              onPress={() => Linking.openURL('mailto:support@studybuddy.com')}
            >
              <Mail size={20} color="#FFF" />
              <Text style={styles.socialBtnText}>Email</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 20 : 10, gap: 15 },
  iconCircle: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  heroSection: { marginTop: 25, marginBottom: 30 },
  heroTitle: { fontSize: 42, fontWeight: '900', letterSpacing: -1 },
  heroSub: { fontSize: 16, marginTop: 8, lineHeight: 24, fontWeight: '500' },
  formContainer: { gap: 15 },
  inputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderRadius: 22, 
    borderWidth: 1.5, 
    paddingHorizontal: 18,
    height: 64
  },
  textAreaWrapper: { height: 160, alignItems: 'flex-start' },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, fontWeight: '600' },
  textArea: { height: 140, paddingTop: 18, textAlignVertical: 'top' },
  submitBtn: { 
    height: 65, 
    borderRadius: 22, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 10,
    elevation: 4,
    shadowColor: '#6366F1',
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  btnRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  submitBtnText: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 35, gap: 10 },
  line: { flex: 1, height: 1 },
  dividerText: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  footerRow: { flexDirection: 'row', gap: 12, marginBottom: 50 },
  socialBtn: { 
    flex: 1, 
    height: 58, 
    borderRadius: 20, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: 10 
  },
  socialBtnText: { color: '#FFF', fontWeight: '800', fontSize: 14 }
});