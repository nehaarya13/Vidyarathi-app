import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  SafeAreaView, TextInput, KeyboardAvoidingView, ActivityIndicator, Alert, Dimensions
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Clock, Check, ArrowRight, AlertCircle } from 'lucide-react-native';
import axios from 'axios';

const { width } = Dimensions.get('window');

export default function PracticeSession() {
  const router = useRouter();
  const { materialId, pattern, userId } = useLocalSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);

  // 1. Fetch Questions from PDF on Mount
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await axios.post('http://YOUR_BACKEND_IP:5000/api/practice/generate-session', {
          materialId,
          pattern,
          userId
        });
        setQuestions(res.data.data);
        
        // Timer Logic as per your flow
        const timerMap = { mcq: 600, '2marks': 300, '5marks': 450, '10marks': 900 };
        setTimeLeft(timerMap[pattern as string] || 600);
      } catch (err) {
        Alert.alert("Error", "Could not fetch PDF questions.");
        router.back();
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  // 2. Timer Countdown
  useEffect(() => {
    if (timeLeft <= 0 && !loading) {
      if (step === 'testing') handleFinalSubmit();
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, loading]);

  const handleNext = () => {
    // Mandatory Check: At least 3 questions if subjective (except MCQ)
    const answeredCount = Object.keys(userAnswers).length;
    if (pattern !== 'mcq' && currentIndex === questions.length - 1 && answeredCount < 3 && questions.length >= 3) {
      Alert.alert("Wait!", "Please answer at least 3 questions (or type n/a).");
      return;
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      handleFinalSubmit();
    }
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    try {
      // Sending all answers to backend for Mastery Update
      await axios.post('http://YOUR_BACKEND_IP:5000/api/practice/submit', {
        userId,
        materialId,
        patternType: pattern,
        answers: userAnswers,
        timeTaken: timeLeft
      });
      
      // Navigate to Summary Screen with Pie Chart logic
      router.push({
        pathname: "/practice-summary",
        params: { materialId, pattern, score: calculateLocalScore() }
      });
    } catch (err) {
      Alert.alert("Submission Failed", "Try again.");
    } finally {
      setLoading(false);
    }
  };

  const calculateLocalScore = () => {
    // For MCQ direct check, for subjective it's just progress percentage
    return Math.round((Object.keys(userAnswers).length / questions.length) * 100);
  };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#6366F1" />
      <Text style={styles.loadingText}>AI preparing questions from your PDF...</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        
        {/* Header: Timer & Exit */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ChevronLeft size={28} color="#0F172A" />
          </TouchableOpacity>
          <View style={styles.timerBox}>
            <Clock size={16} color="#EF4444" />
            <Text style={styles.timerText}>
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </Text>
          </View>
          <View style={{ width: 28 }} /> 
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${((currentIndex + 1) / questions.length) * 100}%` }]} />
          </View>

          <Text style={styles.qCount}>QUESTION {currentIndex + 1} OF {questions.length}</Text>
          <Text style={styles.questionText}>{questions[currentIndex]?.question}</Text>

          {/* Logic for MCQ vs Subjective */}
          {pattern === 'mcq' ? (
            <View style={styles.mcqContainer}>
              {questions[currentIndex].options.map((opt, idx) => (
                <TouchableOpacity 
                  key={idx} 
                  style={[styles.optBtn, userAnswers[currentIndex] === idx && styles.optSelected]}
                  onPress={() => setUserAnswers({ ...userAnswers, [currentIndex]: idx })}
                >
                  <Text style={[styles.optText, userAnswers[currentIndex] === idx && styles.optTextSelected]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View>
              <TextInput
                style={styles.input}
                placeholder="Type your answer here... (Type 'n/a' if you don't know)"
                multiline
                numberOfLines={10}
                value={userAnswers[currentIndex] || ""}
                onChangeText={(val) => setUserAnswers({ ...userAnswers, [currentIndex]: val })}
              />
              <View style={styles.infoBox}>
                <AlertCircle size={14} color="#64748B" />
                <Text style={styles.infoText}>Tip: Mentioning key terms from the PDF increases your score.</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Footer Navigation */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.actionBtn} 
            onPress={handleNext}
          >
            <Text style={styles.actionBtnText}>
              {currentIndex === questions.length - 1 ? "Finish & Submit" : "Next Question"}
            </Text>
            <ArrowRight size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 15, color: '#6366F1', fontWeight: '600' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  timerBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEF2F2', padding: 8, borderRadius: 12 },
  timerText: { color: '#EF4444', fontWeight: 'bold' },
  scroll: { padding: 20 },
  progressContainer: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, marginBottom: 25, overflow: 'hidden' },
  progressBar: { height: '100%', backgroundColor: '#6366F1' },
  qCount: { color: '#6366F1', fontWeight: '800', letterSpacing: 1, fontSize: 12, marginBottom: 10 },
  questionText: { fontSize: 22, fontWeight: '700', color: '#0F172A', lineHeight: 32, marginBottom: 30 },
  mcqContainer: { gap: 12 },
  optBtn: { padding: 20, borderRadius: 16, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  optSelected: { borderColor: '#6366F1', backgroundColor: '#EEF2FF' },
  optText: { fontSize: 16, color: '#475569' },
  optTextSelected: { color: '#6366F1', fontWeight: '600' },
  input: { backgroundColor: '#F8FAFC', borderRadius: 20, padding: 20, fontSize: 16, minHeight: 200, textAlignVertical: 'top', borderWidth: 1, borderColor: '#E2E8F0' },
  infoBox: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 15 },
  infoText: { fontSize: 12, color: '#64748B' },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  actionBtn: { backgroundColor: '#0F172A', padding: 18, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  actionBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});