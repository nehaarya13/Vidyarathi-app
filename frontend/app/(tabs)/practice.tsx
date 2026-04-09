import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  SafeAreaView, Dimensions, TextInput, KeyboardAvoidingView, ActivityIndicator, Alert
} from 'react-native';
import { 
  ChevronLeft, Zap, Target, BookOpen, Clock, 
  ArrowRight 
} from 'lucide-react-native';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
// 🔥 Import Auth Context
import { useAuth } from "../context/AuthContext";

const { width } = Dimensions.get('window');

const NGROK_URL = "https://convincedly-unlanterned-ember.ngrok-free.dev";
const NGROK_HEADERS = { 'ngrok-skip-browser-warning': 'true' };

const PracticeMasteryScreen = () => {
  const router = useRouter();
  const { user } = useAuth(); // 👈 Auth hook use kiya
  const { materialId } = useLocalSearchParams();
  
  // Real User ID lo, agar nahi hai toh guest (Par backend ab ise safely handle karega)
  const userId = user?.id || user?._id || "guest_user";

  const [step, setStep] = useState('selection'); 
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentPattern, setCurrentPattern] = useState(''); 

  const startPractice = async (pattern) => {
    setCurrentPattern(pattern); 

    if(!materialId) {
        Alert.alert("No PDF Found", "Please go back and select a PDF first.");
        return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${NGROK_URL}/api/practice/generate-session`, {
        materialId: materialId, 
        pattern: pattern,
        userId: userId
      }, { headers: NGROK_HEADERS });
      
      if(response.data.success && response.data.data.length > 0) {
          setQuestions(response.data.data);
          const times = { mcq: 600, '2marks': 300, '5marks': 600, '10marks': 900 };
          setTimeLeft(times[pattern] || 600);
          setCurrentIndex(0);
          setUserAnswers({});
          setStep('testing'); 
      } else {
          Alert.alert("Error", "AI couldn't generate questions for this PDF.");
      }
    } catch (error) {
      console.error("❌ Practice Fetch Error:", error.message);
      Alert.alert("AI Offline", "Backend is not responding.");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (questions.length === 0) return;

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      handleFinalSubmit();
    }
  };

  const handleFinalSubmit = async () => {
    // 🛑 SAFETY CHECK: Guest user ko block karo ya warn karo
    if (userId === "guest_user") {
        Alert.alert(
            "Guest Mode", 
            "Bhai, login karlo! Guest mode mein aapka score Knowledge Galaxy mein save nahi hoga.",
            [{ text: "OK", onPress: () => processSubmission() }]
        );
        return;
    }
    processSubmission();
  };

  const processSubmission = async () => {
    if (loading) return; 
    setLoading(true);
    
    try {
        console.log(`📤 Submitting Session for User: ${userId}`);
        let totalAccuracy = 0;
        
        const mainTopicKey = questions[0]?.topicKey || "general-study";
        const mainTopicName = questions[0]?.topicName || "Study Session";

        for (let i = 0; i < questions.length; i++) {
            const payload = {
                userId,
                materialId,
                topicKey: questions[i]?.topicKey || "General",
                question: questions[i]?.question,
                studentAnswer: userAnswers[i] !== undefined ? userAnswers[i] : "n/a",
                options: questions[i]?.options || null, 
                correctAnswer: questions[i]?.correctAnswer || null
            };
            const resp = await axios.post(`${NGROK_URL}/api/practice/submit`, payload, { headers: NGROK_HEADERS });
            if (resp.data.success) totalAccuracy += resp.data.accuracy;
        }

        const finalScore = Math.round(totalAccuracy / questions.length);
        setStep('selection'); 

        router.push({
          pathname: '/practice-summary',
          params: { 
            score: finalScore, 
            pattern: currentPattern || 'Practice',
            materialId: materialId,
            topicKey: mainTopicKey,
            topicName: mainTopicName
          }
        });

    } catch (e) {
        console.error("❌ Submission Error:", e.message);
        Alert.alert("Error", "Could not submit answers.");
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    let interval = null;
    if (step === 'testing' && questions.length > 0 && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } 
    else if (step === 'testing' && questions.length > 0 && timeLeft === 0) {
      handleFinalSubmit();
    }
    return () => { if (interval) clearInterval(interval); };
  }, [step, timeLeft, questions.length]);

  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  if (loading) return (
    <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loaderText}>Processing your session...</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior="padding" style={{flex: 1}}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => step === 'testing' ? setStep('selection') : router.back()} style={styles.backBtn}>
            <ChevronLeft size={24} color="#0F172A" />
          </TouchableOpacity>
          <View style={styles.progressWrapper}>
             <View style={[styles.progressBar, { width: `${progress}%` }]} />
          </View>
          <View style={styles.timerBadge}>
             <Text style={styles.timerText}>
               {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
             </Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={{paddingBottom: 40}}>
          {step === 'selection' ? (
            <View style={styles.selectionView}>
              <Text style={styles.welcomeTitle}>Practice Lab</Text>
              <Text style={styles.welcomeSub}>Test your knowledge from the uploaded PDF.</Text>

              <View style={styles.gridContainer}>
                {[
                  { id: 'mcq', label: 'MCQ Test', icon: <Zap color="#6366F1" /> },
                  { id: '2marks', label: 'Short Answers (2M)', icon: <Clock color="#10B981" /> },
                  { id: '5marks', label: 'Detailed Study (5M)', icon: <Target color="#F59E0B" /> },
                  { id: '10marks', label: 'Mastery Level (10M)', icon: <BookOpen color="#EC4899" /> }
                ].map((mode) => (
                  <TouchableOpacity key={mode.id} style={styles.newModeCard} onPress={() => startPractice(mode.id)}>
                    <View style={styles.cardIcon}>{mode.icon}</View>
                    <Text style={styles.cardLabel}>{mode.label}</Text>
                    <ArrowRight size={16} color="#CBD5E1" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.testArea}>
              <Text style={styles.qCountText}>QUESTION {currentIndex + 1}/{questions.length}</Text>
              <Text style={styles.mainQuestionText}>{questions[currentIndex]?.question}</Text>

              {questions[currentIndex]?.options ? (
                <View style={styles.optionsContainer}>
                  {questions[currentIndex].options.map((opt, i) => (
                    <TouchableOpacity 
                      key={i} 
                      style={[styles.newOptBtn, userAnswers[currentIndex] === i && styles.selectedOpt]}
                      onPress={() => setUserAnswers({...userAnswers, [currentIndex]: i})}
                    >
                      <View style={[styles.radio, userAnswers[currentIndex] === i && styles.radioActive]} />
                      <Text style={styles.optText}>{opt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <TextInput
                    style={styles.bigInput}
                    placeholder="Type your answer here..."
                    multiline
                    value={userAnswers[currentIndex] || ""}
                    onChangeText={(txt) => setUserAnswers({...userAnswers, [currentIndex]: txt})}
                />
              )}

              <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                <Text style={styles.nextBtnText}>
                    {currentIndex === questions.length - 1 ? "Finish Session" : "Next Question"}
                </Text>
                <ArrowRight size={20} color="white" />
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loaderText: { marginTop: 15, color: '#6366F1', fontWeight: '600' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 15 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', elevation: 2 },
  progressWrapper: { flex: 1, height: 8, backgroundColor: '#E2E8F0', borderRadius: 4, overflow: 'hidden' },
  progressBar: { height: '100%', backgroundColor: '#6366F1' },
  timerBadge: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#F1F5F9', borderRadius: 20 },
  timerText: { fontWeight: '700', color: '#475569' },
  selectionView: { padding: 20 },
  welcomeTitle: { fontSize: 28, fontWeight: '800', color: '#0F172A' },
  welcomeSub: { fontSize: 16, color: '#64748B', marginTop: 5 },
  gridContainer: { marginTop: 30, gap: 15 },
  newModeCard: { backgroundColor: 'white', padding: 20, borderRadius: 24, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  cardIcon: { width: 45, height: 45, borderRadius: 15, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  cardLabel: { flex: 1, fontSize: 16, fontWeight: '700', color: '#1E293B' },
  testArea: { padding: 20 },
  qCountText: { fontSize: 12, fontWeight: '800', color: '#6366F1', letterSpacing: 1 },
  mainQuestionText: { fontSize: 22, fontWeight: '700', color: '#0F172A', marginTop: 10, lineHeight: 30 },
  optionsContainer: { marginTop: 30, gap: 12 },
  newOptBtn: { backgroundColor: 'white', padding: 18, borderRadius: 20, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  selectedOpt: { borderColor: '#6366F1', backgroundColor: '#F5F3FF' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#CBD5E1', marginRight: 15 },
  radioActive: { borderColor: '#6366F1', borderWidth: 6 },
  optText: { fontSize: 16, color: '#334155', fontWeight: '500' },
  bigInput: { backgroundColor: 'white', borderRadius: 20, padding: 20, height: 200, marginTop: 30, textAlignVertical: 'top', fontSize: 16, borderWidth: 1, borderColor: '#F1F5F9' },
  nextBtn: { backgroundColor: '#6366F1', padding: 18, borderRadius: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 30, gap: 10, elevation: 4 },
  nextBtnText: { color: 'white', fontWeight: '700', fontSize: 16 }
});

export default PracticeMasteryScreen;