// screens/WalletControlScreen.js - COMPLETE FIXED VERSION
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
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

// ✅ Server URL
const API_URL = 'http://192.168.0.100:5000/api';

const WalletControlScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('deposits');
  const [depositRequests, setDepositRequests] = useState([]);
  const [depositHistory, setDepositHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalBalance: 0,
    todayRevenue: 0,
    pendingDeposits: 0,
    totalDeposits: 0
  });

  // Modal states
  const [showDepositDetailModal, setShowDepositDetailModal] = useState(false);
  const [selectedDeposit, setSelectedDeposit] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [showScreenshotModal, setShowScreenshotModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'deposits') {
        await Promise.all([
          loadDepositRequests(),
          loadStats()
        ]);
      } else {
        await loadDepositHistory();
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ✅ FIXED: Load pending deposits
  const loadDepositRequests = async () => {
    try {
      const response = await fetch(`${API_URL}/deposits?status=pending`);
      
      if (response.ok) {
        const data = await response.json();
        setDepositRequests(data.data || []);
      } else {
        throw new Error('Failed to load deposits');
      }
    } catch (error) {
      console.error('Error loading deposit requests:', error);
      Alert.alert('Error', 'Failed to load deposits');
    }
  };

  // ✅ FIXED: Load deposit history
  const loadDepositHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/deposits?status=all&limit=50`);
      
      if (response.ok) {
        const data = await response.json();
        setDepositHistory(data.data || []);
      } else {
        throw new Error('Failed to load deposit history');
      }
    } catch (error) {
      console.error('Error loading deposit history:', error);
      Alert.alert('Error', 'Failed to load deposit history');
    }
  };

  // ✅ FIXED: Load stats from deposits data
  const loadStats = async () => {
    try {
      const response = await fetch(`${API_URL}/deposits?status=all`);
      if (response.ok) {
        const data = await response.json();
        const deposits = data.data || [];
        
        const totalDeposits = deposits.length;
        const pendingDeposits = deposits.filter(d => d.status === 'pending').length;
        
        // Calculate today's revenue
        const today = new Date().toISOString().split('T')[0];
        const todayRevenue = deposits
          .filter(d => d.status === 'approved' && d.createdAt && d.createdAt.includes(today))
          .reduce((sum, d) => sum + d.amount, 0);
        
        // Calculate total balance from approved deposits
        const totalBalance = deposits
          .filter(d => d.status === 'approved')
          .reduce((sum, d) => sum + d.amount, 0);

        setStats({
          totalBalance,
          todayRevenue,
          pendingDeposits,
          totalDeposits
        });
      }
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

  // ✅ FIXED: Approve deposit function
  const handleApproveDeposit = async (depositId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Alert.alert(
      'Approve Deposit',
      'Are you sure you want to approve this deposit and add money to user wallet?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Approve', 
          style: 'default',
          onPress: async () => {
            try {
              const response = await fetch(`${API_URL}/deposits/${depositId}/approve`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  adminNote: adminNote || 'Deposit approved by admin'
                })
              });

              if (response.ok) {
                const result = await response.json();
                
                // Update local state
                setDepositRequests(prev => 
                  prev.filter(deposit => deposit._id !== depositId)
                );

                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert('Success', 'Deposit approved and user wallet updated successfully!');
                setShowDepositDetailModal(false);
                loadData(); // Refresh data
              } else {
                const errorData = await response.json();
                throw new Error(errorData.message);
              }
            } catch (error) {
              console.error('Approve deposit error:', error);
              Alert.alert('Error', error.message || 'Failed to approve deposit');
            }
          }
        }
      ]
    );
  };

  // ✅ FIXED: Reject deposit function
  const handleRejectDeposit = async (depositId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Alert.prompt(
      'Reject Deposit',
      'Please provide reason for rejection:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reject', 
          style: 'destructive',
          onPress: async (reason) => {
            try {
              const response = await fetch(`${API_URL}/deposits/${depositId}/reject`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  adminNote: reason || 'Deposit rejected by admin'
                })
              });

              if (response.ok) {
                // Update local state
                setDepositRequests(prev => 
                  prev.filter(deposit => deposit._id !== depositId)
                );

                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                Alert.alert('Deposit Rejected', 'User has been notified.');
                setShowDepositDetailModal(false);
                loadData();
              } else {
                const errorData = await response.json();
                throw new Error(errorData.message);
              }
            } catch (error) {
              console.error('Reject deposit error:', error);
              Alert.alert('Error', error.message || 'Failed to reject deposit');
            }
          }
        }
      ]
    );
  };

  const viewScreenshot = (deposit) => {
    setSelectedDeposit(deposit);
    setShowScreenshotModal(true);
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Render stats cards
  const renderStats = () => (
    <View style={styles.statsContainer}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.statCard}
      >
        <Text style={styles.statValue}>৳{stats.totalBalance}</Text>
        <Text style={styles.statLabel}>Total Balance</Text>
        <FontAwesome5 name="wallet" size={20} color="#fff" style={styles.statIcon} />
      </LinearGradient>

      <LinearGradient
        colors={['#f093fb', '#f5576c']}
        style={styles.statCard}
      >
        <Text style={styles.statValue}>৳{stats.todayRevenue}</Text>
        <Text style={styles.statLabel}>Today Revenue</Text>
        <FontAwesome5 name="chart-line" size={20} color="#fff" style={styles.statIcon} />
      </LinearGradient>

      <LinearGradient
        colors={['#4facfe', '#00f2fe']}
        style={styles.statCard}
      >
        <Text style={styles.statValue}>{stats.pendingDeposits}</Text>
        <Text style={styles.statLabel}>Pending Deposits</Text>
        <FontAwesome5 name="clock" size={20} color="#fff" style={styles.statIcon} />
      </LinearGradient>

      <LinearGradient
        colors={['#43e97b', '#38f9d7']}
        style={styles.statCard}
      >
        <Text style={styles.statValue}>{stats.totalDeposits}</Text>
        <Text style={styles.statLabel}>Total Deposits</Text>
        <FontAwesome5 name="money-check" size={20} color="#fff" style={styles.statIcon} />
      </LinearGradient>
    </View>
  );

  // ✅ FIXED: Render deposit item
  const renderDepositItem = ({ item }) => (
    <TouchableOpacity
      style={styles.depositItem}
      onPress={() => {
        setSelectedDeposit(item);
        setAdminNote(item.adminNote || '');
        setShowDepositDetailModal(true);
      }}
    >
      <View style={styles.depositHeader}>
        <Text style={styles.userName}>{item.userName || 'Unknown User'}</Text>
        <Text style={styles.amount}>৳{item.amount}</Text>
      </View>
      
      <View style={styles.depositDetails}>
        <Text style={styles.method}>{item.method}</Text>
        <Text style={styles.date}>
          {formatDateTime(item.createdAt)}
        </Text>
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
        
        {item.screenshot && (
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

  // Render tabs
  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === 'deposits' && styles.activeTab
        ]}
        onPress={() => setActiveTab('deposits')}
      >
        <Text style={[
          styles.tabText,
          activeTab === 'deposits' && styles.activeTabText
        ]}>
          Pending Deposits
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === 'history' && styles.activeTab
        ]}
        onPress={() => setActiveTab('history')}
      >
        <Text style={[
          styles.tabText,
          activeTab === 'history' && styles.activeTabText
        ]}>
          History
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderContent = () => {
    if (activeTab === 'deposits') {
      return (
        <FlatList
          data={depositRequests}
          keyExtractor={(item) => item._id}
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
              <Text style={styles.emptyText}>No Pending Deposits</Text>
              <Text style={styles.emptySubText}>
                All deposit requests have been processed
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      );
    } else {
      return (
        <FlatList
          data={depositHistory}
          keyExtractor={(item) => item._id}
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
              <Ionicons name="time-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No Deposit History</Text>
              <Text style={styles.emptySubText}>
                No deposit history available
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading Wallet Data...</Text>
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
          <Text style={styles.headerTitle}>Wallet Control</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Stats Section */}
        {activeTab === 'deposits' && renderStats()}

        {/* Tabs */}
        {renderTabs()}

        {/* Content */}
        <View style={styles.content}>
          {renderContent()}
        </View>
      </View>

      {/* Deposit Detail Modal */}
      <Modal
        visible={showDepositDetailModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDepositDetailModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {selectedDeposit && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Deposit Details</Text>
                  <TouchableOpacity
                    onPress={() => setShowDepositDetailModal(false)}
                  >
                    <Ionicons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>User:</Text>
                    <Text style={styles.detailValue}>
                      {selectedDeposit.userName || 'Unknown'}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Amount:</Text>
                    <Text style={styles.detailValue}>
                      ৳{selectedDeposit.amount}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Method:</Text>
                    <Text style={styles.detailValue}>
                      {selectedDeposit.method}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Date:</Text>
                    <Text style={styles.detailValue}>
                      {formatDateTime(selectedDeposit.createdAt)}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Transaction ID:</Text>
                    <Text style={styles.detailValue}>
                      {selectedDeposit.transactionId || 'N/A'}
                    </Text>
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

                  {/* SCREENSHOT SECTION */}
                  <View style={styles.screenshotSection}>
                    <Text style={styles.screenshotLabel}>Payment Proof:</Text>
                    {selectedDeposit.screenshot ? (
                      <TouchableOpacity 
                        style={styles.screenshotThumbnail}
                        onPress={() => viewScreenshot(selectedDeposit)}
                      >
                        <Image 
                          source={{ uri: selectedDeposit.screenshot }} 
                          style={styles.thumbnailImage}
                        />
                        <View style={styles.screenshotOverlay}>
                          <Ionicons name="expand" size={24} color="white" />
                          <Text style={styles.viewProofText}>View Proof</Text>
                        </View>
                      </TouchableOpacity>
                    ) : (
                      <Text style={styles.noScreenshotText}>No screenshot provided</Text>
                    )}
                  </View>

                  <View style={styles.noteContainer}>
                    <Text style={styles.noteLabel}>Admin Note:</Text>
                    <TextInput
                      style={styles.noteInput}
                      value={adminNote}
                      onChangeText={setAdminNote}
                      placeholder="Add a note for this transaction..."
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
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Screenshot Preview Modal */}
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
          
          {selectedDeposit?.screenshot && (
            <Image 
              source={{ uri: selectedDeposit.screenshot }} 
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
    width: 24,
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
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
  depositItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  depositHeader: {
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
  depositDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  method: {
    fontSize: 14,
    color: '#666',
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
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
    textAlign: 'center',
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
    maxHeight: height * 0.8,
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
  noScreenshotText: {
    color: '#999',
    fontStyle: 'italic',
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
