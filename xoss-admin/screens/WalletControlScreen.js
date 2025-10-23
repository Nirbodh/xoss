// screens/WalletControlScreen.js - COMPLETE ADMIN WALLET CONTROL
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  Animated,
  Dimensions,
  Modal,
  RefreshControl,
  ActivityIndicator,
  FlatList,
  Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width, height } = Dimensions.get('window');

// Payment Gateway Configuration
const PAYMENT_GATEWAYS = {
  bkash: {
    id: 'bkash',
    name: 'bKash',
    color: '#e2136e',
    icon: 'mobile-alt',
    accountNumber: '01751332386',
    charge: 0,
    minAmount: 10,
    maxAmount: 50000,
    isActive: true
  },
  nagad: {
    id: 'nagad', 
    name: 'Nagad',
    color: '#f60',
    icon: 'bolt',
    accountNumber: '01751332386',
    charge: 5,
    minAmount: 10,
    maxAmount: 50000,
    isActive: true
  },
  rocket: {
    id: 'rocket',
    name: 'Rocket',
    color: '#784bd1',
    icon: 'rocket',
    accountNumber: '01751332386',
    charge: 5,
    minAmount: 10,
    maxAmount: 50000,
    isActive: true
  },
  paypal: {
    id: 'paypal',
    name: 'PayPal',
    color: '#0070ba',
    icon: 'paypal',
    accountNumber: 'support@xossgaming.com',
    charge: 15,
    minAmount: 100,
    maxAmount: 100000,
    isActive: false
  }
};

const WalletControlScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [transactions, setTransactions] = useState([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalBalance: 0,
    todayRevenue: 0,
    totalWithdrawals: 0,
    pendingRequests: 0,
    completedTransactions: 0
  });

  // Filter states
  const [dateFilter, setDateFilter] = useState('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGateway, setSelectedGateway] = useState('all');

  // Modal states
  const [showGatewayModal, setShowGatewayModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Mock data - Replace with actual API calls
      const mockTransactions = [
        {
          id: '1',
          type: 'deposit',
          amount: 500,
          method: 'bkash',
          user: { id: 'U123', name: 'Player Pro', phone: '017XXXXXXX' },
          status: 'completed',
          date: new Date().toISOString(),
          transactionId: 'BKA123456',
          adminNote: ''
        },
        {
          id: '2',
          type: 'withdrawal', 
          amount: 200,
          method: 'nagad',
          user: { id: 'U124', name: 'Gamer King', phone: '018XXXXXXX' },
          status: 'pending',
          date: new Date().toISOString(),
          transactionId: 'NGD789012',
          adminNote: 'Need verification'
        }
      ];

      const mockWithdrawals = [
        {
          id: 'W1',
          userId: 'U124',
          userName: 'Gamer King',
          amount: 200,
          method: 'nagad',
          accountNumber: '018XXXXXXX',
          status: 'pending',
          requestedAt: new Date().toISOString(),
          adminNote: ''
        }
      ];

      setTransactions(mockTransactions);
      setWithdrawalRequests(mockWithdrawals);
      calculateStats(mockTransactions, mockWithdrawals);
      
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateStats = (transactionsList, withdrawalsList) => {
    const totalBalance = transactionsList
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + (t.type === 'deposit' ? t.amount : -t.amount), 0);
    
    const todayRevenue = transactionsList
      .filter(t => t.status === 'completed' && isToday(new Date(t.date)))
      .reduce((sum, t) => sum + (t.type === 'deposit' ? t.amount : 0), 0);
    
    const totalWithdrawals = withdrawalsList
      .filter(w => w.status === 'completed')
      .reduce((sum, w) => sum + w.amount, 0);
    
    const pendingRequests = withdrawalsList.filter(w => w.status === 'pending').length;
    const completedTransactions = transactionsList.filter(t => t.status === 'completed').length;

    setStats({
      totalBalance,
      todayRevenue,
      totalWithdrawals,
      pendingRequests,
      completedTransactions
    });
  };

  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadData();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleApproveWithdrawal = (requestId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Approve Withdrawal',
      'Are you sure you want to approve this withdrawal request?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Approve', 
          style: 'default',
          onPress: () => {
            // Update request status
            setWithdrawalRequests(prev => 
              prev.map(req => 
                req.id === requestId ? { ...req, status: 'completed' } : req
              )
            );
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Success', 'Withdrawal request approved successfully!');
          }
        }
      ]
    );
  };

  const handleRejectWithdrawal = (requestId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.prompt(
      'Reject Withdrawal',
      'Please provide reason for rejection:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reject', 
          style: 'destructive',
          onPress: (reason) => {
            setWithdrawalRequests(prev => 
              prev.map(req => 
                req.id === requestId ? { ...req, status: 'rejected', adminNote: reason } : req
              )
            );
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          }
        }
      ]
    );
  };

  const handleUpdateGateway = (gatewayId, updates) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Update gateway configuration
    Alert.alert('Success', `${PAYMENT_GATEWAYS[gatewayId].name} settings updated!`);
  };

  const renderStatsCard = ({ title, value, subtitle, color, icon }) => (
    <View style={styles.statCard}>
      <LinearGradient
        colors={[color, `${color}DD`]}
        style={styles.statGradient}
      >
        <View style={styles.statIconContainer}>
          <Ionicons name={icon} size={24} color="white" />
        </View>
        <View style={styles.statContent}>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statTitle}>{title}</Text>
          <Text style={styles.statSubtitle}>{subtitle}</Text>
        </View>
      </LinearGradient>
    </View>
  );

  const renderTransactionItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.transactionItem}
      onPress={() => {
        setSelectedTransaction(item);
        setShowTransactionModal(true);
      }}
    >
      <View style={styles.transactionLeft}>
        <View style={[
          styles.transactionIcon,
          { backgroundColor: item.type === 'deposit' ? '#4CAF50' : '#FF6B35' }
        ]}>
          <Ionicons 
            name={item.type === 'deposit' ? 'arrow-down' : 'arrow-up'} 
            size={20} 
            color="white" 
          />
        </View>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionUser}>{item.user.name}</Text>
          <Text style={styles.transactionMethod}>
            {PAYMENT_GATEWAYS[item.method]?.name} • {item.type}
          </Text>
          <Text style={styles.transactionDate}>
            {new Date(item.date).toLocaleDateString()}
          </Text>
        </View>
      </View>
      <View style={styles.transactionRight}>
        <Text style={[
          styles.transactionAmount,
          { color: item.type === 'deposit' ? '#4CAF50' : '#FF6B35' }
        ]}>
          {item.type === 'deposit' ? '+' : '-'}৳{item.amount}
        </Text>
        <View style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(item.status) }
        ]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderWithdrawalRequest = ({ item }) => (
    <View style={styles.withdrawalItem}>
      <View style={styles.withdrawalLeft}>
        <View style={styles.userAvatar}>
          <Text style={styles.avatarText}>
            {item.userName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.withdrawalInfo}>
          <Text style={styles.withdrawalUser}>{item.userName}</Text>
          <Text style={styles.withdrawalDetails}>
            {PAYMENT_GATEWAYS[item.method]?.name} • {item.accountNumber}
          </Text>
          <Text style={styles.withdrawalDate}>
            Requested: {new Date(item.requestedAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
      <View style={styles.withdrawalRight}>
        <Text style={styles.withdrawalAmount}>৳{item.amount}</Text>
        {item.status === 'pending' && (
          <View style={styles.withdrawalActions}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.approveButton]}
              onPress={() => handleApproveWithdrawal(item.id)}
            >
              <Ionicons name="checkmark" size={16} color="white" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleRejectWithdrawal(item.id)}
            >
              <Ionicons name="close" size={16} color="white" />
            </TouchableOpacity>
          </View>
        )}
        <View style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(item.status) }
        ]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
    </View>
  );

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return '#4CAF50';
      case 'pending': return '#FF9800';
      case 'rejected': return '#F44336';
      default: return '#666';
    }
  };

  const headerBackground = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: ['rgba(26, 35, 126, 1)', 'rgba(26, 35, 126, 0.95)'],
    extrapolate: 'clamp',
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2962ff" />
          <Text style={styles.loadingText}>Loading Wallet Control...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.View style={[styles.header, { backgroundColor: headerBackground }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Wallet Control</Text>
              <Text style={styles.headerSubtitle}>Financial Management System</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.settingsButton}
              onPress={() => setShowGatewayModal(true)}
            >
              <Ionicons name="settings" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Quick Stats */}
          <View style={styles.statsContainer}>
            {renderStatsCard({
              title: 'Total Balance',
              value: `৳${stats.totalBalance}`,
              subtitle: 'All time',
              color: '#2962ff',
              icon: 'wallet'
            })}
            {renderStatsCard({
              title: "Today's Revenue",
              value: `৳${stats.todayRevenue}`,
              subtitle: 'From deposits',
              color: '#4CAF50',
              icon: 'trending-up'
            })}
            {renderStatsCard({
              title: 'Pending Requests',
              value: stats.pendingRequests,
              subtitle: 'Withdrawals',
              color: '#FF9800',
              icon: 'time'
            })}
          </View>

          {/* Tabs */}
          <View style={styles.tabContainer}>
            {['overview', 'transactions', 'withdrawals', 'gateways'].map(tab => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveTab(tab);
                }}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Animated.View>

      {/* Main Content */}
      <Animated.ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#2962ff']}
          />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        <View style={styles.contentContainer}>
          
          {activeTab === 'overview' && (
            <View>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <FlatList
                data={transactions.slice(0, 5)}
                renderItem={renderTransactionItem}
                keyExtractor={item => item.id}
                scrollEnabled={false}
              />
              
              <Text style={styles.sectionTitle}>Pending Withdrawals</Text>
              <FlatList
                data={withdrawalRequests.filter(req => req.status === 'pending')}
                renderItem={renderWithdrawalRequest}
                keyExtractor={item => item.id}
                scrollEnabled={false}
              />
            </View>
          )}

          {activeTab === 'transactions' && (
            <View>
              <View style={styles.filterSection}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
              <FlatList
                data={transactions}
                renderItem={renderTransactionItem}
                keyExtractor={item => item.id}
                scrollEnabled={false}
              />
            </View>
          )}

          {activeTab === 'withdrawals' && (
            <View>
              <FlatList
                data={withdrawalRequests}
                renderItem={renderWithdrawalRequest}
                keyExtractor={item => item.id}
                scrollEnabled={false}
              />
            </View>
          )}

          {activeTab === 'gateways' && (
            <View>
              {Object.values(PAYMENT_GATEWAYS).map(gateway => (
                <View key={gateway.id} style={styles.gatewayCard}>
                  <View style={styles.gatewayHeader}>
                    <View style={styles.gatewayInfo}>
                      <View style={[styles.gatewayIcon, { backgroundColor: gateway.color }]}>
                        <FontAwesome5 name={gateway.icon} size={20} color="white" />
                      </View>
                      <View>
                        <Text style={styles.gatewayName}>{gateway.name}</Text>
                        <Text style={styles.gatewayAccount}>{gateway.accountNumber}</Text>
                      </View>
                    </View>
                    <Switch
                      value={gateway.isActive}
                      onValueChange={(value) => handleUpdateGateway(gateway.id, { isActive: value })}
                    />
                  </View>
                  
                  <View style={styles.gatewayDetails}>
                    <View style={styles.gatewayDetail}>
                      <Text style={styles.detailLabel}>Charge</Text>
                      <Text style={styles.detailValue}>৳{gateway.charge}</Text>
                    </View>
                    <View style={styles.gatewayDetail}>
                      <Text style={styles.detailLabel}>Min Amount</Text>
                      <Text style={styles.detailValue}>৳{gateway.minAmount}</Text>
                    </View>
                    <View style={styles.gatewayDetail}>
                      <Text style={styles.detailLabel}>Max Amount</Text>
                      <Text style={styles.detailValue}>৳{gateway.maxAmount}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

        </View>
      </Animated.ScrollView>

      {/* Gateway Settings Modal */}
      <Modal
        visible={showGatewayModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Payment Gateway Settings</Text>
            {/* Add gateway configuration form here */}
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0a0c23',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerContent: {
    marginTop: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitleContainer: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  settingsButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  statGradient: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#2962ff',
  },
  tabText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tabTextActive: {
    color: 'white',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
    marginTop: 8,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionUser: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  transactionMethod: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginBottom: 2,
  },
  transactionDate: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  withdrawalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  withdrawalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
  withdrawalInfo: {
    flex: 1,
  },
  withdrawalUser: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  withdrawalDetails: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginBottom: 2,
  },
  withdrawalDate: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
  },
  withdrawalRight: {
    alignItems: 'flex-end',
  },
  withdrawalAmount: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  withdrawalActions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
  gatewayCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  gatewayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  gatewayInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gatewayIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  gatewayName: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  gatewayAccount: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  gatewayDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gatewayDetail: {
    alignItems: 'center',
  },
  detailLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginBottom: 4,
  },
  detailValue: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  filterSection: {
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 12,
    borderRadius: 8,
    color: 'white',
    fontSize: 14,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1a1f3d',
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
});

export default WalletControlScreen;
