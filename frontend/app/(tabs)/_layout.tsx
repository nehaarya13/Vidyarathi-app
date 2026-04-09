import React from 'react';
import { Tabs } from 'expo-router';
import { 
  Home, 
  Orbit, 
  Target, 
  Calendar, 
  User, 
  Library,
  MessageSquare, 
  Zap 
} from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#4F46E5', // Primary Indigo
        tabBarInactiveTintColor: '#94A3B8', // Muted Slate
        tabBarStyle: {
          height: 65,
          paddingBottom: 10,
          paddingTop: 10,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F1F5F9',
          elevation: 0,
          shadowOpacity: 0,
        },
        headerShown: false,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}>
      
      {/* 1. HOME */}
      <Tabs.Screen
        name="home" 
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Home size={22} color={color} />,
        }}
      />

      {/* 2. STUDY */}
      <Tabs.Screen
        name="study"
        options={{
          title: 'Study',
          tabBarIcon: ({ color }) => <Orbit size={22} color={color} />,
        }}
      />

      {/* 3. PRACTICE */}
      <Tabs.Screen
        name="practice"
        options={{
          title: 'Practice',
          tabBarIcon: ({ color }) => <Target size={22} color={color} />,
        }}
      />

      {/* 4. PLANNER */}
      <Tabs.Screen
        name="planner"
        options={{
          title: 'Planner',
          tabBarIcon: ({ color }) => <Calendar size={22} color={color} />,
        }}
      />

      {/* 5. PROFILE - Added as requested */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <User size={22} color={color} />,
        }}
      />

      {/* --- HIDDEN SCREENS (Registered but not in Tab Bar) --- */}
      
      <Tabs.Screen 
        name="library" 
        options={{ 
          href: null, // Hidden from tab bar
          tabBarIcon: ({ color }) => <Library size={22} color={color} />,
        }} 
      />

      <Tabs.Screen 
        name="chat" 
        options={{ 
          href: null, 
          tabBarIcon: ({ color }) => <MessageSquare size={22} color={color} />,
        }} 
      />
      
      <Tabs.Screen 
        name="focus" 
        options={{ 
          href: null,
          tabBarIcon: ({ color }) => <Zap size={22} color={color} />,
        }} 
      />
      
    </Tabs>
  );
}