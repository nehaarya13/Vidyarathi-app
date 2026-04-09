import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  TextInput, Dimensions, FlatList, ActivityIndicator, Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, FileText, ChevronLeft, BookOpen, RefreshCw } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { useAuth } from './context/AuthContext'; 

const { width } = Dimensions.get('window');

const LibraryScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const NGROK_URL = "https://convincedly-unlanterned-ember.ngrok-free.dev";

  useEffect(() => {
    fetchUserMaterials();
  }, []);

  const fetchUserMaterials = async () => {
    try {
      setLoading(true);
      const userId = user?.id || user?._id;
      
      console.log("📡 Fetching materials for UID:", userId);

      const res = await axios.get(`${NGROK_URL}/api/upload/user-materials/${userId}`, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      setMaterials(res.data);
      console.log("✅ Data Loaded:", res.data.length, "files found.");
    } catch (err) {
      console.error("❌ Library Fetch Error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePracticeNavigate = (id) => {
    // 🎯 Practice screen par ID bhej rahe hain
    router.push({
      pathname: "/(tabs)/practice",
      params: { materialId: id, userId: user?.id || user?._id }
    });
  };

  const renderFile = ({ item }) => (
    <TouchableOpacity 
      style={styles.fileCard} 
      onPress={() => handlePracticeNavigate(item._id)}
    >
      <View style={styles.fileIconBox}>
        <FileText size={22} color="#4F46E5" />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.fileName} numberOfLines={1}>{item.fileName || "Study Material"}</Text>
        <Text style={styles.fileMeta}>
          {new Date(item.createdAt).toLocaleDateString()} • PDF
        </Text>
      </View>
      <View style={styles.actionIcon}>
        <BookOpen size={18} color="#6366F1" />
      </View>
    </TouchableOpacity>
  );

  const filteredMaterials = materials.filter(m => 
    m.fileName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Library</Text>
        <TouchableOpacity style={styles.iconBtn} onPress={fetchUserMaterials}>
          <RefreshCw size={20} color="#0F172A" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBox}>
        <Search size={18} color="#94A3B8" />
        <TextInput 
          placeholder="Search your PDFs..." 
          style={styles.searchInput}
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <Text style={styles.sectionTitle}>
        {filteredMaterials.length} Documents Found
      </Text>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loaderText}>Syncing your library...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredMaterials}
          renderItem={renderFile}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.fileList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <FileText size={60} color="#E2E8F0" />
              <Text style={styles.emptyText}>No PDFs found.</Text>
              <Text style={styles.emptySubText}>Upload a file from the Home screen to see it here.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
  backBtn: { padding: 8, backgroundColor: '#F8FAFC', borderRadius: 12 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  iconBtn: { padding: 8 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', marginHorizontal: 20, paddingHorizontal: 15, height: 52, borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 20 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16, color: '#0F172A' },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#64748B', marginHorizontal: 22, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  fileList: { paddingHorizontal: 20, paddingBottom: 40 },
  fileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  fileIconBox: { width: 48, height: 48, backgroundColor: '#EEF2FF', borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  fileName: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  fileMeta: { fontSize: 12, color: '#94A3B8', marginTop: 3 },
  actionIcon: { padding: 8 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loaderText: { marginTop: 12, color: '#64748B', fontWeight: '500' },
  emptyContainer: { alignItems: 'center', marginTop: 100, paddingHorizontal: 40 },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#475569', marginTop: 15 },
  emptySubText: { textAlign: 'center', marginTop: 8, color: '#94A3B8', fontSize: 14, lineHeight: 20 }
});

export default LibraryScreen;