// screens/WalletControlScreen.js - FINAL FIXED VERSION
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  Modal,
  RefreshControl,
  ActivityIndicator,
  FlatList,
  Image,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../context/AuthContext'; // ✅ AuthContext থেকে টোকেন নিবে

const { width } = Dimensions.get('window');

// ✅ আপনার সার্ভার URL
const API_URL = 'https://xoss.onrender.com/api';

const WalletControlScreen = ({ navigation }) => {
  const { user, token, logout } = useAuth(); // ✅ useAuth থেকে টোকেন নিন
  const [activeTab, setActiveTab] = useState('deposits');
  const [depositRequests, setDepositRequests] = useState([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);
  const [depositHistory, setDepositHistory] = useState([]);
  const [withdrawalHistory, setWithdrawalHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalBalance: 0,
    todayRevenue: 0,
    pendingDeposits: 0,
    pendingWithdrawals: 0,
    totalTransactions: 0
  });

  // Modal states
  const [showDepositDetailModal, setShowDepositDetailModal] = useState(false);
  const [showWithdrawalDetailModal, setShowWithdrawalDetailModal] = useState(false);
  const [selectedDeposit, setSelectedDeposit] = useState(null);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [showScreenshotModal, setShowScreenshotModal] = useState(false);

  useEffect(() => {
    // ✅ চেক করুন ইউজার এডমিন কিনা
    if (user && user.role !== 'admin') {
      Alert.alert(
        'Access Denied',
        'Only admin can access this screen.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
      return;
    }
    
    if (token) {
      loadData();
    } else {
      Alert.alert(
        'Login Required',
        'Please login first.',
        [{ text: 'Login', onPress: () => navigation.navigate('Login') }]
      );
    }
  }, [activeTab, token, user]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      if (activeTab === 'deposits') {
        await loadDepositRequests();
      } else if (activeTab === 'withdrawals') {
        await loadWithdrawalRequests();
      }
      
      await loadStats();
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ✅ Load pending deposits (REAL API CALL)
  const loadDepositRequests = async () => {
    try {
      console.log('📥 Loading pending deposits with user token...');
      
      if (!token) {
        Alert.alert('Error', 'Please login first');
        return;
      }

      const response = await fetch(`${API_URL}/deposits/admin/pending`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`, // ✅ ইউজারের টোকেন ব্যবহার
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Pending deposits loaded:', data.data?.length || 0);
        
        if (data.success && data.data) {
          setDepositRequests(data.data);
        } else {
          setDepositRequests([]);
        }
      } else if (response.status === 401) {
        // Token expired
        Alert.alert(
          'Session Expired',
          'Please login again.',
          [{ text: 'Login', onPress: () => navigation.navigate('Login') }]
        );
        setDepositRequests([]);
      } else {
        console.log('❌ Failed to load pending deposits:', response.status);
        setDepositRequests([]);
      }
    } catch (error) {
      console.error('Error loading deposit requests:', error);
      Alert.alert('Error', 'Failed to load deposit requests');
      setDepositRequests([]);
    }
  };

  // ✅ Load deposit history (REAL API CALL)
  const loadDepositHistory = async () => {
    try {
      if (!token) {
        return;
      }

      const response = await fetch(`${API_URL}/deposits`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const historyData = data.data.filter(deposit => 
            deposit.status !== 'pending'
          );
          setDepositHistory(historyData);
        } else {
          setDepositHistory([]);
        }
      } else {
        setDepositHistory([]);
      }
    } catch (error) {
      console.error('Error loading deposit history:', error);
      setDepositHistory([]);
    }
  };

  // ✅ Load pending withdrawals (REAL API CALL)
  const loadWithdrawalRequests = async () => {
    try {
      if (!token) {
        return;
      }

      const response = await fetch(`${API_URL}/withdrawals/admin/pending`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setWithdrawalRequests(data.data);
        } else {
          setWithdrawalRequests([]);
        }
      } else {
        setWithdrawalRequests([]);
      }
    } catch (error) {
      console.error('Error loading withdrawal requests:', error);
      setWithdrawalRequests([]);
    }
  };

  // ✅ Load withdrawal history (REAL API CALL)
  const loadWithdrawalHistory = async () => {
    try {
      if (!token) {
        return;
      }

      const response = await fetch(`${API_URL}/withdrawals/history?limit=50`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const historyData = data.data.filter(withdrawal => 
            withdrawal.status !== 'pending'
          );
          setWithdrawalHistory(historyData);
        } else {
          setWithdrawalHistory([]);
        }
      } else {
        setWithdrawalHistory([]);
      }
    } catch (error) {
      console.error('Error loading withdrawal history:', error);
      setWithdrawalHistory([]);
    }
  };

// WalletControlScreen.js এর withdrawal section এ যোগ করুন:

const loadWithdrawalData = async () => {
  try {
    // Withdrawal requests লোড
    const withdrawalResponse = await walletAPI.getPendingWithdrawals();
    if (withdrawalResponse.success) {
      setWithdrawalRequests(withdrawalResponse.data);
    }
    
    // Withdrawal analytics লোড
    const analyticsResponse = await walletAPI.getWithdrawalAnalytics();
    if (analyticsResponse.success) {
      setWithdrawalStats(analyticsResponse.data);
    }
  } catch (error) {
    console.error('Error loading withdrawal data:', error);
  }
};

// Approve withdrawal function
const approveWithdrawal = async (withdrawalId, transactionId) => {
  try {
    const response = await walletAPI.approveWithdrawal(
      withdrawalId, 
      transactionId,
      'Approved by admin'
    );
    
    if (response.success) {
      Alert.alert('Success', 'Withdrawal approved!');
      loadWithdrawalData(); // Refresh data
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to approve withdrawal');
  }
};

// Reject withdrawal function
const rejectWithdrawal = async (withdrawalId) => {
  try {
    const response = await walletAPI.rejectWithdrawal(
      withdrawalId,
      'Rejected by admin'
    );
    
    if (response.success) {
      Alert.alert('Rejected', 'Withdrawal has been rejected');
      loadWithdrawalData(); // Refresh data
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to reject withdrawal');
  }
};

  // ✅ Calculate stats from real data
  const loadStats = async () => {
    try {
      // First load history data if not loaded
      if (activeTab === 'deposits') {
        await loadDepositHistory();
      } else {
        await loadWithdrawalHistory();
      }

      // Calculate stats
      const totalBalance = depositHistory
        .filter(d => d.status === 'approved')
        .reduce((sum, d) => sum + (d.amount || 0), 0);

      const today = new Date().toISOString().split('T')[0];
      const todayRevenue = depositHistory
        .filter(d => d.status === 'approved' && 
          d.createdAt && 
          new Date(d.createdAt).toISOString().split('T')[0] === today
        )
        .reduce((sum, d) => sum + (d.amount || 0), 0);

      setStats({
        totalBalance,
        todayRevenue,
        pendingDeposits: depositRequests.length,
        pendingWithdrawals: withdrawalRequests.length,
        totalTransactions: depositHistory.length + withdrawalHistory.length
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadData();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // ✅ Approve deposit (REAL API CALL)
  const handleApproveDeposit = async (depositId) => {
    try {
      if (!token) {
        Alert.alert('Error', 'Please login first');
        return;
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      Alert.alert(
        'Approve Deposit',
        'Approve this deposit and add money to user wallet?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Approve', 
            onPress: async () => {
              try {
                console.log(`✅ Approving deposit: ${depositId}`);
                
                const response = await fetch(`${API_URL}/deposits/admin/approve/${depositId}`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    adminNote: adminNote || 'Approved by admin'
                  })
                });

                console.log('Approve response status:', response.status);

                if (response.ok) {
                  const result = await response.json();
                  
                  if (result.success) {
                    // Remove from pending list
                    setDepositRequests(prev => 
                      prev.filter(deposit => deposit._id !== depositId)
                    );
                    
                    // Add to history
                    const approvedDeposit = depositRequests.find(d => d._id === depositId);
                    if (approvedDeposit) {
                      setDepositHistory(prev => [{
                        ...approvedDeposit,
                        status: 'approved',
                        adminNote: adminNote || 'Approved by admin',
                        approvedAt: new Date()
                      }, ...prev]);
                    }

                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    Alert.alert('Success', 'Deposit approved successfully!');
                    setShowDepositDetailModal(false);
                    loadStats();
                  } else {
                    throw new Error(result.message);
                  }
                } else if (response.status === 401) {
                  Alert.alert(
                    'Session Expired',
                    'Please login again.',
                    [{ text: 'Login', onPress: () => navigation.navigate('Login') }]
                  );
                } else {
                  const errorData = await response.json();
                  throw new Error(errorData.message || 'Approval failed');
                }
              } catch (error) {
                console.error('Approve deposit error:', error);
                Alert.alert('Error', error.message || 'Failed to approve deposit');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Approve deposit error:', error);
      Alert.alert('Error', error.message || 'Failed to approve deposit');
    }
  };

  // ✅ Reject deposit (REAL API CALL)
  const handleRejectDeposit = async (depositId) => {
    try {
      if (!token) {
        Alert.alert('Error', 'Please login first');
        return;
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      Alert.alert(
        'Reject Deposit',
        'Are you sure you want to reject this deposit?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Reject', 
            style: 'destructive',
            onPress: async () => {
              try {
                console.log(`❌ Rejecting deposit: ${depositId}`);
                
                const response = await fetch(`${API_URL}/deposits/admin/reject/${depositId}`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    adminNote: adminNote || 'Rejected by admin'
                  })
                });

                if (response.ok) {
                  const result = await response.json();
                  
                  if (result.success) {
                    setDepositRequests(prev => 
                      prev.filter(deposit => deposit._id !== depositId)
                    );
                    
                    const rejectedDeposit = depositRequests.find(d => d._id === depositId);
                    if (rejectedDeposit) {
                      setDepositHistory(prev => [{
                        ...rejectedDeposit,
                        status: 'rejected',
                        adminNote: adminNote || 'Rejected by admin',
                        rejectedAt: new Date()
                      }, ...prev]);
                    }

                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                    Alert.alert('Deposit Rejected', 'Deposit has been rejected.');
                    setShowDepositDetailModal(false);
                    loadStats();
                  } else {
                    throw new Error(result.message);
                  }
                } else if (response.status === 401) {
                  Alert.alert(
                    'Session Expired',
                    'Please login again.',
                    [{ text: 'Login', onPress: () => navigation.navigate('Login') }]
                  );
                } else {
                  const errorData = await response.json();
                  throw new Error(errorData.message || 'Rejection failed');
                }
              } catch (error) {
                console.error('Reject deposit error:', error);
                Alert.alert('Error', error.message || 'Failed to reject deposit');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Reject deposit error:', error);
      Alert.alert('Error', error.message || 'Failed to reject deposit');
    }
  };

  // ✅ Approve withdrawal (REAL API CALL)
  const handleApproveWithdrawal = async (withdrawalId) => {
    try {
      if (!token) {
        Alert.alert('Error', 'Please login first');
        return;
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      Alert.alert(
        'Approve Withdrawal',
        'Approve this withdrawal request?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Approve', 
            onPress: async () => {
              try {
                const response = await fetch(`${API_URL}/withdrawals/admin/approve/${withdrawalId}`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    admin_notes: adminNote || 'Approved by admin'
                  })
                });

                if (response.ok) {
                  const result = await response.json();
                  
                  if (result.success) {
                    setWithdrawalRequests(prev => 
                      prev.filter(withdrawal => withdrawal._id !== withdrawalId)
                    );
                    
                    const approvedWithdrawal = withdrawalRequests.find(w => w._id === withdrawalId);
                    if (approvedWithdrawal) {
                      setWithdrawalHistory(prev => [{
                        ...approvedWithdrawal,
                        status: 'approved',
                        admin_notes: adminNote || 'Approved by admin'
                      }, ...prev]);
                    }

                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    Alert.alert('Success', 'Withdrawal approved!');
                    setShowWithdrawalDetailModal(false);
                    loadStats();
                  } else {
                    throw new Error(result.message);
                  }
                } else if (response.status === 401) {
                  Alert.alert(
                    'Session Expired',
                    'Please login again.',
                    [{ text: 'Login', onPress: () => navigation.navigate('Login') }]
                  );
                } else {
                  const errorData = await response.json();
                  throw new Error(errorData.message || 'Approval failed');
                }
              } catch (error) {
                console.error('Approve withdrawal error:', error);
                Alert.alert('Error', error.message || 'Failed to approve withdrawal');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Approve withdrawal error:', error);
      Alert.alert('Error', error.message || 'Failed to approve withdrawal');
    }
  };

  // ✅ Reject withdrawal (REAL API CALL)
  const handleRejectWithdrawal = async (withdrawalId) => {
    try {
      if (!token) {
        Alert.alert('Error', 'Please login first');
        return;
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      Alert.alert(
        'Reject Withdrawal',
        'Reject this withdrawal request and refund money?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Reject', 
            style: 'destructive',
            onPress: async () => {
              try {
                const response = await fetch(`${API_URL}/withdrawals/admin/reject/${withdrawalId}`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    admin_notes: adminNote || 'Rejected by admin'
                  })
                });

                if (response.ok) {
                  const result = await response.json();
                  
                  if (result.success) {
                    setWithdrawalRequests(prev => 
                      prev.filter(withdrawal => withdrawal._id !== withdrawalId)
                    );
                    
                    const rejectedWithdrawal = withdrawalRequests.find(w => w._id === withdrawalId);
                    if (rejectedWithdrawal) {
                      setWithdrawalHistory(prev => [{
                        ...rejectedWithdrawal,
                        status: 'rejected',
                        admin_notes: adminNote || 'Rejected by admin'
                      }, ...prev]);
                    }

                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                    Alert.alert('Withdrawal Rejected', 'Withdrawal has been rejected.');
                    setShowWithdrawalDetailModal(false);
                    loadStats();
                  } else {
                    throw new Error(result.message);
                  }
                } else if (response.status === 401) {
                  Alert.alert(
                    'Session Expired',
                    'Please login again.',
                    [{ text: 'Login', onPress: () => navigation.navigate('Login') }]
                  );
                } else {
                  const errorData = await response.json();
                  throw new Error(errorData.message || 'Rejection failed');
                }
              } catch (error) {
                console.error('Reject withdrawal error:', error);
                Alert.alert('Error', error.message || 'Failed to reject withdrawal');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Reject withdrawal error:', error);
      Alert.alert('Error', error.message || 'Failed to reject withdrawal');
    }
  };

  // ✅ View screenshot
  const viewScreenshot = (item) => {
    if (!item.screenshot) {
      Alert.alert('No Screenshot', 'No payment proof available.');
      return;
    }
    
    if (activeTab === 'deposits') {
      setSelectedDeposit(item);
    } else {
      setSelectedWithdrawal(item);
    }
    setShowScreenshotModal(true);
  };

  // ✅ Format base64 image
  const getScreenshotUri = (screenshotData) => {
    if (!screenshotData) return null;
    
    if (screenshotData.startsWith('http')) {
      return screenshotData;
    }
    
    if (screenshotData.startsWith('data:image')) {
      return screenshotData;
    }
    
    if (screenshotData.length > 100) {
      return `data:image/jpeg;base64,${screenshotData}`;
    }
    
    return null;
  };

  const formatDateTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // ✅ Render stats cards
  const renderStats = () => (
    <View style={styles.statsContainer}>
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.statCard}>
        <Text style={styles.statValue}>৳{stats.totalBalance.toLocaleString()}</Text>
        <Text style={styles.statLabel}>Total Balance</Text>
        <FontAwesome5 name="wallet" size={20} color="#fff" style={styles.statIcon} />
      </LinearGradient>

      <LinearGradient colors={['#f093fb', '#f5576c']} style={styles.statCard}>
        <Text style={styles.statValue}>৳{stats.todayRevenue.toLocaleString()}</Text>
        <Text style={styles.statLabel}>Today Revenue</Text>
        <FontAwesome5 name="chart-line" size={20} color="#fff" style={styles.statIcon} />
      </LinearGradient>

      <LinearGradient colors={['#4facfe', '#00f2fe']} style={styles.statCard}>
        <Text style={styles.statValue}>{stats.pendingDeposits}</Text>
        <Text style={styles.statLabel}>Pending Deposits</Text>
        <FontAwesome5 name="clock" size={20} color="#fff" style={styles.statIcon} />
      </LinearGradient>

      <LinearGradient colors={['#43e97b', '#38f9d7']} style={styles.statCard}>
        <Text style={styles.statValue}>{stats.pendingWithdrawals}</Text>
        <Text style={styles.statLabel}>Pending Withdrawals</Text>
        <FontAwesome5 name="money-bill-wave" size={20} color="#fff" style={styles.statIcon} />
      </LinearGradient>
    </View>
  );

  // ✅ Render deposit item
  const renderDepositItem = ({ item }) => {
    const screenshotUri = getScreenshotUri(item.screenshot);
    
    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() => {
          setSelectedDeposit(item);
          setAdminNote(item.adminNote || '');
          setShowDepositDetailModal(true);
        }}
      >
        <View style={styles.itemHeader}>
          <Text style={styles.userName}>{item.userName || 'Unknown User'}</Text>
          <Text style={styles.amount}>৳{item.amount}</Text>
        </View>
        
        <View style={styles.itemDetails}>
          <Text style={styles.method}>{item.method?.toUpperCase()}</Text>
          <Text style={styles.date}>{formatDateTime(item.createdAt)}</Text>
        </View>
        
        <View style={styles.statusContainer}>
          <View style={[
            styles.statusBadge,
            { 
              backgroundColor: item.status === 'pending' ? '#FFA500' : 
                             item.status === 'approved' ? '#4CAF50' : '#ff4444'
            }
          ]}>
            <Text style={styles.statusText}>
              {item.status === 'pending' ? 'Pending' : 
               item.status === 'approved' ? 'Approved' : 'Rejected'}
            </Text>
          </View>
          
          {screenshotUri && (
            <TouchableOpacity 
              style={styles.screenshotButton}
              onPress={() => viewScreenshot(item)}
            >
              <Ionicons name="image" size={16} color="#2962ff" />
              <Text style={styles.screenshotButtonText}>View Proof</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // ✅ Render withdrawal item
  const renderWithdrawalItem = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() => {
          setSelectedWithdrawal(item);
          setAdminNote(item.admin_notes || '');
          setShowWithdrawalDetailModal(true);
        }}
      >
        <View style={styles.itemHeader}>
          <Text style={styles.userName}>
            {item.user_id?.username || 'Unknown User'}
          </Text>
          <Text style={styles.amount}>৳{item.amount}</Text>
        </View>
        
        <View style={styles.itemDetails}>
          <Text style={styles.method}>{item.payment_method?.toUpperCase()}</Text>
          <Text style={styles.date}>{formatDateTime(item.createdAt)}</Text>
        </View>
        
        <View style={styles.statusContainer}>
          <View style={[
            styles.statusBadge,
            { 
              backgroundColor: item.status === 'pending' ? '#FFA500' : 
                             item.status === 'approved' ? '#4CAF50' : '#ff4444'
            }
          ]}>
            <Text style={styles.statusText}>
              {item.status === 'pending' ? 'Pending' : 
               item.status === 'approved' ? 'Approved' : 'Rejected'}
            </Text>
          </View>
          
          <Text style={styles.accountText}>
            {item.account_details?.phone || 'N/A'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // ✅ Render tabs
  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'deposits' && styles.activeTab]}
        onPress={() => setActiveTab('deposits')}
      >
        <Text style={[styles.tabText, activeTab === 'deposits' && styles.activeTabText]}>
          Deposits ({depositRequests.length})
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tab, activeTab === 'withdrawals' && styles.activeTab]}
        onPress={() => setActiveTab('withdrawals')}
      >
        <Text style={[styles.tabText, activeTab === 'withdrawals' && styles.activeTabText]}>
          Withdrawals ({withdrawalRequests.length})
        </Text>
      </TouchableOpacity>
    </View>
  );

  // ✅ Render content based on active tab
  const renderContent = () => {
    if (activeTab === 'deposits') {
      const dataToShow = depositRequests.length > 0 ? depositRequests : depositHistory;
      return (
        <FlatList
          data={dataToShow}
          keyExtractor={(item) => item._id || item.id}
          renderItem={renderDepositItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#667eea']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="wallet-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No Deposits Found</Text>
              <Text style={styles.emptySubText}>Pull down to refresh</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      );
    } else {
      const dataToShow = withdrawalRequests.length > 0 ? withdrawalRequests : withdrawalHistory;
      return (
        <FlatList
          data={dataToShow}
          keyExtractor={(item) => item._id || item.id}
          renderItem={renderWithdrawalItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#667eea']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="cash-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No Withdrawals Found</Text>
              <Text style={styles.emptySubText}>Pull down to refresh</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      );
    }
  };

  // ✅ Check if user is admin
  if (user && user.role !== 'admin') {
    return (
      <View style={styles.deniedContainer}>
        <Ionicons name="shield-offline" size={64} color="#ff4444" />
        <Text style={styles.deniedTitle}>Access Denied</Text>
        <Text style={styles.deniedText}>Only admin users can access this screen.</Text>
        <TouchableOpacity 
          style={styles.backButtonDenied}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading Payment Data...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment Control Panel</Text>
          <View style={styles.headerRight}>
            <Text style={styles.userRole}>{user?.role || 'Admin'}</Text>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={handleRefresh}
            >
              <Ionicons name="refresh" size={24} color="#667eea" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        {renderStats()}

        {/* Tabs */}
        {renderTabs()}

        {/* Content */}
        <View style={styles.content}>
          {renderContent()}
        </View>
      </View>

      {/* Deposit Detail Modal */}
      {selectedDeposit && (
        <Modal
          visible={showDepositDetailModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowDepositDetailModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Deposit Details</Text>
                <TouchableOpacity onPress={() => setShowDepositDetailModal(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>User:</Text>
                  <Text style={styles.detailValue}>{selectedDeposit.userName || 'Unknown'}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Amount:</Text>
                  <Text style={styles.detailValue}>৳{selectedDeposit.amount}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Method:</Text>
                  <Text style={styles.detailValue}>{selectedDeposit.method?.toUpperCase()}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date:</Text>
                  <Text style={styles.detailValue}>{formatDateTime(selectedDeposit.createdAt)}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Transaction ID:</Text>
                  <Text style={styles.detailValue}>{selectedDeposit.transactionId || 'N/A'}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <Text style={[
                    styles.detailValue,
                    { 
                      color: selectedDeposit.status === 'approved' ? '#4CAF50' : 
                            selectedDeposit.status === 'rejected' ? '#ff4444' : '#FFA500'
                    }
                  ]}>
                    {selectedDeposit.status?.toUpperCase()}
                  </Text>
                </View>

                {selectedDeposit.screenshot && (
                  <View style={styles.screenshotSection}>
                    <Text style={styles.screenshotLabel}>Payment Proof:</Text>
                    <TouchableOpacity 
                      style={styles.screenshotThumbnail}
                      onPress={() => viewScreenshot(selectedDeposit)}
                    >
                      <Image 
                        source={{ uri: getScreenshotUri(selectedDeposit.screenshot) }} 
                        style={styles.thumbnailImage}
                      />
                      <View style={styles.screenshotOverlay}>
                        <Ionicons name="expand" size={24} color="white" />
                        <Text style={styles.viewProofText}>View Proof</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.noteContainer}>
                  <Text style={styles.noteLabel}>Admin Note:</Text>
                  <TextInput
                    style={styles.noteInput}
                    value={adminNote}
                    onChangeText={setAdminNote}
                    placeholder="Add note here..."
                    multiline
                  />
                </View>
              </ScrollView>

              {selectedDeposit.status === 'pending' && (
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => handleRejectDeposit(selectedDeposit._id)}
                  >
                    <Text style={styles.rejectButtonText}>Reject</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.approveButton]}
                    onPress={() => handleApproveDeposit(selectedDeposit._id)}
                  >
                    <Text style={styles.approveButtonText}>Approve</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </Modal>
      )}

      {/* Withdrawal Detail Modal */}
      {selectedWithdrawal && (
        <Modal
          visible={showWithdrawalDetailModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowWithdrawalDetailModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Withdrawal Details</Text>
                <TouchableOpacity onPress={() => setShowWithdrawalDetailModal(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>User:</Text>
                  <Text style={styles.detailValue}>
                    {selectedWithdrawal.user_id?.username || 'Unknown'}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Amount:</Text>
                  <Text style={styles.detailValue}>৳{selectedWithdrawal.amount}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Method:</Text>
                  <Text style={styles.detailValue}>{selectedWithdrawal.payment_method?.toUpperCase()}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Account:</Text>
                  <Text style={styles.detailValue}>
                    {selectedWithdrawal.account_details?.phone || 'N/A'}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date:</Text>
                  <Text style={styles.detailValue}>{formatDateTime(selectedWithdrawal.createdAt)}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <Text style={[
                    styles.detailValue,
                    { 
                      color: selectedWithdrawal.status === 'approved' ? '#4CAF50' : 
                            selectedWithdrawal.status === 'rejected' ? '#ff4444' : '#FFA500'
                    }
                  ]}>
                    {selectedWithdrawal.status?.toUpperCase()}
                  </Text>
                </View>

                <View style={styles.noteContainer}>
                  <Text style={styles.noteLabel}>Admin Note:</Text>
                  <TextInput
                    style={styles.noteInput}
                    value={adminNote}
                    onChangeText={setAdminNote}
                    placeholder="Add note here..."
                    multiline
                  />
                </View>
              </ScrollView>

              {selectedWithdrawal.status === 'pending' && (
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => handleRejectWithdrawal(selectedWithdrawal._id)}
                  >
                    <Text style={styles.rejectButtonText}>Reject</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.approveButton]}
                    onPress={() => handleApproveWithdrawal(selectedWithdrawal._id)}
                  >
                    <Text style={styles.approveButtonText}>Approve</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </Modal>
      )}

      {/* Screenshot Modal */}
      <Modal
        visible={showScreenshotModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowScreenshotModal(false)}
      >
        <View style={styles.screenshotModal}>
          <TouchableOpacity 
            style={styles.screenshotClose}
            onPress={() => setShowScreenshotModal(false)}
          >
            <Ionicons name="close" size={30} color="white" />
          </TouchableOpacity>
          
          {(selectedDeposit?.screenshot || selectedWithdrawal?.screenshot) && (
            <Image 
              source={{ uri: getScreenshotUri(selectedDeposit?.screenshot || selectedWithdrawal?.screenshot) }} 
              style={styles.fullScreenScreenshot}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userRole: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: 'bold',
    marginRight: 10,
    backgroundColor: '#eef2ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  refreshButton: {
    padding: 5,
  },
  deniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  deniedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
  },
  deniedText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  backButtonDenied: {
    backgroundColor: '#667eea',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - 40) / 2 - 5,
    height: 100,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
  },
  statIcon: {
    position: 'absolute',
    top: 15,
    right: 15,
    opacity: 0.8,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 10,
    padding: 4,
    marginVertical: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#667eea',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  item: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  method: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  screenshotButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  screenshotButtonText: {
    color: '#2962ff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  accountText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#999',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    padding: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  screenshotSection: {
    marginVertical: 15,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
  },
  screenshotLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  screenshotThumbnail: {
    position: 'relative',
    alignItems: 'center',
  },
  thumbnailImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
  },
  screenshotOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewProofText: {
    color: 'white',
    fontWeight: 'bold',
    marginTop: 5,
  },
  noteContainer: {
    marginTop: 10,
  },
  noteLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  rejectButton: {
    backgroundColor: '#ffebee',
    borderWidth: 1,
    borderColor: '#ffcdd2',
  },
  approveButton: {
    backgroundColor: '#667eea',
  },
  rejectButtonText: {
    color: '#d32f2f',
    fontWeight: 'bold',
  },
  approveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  screenshotModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenshotClose: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
  },
  fullScreenScreenshot: {
    width: '100%',
    height: '80%',
  },
});

export default WalletControlScreen;
