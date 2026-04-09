import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, ActivityIndicator, RefreshControl, SafeAreaView, StatusBar, 
  Dimensions, Modal, TouchableWithoutFeedback
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { 
  Search, Bell, Target, ChevronRight, Sparkles, 
  Library, Calendar, Layout, X, PlayCircle 
} from "lucide-react-native";
import { useAuth } from "../context/AuthContext";
import { StudyBuddyAPI } from "../../services/api-client";

const { width } = Dimensions.get("window");
const MAX_COLUMNS = 4;
const COLUMN_WIDTH = (width - 40) / MAX_COLUMNS;

const COLORS = {
  bg: "#FFFFFF",
  card: "#F8FAFC",
  primary: "#4F46E5",
  text: "#1E293B",
  muted: "#64748B",
  red: "#EF4444",
  yellow: "#F59E0B",
  green: "#10B981",
  border: "#F1F5F9",
};

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id || user?._id;

  const [mastery, setMastery] = useState<any>({ topics: [], overallProgress: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<any>(null);

  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 2500, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const loadData = async () => {
    if (!userId) return;
    try {
      if (!refreshing) setLoading(true);
      const materials = await StudyBuddyAPI.getUserMaterials(userId);
      const fifteenDaysAgo = new Date();
      fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

      let combinedTopics: any[] = [];
      let cumulativeMastery = 0;
      let materialsWithData = 0;

      if (materials?.length) {
        const recentMaterials = materials.filter((mat: any) => {
          const materialDate = new Date(mat.updatedAt || mat.createdAt);
          return materialDate >= fifteenDaysAgo;
        });

        for (const mat of recentMaterials) {
          try {
            const data = await StudyBuddyAPI.getMasteryData(userId, mat._id);
            if (data?.topics?.length) {
              const importantTopics = data.topics
                .sort((a: any, b: any) => {
                  const order: any = { Red: 1, Yellow: 2, Green: 3 };
                  return (order[a.status] || 4) - (order[b.status] || 4);
                })
                .slice(0, 3);

              combinedTopics.push(...importantTopics.map((t: any) => ({
                ...t, materialId: mat._id, fileName: mat.fileName || "Topic"
              })));
              cumulativeMastery += data.overallProgress || 0;
              materialsWithData++;
            } else if (mat.masteryScore > 0) {
              combinedTopics.push({
                topicKey: `legacy-${mat._id}`,
                name: mat.fileName?.split(".")[0]?.substring(0, 15) || "?",
                status: mat.masteryScore < 50 ? "Red" : mat.masteryScore < 80 ? "Yellow" : "Green",
                masteryLevel: mat.masteryScore,
                materialId: mat._id,
              });
              cumulativeMastery += mat.masteryScore;
              materialsWithData++;
            }
          } catch (e) { console.log(e); }
        }
      }

      combinedTopics.sort((a, b) => {
        const order: any = { Red: 1, Yellow: 2, Green: 3 };
        return (order[a.status] || 4) - (order[b.status] || 4);
      });

      setMastery({
        topics: combinedTopics,
        overallProgress: materialsWithData ? Math.round(cumulativeMastery / materialsWithData) : 0,
      });
    } catch (err) { console.log(err); } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { loadData(); }, [userId]));

  const renderBubble = (topic: any, index: number) => {
    const row = Math.floor(index / MAX_COLUMNS);
    const col = index % MAX_COLUMNS;
    const top = 30 + (row * 95);
    const left = (col * COLUMN_WIDTH) + (COLUMN_WIDTH / 2) - 24;

    const translateY = floatAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [index % 2 === 0 ? -8 : 8, index % 2 === 0 ? 8 : -8]
    });

    const statusColor = topic.status === 'Green' ? COLORS.green : topic.status === 'Yellow' ? COLORS.yellow : COLORS.red;

    return (
      <Animated.View
        key={`${topic.topicKey}-${index}`}
        style={[styles.bubble, { top, left, transform: [{ translateY }] }]}
      >
        <TouchableOpacity
          style={[styles.bubbleCircle, { backgroundColor: statusColor }]}
          onPress={() => setSelectedTopic(topic)}
          activeOpacity={0.8}
        >
          <Text style={styles.bubbleLetter}>{topic.name?.charAt(0).toUpperCase() || "?"}</Text>
        </TouchableOpacity>
        <Text style={styles.bubbleLabel} numberOfLines={1}>{topic.name || "?"}</Text>
      </Animated.View>
    );
  };

  const getProgressColor = (val: number) => {
    if (val < 50) return COLORS.red;
    if (val < 80) return COLORS.yellow;
    return COLORS.green;
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View>
    );
  }

  const galaxyHeight = Math.max(300, (Math.ceil(mastery.topics.length / MAX_COLUMNS) * 100) + 60);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor={COLORS.primary}/>}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hi, {user?.name?.split(' ')[0] || "Explorer"}</Text>
            <Text style={styles.subGreeting}>Your AI Study Buddy is ready.</Text>
          </View>
          <TouchableOpacity style={styles.notifBtn}>
            <Bell size={22} color={COLORS.text} />
            <View style={styles.notifDot} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.searchBar} onPress={() => router.push("/(tabs)/study")}>
          <Search size={20} color={COLORS.muted} />
          <Text style={{marginLeft: 10, color: COLORS.muted}}>Ask AI about your notes...</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.resumeCard}
          onPress={() => {
            const weak = mastery.topics.find((t:any) => t.status === "Red") || mastery.topics[0];
            if(weak) router.push({ pathname: "/(tabs)/practice", params: { materialId: weak.materialId, topicKey: weak.topicKey } });
          }}
        >
          <View style={styles.resumeIcon}><Sparkles size={18} color="#FFF" /></View>
          <View style={{ flex: 1, marginLeft: 15 }}>
            <Text style={styles.resumeLabel}>NEXT RECOMMENDED FOCUS</Text>
            <Text style={styles.resumeTopic} numberOfLines={1}>
              {mastery.topics.find((t:any) => t.status === "Red")?.name || "Ready to Practice?"}
            </Text>
          </View>
          <ChevronRight size={20} color={COLORS.muted} />
        </TouchableOpacity>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Knowledge Galaxy</Text>
          <TouchableOpacity onPress={loadData}><Text style={styles.viewMore}>Sync</Text></TouchableOpacity>
        </View>

        <View style={[styles.galaxyContainer, { height: galaxyHeight }]}>
          {mastery.topics.length > 0 ? (
            mastery.topics.map((t: any, i: number) => renderBubble(t, i))
          ) : (
            <View style={{alignItems:'center', padding: 40}}>
              <Target size={40} color="rgba(255,255,255,0.2)" />
              <Text style={styles.emptyGalaxyText}>No recent activity found.</Text>
            </View>
          )}
        </View>

        <View style={styles.actionGrid}>
          <ActionCard icon={<Library size={22} color={COLORS.primary}/>} label="Library" onPress={() => router.push("/library")} />
          <ActionCard icon={<Target size={22} color={COLORS.green}/>} label="Practice" onPress={() => router.push("/(tabs)/practice")} />
          <ActionCard icon={<Calendar size={22} color={COLORS.yellow}/>} label="Planner" onPress={() => router.push("/(tabs)/planner")} />
          <ActionCard icon={<Layout size={22} color="#6366F1"/>} label="Analysis" onPress={() => router.push("/analysis")} />
        </View>

        <View style={styles.insightsCard}>
          <Text style={styles.insightTitle}>Overall Retention Mastery</Text>
          <View style={styles.progressRow}>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBarFill, { width: `${mastery.overallProgress}%`, backgroundColor: getProgressColor(mastery.overallProgress) }]} />
            </View>
            <Text style={styles.progressPercent}>{mastery.overallProgress}%</Text>
          </View>
          <Text style={styles.activityText}>You've mastered {mastery.overallProgress}% of recent topics.</Text>
        </View>

        <Modal transparent animationType="fade" visible={!!selectedTopic} onRequestClose={() => setSelectedTopic(null)}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSelectedTopic(null)}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedTopic(null)}>
                  <X size={18} color={COLORS.muted} />
                </TouchableOpacity>
                <Text style={styles.topicTitle}>{selectedTopic?.name}</Text>
                <Text style={styles.topicStat}>Mastery: {selectedTopic?.masteryLevel || 0}%</Text>
                <TouchableOpacity 
                  style={styles.practiceBtn}
                  onPress={() => {
                    const topic = selectedTopic;
                    setSelectedTopic(null);
                    router.push({ pathname: "/(tabs)/practice", params: { materialId: topic.materialId, topicKey: topic.topicKey } });
                  }}
                >
                  <PlayCircle size={18} color="#FFF" />
                  <Text style={styles.btnText}>Start Test</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </TouchableOpacity>
        </Modal>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const ActionCard = ({ icon, label, onPress }: any) => (
  <TouchableOpacity style={styles.card} onPress={onPress}>
    <View style={styles.actionIconContainer}>{icon}</View>
    <Text style={styles.cardLabel}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  container: { paddingHorizontal: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { marginTop: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: 24, fontWeight: '800', color: COLORS.text },
  subGreeting: { color: COLORS.muted, fontSize: 14, marginTop: 2 },
  notifBtn: { width: 45, height: 45, borderRadius: 12, backgroundColor: COLORS.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  notifDot: { position: 'absolute', top: 12, right: 14, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.red, borderWidth: 2, borderColor: '#FFF' },
  searchBar: { marginTop: 25, backgroundColor: COLORS.card, borderRadius: 16, paddingHorizontal: 15, height: 55, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  resumeCard: { marginTop: 20, backgroundColor: COLORS.card, padding: 18, borderRadius: 24, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  resumeIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  resumeLabel: { fontSize: 10, fontWeight: '800', color: COLORS.muted, letterSpacing: 0.5 },
  resumeTopic: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginTop: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 30, alignItems: 'center' },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: COLORS.text },
  viewMore: { fontSize: 13, color: COLORS.primary, fontWeight: '700' },
  galaxyContainer: { marginTop: 15, backgroundColor: '#0F172A', borderRadius: 32, position: 'relative', overflow: 'hidden' },
  bubble: { position: 'absolute', alignItems: 'center', width: 48 },
  bubbleCircle: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' },
  bubbleLetter: { color: '#FFF', fontWeight: '900', fontSize: 20 },
  bubbleLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '700', marginTop: 6, width: 80, textAlign: 'center' },
  emptyGalaxyText: { color: 'rgba(255,255,255,0.4)', fontSize: 14, marginTop: 10 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 25 },
  card: { flex: 1, minWidth: '45%', backgroundColor: COLORS.card, padding: 20, borderRadius: 24, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  actionIconContainer: { width: 45, height: 45, borderRadius: 15, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  cardLabel: { marginTop: 12, fontWeight: '800', color: COLORS.text, fontSize: 14 },
  insightsCard: { marginTop: 25, backgroundColor: COLORS.card, padding: 20, borderRadius: 24, borderWidth: 1, borderColor: COLORS.border },
  insightTitle: { fontSize: 14, fontWeight: '800', color: COLORS.muted, marginBottom: 10 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  progressBarContainer: { flex: 1, height: 8, backgroundColor: '#E2E8F0', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  progressPercent: { fontSize: 14, fontWeight: '800', color: COLORS.text },
  activityText: { fontSize: 12, color: COLORS.muted, marginTop: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFF', width: '80%', padding: 25, borderRadius: 32, alignItems: 'center' },
  closeBtn: { position: 'absolute', right: 20, top: 20 },
  topicTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: 10, textAlign: 'center' },
  topicStat: { fontSize: 14, color: COLORS.muted, marginBottom: 20 },
  practiceBtn: { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 25, borderRadius: 20, gap: 10 },
  btnText: { color: '#FFF', fontWeight: '700', fontSize: 16 }
});