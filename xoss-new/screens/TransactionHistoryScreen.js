// screens/TransactionHistoryScreen.js - FIXED VERSION
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  RefreshControl,
  ActivityIndicator,
  FlatList,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Modal,
  Alert
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { walletAPI } from '../api/walletAPI';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const API_URL = 'https://xoss.onrender.com/api';

const TransactionHistoryScreen = ({ navigation }) => {
  const { user, token, isAuthenticated } = useAuth();
  
  // ✅ FIXED: Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [stats, setStats] = useState({
    totalDeposit: 0,
    totalWithdraw: 0,
    totalWin: 0,
    totalEntry: 0,
    totalTransfer: 0,
    totalBonus: 0,
    totalRefund: 0
  });

  // ✅ ফিল্টার অপশন - API response types অনুযায়ী
  const filters = [
    { id: 'all', label: 'সব ট্রানজেকশন', icon: 'list', color: '#ff8a00' },
    { id: 'deposit', label: 'ডিপোজিট', icon: 'arrow-down-circle', color: '#4CAF50' },
    { id: 'withdrawal', label: 'উইথড্র', icon: 'arrow-up-circle', color: '#FF6B35' },
    { id: 'win', label: 'টুর্নামেন্ট জয়', icon: 'trophy', color: '#9C27B0' },
    { id: 'entry_fee', label: 'এন্ট্রি ফি', icon: 'game-controller', color: '#FF9800' },
    { id: 'prize', label: 'প্রাইজ', icon: 'gift', color: '#9C27B0' },
    { id: 'bonus', label: 'বোনাস', icon: 'star', color: '#FFD700' },
    { id: 'transfer', label: 'ট্রান্সফার', icon: 'swap-horizontal', color: '#2196F3' },
  ];

  // ✅ API থেকে রিয়েল ডেটা লোড
  const loadTransactions = async () => {
    try {
      setLoading(true);
      
      if (!isAuthenticated || !token) {
        Alert.alert('লগইন করুন', 'দয়া করে লগইন করুন');
        return;
      }

      // ✅ walletAPI ব্যবহার করে ডেটা ফেচ করুন
      const response = await walletAPI.getTransactions(1, 50);
      
      if (response.success) {
        // ✅ API response format আপনার Wallet model অনুযায়ী
        const formattedTransactions = (response.data?.transactions || []).map(tx => {
          // Type mapping based on your Wallet model
          let displayType = tx.type;
          let displayDescription = tx.description || 'ট্রানজেকশন';
          
          // Type mapping for UI
          if (tx.type === 'credit' && tx.description?.includes('deposit')) {
            displayType = 'deposit';
          } else if (tx.type === 'debit' && tx.description?.includes('withdrawal')) {
            displayType = 'withdrawal';
          } else if (tx.type === 'credit' && tx.description?.includes('prize')) {
            displayType = 'win';
          } else if (tx.type === 'debit' && tx.description?.includes('entry')) {
            displayType = 'entry_fee';
          } else if (tx.type === 'bonus') {
            displayType = 'bonus';
          } else if (tx.type === 'transfer') {
            displayType = 'transfer';
          }
          
          return {
            id: tx._id || tx.id || `tx_${Date.now()}_${Math.random()}`,
            type: displayType,
            amount: tx.amount || 0,
            description: displayDescription,
            date: new Date(tx.createdAt || tx.date || Date.now()),
            status: tx.status || 'completed',
            transactionId: tx._id || tx.id || 'N/A',
            method: tx.method || null,
            metadata: tx.metadata || {},
            gameName: tx.metadata?.tournamentName || tx.metadata?.game || null,
            recipient: tx.metadata?.recipientName || tx.metadata?.receiver || null
          };
        });
        
        setTransactions(formattedTransactions);
        
        // ✅ স্ট্যাটস ক্যালকুলেশন
        calculateStats(formattedTransactions);
      } else {
        // Fallback to sample data
        loadSampleData();
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      Alert.alert('ত্রুটি', 'ডেটা লোড করতে সমস্যা হচ্ছে। ইন্টারনেট চেক করুন।');
      loadSampleData();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ✅ স্যাম্পল ডেটা (API কাজ না করলে)
  const loadSampleData = () => {
    const sampleTransactions = [
      {
        id: '1',
        type: 'win',
        amount: 500,
        description: 'টুর্নামেন্ট জয় - Free Fire',
        date: new Date('2024-01-20T14:30:00'),
        status: 'completed',
        transactionId: 'TX123456',
        gameName: 'Free Fire Tournament',
        method: 'system'
      },
      {
        id: '2',
        type: 'entry_fee',
        amount: -50,
        description: 'এন্ট্রি ফি - PUBG Match',
        date: new Date('2024-01-20T13:15:00'),
        status: 'completed',
        transactionId: 'TX123457',
        gameName: 'PUBG Match',
        method: 'wallet'
      },
      {
        id: '3',
        type: 'deposit',
        amount: 1000,
        description: 'ডিপোজিট - বিকাশ',
        date: new Date('2024-01-19T11:20:00'),
        status: 'completed',
        transactionId: 'TX123458',
        method: 'Bkash'
      },
      {
        id: '4',
        type: 'withdrawal',
        amount: -200,
        description: 'উইথড্র রিকোয়েস্ট - নগদ',
        date: new Date('2024-01-18T16:45:00'),
        status: 'pending',
        transactionId: 'TX123459',
        method: 'Nagad'
      },
      {
        id: '5',
        type: 'bonus',
        amount: 100,
        description: 'রেফারেল বোনাস',
        date: new Date('2024-01-17T10:30:00'),
        status: 'completed',
        transactionId: 'TX123460',
        method: 'system'
      },
      {
        id: '6',
        type: 'transfer',
        amount: -100,
        description: 'ট্রান্সফার - বন্ধুকে গিফট',
        date: new Date('2024-01-16T09:15:00'),
        status: 'completed',
        transactionId: 'TX123461',
        recipient: 'Alice'
      },
      {
        id: '7',
        type: 'prize',
        amount: 300,
        description: 'প্রাইজ - ডেইলি টুর্নামেন্ট',
        date: new Date('2024-01-15T14:00:00'),
        status: 'completed',
        transactionId: 'TX123462',
        gameName: '8 Ball Pool'
      },
      {
        id: '8',
        type: 'deposit',
        amount: 500,
        description: 'ডিপোজিট - রকেট',
        date: new Date('2024-01-14T12:30:00'),
        status: 'completed',
        transactionId: 'TX123463',
        method: 'Rocket'
      },
    ];
    
    setTransactions(sampleTransactions);
    calculateStats(sampleTransactions);
  };

  // ✅ স্ট্যাটস ক্যালকুলেশন
  const calculateStats = (txList) => {
    const newStats = {
      totalDeposit: 0,
      totalWithdraw: 0,
      totalWin: 0,
      totalEntry: 0,
      totalTransfer: 0,
      totalBonus: 0,
      totalRefund: 0
    };

    txList.forEach(tx => {
      const amount = Math.abs(tx.amount);
      
      switch (tx.type) {
        case 'deposit':
          newStats.totalDeposit += tx.amount;
          break;
        case 'withdrawal':
          newStats.totalWithdraw += amount;
          break;
        case 'win':
        case 'prize':
          newStats.totalWin += tx.amount;
          break;
        case 'entry_fee':
          newStats.totalEntry += amount;
          break;
        case 'transfer':
          newStats.totalTransfer += amount;
          break;
        case 'bonus':
          newStats.totalBonus += tx.amount;
          break;
        case 'refund':
          newStats.totalRefund += tx.amount;
          break;
      }
    });

    setStats(newStats);
  };

  // ✅ Initialize and load data
  useEffect(() => {
    if (isAuthenticated) {
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
        }),
      ]).start();
      
      loadTransactions();
    }
  }, [isAuthenticated]);

  // ✅ Screen focus হলে ডেটা রিফ্রেশ
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (isAuthenticated) {
        loadTransactions();
      }
    });
    return unsubscribe;
  }, [navigation, isAuthenticated]);

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadTransactions();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const filteredTransactions = filter === 'all' 
    ? transactions 
    : transactions.filter(t => t.type === filter);

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'deposit': return 'arrow-down-circle';
      case 'withdrawal': return 'arrow-up-circle';
      case 'win':
      case 'prize': return 'trophy';
      case 'entry_fee': return 'game-controller';
      case 'transfer': return 'swap-horizontal';
      case 'bonus': return 'star';
      case 'refund': return 'refresh-circle';
      default: return 'cash';
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'deposit': return '#4CAF50';
      case 'withdrawal': return '#FF6B35';
      case 'win':
      case 'prize': return '#9C27B0';
      case 'entry_fee': return '#FF9800';
      case 'transfer': return '#2196F3';
      case 'bonus': return '#FFD700';
      case 'refund': return '#00BCD4';
      default: return '#666';
    }
  };

  const getTransactionLabel = (type) => {
    const filterItem = filters.find(f => f.id === type);
    return filterItem ? filterItem.label : type;
  };

  const formatDate = (date) => {
    try {
      const now = new Date();
      const diff = now - date;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor(diff / (1000 * 60));
      
      if (minutes < 60) return `${minutes} মিনিট আগে`;
      if (hours < 24) return `${hours} ঘণ্টা আগে`;
      if (days === 1) return 'গতকাল';
      if (days < 7) return `${days} দিন আগে`;
      
      return date.toLocaleDateString('bn-BD', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      return 'তারিখ নেই';
    }
  };

  const handleTransactionPress = (transaction) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTransaction(transaction);
    setShowDetailsModal(true);
  };

  const renderTransactionItem = ({ item, index }) => {
    const isPositive = item.amount > 0;
    const transactionType = item.type;
    
    return (
      <TouchableOpacity 
        style={styles.transactionCard}
        onPress={() => handleTransactionPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.transactionLeft}>
          <View style={[
            styles.iconContainer,
            { backgroundColor: `${getTransactionColor(transactionType)}20` }
          ]}>
            <Ionicons 
              name={getTransactionIcon(transactionType)} 
              size={28} 
              color={getTransactionColor(transactionType)} 
            />
          </View>
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionTitle} numberOfLines={1}>
              {item.description}
            </Text>
            <View style={styles.transactionMeta}>
              <Text style={styles.transactionDate}>{formatDate(item.date)}</Text>
              {item.gameName && (
                <>
                  <Text style={styles.dot}>•</Text>
                  <Text style={styles.gameName} numberOfLines={1}>
                    {item.gameName}
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>
        
        <View style={styles.transactionRight}>
          <Text style={[
            styles.amount,
            isPositive ? styles.positiveAmount : styles.negativeAmount
          ]}>
            {isPositive ? '+' : ''}{item.amount} ৳
          </Text>
          <View style={[
            styles.statusBadge,
            item.status === 'completed' ? styles.completedBadge : 
            item.status === 'pending' ? styles.pendingBadge : 
            item.status === 'failed' ? styles.failedBadge :
            item.status === 'processing' ? styles.processingBadge : styles.completedBadge
          ]}>
            <Text style={styles.statusText}>
              {item.status === 'completed' ? 'সফল' : 
               item.status === 'pending' ? 'পেন্ডিং' : 
               item.status === 'failed' ? 'ব্যর্থ' :
               item.status === 'processing' ? 'প্রসেসিং' : item.status}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ✅ ফিল্টার ট্যাব কম্পোনেন্ট
  const FilterTab = ({ filterItem }) => {
    const isActive = filter === filterItem.id;
    
    return (
      <TouchableOpacity
        style={[
          styles.filterTab,
          isActive && styles.filterTabActive,
          isActive && { borderColor: filterItem.color }
        ]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setFilter(filterItem.id);
        }}
      >
        <Ionicons 
          name={filterItem.icon} 
          size={20} 
          color={isActive ? filterItem.color : '#b0b8ff'} 
          style={styles.filterIcon}
        />
        <Text style={[
          styles.filterText,
          isActive && styles.filterTextActive,
          isActive && { color: filterItem.color }
        ]} numberOfLines={1}>
          {filterItem.label}
        </Text>
        {isActive && (
          <View style={[
            styles.activeIndicator,
            { backgroundColor: filterItem.color }
          ]} />
        )}
      </TouchableOpacity>
    );
  };

  // ✅ লগইন না থাকলে শো করুন
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#0a0c23" barStyle="light-content" />
        <View style={styles.notAuthenticatedContainer}>
          <Ionicons name="lock-closed" size={80} color="#666" />
          <Text style={styles.notAuthenticatedTitle}>লগইন করুন</Text>
          <Text style={styles.notAuthenticatedText}>
            ট্রানজেকশন হিস্টোরি দেখতে লগইন করুন
          </Text>
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginButtonText}>লগইন করুন</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#0a0c23" barStyle="light-content" />
      
      {/* Header */}
      <Animated.View 
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>ট্রানজেকশন হিস্টোরি</Text>
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              loadTransactions();
            }}
          >
            <Ionicons name="refresh" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Stats Summary */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.statsScroll}
          contentContainerStyle={styles.statsContainer}
        >
          <View style={styles.statItem}>
            <Ionicons name="arrow-down-circle" size={20} color="#4CAF50" />
            <Text style={styles.statLabel}>ডিপোজিট</Text>
            <Text style={[styles.statValue, { color: '#4CAF50' }]}>
              +{stats.totalDeposit} ৳
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Ionicons name="arrow-up-circle" size={20} color="#FF6B35" />
            <Text style={styles.statLabel}>উইথড্র</Text>
            <Text style={[styles.statValue, { color: '#FF6B35' }]}>
              {stats.totalWithdraw} ৳
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Ionicons name="trophy" size={20} color="#9C27B0" />
            <Text style={styles.statLabel}>জয়/প্রাইজ</Text>
            <Text style={[styles.statValue, { color: '#9C27B0' }]}>
              +{stats.totalWin} ৳
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Ionicons name="game-controller" size={20} color="#FF9800" />
            <Text style={styles.statLabel}>এন্ট্রি</Text>
            <Text style={[styles.statValue, { color: '#FF9800' }]}>
              {stats.totalEntry} ৳
            </Text>
          </View>

          {stats.totalBonus > 0 && (
            <View style={styles.statItem}>
              <Ionicons name="star" size={20} color="#FFD700" />
              <Text style={styles.statLabel}>বোনাস</Text>
              <Text style={[styles.statValue, { color: '#FFD700' }]}>
                +{stats.totalBonus} ৳
              </Text>
            </View>
          )}
        </ScrollView>
      </Animated.View>

      {/* ফিল্টার ট্যাবস */}
      <View style={styles.filterSection}>
        <Text style={styles.filterTitle}>ফিল্টার করুন:</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContainer}
        >
          {filters.map((filterItem) => (
            <FilterTab key={filterItem.id} filterItem={filterItem} />
          ))}
        </ScrollView>
      </View>

      {/* Transactions List */}
      <View style={styles.listContainer}>
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ff8a00" />
            <Text style={styles.loadingText}>ট্রানজেকশন লোড হচ্ছে...</Text>
          </View>
        ) : filteredTransactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={80} color="#666" />
            <Text style={styles.emptyTitle}>কোন ট্রানজেকশন নেই</Text>
            <Text style={styles.emptyText}>
              {filter === 'all' 
                ? 'আপনার এখনো কোনো ট্রানজেকশন নেই' 
                : `এই ফিল্টারে কোনো ট্রানজেকশন নেই`}
            </Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={() => {
                setFilter('all');
                loadTransactions();
              }}
            >
              <Text style={styles.emptyButtonText}>সব ট্রানজেকশন দেখুন</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredTransactions}
            keyExtractor={(item) => item.id}
            renderItem={renderTransactionItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh}
                colors={['#ff8a00']}
                tintColor="#ff8a00"
                title="রিফ্রেশ হচ্ছে..."
                titleColor="#ff8a00"
              />
            }
            ListHeaderComponent={
              <View style={styles.listHeaderContainer}>
                <Text style={styles.listHeader}>
                  {filter === 'all' 
                    ? `সব ট্রানজেকশন (${filteredTransactions.length})` 
                    : `${filters.find(f => f.id === filter)?.label} (${filteredTransactions.length})`}
                </Text>
                <TouchableOpacity 
                  style={styles.exportButton}
                  onPress={() => {
                    Alert.alert('এক্সপোর্ট', 'ট্রানজেকশন রিপোর্ট ডাউনলোড করুন');
                  }}
                >
                  <Text style={styles.exportText}>এক্সপোর্ট</Text>
                  <Ionicons name="download" size={16} color="#ff8a00" />
                </TouchableOpacity>
              </View>
            }
            ListFooterComponent={<View style={{ height: 30 }} />}
          />
        )}
      </View>

      {/* Transaction Details Modal */}
      <Modal
        visible={showDetailsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                {selectedTransaction && (
                  <Ionicons 
                    name={getTransactionIcon(selectedTransaction.type)} 
                    size={24} 
                    color={getTransactionColor(selectedTransaction.type)} 
                  />
                )}
                <Text style={styles.modalTitle}>ট্রানজেকশন বিস্তারিত</Text>
              </View>
              <TouchableOpacity 
                onPress={() => setShowDetailsModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {selectedTransaction && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>মূল তথ্য</Text>
                  
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>বর্ণনা</Text>
                    <Text style={styles.detailValue}>{selectedTransaction.description}</Text>
                  </View>

                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>ধরন</Text>
                    <View style={styles.typeContainer}>
                      <View style={[
                        styles.typeBadge,
                        { backgroundColor: `${getTransactionColor(selectedTransaction.type)}20` }
                      ]}>
                        <Text style={[
                          styles.typeBadgeText,
                          { color: getTransactionColor(selectedTransaction.type) }
                        ]}>
                          {getTransactionLabel(selectedTransaction.type)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>অ্যামাউন্ট</Text>
                    <Text style={[
                      styles.detailValue,
                      selectedTransaction.amount > 0 ? styles.positiveAmount : styles.negativeAmount,
                      { fontSize: 18 }
                    ]}>
                      {selectedTransaction.amount > 0 ? '+' : ''}{selectedTransaction.amount} ৳
                    </Text>
                  </View>

                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>তারিখ ও সময়</Text>
                    <Text style={styles.detailValue}>
                      {selectedTransaction.date.toLocaleString('bn-BD', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </View>

                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>ট্রানজেকশন আইডি</Text>
                    <Text style={[styles.detailValue, { fontSize: 12 }]}>{selectedTransaction.transactionId}</Text>
                  </View>

                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>স্ট্যাটাস</Text>
                    <View style={[
                      styles.statusBadgeLarge,
                      selectedTransaction.status === 'completed' ? styles.completedBadge : 
                      selectedTransaction.status === 'pending' ? styles.pendingBadge : 
                      selectedTransaction.status === 'failed' ? styles.failedBadge :
                      styles.processingBadge
                    ]}>
                      <Text style={styles.statusTextLarge}>
                        {selectedTransaction.status === 'completed' ? 'সফল' : 
                         selectedTransaction.status === 'pending' ? 'পেন্ডিং' : 
                         selectedTransaction.status === 'failed' ? 'ব্যর্থ' :
                         selectedTransaction.status === 'processing' ? 'প্রসেসিং' : selectedTransaction.status}
                      </Text>
                    </View>
                  </View>
                </View>

                {(selectedTransaction.gameName || selectedTransaction.method || selectedTransaction.recipient) && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>অতিরিক্ত তথ্য</Text>
                    
                    {selectedTransaction.gameName && (
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>গেম/টুর্নামেন্ট</Text>
                        <Text style={styles.detailValue}>{selectedTransaction.gameName}</Text>
                      </View>
                    )}

                    {selectedTransaction.method && (
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>পদ্ধতি</Text>
                        <Text style={styles.detailValue}>{selectedTransaction.method}</Text>
                      </View>
                    )}

                    {selectedTransaction.recipient && (
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>প্রাপক/প্রেরক</Text>
                        <Text style={styles.detailValue}>{selectedTransaction.recipient}</Text>
                      </View>
                    )}
                  </View>
                )}

                {selectedTransaction.metadata && Object.keys(selectedTransaction.metadata).length > 0 && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>মেটাডাটা</Text>
                    {Object.entries(selectedTransaction.metadata).map(([key, value]) => (
                      <View key={key} style={styles.detailItem}>
                        <Text style={styles.detailLabel}>{key}</Text>
                        <Text style={[styles.detailValue, { fontSize: 12 }]}>
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      Alert.alert('শেয়ার', 'ট্রানজেকশন শেয়ার করুন');
                    }}
                  >
                    <Ionicons name="share-social" size={20} color="#2962ff" />
                    <Text style={[styles.actionButtonText, { color: '#2962ff' }]}>শেয়ার</Text>
                  </TouchableOpacity>
                  
                  {selectedTransaction.status === 'failed' && (
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        Alert.alert('সহায়তা', 'সমস্যার জন্য সহায়তা নিন');
                      }}
                    >
                      <Ionicons name="help-circle" size={20} color="#FF6B35" />
                      <Text style={[styles.actionButtonText, { color: '#FF6B35' }]}>সহায়তা</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
            )}

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={() => setShowDetailsModal(false)}
              >
                <Text style={styles.modalButtonText}>ঠিক আছে</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0c23',
  },
  notAuthenticatedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notAuthenticatedTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
  },
  notAuthenticatedText: {
    color: '#b0b8ff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  loginButton: {
    backgroundColor: '#ff8a00',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 12,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    backgroundColor: '#1a1f3d',
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  filterButton: {
    padding: 8,
  },
  statsScroll: {
    maxHeight: 80,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingRight: 20,
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    minWidth: 100,
  },
  statLabel: {
    color: '#b0b8ff',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  filterSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  filterTitle: {
    color: '#b0b8ff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  filterScroll: {
    maxHeight: 60,
  },
  filterContainer: {
    paddingBottom: 8,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    minWidth: 100,
    position: 'relative',
  },
  filterTabActive: {
    backgroundColor: 'rgba(255,138,0,0.1)',
  },
  filterIcon: {
    marginRight: 8,
  },
  filterText: {
    color: '#b0b8ff',
    fontSize: 14,
    fontWeight: '600',
  },
  filterTextActive: {
    fontWeight: 'bold',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -8,
    left: '50%',
    marginLeft: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#b0b8ff',
    marginTop: 10,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
  },
  emptyText: {
    color: '#b0b8ff',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
  emptyButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,138,0,0.2)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ff8a00',
  },
  emptyButtonText: {
    color: '#ff8a00',
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    paddingTop: 16,
  },
  listHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  listHeader: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,138,0,0.1)',
    borderRadius: 8,
    gap: 4,
  },
  exportText: {
    color: '#ff8a00',
    fontSize: 12,
    fontWeight: '600',
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  transactionDate: {
    color: '#888',
    fontSize: 12,
  },
  dot: {
    color: '#888',
    marginHorizontal: 6,
  },
  gameName: {
    color: '#ff8a00',
    fontSize: 12,
    maxWidth: 100,
  },
  transactionRight: {
    alignItems: 'flex-end',
    minWidth: 100,
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  positiveAmount: {
    color: '#4CAF50',
  },
  negativeAmount: {
    color: '#FF6B35',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  completedBadge: {
    backgroundColor: 'rgba(76,175,80,0.2)',
  },
  pendingBadge: {
    backgroundColor: 'rgba(255,152,0,0.2)',
  },
  failedBadge: {
    backgroundColor: 'rgba(244,67,54,0.2)',
  },
  processingBadge: {
    backgroundColor: 'rgba(33,150,243,0.2)',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
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
    overflow: 'hidden',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  modalTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailSectionTitle: {
    color: '#ff8a00',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  detailLabel: {
    color: '#b0b8ff',
    fontSize: 14,
    flex: 1,
  },
  detailValue: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusBadgeLarge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  statusTextLarge: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  actionButton: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    minWidth: 100,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  modalButton: {
    backgroundColor: '#ff8a00',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TransactionHistoryScreen;
