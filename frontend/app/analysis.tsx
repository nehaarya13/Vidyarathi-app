import React, { useState, useEffect, useMemo } from "react";
import { 
  SafeAreaView, ScrollView, View, Text, StyleSheet, 
  Dimensions, ActivityIndicator, RefreshControl 
} from "react-native";
import { LineChart, BarChart, ProgressChart } from "react-native-chart-kit";
import { Sparkles, TrendingUp, Brain, Target, Award, CheckCircle, AlertCircle } from "lucide-react-native";

const { width } = Dimensions.get("window");

const COLORS = {
  primary: "#4F46E5",   // Indigo
  success: "#10B981",   // Green
  warning: "#F59E0B",   // Orange
  bg: "#FFFFFF",        // Pure White Background
  card: "#FFFFFF",
  text: "#0F172A",
  muted: "#64748B",
  border: "#E2E8F0",
  lightPrimary: "#EEF2FF",
};

export default function UltimateAnalysisScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null);

  const fetchData = async () => {
    // 🔌 Mapping directly to your backend logic structure
    setTimeout(() => {
      setData({
        overall: 0.78,
        retention: [62, 75, 68, 82, 78, 90, 85],
        subjects: {
          labels: ["Physics", "Coding", "Maths", "Chem"],
          values: [85, 92, 74, 80]
        },
        insights: {
          strengths: ["Fast learner in Logic", "High MCQ accuracy"],
          weaknesses: ["Retention drops in Theory"],
          action: "Schedule 'Quantum Physics' revision"
        }
      });
      setLoading(false);
      setRefreshing(false);
    }, 1000);
  };

  useEffect(() => { fetchData(); }, []);

  const chartConfig = useMemo(() => ({
    backgroundGradientFrom: "#FFF",
    backgroundGradientTo: "#FFF",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`, // Your Indigo
    labelColor: () => COLORS.muted,
    propsForDots: { r: "5", strokeWidth: "2", stroke: COLORS.primary },
    barPercentage: 0.6,
  }), []);

  if (loading) return (
    <View style={styles.loader}><ActivityIndicator size="large" color={COLORS.primary} /></View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView 
        contentContainerStyle={styles.container} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchData();}} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Learning Analysis</Text>
          <Award size={28} color={COLORS.primary} />
        </View>

        {/* 1. Overall Mastery (Hero Card - Design 1 Style) */}
        <View style={[styles.card, styles.heroCard]}>
          <View style={styles.heroLeft}>
            <View style={styles.eliteBadge}>
              <Sparkles size={12} color={COLORS.success} />
              <Text style={styles.eliteText}>ELITE STATUS</Text>
            </View>
            <Text style={styles.heroTitle}>Overall Mastery</Text>
            <Text style={styles.heroDesc}>You've mastered 22 new concepts this week!</Text>
          </View>
          <View style={styles.heroRight}>
            <ProgressChart
              data={{ data: [data.overall] }}
              width={130}
              height={130}
              strokeWidth={14}
              radius={45}
              chartConfig={chartConfig}
              hideLegend
            />
            <View style={styles.percentageContainer}>
              <Text style={styles.percentageText}>{(data.overall * 100).toFixed(0)}%</Text>
            </View>
          </View>
        </View>

        {/* 2. AI Feedback (Classy Boxes) */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Brain size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>AI Feedback</Text>
          </View>
          
          <View style={styles.insightGroup}>
            {data.insights.strengths.map((s, i) => (
              <View key={i} style={styles.insightItem}>
                <CheckCircle size={18} color={COLORS.success} />
                <Text style={styles.insightText}>{s}</Text>
              </View>
            ))}
            <View style={styles.insightItem}>
              <AlertCircle size={18} color={COLORS.warning} />
              <Text style={styles.insightText}>{data.insights.weaknesses[0]}</Text>
            </View>
          </View>

          <View style={styles.actionBanner}>
            <Target size={18} color={COLORS.primary} />
            <Text style={styles.actionText}>{data.insights.action}</Text>
          </View>
        </View>

        {/* 3. Retention Trend (Design 3 Style) */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <TrendingUp size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Retention Trend</Text>
          </View>
          <LineChart
            data={{ labels: ["M", "T", "W", "T", "F", "S", "S"], datasets: [{ data: data.retention }] }}
            width={width - 70}
            height={180}
            chartConfig={chartConfig}
            bezier
            style={styles.chartAdjustment}
          />
        </View>

        {/* 4. Subject Wise Breakdown (Bar Graph - Wapas Add Kar Diya!) */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Brain size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Subject Performance</Text>
          </View>
          <BarChart
            data={{ labels: data.subjects.labels, datasets: [{ data: data.subjects.values }] }}
            width={width - 70}
            height={220}
            chartConfig={chartConfig}
            fromZero
            showValuesOnTopOfBars
            style={styles.chartAdjustment}
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  container: { padding: 20 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  headerTitle: { fontSize: 28, fontWeight: "900", color: COLORS.text, letterSpacing: -1 },
  card: { backgroundColor: COLORS.card, borderRadius: 32, padding: 20, marginBottom: 18, borderWidth: 1, borderColor: COLORS.border, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 15, shadowOffset: { width: 0, height: 5 } },
  heroCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", borderColor: COLORS.lightPrimary, borderWidth: 2 },
  heroLeft: { flex: 1 },
  heroRight: { justifyContent: "center", alignItems: "center" },
  eliteBadge: { backgroundColor: "#DCFCE7", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 8, alignSelf: "flex-start" },
  eliteText: { color: COLORS.success, fontSize: 10, fontWeight: "800" },
  heroTitle: { fontSize: 22, fontWeight: "800", color: COLORS.text },
  heroDesc: { color: COLORS.muted, fontSize: 13, marginTop: 4, lineHeight: 18 },
  percentageContainer: { position: "absolute", alignItems: "center", justifyContent: "center" },
  percentageText: { fontSize: 22, fontWeight: "900", color: COLORS.text },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: COLORS.text },
  insightGroup: { gap: 12, marginBottom: 15 },
  insightItem: { flexDirection: "row", alignItems: "center", gap: 10 },
  insightText: { color: COLORS.text, fontSize: 14, fontWeight: "500", flex: 1 },
  actionBanner: { backgroundColor: COLORS.lightPrimary, padding: 16, borderRadius: 20, flexDirection: "row", gap: 10, alignItems: "center" },
  actionText: { color: COLORS.primary, fontWeight: "700", fontSize: 13, flex: 1 },
  chartAdjustment: { marginLeft: -15, marginTop: 10, borderRadius: 16 }
});