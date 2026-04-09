import React, { useState } from 'react';
import { 
  View, Text, ScrollView, StyleSheet, SafeAreaView, 
  TouchableOpacity, LayoutAnimation, Platform, UIManager, StatusBar 
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { 
  ChevronLeft, ChevronDown, ChevronUp, BrainCircuit, 
  ShieldCheck, Zap, CreditCard, Cloud, MessageCircle,
  Languages, FileText, Smartphone, Download
} from 'lucide-react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function FAQScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const theme = {
    bg: isDarkMode ? '#0F172A' : '#F8FAFC',
    card: isDarkMode ? '#1E293B' : '#FFFFFF',
    text: isDarkMode ? '#F8FAFC' : '#1E293B',
    subText: isDarkMode ? '#94A3B8' : '#64748B',
    accent: '#6366F1',
    border: isDarkMode ? '#334155' : '#F1F5F9',
    iconBg: isDarkMode ? '#334155' : '#F1F5F9'
  };

  const toggleAccordion = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const faqs = [
    { 
      q: "How accurate is the AI note generation?", 
      a: "Our AI model is trained specifically on academic and professional data, providing 95%+ accuracy for conceptual summaries and key point extraction.",
      icon: <BrainCircuit size={18} color={theme.accent} />
    },
    { 
      q: "Does the app support handwritten notes?", 
      a: "Yes, our advanced OCR (Optical Character Recognition) can process clear handwritten text from images and convert it into structured digital notes.",
      icon: <FileText size={18} color="#10B981" />
    },
    { 
      q: "Which file formats can I upload?", 
      a: "Currently, we support PDF documents and image files (JPG, PNG). Support for Word and PowerPoint files is coming in a future update.",
      icon: <Cloud size={18} color="#0EA5E9" />
    },
    { 
      q: "Can I use the app in multiple languages?", 
      a: "Absolutely. You can choose between English, Hindi, and Hinglish for the AI output to ensure the explanations match your learning style.",
      icon: <Languages size={18} color="#EC4899" />
    },
    { 
      q: "How secure is my personal study data?", 
      a: "We prioritize your privacy. All uploaded documents are encrypted and used solely for generating your personal study materials.",
      icon: <ShieldCheck size={18} color="#F59E0B" />
    },
    { 
      q: "Can I export my notes for offline use?", 
      a: "Yes, every generated note includes an 'Export to PDF' option, allowing you to save or print your summaries anytime.",
      icon: <Download size={18} color="#6366F1" />
    },
    { 
      q: "Is cross-device synchronization supported?", 
      a: "Yes, simply log in with the same account. Your entire mastery graph and history will sync automatically across all your devices.",
      icon: <Smartphone size={18} color={theme.accent} />
    }
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <View style={[styles.iconCircle, {backgroundColor: theme.card}]}>
            <ChevronLeft size={24} color={theme.text} />
          </View>
        </TouchableOpacity>
        <View>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Help Center</Text>
          <Text style={[styles.headerSub, { color: theme.subText }]}>Get instant answers to your questions</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {faqs.map((item, i) => {
          const isExpanded = expandedIndex === i;
          return (
            <TouchableOpacity 
              key={i} 
              activeOpacity={0.7}
              onPress={() => toggleAccordion(i)}
              style={[
                styles.faqCard, 
                { 
                  backgroundColor: theme.card, 
                  borderColor: isExpanded ? theme.accent : theme.border,
                }
              ]}
            >
              <View style={styles.qRow}>
                <View style={[styles.iconBox, { backgroundColor: theme.iconBg }]}>
                  {item.icon}
                </View>
                <Text style={[styles.question, { color: theme.text }]}>{item.q}</Text>
                {isExpanded ? 
                  <ChevronUp size={20} color={theme.accent} strokeWidth={3} /> : 
                  <ChevronDown size={20} color={theme.subText} />
                }
              </View>
              
              {isExpanded && (
                <View style={styles.aContainer}>
                  <View style={[styles.divider, { backgroundColor: theme.border }]} />
                  <Text style={[styles.answer, { color: theme.subText }]}>{item.a}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
        
        {/* Support Section */}
        <View style={[styles.supportCard, { backgroundColor: isDarkMode ? '#1E293B' : '#EEF2FF' }]}>
          <View style={styles.supportIconHeader}>
             <MessageCircle size={24} color={theme.accent} />
          </View>
          <Text style={[styles.footerText, { color: theme.text }]}>Still need assistance?</Text>
          <Text style={[styles.footerSub, { color: theme.subText }]}>Our support team is available 24/7 to help you with any issues.</Text>
          <TouchableOpacity 
            style={[styles.contactBtn, {backgroundColor: theme.accent}]}
            onPress={() => router.push('/support/contact')}
          >
            <Text style={styles.contactBtnText}>Contact Support</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    paddingHorizontal: 20, 
    paddingTop: Platform.OS === 'android' ? 20 : 10, 
    paddingBottom: 20, 
    flexDirection: 'row', 
    alignItems: 'center',
    gap: 12
  },
  iconCircle: {
    width: 45,
    height: 45,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  backBtn: { marginRight: 5 },
  headerTitle: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  headerSub: { fontSize: 14, fontWeight: '600', marginTop: 2 },
  scrollContent: { padding: 20, paddingBottom: 60 },
  faqCard: { 
    borderRadius: 22, 
    marginBottom: 12, 
    padding: 18, 
    borderWidth: 1.5,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5
  },
  qRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  question: { fontSize: 16, fontWeight: '700', flex: 1, lineHeight: 22 },
  aContainer: { marginTop: 15 },
  divider: { height: 1.2, marginBottom: 15 },
  answer: { fontSize: 15, lineHeight: 24, fontWeight: '500' },
  supportCard: { 
    marginTop: 40, 
    borderRadius: 30, 
    padding: 30, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.1)'
  },
  supportIconHeader: {
    width: 50,
    height: 50,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15
  },
  footerText: { fontSize: 20, fontWeight: '800' },
  footerSub: { fontSize: 14, textAlign: 'center', marginTop: 8, marginBottom: 25, lineHeight: 20 },
  contactBtn: { 
    paddingHorizontal: 30, 
    paddingVertical: 15, 
    borderRadius: 18,
    elevation: 4,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10
  },
  contactBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' }
});