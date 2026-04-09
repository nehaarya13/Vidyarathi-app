import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView, 
  Dimensions, Animated, StatusBar, ActivityIndicator, Alert 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle2, Trophy, RefreshCcw, Home, ShieldCheck, Target } from 'lucide-react-native';
import { StudyBuddyAPI } from '../services/api-client'; // Path check kar lein apne structure ke hisaab se
import { useAuth } from './context/AuthContext';

const { width } = Dimensions.get('window');

export default function PracticeSummary() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();

  // 🎯 Params extraction
  const score = params.score ? Math.round(Number(params.score)) : 0;
  const pattern = params.pattern ? String(params.pattern).toUpperCase() : "PRACTICE";
  const materialId = params.materialId as string;
  const topicKey = params.topicKey as string; 
  const topicName = params.topicName as string;

  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 6, useNativeDriver: true })
    ]).start();
  }, []);

  // 🔥 THE MASTER SYNC: Connects Frontend UI to Backend Database
  const handleGoHome = async () => {
    const userId = user?.id || user?._id;
    
    if (!userId || !materialId) {
      console.warn("⚠️ Data missing for sync, redirecting directly.");
      router.replace('/(tabs)/planner');
      return;
    }

    try {
      setIsSaving(true);
      
      // ✅ FIXED: Using StudyBuddyAPI.updateScore (not updateMasteryScore)
      const res = await StudyBuddyAPI.updateScore({
        userId,
        materialId,
        score,
        topicKey: topicKey || 'general-focus',
        topicName: topicName || 'Study Session'
      });

      if (res.success) {
        console.log("✅ Database Synced Successfully.");
        router.replace('/(tabs)/planner'); 
      } else {
        throw new Error("Backend response unsuccessful");
      }
    } catch (e) {
      console.error("❌ Sync Error:", e);
      Alert.alert(
        "Sync Notice", 
        `Score ${score}% saved locally, but cloud sync failed. Check your connection.`,
        [{ text: "Go to Planner", onPress: () => router.replace('/(tabs)/planner') }]
      );
    } finally {
      setIsSaving(false);
    }
  };

  const getFeedback = () => {
    if (score >= 85) return { 
      title: "Elite Mastery", color: "#10B981", 
      msg: "Exceptional! You've completely mastered this segment.",
      icon: <Trophy size={60} color="#10B981" />
    };
    if (score >= 60) return { 
      title: "Solid Progress", color: "#6366F1", 
      msg: "Great job! A few more sessions and you'll be an expert.",
      icon: <Target size={60} color="#6366F1" />
    };
    return { 
      title: "Keep Growing", color: "#F59E0B", 
      msg: "Consistency is key. Review the material and try again!",
      icon: <ShieldCheck size={60} color="#F59E0B" />
    };
  };

  const feedback = getFeedback();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        
        <View style={styles.iconContainer}>
          <View style={[styles.circleBg, { backgroundColor: feedback.color + '15', borderColor: feedback.color + '30' }]}>
            {feedback.icon}
          </View>
          <View style={[styles.badgeOverlay, { backgroundColor: feedback.color }]}>
            <CheckCircle2 size={18} color="#FFF" />
          </View>
        </View>

        <Text style={styles.congratsText}>PRACTICE SESSION ENDED</Text>
        <Text style={[styles.masteryTitle, { color: feedback.color }]}>{feedback.title}</Text>
        
        <View style={styles.scoreWrapper}>
            <View style={[styles.outerRing, { borderColor: feedback.color }]}>
                <View style={styles.innerRing}>
                    <Text style={styles.scorePercent}>{score}%</Text>
                    <Text style={styles.scoreLabel}>ACCURACY</Text>
                </View>
            </View>
        </View>

        <View style={styles.card}>
            <View style={[styles.modeBadge, { backgroundColor: feedback.color + '10' }]}>
                <Text style={[styles.modeText, { color: feedback.color }]}>{pattern} MODE</Text>
            </View>
            <Text style={styles.feedbackMsg}>{feedback.msg}</Text>
        </View>

        <View style={styles.buttonGroup}>
          <TouchableOpacity 
            activeOpacity={0.8}
            style={[styles.mainBtn, isSaving && { opacity: 0.7 }]} 
            onPress={handleGoHome}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Home size={20} color="#FFF" />
                <Text style={styles.mainBtnText}>Sync & Go to Planner</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            activeOpacity={0.7}
            style={styles.outlineBtn} 
            onPress={() => router.replace('/(tabs)/study')}
          >
            <RefreshCcw size={20} color="#64748B" />
            <Text style={styles.outlineBtnText}>Try Another Topic</Text>
          </TouchableOpacity>
        </View>

      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 25 },
  iconContainer: { marginBottom: 20, alignItems: 'center' },
  circleBg: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderStyle: 'dashed' },
  badgeOverlay: { position: 'absolute', bottom: 5, right: 5, borderRadius: 20, padding: 4, elevation: 3 },
  congratsText: { fontSize: 11, fontWeight: '800', color: '#94A3B8', letterSpacing: 1.5, marginBottom: 5 },
  masteryTitle: { fontSize: 32, fontWeight: '900', textAlign: 'center' },
  scoreWrapper: { marginVertical: 30 },
  outerRing: { 
    width: 160, height: 160, borderRadius: 80, 
    borderWidth: 10, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#FFF', elevation: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10
  },
  innerRing: { alignItems: 'center' },
  scorePercent: { fontSize: 44, fontWeight: '900', color: '#1E293B' },
  scoreLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '800', letterSpacing: 1, marginTop: -2 },
  card: { backgroundColor: '#FFF', padding: 20, borderRadius: 24, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 30 },
  modeBadge: { paddingVertical: 4, paddingHorizontal: 12, borderRadius: 8, marginBottom: 12 },
  modeText: { fontSize: 10, fontWeight: '900' },
  feedbackMsg: { fontSize: 15, color: '#475569', textAlign: 'center', fontWeight: '500', lineHeight: 22 },
  buttonGroup: { width: '100%', gap: 12 },
  mainBtn: { backgroundColor: '#1E293B', padding: 18, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  mainBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  outlineBtn: { padding: 16, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, borderWidth: 1.5, borderColor: '#E2E8F0' },
  outlineBtnText: { color: '#64748B', fontWeight: '700', fontSize: 15 }
});