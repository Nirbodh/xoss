// screens/ReferralScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Clipboard,
  Share,
  Animated,
  Dimensions,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const ReferralScreen = ({ navigation }) => {
  const [referralCode, setReferralCode] = useState('XOSS2024');
  const [referralStats, setReferralStats] = useState({
    totalReferrals: 12,
    activeReferrals: 8,
    totalEarnings: 1200,
    pendingEarnings: 300
  });
  const [referralHistory, setReferralHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const isFocused = useIsFocused();

  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);

  useEffect(() => {
    if (isFocused) {
      loadReferralData();
      startAnimations();
    }
  }, [isFocused]);

  const startAnimations = () => {
    fadeAnim.setValue(0);
    slideAnim.setValue(50);
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      })
    ]).start();
  };

  const loadReferralData = () => {
    // Simulate API call
    const history = [
      {
        id: 1,
        username: 'gamer_pro',
        date: '05/Sept/2025',
        status: 'completed',
        earnings: 100,
        type: 'signup'
      },
      {
        id: 2,
        username: 'pubg_king',
        date: '04/Sept/2025',
        status: 'completed',
        earnings: 100,
        type: 'signup'
      },
      {
        id: 3,
        username: 'ff_champion',
        date: '03/Sept/2025',
        status: 'pending',
        earnings: 100,
        type: 'signup'
      },
      {
        id: 4,
        username: 'ludo_master',
        date: '02/Sept/2025',
        status: 'completed',
        earnings: 100,
        type: 'tournament'
      },
      {
        id: 5,
        username: 'cod_expert',
        date: '01/Sept/2025',
        status: 'completed',
        earnings: 100,
        type: 'signup'
      }
    ];
    
    setReferralHistory(history);
    setRefreshing(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadReferralData();
  };

  const copyReferralCode = async () => {
    try {
      await Clipboard.setString(referralCode);
      setCopied(true);
      Alert.alert('✅ Copied!', 'Referral code copied to clipboard');
      
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      Alert.alert('Error', 'Failed to copy referral code');
    }
  };

  const shareReferral = async () => {
    try {
      const message = `🎮 Join XOSS Gaming & Get ৳100 Bonus! 🎯\n\nUse my referral code: ${referralCode}\n\nDownload now: https://xossgaming.com\n\n• Play Free Fire, PUBG, Ludo & more\n• Win real money tournaments\n• Instant withdrawals\n• 24/7 support`;
      
      await Share.share({
        message: message,
        title: 'Join XOSS Gaming'
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share referral');
    }
  };

  const copyReferralLink = async () => {
    try {
      const link = `https://xossgaming.com/invite?code=${referralCode}`;
      await Clipboard.setString(link);
      Alert.alert('✅ Link Copied!', 'Referral link copied to clipboard');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy referral link');
    }
  };

  const ReferralStatsCard = () => (
    <View 
      style={[
        styles.statsCard,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
      ]}
    >
      <Text style={styles.statsTitle}>Your Referral Performance</Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: '#2962ff' }]}>
            <Ionicons name="people" size={20} color="white" />
          </View>
          <Text style={styles.statNumber}>{referralStats.totalReferrals}</Text>
          <Text style={styles.statLabel}>Total Referrals</Text>
        </View>
        
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: '#4CAF50' }]}>
            <Ionicons name="checkmark-circle" size={20} color="white" />
          </View>
          <Text style={styles.statNumber}>{referralStats.activeReferrals}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: '#FF8A00' }]}>
            <Ionicons name="cash" size={20} color="white" />
          </View>
          <Text style={styles.statNumber}>৳{referralStats.totalEarnings}</Text>
          <Text style={styles.statLabel}>Total Earned</Text>
        </View>
        
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: '#FFD700' }]}>
            <Ionicons name="time" size={20} color="white" />
          </View>
          <Text style={styles.statNumber}>৳{referralStats.pendingEarnings}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>
    </View>
  );

  const ReferralCodeCard = () => (
    <View 
      style={[
        styles.referralCard,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
      ]}
    >
      <View style={styles.cardHeader}>
        <Ionicons name="gift" size={28} color="#FF8A00" />
        <View style={styles.headerText}>
          <Text style={styles.cardTitle}>Invite Friends & Earn</Text>
          <Text style={styles.cardSubtitle}>Get ৳100 for each friend who joins</Text>
        </View>
      </View>

      <View style={styles.referralCodeContainer}>
        <Text style={styles.referralLabel}>Your Referral Code</Text>
        <TouchableOpacity 
          style={[styles.codeBox, copied && styles.codeBoxCopied]}
          onPress={copyReferralCode}
        >
          <Text style={styles.referralCode}>{referralCode}</Text>
          <Ionicons 
            name={copied ? "checkmark" : "copy"} 
            size={20} 
            color={copied ? "#4CAF50" : "#2962ff"} 
          />
        </TouchableOpacity>
        <Text style={styles.codeHint}>
          {copied ? 'Copied to clipboard!' : 'Tap to copy your code'}
        </Text>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.shareButton} onPress={shareReferral}>
          <Ionicons name="share-social" size={20} color="white" />
          <Text style={styles.shareButtonText}>Share Invite</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.linkButton} onPress={copyReferralLink}>
          <Ionicons name="link" size={20} color="#2962ff" />
          <Text style={styles.linkButtonText}>Copy Link</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const HowItWorksCard = () => (
    <View style={styles.howItWorksCard}>
      <Text style={styles.sectionTitle}>How It Works</Text>
      
      <View style={styles.stepsContainer}>
        <View style={styles.step}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>1</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Share Your Code</Text>
            <Text style={styles.stepDescription}>
              Share your referral code with friends
            </Text>
          </View>
        </View>
        
        <View style={styles.step}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>2</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Friend Signs Up</Text>
            <Text style={styles.stepDescription}>
              Your friend registers using your code
            </Text>
          </View>
        </View>
        
        <View style={styles.step}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>3</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Both Get Rewards</Text>
            <Text style={styles.stepDescription}>
              You get ৳100 when they join & play
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const ReferralHistoryItem = ({ item }) => (
    <View style={styles.historyItem}>
      <View style={styles.historyIcon}>
        <Ionicons 
          name={item.type === 'tournament' ? "trophy" : "person"} 
          size={20} 
          color="white" 
        />
      </View>
      
      <View style={styles.historyInfo}>
        <Text style={styles.historyUsername}>{item.username}</Text>
        <Text style={styles.historyDate}>{item.date}</Text>
        <View style={styles.historyMeta}>
          <Text style={[
            styles.historyStatus,
            item.status === 'completed' ? styles.statusCompleted : styles.statusPending
          ]}>
            {item.status}
          </Text>
          <Text style={styles.historyType}>{item.type}</Text>
        </View>
      </View>
      
      <View style={styles.historyEarnings}>
        <Text style={styles.earningsAmount}>+৳{item.earnings}</Text>
        <Ionicons name="cash" size={16} color="#4CAF50" />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Refer & Earn</Text>
          <Text style={styles.headerSubtitle}>Invite friends and earn rewards</Text>
        </View>
        <TouchableOpacity style={styles.helpButton}>
          <Ionicons name="help-circle" size={24} color="#2962ff" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2962ff']}
            tintColor="#2962ff"
          />
        }
      >
        {/* Referral Stats */}
        <ReferralStatsCard />
        
        {/* Referral Code Card */}
        <ReferralCodeCard />
        
        {/* How It Works */}
        <HowItWorksCard />
        
        {/* Referral History */}
        <View style={styles.historySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Referrals</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {referralHistory.map(item => (
            <ReferralHistoryItem key={item.id} item={item} />
          ))}
          
          {referralHistory.length === 0 && (
            <View style={styles.emptyHistory}>
              <Ionicons name="people-outline" size={64} color="#2962ff" />
              <Text style={styles.emptyText}>No referrals yet</Text>
              <Text style={styles.emptySubtext}>
                Share your code to start earning!
              </Text>
            </View>
          )}
        </View>
        
        {/* Terms & Conditions */}
        <View style={styles.termsSection}>
          <Text style={styles.termsTitle}>Terms & Conditions</Text>
          <View style={styles.termsList}>
            <View style={styles.termItem}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.termText}>
                You earn ৳100 when your friend completes registration
              </Text>
            </View>
            <View style={styles.termItem}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.termText}>
                Additional ৳50 when friend joins first tournament
              </Text>
            </View>
            <View style={styles.termItem}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.termText}>
                Maximum 20 referrals per month
              </Text>
            </View>
            <View style={styles.termItem}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.termText}>
                Rewards are credited within 24 hours
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0c23',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#1a237e',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#2962ff',
    textAlign: 'center',
    marginTop: 4,
  },
  helpButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
    paddingTop: 10,
  },
  statsCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2962ff20',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 15,
  },
  statIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#ccc',
    textAlign: 'center',
  },
  referralCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2962ff20',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#2962ff',
  },
  referralCodeContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  referralLabel: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 10,
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(41, 98, 255, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#2962ff',
    marginBottom: 8,
    minWidth: '80%',
    justifyContent: 'space-between',
  },
  codeBoxCopied: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  referralCode: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2962ff',
    letterSpacing: 2,
  },
  codeHint: {
    color: '#666',
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  shareButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2962ff',
    paddingVertical: 15,
    borderRadius: 15,
    shadowColor: '#2962ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  shareButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  linkButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#2962ff',
  },
  linkButtonText: {
    color: '#2962ff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  howItWorksCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2962ff20',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
  },
  stepsContainer: {
    gap: 15,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#2962ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    marginTop: 2,
  },
  stepNumberText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
  historySection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  seeAllText: {
    color: '#2962ff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2962ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  historyInfo: {
    flex: 1,
  },
  historyUsername: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 12,
    color: '#ccc',
    marginBottom: 4,
  },
  historyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyStatus: {
    fontSize: 11,
    fontWeight: 'bold',
    marginRight: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusCompleted: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    color: '#4CAF50',
  },
  statusPending: {
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
    color: '#FF9800',
  },
  historyType: {
    fontSize: 11,
    color: '#999',
    textTransform: 'capitalize',
  },
  historyEarnings: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  earningsAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginRight: 6,
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  emptyText: {
    color: '#2962ff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
  },
  emptySubtext: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 5,
  },
  termsSection: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: 20,
    marginBottom: 30,
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2962ff20',
  },
  termsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
  },
  termsList: {
    gap: 12,
  },
  termItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  termText: {
    flex: 1,
    marginLeft: 10,
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
  },
});

export default ReferralScreen;
