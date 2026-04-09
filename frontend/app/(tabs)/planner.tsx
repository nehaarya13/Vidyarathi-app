import React, { useState, useCallback } from 'react';
import {
  SafeAreaView, ScrollView, View, Text, TouchableOpacity,
  StyleSheet, StatusBar, Modal, TextInput,
  KeyboardAvoidingView, ActivityIndicator, Platform, Alert, RefreshControl
} from 'react-native';
import { 
  Flame, Plus, Sparkles, X,
  ChevronRight, LayoutGrid, RefreshCw, CheckCircle2, BookOpen
} from 'lucide-react-native';
import { useFocusEffect, useRouter } from 'expo-router'; 
import { StudyBuddyAPI } from '../../services/api-client';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../context/AuthContext';

const StudyBuddyPlanner = () => {
  const router = useRouter(); 
  const { user } = useAuth();
  const userId = user?.id || user?._id;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [aiMessage, setAiMessage] = useState("Analyzing your study patterns...");
  const [stats, setStats] = useState({ avgMastery: 0, totalSessions: 0 }); 
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  // ✅ Safe fetch with fallback
  const fetchData = useCallback(async () => {
    if (!userId) return;
    try {
      if (!refreshing) setLoading(true);

      const [planRes, matRes, insightRes] = await Promise.all([
        StudyBuddyAPI.getFullPlan(userId).catch(() => ({ plan: [] })),
        StudyBuddyAPI.getUserMaterials(userId).catch(() => []),
        StudyBuddyAPI.getAIInsights(userId).catch(() => null)
      ]);

      let allTasks = planRes?.plan || [];
      const aiSuggestedTasks = [];

      if (matRes?.length > 0) {
        await Promise.all(matRes.map(async (mat) => {
          try {
           const masteryData = await StudyBuddyAPI.getMasteryData(userId, mat.materialKey);
            if (masteryData?.topics?.length > 0) {
              const weakTopics = masteryData.topics.filter(
                t => t.status?.toLowerCase() === 'red' || t.status?.toLowerCase() === 'yellow'
              );
              weakTopics.forEach(t => {
                aiSuggestedTasks.push({
                  _id: t.topicKey || `ai-${mat._id}-${Math.random()}`,
                  taskName: `Master: ${t.name}`,
                  source: 'AI',
                  priority: t.status === 'Red' ? 'High' : 'Medium',
                  linkedMaterialId: mat._id,
                  topicKey: t.topicKey,
                  isCompleted: false,
                  fileName: mat.fileName,
                  score: t.lastScore
                });
              });
            } else if (mat.masteryScore > 0 && mat.masteryScore < 80) {
              aiSuggestedTasks.push({
                _id: `legacy-ai-${mat._id}`,
                taskName: `Improve: ${mat.fileName.split('.')[0]}`,
                source: 'AI',
                priority: mat.masteryScore < 50 ? 'High' : 'Medium',
                linkedMaterialId: mat._id,
                isCompleted: false,
                fileName: mat.fileName,
                score: mat.masteryScore
              });
            }
          } catch (e) {
            console.log("Mastery sync skipped for:", mat.fileName);
          }
        }));
      }

      allTasks = [...allTasks, ...aiSuggestedTasks];
      setTasks(allTasks);
      setMaterials(matRes);

      if (insightRes?.success) {
        setAiMessage(insightRes.aiMessage);
        setStats(insightRes.stats || { avgMastery: 0, totalSessions: 0 });
      } else {
        const criticalCount = aiSuggestedTasks.filter(t => t.priority === 'High').length;
        setAiMessage(criticalCount > 0 
          ? `You have ${criticalCount} priority areas. AI suggests starting with high-priority topics.`
          : "Your schedule looks great! Ready to add a new study goal?");
      }

    } catch (err) {
      console.error("❌ Planner Sync Error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, refreshing]);

  // ✅ useFocusEffect with cleanup to avoid infinite re-render
  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const loadData = async () => {
        if (!userId) return;
        try {
          if (!refreshing) setLoading(true);

          const [planRes, matRes, insightRes] = await Promise.all([
            StudyBuddyAPI.getFullPlan(userId).catch(() => ({ plan: [] })),
            StudyBuddyAPI.getUserMaterials(userId).catch(() => []),
            StudyBuddyAPI.getAIInsights(userId).catch(() => null)
          ]);

          if (!isActive) return;

          let allTasks = planRes?.plan || [];
          const aiSuggestedTasks = [];

          if (matRes?.length > 0) {
            await Promise.all(matRes.map(async (mat) => {
              try {
                const masteryData = await StudyBuddyAPI.getMasteryData(userId, mat._id);
                if (masteryData?.topics?.length > 0) {
                  const weakTopics = masteryData.topics.filter(
                    t => t.status?.toLowerCase() === 'red' || t.status?.toLowerCase() === 'yellow'
                  );
                  weakTopics.forEach(t => {
                    aiSuggestedTasks.push({
                      _id: t.topicKey || `ai-${mat._id}-${Math.random()}`,
                      taskName: `Master: ${t.name}`,
                      source: 'AI',
                      priority: t.status === 'Red' ? 'High' : 'Medium',
                      linkedMaterialId: mat._id,
                      topicKey: t.topicKey,
                      isCompleted: false,
                      fileName: mat.fileName,
                      score: t.lastScore
                    });
                  });
                }
              } catch (e) {}
            }));
          }

          allTasks = [...allTasks, ...aiSuggestedTasks];

          if (isActive) {
            setTasks(allTasks);
            setMaterials(matRes);
            if (insightRes?.success) {
              setAiMessage(insightRes.aiMessage);
              setStats(insightRes.stats || { avgMastery: 0, totalSessions: 0 });
            }
          }

        } catch (err) {
          console.error("❌ Planner Sync Error:", err);
        } finally {
          if (isActive) {
            setLoading(false);
            setRefreshing(false);
          }
        }
      };

      loadData();
      return () => { isActive = false; };
    }, [userId, refreshing])
  );

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const handleTaskPress = (task) => {
    if (task.source === 'AI' || task.linkedMaterialId) {
      router.push({
        pathname: '/(tabs)/practice', 
        params: { 
          materialId: task.linkedMaterialId, 
          topicKey: task.topicKey || ''
        }
      });
    } else {
      toggleTaskStatus(task._id);
    }
  };

  const toggleTaskStatus = async (taskId) => {
    try {
      const res = await StudyBuddyAPI.toggleTask(taskId);
      if (res.success) fetchData();
    } catch (err) {
      Alert.alert("Error", "Could not update task.");
    }
  };

  const addNewTask = async () => {
    if (!newTaskTitle.trim()) return;
    try {
      const res = await StudyBuddyAPI.addTask({ 
        userId, 
        taskName: newTaskTitle, 
        linkedMaterialId: selectedMaterial 
      });
      if (res.success) { 
        setIsModalVisible(false); 
        setNewTaskTitle('');
        setSelectedMaterial(null);
        fetchData(); 
      }
    } catch (err) { 
      Alert.alert("Error", "Could not add goal.");
    }
  };

  const getStatusColor = (task) => {
    if (task.priority === 'High' || task.score < 50) return '#EF4444'; 
    if (task.score < 80) return '#F59E0B'; 
    return '#6366F1';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.dateText}>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}</Text>
          <Text style={styles.greeting}>Study Path</Text>
        </View>
        <TouchableOpacity style={styles.streakBadge}>
          <Flame size={18} color="#F97316" fill="#F97316" />
          <Text style={styles.streakText}>{user?.streak || 0}</Text>
        </TouchableOpacity>
      </View>

      {/* Scroll / Tasks */}
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6366F1']} />}
      >
        {/* AI Card */}
        <View style={styles.aiCard}>
          <View style={styles.aiHeader}>
            <Sparkles size={20} color="#6366F1" />
            <Text style={styles.aiLabel}>ADVISOR INSIGHTS</Text>
          </View>
          <Text style={styles.aiMessage}>{aiMessage}</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statSub}>PROGRESS</Text>
              <Text style={styles.statMain}>{stats.avgMastery}%</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statSub}>SESSIONS</Text>
              <Text style={styles.statMain}>{stats.totalSessions}</Text>
            </View>
          </View>
        </View>

        {/* Tasks Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Priority Goals</Text>
          <TouchableOpacity onPress={onRefresh} style={styles.syncBtn}>
             <RefreshCw size={14} color="#6366F1" />
             <Text style={styles.syncText}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {/* Tasks List */}
        {loading && !refreshing ? (
          <ActivityIndicator color="#6366F1" style={{ marginTop: 40 }} />
        ) : tasks.length === 0 ? (
          <View style={styles.emptyState}>
            <BookOpen size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>No active goals. Time to practice!</Text>
          </View>
        ) : (
          tasks.map((task, index) => (
            <TouchableOpacity 
              key={task._id || `task-${index}`} 
              style={[
                styles.taskItem, 
                task.isCompleted && styles.taskDone, 
                { 
                  borderLeftColor: getStatusColor(task), 
                  backgroundColor: task.source === 'AI' ? '#F5F7FF' : '#FFF' 
                }
              ]}
              onPress={() => handleTaskPress(task)}
            >
              <View style={[styles.iconWrapper, { backgroundColor: task.source === 'AI' ? '#EEF2FF' : '#F8FAFC' }]}>
                {task.source === 'AI' ? <Sparkles size={18} color="#6366F1" /> : (task.isCompleted ? <CheckCircle2 size={18} color="#10B981" /> : <LayoutGrid size={18} color="#94A3B8" />)}
              </View>
              <View style={styles.taskMeta}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Text numberOfLines={1} style={[styles.taskTitle, task.isCompleted && styles.strikeThrough]}>{task.taskName}</Text>
                  {task.source === 'AI' && <View style={styles.aiBadge}><Text style={styles.aiBadgeText}>AI</Text></View>}
                </View>
                <Text style={styles.taskSub}>
                    {task.source === 'AI' ? `Focus Score: ${task.score || 0}%` : 'Personal Goal'} 
                    {task.fileName ? ` • ${task.fileName.substring(0,15)}...` : ''}
                </Text>
              </View>
              {task.priority === 'High' && <View style={styles.priorityPill}><Text style={styles.priorityPillText}>Critical</Text></View>}
              <ChevronRight size={18} color="#CBD5E1" />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setIsModalVisible(true)}>
        <Plus size={30} color="#FFF" />
      </TouchableOpacity>

      {/* Modal */}
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? "padding" : "height"} style={styles.modalBg}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Study Goal</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}><X size={24} color="#64748B" /></TouchableOpacity>
            </View>
            <TextInput style={styles.input} placeholder="What are we mastering today?" value={newTaskTitle} onChangeText={setNewTaskTitle} placeholderTextColor="#94A3B8" />
            <Text style={styles.label}>Link to Material (Optional)</Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={selectedMaterial} onValueChange={(v) => setSelectedMaterial(v)} style={{height: 50}}>
                <Picker.Item label="🌍 General Focus" value={null} />
                {materials.map(m => <Picker.Item key={m._id} label={m.fileName} value={m._id} />)}
              </Picker>
            </View>
            <TouchableOpacity style={styles.submitBtn} onPress={addNewTask}>
              <Text style={styles.submitBtnText}>Add to Planner</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

// 🔹 Styles (same as before)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 20, alignItems: 'center' },
  dateText: { fontSize: 11, fontWeight: '800', color: '#94A3B8', letterSpacing: 1 },
  greeting: { fontSize: 28, fontWeight: '800', color: '#1E293B' },
  streakBadge: { flexDirection: 'row', backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, elevation: 3 },
  streakText: { marginLeft: 6, fontWeight: '800', color: '#F97316', fontSize: 16 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 120 },
  aiCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, marginBottom: 30, elevation: 5, borderLeftWidth: 6, borderLeftColor: '#6366F1' },
  aiHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  aiLabel: { fontSize: 12, fontWeight: '900', color: '#6366F1', marginLeft: 8 },
  aiMessage: { fontSize: 16, fontWeight: '600', color: '#334155', lineHeight: 24 },
  statsRow: { flexDirection: 'row', marginTop: 18, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  statBox: { flex: 1, alignItems: 'center' },
  statSub: { fontSize: 9, fontWeight: '800', color: '#94A3B8' },
  statMain: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  statDivider: { width: 1, height: '100%', backgroundColor: '#F1F5F9' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#475569' },
  syncBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  syncText: { fontSize: 13, fontWeight: '700', color: '#6366F1' },
  taskItem: { flexDirection: 'row', borderRadius: 20, padding: 16, alignItems: 'center', marginBottom: 14, borderLeftWidth: 5, elevation: 2 },
  iconWrapper: { width: 44, height: 44, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  taskMeta: { flex: 1 },
  taskTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  taskSub: { fontSize: 12, color: '#94A3B8', marginTop: 3 },
  strikeThrough: { textDecorationLine: 'line-through', color: '#CBD5E1' },
  taskDone: { opacity: 0.7 },
  aiBadge: { backgroundColor: '#6366F1', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginLeft: 8 },
  aiBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '900' },
  priorityPill: { backgroundColor: '#FEE2E2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginRight: 8 },
  priorityPillText: { fontSize: 10, fontWeight: '800', color: '#EF4444', textTransform: 'uppercase' },
  fab: { position: 'absolute', bottom: 35, right: 25, width: 64, height: 64, borderRadius: 32, backgroundColor: '#6366F1', justifyContent: 'center', alignItems: 'center', elevation: 8 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  input: { backgroundColor: '#F8FAFC', padding: 18, borderRadius: 15, fontSize: 16, marginBottom: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  label: { fontSize: 13, fontWeight: '700', color: '#64748B', marginBottom: 10 },
  pickerContainer: { backgroundColor: '#F8FAFC', borderRadius: 15, marginBottom: 25, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0' },
  submitBtn: { backgroundColor: '#1E293B', padding: 18, borderRadius: 15, alignItems: 'center' },
  submitBtnText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
  emptyState: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#94A3B8', marginTop: 15, fontWeight: '600' }
});

export default StudyBuddyPlanner;
