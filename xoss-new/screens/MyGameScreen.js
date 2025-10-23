// screens/MyGameScreen.js - MATCHES YOUR HTML DESIGN
import React from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet,
  StatusBar,
  SafeAreaView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MyGameScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#1a237e" barStyle="light-content" />
      <View style={styles.container}>
        {/* Header - Exactly like your HTML */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="game-controller" size={28} color="#2962ff" />
            <Text style={styles.logoText}>MyGame</Text>
          </View>
          <Text style={styles.subtitle}>আপনার গেম স্ট্যাটাস</Text>
        </View>

        {/* Status Bar - Exactly like your HTML */}
        <View style={styles.statusBar}>
          <View style={styles.userInfo}>
            <View style={styles.userAvatar}>
              <Text style={styles.avatarText}>U</Text>
            </View>
            <Text style={styles.userName}>Player Name</Text>
          </View>
          <View style={styles.walletBalance}>
            <Ionicons name="wallet" size={16} color="#4CAF50" />
            <Text style={styles.balanceText}>৳ 500</Text>
          </View>
        </View>

        {/* MyGame Content - Exactly like your HTML */}
        <ScrollView style={styles.mygameContent} contentContainerStyle={styles.mygameContentContainer}>
          <View style={styles.mygameIcon}>
            <Ionicons name="chess-knight" size={64} color="#2962ff" />
          </View>
          <Text style={styles.mygameTitle}>আপনার গেম স্ট্যাটাস</Text>
          <Text style={styles.mygameText}>এই বিভাগটি শীঘ্রই আসছে</Text>

          {/* Stats Grid - Exactly like your HTML */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>25</Text>
              <Text style={styles.statLabel}>মোট ম্যাচ</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>5</Text>
              <Text style={styles.statLabel}>টুর্নামেন্ট জয়</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>120</Text>
              <Text style={styles.statLabel}>মোট কিল</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>৳ 1500</Text>
              <Text style={styles.statLabel}>মোট জয়</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.historyButton}>
            <Text style={styles.historyButtonText}>গেম ইতিহাস দেখুন</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1a237e',
  },
  container: {
    flex: 1,
    backgroundColor: '#0a0c23',
  },
  // Header - Exactly like HTML
  header: {
    paddingHorizontal: 20,
    paddingTop: "android" === 'android' ? 30 : 60,
    paddingBottom: 15,
    backgroundColor: '#1a237e',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#2962ff',
  },
  // Status Bar - Exactly like HTML
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(41, 98, 255, 0.1)',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2962ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  userName: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  walletBalance: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  balanceText: {
    color: '#4CAF50',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  // MyGame Content - Exactly like HTML
  mygameContent: {
    flex: 1,
  },
  mygameContentContainer: {
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
  },
  mygameIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(41, 98, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#2962ff',
  },
  mygameTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
    textAlign: 'center',
  },
  mygameText: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 40,
    textAlign: 'center',
  },
  // Stats Grid - Exactly like HTML
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 30,
  },
  statCard: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff8a00',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#ccc',
    textAlign: 'center',
  },
  // History Button - Exactly like HTML
  historyButton: {
    backgroundColor: '#2962ff',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 20,
  },
  historyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MyGameScreen;
