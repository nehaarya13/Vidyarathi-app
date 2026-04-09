import React, { useState, useEffect, useRef } from "react";
import { 
  View, Text, TextInput, ScrollView, TouchableOpacity, 
  StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator 
} from "react-native";
import { useLocalSearchParams } from "expo-router"; 
import { Send, Sparkles, Paperclip, Plus, Globe, Book, X, FileText } from "lucide-react-native";
import * as DocumentPicker from 'expo-document-picker';
import { StudyBuddyAPI } from "../../services/api-client";
import { useAuth } from "../context/AuthContext";

export default function StudyScreen() {
  const { user } = useAuth();
  const userId = user?.id || user?._id;
  
  // 🎒 EXPO ROUTER PARAMS
  const params = useLocalSearchParams();
  const { autoQuery, materialId, taskId } = params;
  
  const [messages, setMessages] = useState<any[]>([
    { role: 'ai', content: "Hello! I am your AI Study Partner. Let's tackle your goals today. 👋" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentMaterial, setCurrentMaterial] = useState<{id: string, name: string} | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const hasInitialized = useRef(false); // To prevent double triggers

  // --- 🔥 AUTO-PILOT TRIGGER (NEW FEATURE) ---
  useEffect(() => {
    const initializeChat = async () => {
      // Sirf ek baar run kare jab autoQuery mile aur abhi tak fire na hua ho
      if (autoQuery && !hasInitialized.current) {
        hasInitialized.current = true;
        
        // Agar materialId hai toh usey automatically select kar lo
        if (materialId) {
          setCurrentMaterial({ id: materialId as string, name: "Linked Material" });
        }
        
        // Short delay taaki UI render ho jaye phir AI message automatically chala jaye
        setTimeout(() => {
          handleSendMessage(autoQuery as string, materialId as string, taskId as string);
        }, 600);
      }
    };

    initializeChat();
  }, [autoQuery]); // Dependency on autoQuery to catch navigation events

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: "application/pdf" });
      if (!result.canceled) {
        const file = result.assets[0];
        const formData = new FormData();
        formData.append('file', {
          uri: Platform.OS === 'android' ? file.uri : file.uri.replace('file://', ''),
          name: file.name,
          type: 'application/pdf',
        } as any);
        formData.append('userId', userId);

        setLoading(true);
        try {
          const response = await StudyBuddyAPI.uploadMaterial(formData);
          setCurrentMaterial({ id: response.materialId, name: file.name });
          Alert.alert("Success", `"${file.name}" ready!`);
        } catch (err) {
          Alert.alert("Error", "Upload failed.");
        } finally {
          setLoading(false);
        }
      }
    } catch (err) { console.log(err); }
  };

  const handleSendMessage = async (text?: string, forcedMatId?: string, tId?: string) => {
    const userMessage = text || input;
    if (!userMessage.trim()) return;

    // UI mein user ka message add karo
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput("");
    setLoading(true);

    try {
      const targetMatId = forcedMatId || currentMaterial?.id || null;
      
      // REAL BACKEND API CALL
      const response = await StudyBuddyAPI.sendMessage(
        userMessage, 
        userId, 
        targetMatId
      );
      
      // AI ka response UI mein add karo
      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: response.answer,
        sourceType: response.sourceType || (targetMatId ? 'pdf' : 'internet')
      }]);

      // ✅ STATUS SYNC: AI ne jawab diya? Task ko "Complete" mark kar do!
      const finalTaskId = tId || taskId;
      if (finalTaskId) {
        console.log("Auto-Syncing Task Status:", finalTaskId);
        await StudyBuddyAPI.toggleTask(finalTaskId as string);
      }

    } catch (err) {
      console.error("Chat error:", err);
      setMessages(prev => [...prev, { role: 'ai', content: "I'm having trouble connecting. 🌐" }]);
    } finally {
      setLoading(false);
      // Scroll to bottom after message
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      style={styles.container}
    >
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Sparkles size={20} color="#4F46E5" />
          <Text style={styles.headerTitle}>Study AI</Text>
        </View>
        <TouchableOpacity onPress={pickDocument} style={styles.uploadBtn}>
          <Plus size={18} color="#4F46E5" />
          <Text style={styles.uploadBtnText}>Add Material</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        ref={scrollViewRef} 
        style={styles.chatArea}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {messages.map((m, i) => (
          <View key={i} style={[styles.msgWrapper, m.role === 'user' ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }]}>
            <View style={[styles.msgBox, m.role === 'user' ? styles.userMsg : styles.aiMsg]}>
              <Text style={[styles.msgText, { color: m.role === 'user' ? '#FFF' : '#1E293B' }]}>{m.content}</Text>
            </View>
            {m.role === 'ai' && i !== 0 && (
              <View style={styles.sourceTag}>
                {m.sourceType === 'pdf' ? <Book size={10} color="#4F46E5"/> : <Globe size={10} color="#64748B"/>}
                <Text style={styles.sourceText}>{m.sourceType === 'pdf' ? "Source: PDF" : "Source: Web"}</Text>
              </View>
            )}
          </View>
        ))}
        {loading && <ActivityIndicator style={{marginTop: 10}} color="#4F46E5" />}
      </ScrollView>

      <View style={styles.footerContainer}>
        {currentMaterial && (
          <View style={styles.attachmentChip}>
            <FileText size={14} color="#4F46E5" />
            <Text style={styles.attachmentText} numberOfLines={1}>{currentMaterial.name}</Text>
            <TouchableOpacity onPress={() => setCurrentMaterial(null)}>
              <X size={14} color="#64748B" />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.inputWrapper}>
          <TouchableOpacity onPress={pickDocument} style={styles.attachBtn}>
            <Paperclip size={22} color="#64748B" />
          </TouchableOpacity>
          <TextInput 
            style={styles.input} 
            placeholder="Ask your study partner..." 
            value={input}
            onChangeText={setInput}
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendBtn, (!input.trim() || loading) && {opacity: 0.6}]} 
            onPress={() => handleSendMessage()}
            disabled={loading || !input.trim()}
          >
            <Send size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: { paddingTop: 60, paddingBottom: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: "#F1F5F9", flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF2FF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 4 },
  uploadBtnText: { color: '#4F46E5', fontSize: 12, fontWeight: '700' },
  chatArea: { flex: 1, padding: 15 },
  msgWrapper: { marginBottom: 20 },
  msgBox: { padding: 14, borderRadius: 18, maxWidth: '85%' },
  userMsg: { backgroundColor: "#4F46E5", borderBottomRightRadius: 2 },
  aiMsg: { backgroundColor: "#F8FAFC", borderBottomLeftRadius: 2, borderWidth: 1, borderColor: '#F1F5F9' },
  msgText: { fontSize: 15, lineHeight: 22 },
  sourceTag: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  sourceText: { fontSize: 10, color: '#64748B' },
  footerContainer: { borderTopWidth: 1, borderTopColor: "#F1F5F9", paddingHorizontal: 15, paddingBottom: Platform.OS === 'ios' ? 35 : 15 },
  attachmentChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, gap: 6, marginTop: 10, maxWidth: '70%' },
  attachmentText: { fontSize: 12, color: '#4F46E5', fontWeight: '600', flexShrink: 1 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  attachBtn: { padding: 5 },
  input: { flex: 1, backgroundColor: "#F8FAFC", borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, maxHeight: 100 },
  sendBtn: { width: 45, height: 45, borderRadius: 22, backgroundColor: "#4F46E5", justifyContent: 'center', alignItems: 'center' }
});