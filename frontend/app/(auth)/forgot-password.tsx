import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Mail, ShieldCheck, Lock, ChevronLeft, ArrowRight, CheckCircle2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

// 🔥 Import the API Client
import { StudyBuddyAPI } from '../../services/api-client';

const { width } = Dimensions.get('window');

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1); 
  const [loading, setLoading] = useState(false);

  // Form States
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  /**
   * Main Action Handler - Connects to Backend
   */
  const handleAction = async () => {
    // 1. Basic Validation
    if (step === 1 && !email) return Alert.alert("Error", "Please enter your email");
    if (step === 2 && !otp) return Alert.alert("Error", "Please enter the 6-digit OTP");
    if (step === 3 && !newPassword) return Alert.alert("Error", "Please enter your new password");

    setLoading(true);

    try {
      if (step === 1) {
        // --- Step 1: Request OTP ---
        console.log("Attempting to send OTP to:", email);
        await StudyBuddyAPI.forgotPassword(email.trim().toLowerCase());
        setStep(2);
      } 
      else if (step === 2) {
        // --- Step 2: Verify OTP ---
        await StudyBuddyAPI.verifyOTP(email.trim().toLowerCase(), otp);
        setStep(3);
      } 
      else if (step === 3) {
        // --- Step 3: Reset Password ---
        await StudyBuddyAPI.resetPassword(email.trim().toLowerCase(), otp, newPassword);
        Alert.alert("Success 🎉", "Password updated! You can now login.");
        router.replace('/(auth)/login');
      }
    } catch (error: any) {
      console.log("Frontend Error:", error);
      const errorMsg = error.response?.data?.error || "Connection error. Is the server running?";
      Alert.alert("Failed", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicatorRow}>
      {[1, 2, 3].map((item) => (
        <View key={item} style={styles.stepWrapper}>
          <View style={[
            styles.stepCircle, 
            step >= item ? styles.activeStepCircle : styles.inactiveStepCircle
          ]}>
            {step > item ? (
              <CheckCircle2 size={18} color="#FFF" />
            ) : (
              <Text style={[styles.stepText, step >= item ? styles.activeStepText : styles.inactiveStepText]}>
                {item}
              </Text>
            )}
          </View>
          {item < 3 && <View style={[styles.stepLine, step > item ? styles.activeStepLine : styles.inactiveStepLine]} />}
        </View>
      ))}
    </View>
  );

  return (
    <LinearGradient colors={['#F8FAFC', '#EFF6FF']} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          
          <View style={styles.header}>
            <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : router.back()} style={styles.glassBackBtn}>
              <ChevronLeft size={24} color="#1E293B" />
            </TouchableOpacity>
            <Text style={styles.headerTitleText}>Security</Text>
            <View style={{ width: 44 }} /> 
          </View>

          <View style={styles.mainContent}>
            {renderStepIndicator()}

            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                {step === 1 && "Reset Password"}
                {step === 2 && "Verify OTP"}
                {step === 3 && "New Password"}
              </Text>
              <Text style={styles.cardSubtitle}>
                {step === 1 && "Enter your email to receive a secure verification code."}
                {step === 2 && `Enter the 6-digit code sent to your email.`}
                {step === 3 && "Ensure your new password is at least 8 characters long."}
              </Text>

              <View style={styles.inputContainer}>
                {step === 1 && (
                  <View style={styles.inputWrapper}>
                    <Mail size={20} color="#6366F1" style={styles.inputIcon} />
                    <TextInput
                      placeholder="Email Address"
                      style={styles.textInput}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                )}

                {step === 2 && (
                  <View style={styles.inputWrapper}>
                    <ShieldCheck size={20} color="#6366F1" style={styles.inputIcon} />
                    <TextInput
                      placeholder="Verification Code"
                      style={styles.textInput}
                      value={otp}
                      onChangeText={setOtp}
                      keyboardType="number-pad"
                      maxLength={6}
                    />
                  </View>
                )}

                {step === 3 && (
                  <View style={styles.inputWrapper}>
                    <Lock size={20} color="#6366F1" style={styles.inputIcon} />
                    <TextInput
                      placeholder="New Password"
                      style={styles.textInput}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      secureTextEntry
                    />
                  </View>
                )}
              </View>

              <TouchableOpacity 
                style={styles.primaryBtn} 
                onPress={handleAction}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Text style={styles.primaryBtnText}>
                      {step === 3 ? "Reset Password" : "Next Step"}
                    </Text>
                    <ArrowRight size={20} color="#FFF" />
                  </>
                )}
              </TouchableOpacity>
            </View>

            {step === 2 && (
              <TouchableOpacity style={styles.resendAction} onPress={() => setStep(1)}>
                <Text style={styles.resendLabel}>
                  Didn't receive code? <Text style={styles.resendLink}>Try Again</Text>
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20,
    paddingVertical: 10
  },
  glassBackBtn: { 
    width: 44, 
    height: 44, 
    borderRadius: 14, 
    backgroundColor: 'rgba(255,255,255,0.8)', 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  headerTitleText: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  mainContent: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
  stepIndicatorRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 40 },
  stepWrapper: { flexDirection: 'row', alignItems: 'center' },
  stepCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
  activeStepCircle: { backgroundColor: '#6366F1', borderColor: '#6366F1' },
  inactiveStepCircle: { backgroundColor: '#FFF', borderColor: '#CBD5E1' },
  stepText: { fontSize: 14, fontWeight: '700' },
  activeStepText: { color: '#FFF' },
  inactiveStepText: { color: '#94A3B8' },
  stepLine: { width: 40, height: 2, marginHorizontal: 8 },
  activeStepLine: { backgroundColor: '#6366F1' },
  inactiveStepLine: { backgroundColor: '#E2E8F0' },
  card: { 
    backgroundColor: '#FFF', 
    borderRadius: 24, 
    padding: 24, 
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5
  },
  cardTitle: { fontSize: 24, fontWeight: '800', color: '#1E293B', marginBottom: 8 },
  cardSubtitle: { fontSize: 15, color: '#64748B', lineHeight: 22, marginBottom: 28 },
  inputContainer: { marginBottom: 24 },
  inputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F8FAFC', 
    borderRadius: 16, 
    paddingHorizontal: 16, 
    height: 64,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  inputIcon: { marginRight: 12 },
  textInput: { flex: 1, fontSize: 16, color: '#1E293B', fontWeight: '500' },
  primaryBtn: { 
    backgroundColor: '#6366F1', 
    height: 64, 
    borderRadius: 16, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: 12,
    elevation: 4
  },
  primaryBtnText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  resendAction: { marginTop: 24, alignSelf: 'center' },
  resendLabel: { color: '#64748B', fontSize: 14 },
  resendLink: { color: '#6366F1', fontWeight: '700' }
});