import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  TextInput, 
  ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { 
  GraduationCap, 
  School, 
  Trophy, 
  Sparkles, 
  ArrowRight, 
  ChevronLeft 
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext'; 
import { StudyBuddyAPI } from '../../services/api-client'; // Ensure path is correct

const OPTIONS = [
  { id: 'school', label: 'School Student', icon: School, color: '#6366F1', desc: 'Class 1 to 12' },
  { id: 'college', label: 'College / University', icon: GraduationCap, color: '#8B5CF6', desc: 'Degrees & Diplomas' },
  { id: 'competitive', label: 'Competitive Exams', icon: Trophy, color: '#EC4899', desc: 'JEE, NEET, UPSC, etc.' },
  { id: 'other', label: 'Other / Skills', icon: Sparkles, color: '#10B981', desc: 'General Learning' },
];

export default function OnboardingScreen() {
  const { user, updateOnboardingStatus }: any = useAuth(); 
  const [step, setStep] = useState(1); 
  const [selected, setSelected] = useState('');
  const [detail, setDetail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleNext = () => {
    if (step === 1 && !selected) return Alert.alert("Required", "Please select your category.");
    setStep(2);
  };

  const handleFinish = async () => {
    if (!detail) return Alert.alert("Details Required", "Please specify your class or exam.");

    setLoading(true);
    try {
      console.log("📡 Sending onboarding data to backend...");
      
      // 1. Backend API ko update karein
      const response = await StudyBuddyAPI.completeOnboarding({
        userId: user?.id || user?._id,
        userType: selected,
        contextDetails: detail
      });

      if (response.success) {
        console.log("✅ Backend updated successfully");

        // 2. Global Auth State ko update karein (Context)
        if (updateOnboardingStatus) {
          await updateOnboardingStatus(true);
          
          console.log("🚀 Redirecting to Dashboard...");
          // 3. Final Navigation
          router.replace("/(tabs)/home");
        }
      }
    } catch (error: any) {
      console.error("❌ Onboarding Error:", error);
      const serverMsg = error.response?.data?.error || "Could not save your preferences. Please try again.";
      Alert.alert("Error", serverMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#F8FAFC', '#F1F5F9']} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll}>
          
          {step === 2 && (
            <TouchableOpacity onPress={() => setStep(1)} style={styles.backBtn}>
              <ChevronLeft size={24} color="#64748B" />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          )}

          <View style={styles.header}>
            <Text style={styles.stepTag}>STEP {step} OF 2</Text>
            <Text style={styles.title}>
              {step === 1 ? "Tell us about\nyourself" : "Almost there!"}
            </Text>
            <Text style={styles.subtitle}>
              {step === 1 
                ? "This helps our AI adapt to your study level." 
                : `What are you currently studying for in ${selected.toUpperCase()}?`}
            </Text>
          </View>

          {step === 1 ? (
            <View style={styles.grid}>
              {OPTIONS.map((item) => {
                const Icon = item.icon;
                const isActive = selected === item.id;
                return (
                  <TouchableOpacity 
                    key={item.id}
                    activeOpacity={0.8}
                    onPress={() => setSelected(item.id)}
                    style={[styles.card, isActive && { borderColor: item.color, borderWidth: 2, backgroundColor: '#FFF' }]}
                  >
                    <View style={[styles.iconBox, { backgroundColor: item.color + '15' }]}>
                      <Icon size={28} color={item.color} />
                    </View>
                    <View style={styles.cardContent}>
                      <Text style={styles.cardLabel}>{item.label}</Text>
                      <Text style={styles.cardDesc}>{item.desc}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.detailContainer}>
              <Text style={styles.inputLabel}>Enter your Class, Degree or Exam Name</Text>
              <TextInput
                style={styles.input}
                placeholder={selected === 'school' ? "e.g. 10th Standard" : "e.g. B.Tech Computer Science"}
                placeholderTextColor="#94A3B8"
                value={detail}
                onChangeText={setDetail}
                autoFocus
              />
              <View style={styles.infoBox}>
                <Sparkles size={18} color="#6366F1" />
                <Text style={styles.infoText}>Our AI will use this to generate your personalized Knowledge Graph.</Text>
              </View>
            </View>
          )}

        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.nextBtn, (!selected || (step === 2 && !detail)) && { opacity: 0.6 }]} 
            onPress={step === 1 ? handleNext : handleFinish}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Text style={styles.nextBtnText}>{step === 1 ? 'Next Step' : 'Launch Dashboard'}</Text>
                <ArrowRight size={20} color="#FFF" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 24 },
  backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backText: { fontSize: 16, color: '#64748B', marginLeft: 4 },
  header: { marginBottom: 32 },
  stepTag: { fontSize: 12, fontWeight: '700', color: '#6366F1', letterSpacing: 1, marginBottom: 8 },
  title: { fontSize: 32, fontWeight: '800', color: '#1E293B', lineHeight: 40 },
  subtitle: { fontSize: 16, color: '#64748B', marginTop: 12, lineHeight: 24 },
  grid: { gap: 16 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iconBox: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  cardContent: { marginLeft: 16, flex: 1 },
  cardLabel: { fontSize: 17, fontWeight: '700', color: '#1E293B' },
  cardDesc: { fontSize: 13, color: '#94A3B8', marginTop: 2 },
  detailContainer: { marginTop: 10 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 12 },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 18,
    fontSize: 16,
    color: '#1E293B'
  },
  infoBox: { flexDirection: 'row', backgroundColor: '#EEF2FF', padding: 16, borderRadius: 16, marginTop: 24, gap: 12 },
  infoText: { flex: 1, fontSize: 13, color: '#4F46E5', lineHeight: 18 },
  footer: { padding: 24, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  nextBtn: { 
    backgroundColor: '#1E293B', 
    height: 60, 
    borderRadius: 18, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: 10 
  },
  nextBtnText: { color: '#FFF', fontSize: 18, fontWeight: '700' }
});