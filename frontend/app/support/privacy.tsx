import React from 'react';
import { 
  View, Text, ScrollView, StyleSheet, SafeAreaView, 
  TouchableOpacity, StatusBar, Platform, Linking 
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext'; 
import { 
  ChevronLeft, ShieldCheck, EyeOff, Lock, 
  Server, FileText, Smartphone, CheckCircle2,
  ExternalLink, Mail
} from 'lucide-react-native';

export default function PrivacyPolicy() {
  const router = useRouter();
  const { isDarkMode } = useTheme();

  // Unified Theme Mapping
  const theme = {
    bg: isDarkMode ? '#0F172A' : '#F8FAFC',
    card: isDarkMode ? '#1E293B' : '#FFFFFF',
    text: isDarkMode ? '#F8FAFC' : '#1E293B',
    subText: isDarkMode ? '#94A3B8' : '#64748B',
    accent: '#6366F1',
    border: isDarkMode ? '#334155' : '#F1F5F9',
    secondary: isDarkMode ? '#312E81' : '#EEF2FF'
  };

  const sections = [
    {
      title: "Data Collection",
      content: "We only collect study materials (PDFs, Images, Text) that you explicitly upload. We do not access your personal gallery or private device files.",
      icon: <FileText size={20} color={theme.accent} />
    },
    {
      title: "AI Processing",
      content: "Documents are processed solely to generate study aids. Your content is never used to train global AI models without your explicit consent.",
      icon: <Server size={20} color="#10B981" />
    },
    {
      title: "Strict Privacy",
      content: "We follow a 'Privacy by Design' approach. Your identity is anonymized, and we never sell your personal data to third-party advertisers.",
      icon: <EyeOff size={20} color="#F59E0B" />
    },
    {
      title: "Encryption",
      content: "All data transfers are protected with industry-standard AES-256 encryption. Your notes are stored securely and can be deleted instantly.",
      icon: <Lock size={20} color="#EC4899" />
    }
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      {/* Header Navigation */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={[styles.iconCircle, {backgroundColor: theme.card, borderColor: theme.border}]}
        >
          <ChevronLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Privacy Center</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Visual Hero Section */}
        <View style={styles.hero}>
          <View style={[styles.shieldBox, {backgroundColor: theme.secondary}]}>
            <ShieldCheck size={56} color={theme.accent} />
          </View>
          <Text style={[styles.heroTitle, { color: theme.text }]}>Your data is yours.</Text>
          <Text style={[styles.heroSub, { color: theme.subText }]}>
            Last updated: January 2026 • v1.2
          </Text>
        </View>

        {/* Policy Grid Layout */}
        <View style={styles.gridContainer}>
          {sections.map((item, index) => (
            <View key={index} style={[styles.policyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconBg, {backgroundColor: isDarkMode ? '#0F172A' : '#F1F5F9'}]}>
                  {item.icon}
                </View>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>{item.title}</Text>
              </View>
              <Text style={[styles.sectionContent, { color: theme.subText }]}>{item.content}</Text>
            </View>
          ))}
        </View>

        {/* Global Compliance Badge */}
        <View style={[styles.complianceBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <CheckCircle2 size={18} color="#10B981" />
            <Text style={[styles.complianceText, { color: theme.subText }]}>
                Fully compliant with global GDPR & Data Protection standards.
            </Text>
        </View>

        {/* Our Commitment Card */}
        <View style={[styles.footerCard, {backgroundColor: theme.accent}]}>
          <Smartphone size={28} color="#FFF" style={{ marginBottom: 10 }} />
          <Text style={styles.footerTitle}>Our Commitment</Text>
          <Text style={styles.footerText}>
            We believe education should be private. We are committed to protecting your intellectual property and personal learning habits.
          </Text>
        </View>

        {/* Legal Action Links */}
        <View style={styles.linkContainer}>
            <TouchableOpacity style={styles.linkRow} onPress={() => Linking.openURL('mailto:privacy@myaiassistant.com')}>
                <Mail size={16} color={theme.accent} />
                <Text style={[styles.linkText, {color: theme.accent}]}>Contact Privacy Officer</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.linkRow} onPress={() => router.push('/support/terms')}>
                <ExternalLink size={16} color={theme.subText} />
                <Text style={[styles.linkText, {color: theme.subText}]}>Read Terms of Service</Text>
            </TouchableOpacity>
        </View>

        <View style={{height: 40}} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingTop: Platform.OS === 'android' ? 20 : 10, 
    paddingBottom: 20,
    borderBottomWidth: 1,
    gap: 15 
  },
  iconCircle: { 
    width: 42, 
    height: 42, 
    borderRadius: 14, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 1 
  },
  headerTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  scrollContent: { padding: 20 },
  hero: { alignItems: 'center', marginVertical: 35 },
  shieldBox: { padding: 25, borderRadius: 35, marginBottom: 20 },
  heroTitle: { fontSize: 32, fontWeight: '900', textAlign: 'center', letterSpacing: -1 },
  heroSub: { fontSize: 13, fontWeight: '700', marginTop: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  gridContainer: { gap: 16 },
  policyCard: { 
    padding: 22, 
    borderRadius: 28, 
    borderWidth: 1.5,
    ...Platform.select({
        ios: { shadowColor: '#000', shadowOpacity: 0.02, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10 },
        android: { elevation: 2 }
    })
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 15 },
  iconBg: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  sectionContent: { fontSize: 14, lineHeight: 22, fontWeight: '500' },
  complianceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 20,
    marginTop: 10,
    marginBottom: 25,
    borderWidth: 1,
    gap: 8
  },
  complianceText: { fontSize: 12, fontWeight: '600' },
  footerCard: { padding: 30, borderRadius: 32, alignItems: 'center', gap: 5, elevation: 8, shadowColor: '#6366F1', shadowOpacity: 0.3, shadowRadius: 15 },
  footerTitle: { color: '#FFF', fontSize: 20, fontWeight: '900' },
  footerText: { color: 'rgba(255,255,255,0.85)', fontSize: 14, textAlign: 'center', lineHeight: 22, marginTop: 5 },
  linkContainer: { marginTop: 30, alignItems: 'center', gap: 15 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  linkText: { fontSize: 14, fontWeight: '700' }
});