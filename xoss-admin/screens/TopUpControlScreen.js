// screens/TopUpControlScreen.js - FIXED VERSION
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  RefreshControl,
  ActivityIndicator,
  FlatList,
  Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const TopUpControlScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('requests');
  const [topUpRequests, setTopUpRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Mock data
  const diamondPackages = [
    { id: 1, diamonds: 100, price: 109, bonus: 0, isActive: true },
    { id: 2, diamonds: 310, price: 329, bonus: 10, isActive: true },
    { id: 3, diamonds: 520, price: 549, bonus: 20, isActive: true }
  ];

  useEffect(() => {
    loadTopUpData();
  }, []);

  const loadTopUpData = async () => {
    try {
      setLoading(true);
      const mockRequests = [
        {
          id: 'T001',
          userName: 'proplayer123',
          userPhone: '+8801712345678',
          diamonds: 310,
          amount: 329,
          paymentMethod: 'bkash',
          status: 'pending',
          submittedAt: new Date().toISOString()
        },
        {
          id: 'T002', 
          userName: 'gamerking',
          userPhone: '+8801812345678',
          diamonds: 1060,
          amount: 1099,
          paymentMethod: 'nagad',
          status: 'approved',
          submittedAt: new Date().toISOString()
        }
      ];
      setTopUpRequests(mockRequests);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTopUpData();
  };

  const handleRequestAction = (requestId, action) => {
    switch(action) {
      case 'approve':
        setTopUpRequests(prev => 
          prev.map(req => 
            req.id === requestId ? { ...req, status: 'approved' } : req
          )
        );
        Alert.alert('Approved', 'Top-up request approved!');
        break;
      case 'reject':
        setTopUpRequests(prev => 
          prev.map(req => 
            req.id === requestId ? { ...req, status: 'rejected' } : req
          )
        );
        Alert.alert('Rejected', 'Top-up request rejected.');
        break;
    }
  };

  const RequestItem = ({ item }) => (
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View style={styles.userInfo}>
          <View style={styles.userAvatar}>
            <Text style={styles.avatarText}>
              {item.userName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.userName}>{item.userName}</Text>
            <Text style={styles.userPhone}>{item.userPhone}</Text>
          </View>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(item.status) }
        ]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.packageDetails}>
        <Text style={styles.diamondText}>{item.diamonds} Diamonds</Text>
        <Text style={styles.amountText}>৳{item.amount}</Text>
      </View>

      {item.status === 'pending' && (
        <View style={styles.requestActions}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => handleRequestAction(item.id, 'approve')}
          >
            <Text style={styles.actionButtonText}>Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleRequestAction(item.id, 'reject')}
          >
            <Text style={styles.actionButtonText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const getStatusColor = (status) => {
    switch(status) {
      case 'approved': return '#4CAF50';
      case 'pending': return '#FF9800';
      case 'rejected': return '#F44336';
      default: return '#666';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2962ff" />
          <Text style={styles.loadingText}>Loading Top-Up Control...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={['#1a237e', '#283593']} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Top-Up Control</Text>
            <View style={{ width: 24 }} />
          </View>
        </View>
      </LinearGradient>

      <View style={styles.tabContainer}>
        {['requests', 'packages', 'payments'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.contentContainer}>
          {activeTab === 'requests' && (
            <FlatList
              data={topUpRequests}
              renderItem={({ item }) => <RequestItem item={item} />}
              keyExtractor={item => item.id}
              scrollEnabled={false}
            />
          )}

          {activeTab === 'packages' && (
            <View>
              <Text style={styles.sectionTitle}>Diamond Packages</Text>
              {diamondPackages.map(pkg => (
                <View key={pkg.id} style={styles.packageCard}>
                  <Text style={styles.packageName}>{pkg.diamonds} Diamonds</Text>
                  <Text style={styles.packagePrice}>৳{pkg.price}</Text>
                  <Switch value={pkg.isActive} />
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0a0c23',
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  headerContent: {
    marginTop: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    margin: 16,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#2962ff',
  },
  tabText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: 'bold',
  },
  tabTextActive: {
    color: 'white',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  requestCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
    marginRight: 12,
  },
  avatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userName: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userPhone: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  packageDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  diamondText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  amountText: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  sectionTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  packageCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  packageName: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  packagePrice: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    marginTop: 12,
    fontSize: 16,
  },
});

export default TopUpControlScreen;
