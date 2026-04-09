import React, { useState, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Sparkles,
  Paperclip,
  Send,
  Bot,
  MoreVertical,
  FileText,
  Check,
  CheckCheck,
  Target, // Added Target icon for Practice
} from 'lucide-react-native';

const AI_CHAT_SCREEN = () => {
  const router = useRouter();
  
  // Navigate to Practice Screen
  const goToPractice = () => {
    // Make sure your file is named 'practice.tsx' in the app folder
    router.push('/practice');
  };

  const [messages, setMessages] = useState([
    {
      id: '1',
      text: "I've analyzed your Physics_Notes.pdf. I can see you're focusing on thermodynamics. Would you like me to create a study plan or clarify any specific concepts?",
      sender: 'ai',
      time: '10:30 AM',
      status: 'delivered',
      fileName: 'Physics_Notes.pdf',
    },
    {
      id: '2',
      text: 'Yes, please clarify the Second Law of Thermodynamics',
      sender: 'user',
      time: '10:32 AM',
      status: 'read',
    }
  ]);

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const typingAnimation = useRef(new Animated.Value(0)).current;

  const handleSend = () => {
    if (inputText.trim() === '') return;

    const newMessage = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
    };

    setMessages([...messages, newMessage]);
    setInputText('');

    // AI Typing Logic
    setIsTyping(true);
    Animated.timing(typingAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        text: "The Second Law states that total entropy of an isolated system can never decrease over time. For example, heat flows spontaneously from hotter to colder bodies.",
        sender: 'ai',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'delivered',
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
      typingAnimation.setValue(0);
    }, 1500);
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isAI = item.sender === 'ai';

    return (
      <View style={[styles.messageWrapper, isAI ? styles.aiWrapper : styles.userWrapper]}>
        {isAI && (
          <View style={styles.aiAvatar}>
            <Bot size={16} color="#3B82F6" />
          </View>
        )}
        
        <View style={[styles.messageContainer, isAI ? styles.aiContainer : styles.userContainer]}>
          {isAI && item.fileName && (
            <View style={styles.fileIndicator}>
              <FileText size={14} color="#64748B" />
              <Text style={styles.fileName}>{item.fileName}</Text>
              <Sparkles size={14} color="#8B5CF6" />
            </View>
          )}
          
          <Text style={[styles.messageText, isAI ? styles.aiText : styles.userText]}>
            {item.text}
          </Text>
          
          <View style={styles.messageMeta}>
            <Text style={styles.timeText}>{item.time}</Text>
            {!isAI && (
              <View style={styles.statusIcon}>
                {item.status === 'sent' && <Check size={12} color="#94A3B8" />}
                {item.status === 'delivered' && <CheckCheck size={12} color="#94A3B8" />}
                {item.status === 'read' && <CheckCheck size={12} color="#3B82F6" />}
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          {/* Left: Back & Title */}
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color="#0F172A" />
            </TouchableOpacity>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>StudyBuddy AI</Text>
              <View style={styles.headerSubtitle}>
                <Sparkles size={14} color="#10B981" />
                <Text style={styles.headerSubtitleText}>Analyzing Physics_Notes.pdf</Text>
              </View>
            </View>
          </View>

          {/* Right: Actions */}
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={goToPractice} style={styles.actionButton}>
              <Target size={22} color="#3B82F6" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <MoreVertical size={22} color="#64748B" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Main Chat View */}
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListFooterComponent={
            isTyping ? (
              <View style={styles.typingIndicator}>
                <View style={styles.aiAvatar}><Bot size={16} color="#3B82F6" /></View>
                <View style={styles.typingBubble}>
                  <Text style={styles.typingText}>StudyBuddy is thinking...</Text>
                </View>
              </View>
            ) : null
          }
        />

        {/* Input Bar */}
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachButton}>
            <Paperclip size={20} color="#64748B" />
          </TouchableOpacity>
          
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask anything..."
              placeholderTextColor="#94A3B8"
              multiline
            />
          </View>
          
          <TouchableOpacity 
            style={[styles.sendButton, inputText.trim() === '' && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={inputText.trim() === ''}
          >
            <Send size={18} color={inputText.trim() === '' ? "#CBD5E1" : "#FFFFFF"} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  
  // Header Styles Updated
  header: { 
    paddingHorizontal: 20, 
    paddingVertical: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F1F5F9', 
    backgroundColor: '#FFFFFF', 
    paddingTop: Platform.OS === 'android' ? 40 : 12 
  },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  backButton: { padding: 8, marginLeft: -8, marginRight: 8 },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', letterSpacing: -0.3 },
  headerSubtitle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerSubtitleText: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionButton: { padding: 8 },

  // Chat Styles
  chatContainer: { flex: 1 },
  messagesList: { paddingHorizontal: 20, paddingVertical: 24, paddingBottom: 20 },
  messageWrapper: { flexDirection: 'row', marginBottom: 20, alignItems: 'flex-start' },
  aiWrapper: { alignSelf: 'flex-start' },
  userWrapper: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  aiAvatar: { width: 28, height: 28, borderRadius: 10, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginRight: 12, borderWidth: 1, borderColor: '#DBEAFE' },
  messageContainer: { maxWidth: '80%', padding: 16, borderRadius: 18 },
  aiContainer: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderTopLeftRadius: 4 },
  userContainer: { backgroundColor: '#EFF6FF', borderTopRightRadius: 4 },
  fileIndicator: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  fileName: { fontSize: 13, color: '#64748B', flex: 1, fontWeight: '500' },
  messageText: { fontSize: 15, lineHeight: 22, color: '#0F172A' },
  aiText: { fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto' },
  userText: { fontWeight: '500' },
  messageMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 8, gap: 6 },
  timeText: { fontSize: 12, color: '#94A3B8' },
  statusIcon: { marginLeft: 2 },
  typingIndicator: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 20, marginBottom: 20 },
  typingBubble: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 18, borderTopLeftRadius: 4, padding: 12 },
  typingText: { fontSize: 13, color: '#64748B', fontStyle: 'italic' },
  
  // Input Styles (Fixed for keyboard visibility)
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'flex-end', 
    paddingHorizontal: 20, 
    paddingVertical: 16, 
    backgroundColor: '#FFFFFF', 
    borderTopWidth: 1, 
    borderTopColor: '#F1F5F9' 
  },
  attachButton: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', marginRight: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  inputWrapper: { flex: 1, backgroundColor: '#F8FAFC', borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0', maxHeight: 100, paddingHorizontal: 16, paddingVertical: 12 },
  input: { fontSize: 16, color: '#0F172A', padding: 0 },
  sendButton: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
  sendButtonDisabled: { backgroundColor: '#F1F5F9' },
});

export default AI_CHAT_SCREEN;