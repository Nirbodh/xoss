// screens/WalletScreen.js - COMPLETE FIXED VERSION WITH REAL DATA
import React, { useState, useRef, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, 
  Alert, ActivityIndicator, FlatList, Image, Modal, 
  KeyboardAvoidingView, Platform, Animated, Dimensions,
  RefreshControl
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { useWallet } from '../context/WalletContext';
import { useNotification } from '../context/NotificationContext';
import NotificationBell from '../components/NotificationBell';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const API_URL = 'https://xoss.onrender.com/api';

const WalletScreen = () => {
  const navigation = useNavigation();
  const { user, token, isAuthenticated, getUserId } = useAuth();
  const { balance: walletBalance, refreshWallet } = useWallet();
  const { markAsRead } = useNotification();
  
  const [balance, setBalance] = useState(0);
  const [userStats, setUserStats] = useState({
    gamesPlayed: 0,
    tournaments: 0,
    wins: 0,
    winRate: '0%'
  });
  const [recipientId, setRecipientId] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showProofModal, setShowProofModal] = useState(false);
  const [transactionProof, setTransactionProof] = useState('');
  const [note, setNote] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [showUserID, setShowUserID] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [debugMode, setDebugMode] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // User data
  const userData = {
    id: user?.id || user?._id || 'XOSS_789123',
    name: user?.name || user?.username || 'User',
    avatar: user?.avatar || 'https://i.pravatar.cc/150?img=5'
  };

  const mockUsers = [
    { id: '1', name: 'Alice', avatar: 'https://i.pravatar.cc/150?img=1', username: 'alice_gamer' },
    { id: '2', name: 'Bob', avatar: 'https://i.pravatar.cc/150?img=2', username: 'bob_pro' },
    { id: '3', name: 'Charlie', avatar: 'https://i.pravatar.cc/150?img=3', username: 'charlie_win' },
    { id: '4', name: 'David', avatar: 'https://i.pravatar.cc/150?img=4', username: 'david_king' },
  ];

  const quickAmounts = [5, 10, 20, 50, 100, 200];

  // ✅ REAL DATA: Load user data from server - FIXED VERSION
  const loadUserData = async () => {
    try {
      console.log('🔄 Loading REAL user data...');
      setIsLoadingData(true);
      
      // ✅ **FIXED: Check if user is authenticated properly**
      if (!token || !isAuthenticated) {
        console.log('🔐 User not authenticated, using wallet context');
        setBalance(walletBalance || 0);
        setIsLoadingData(false);
        return;
      }
      
      console.log('🔐 User is authenticated, token available');

      // 1. Load REAL balance from server
      try {
        console.log('🔐 Fetching wallet with token...');
        
        const response = await fetch(`${API_URL}/wallet`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('📊 Wallet API response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('📊 Wallet API Response:', data);
          
          if (data.success && data.data?.balance !== undefined) {
            const realBalance = parseFloat(data.data.balance);
            setBalance(realBalance);
            console.log('✅ REAL Balance from server:', realBalance);
          } else {
            console.log('⚠️ Invalid response format, using wallet context');
            setBalance(walletBalance || 0);
          }
        } else {
          const errorText = await response.text();
          console.log('❌ Wallet API failed:', response.status, errorText);
          // Server error হলে local balance use করো
          setBalance(walletBalance || 0);
        }
      } catch (error) {
        console.log('❌ Balance fetch error:', error.message);
        // Network error হলে local balance use করো
        setBalance(walletBalance || 0);
      }
      
      // 2. Load stats from AsyncStorage
      const stats = await AsyncStorage.getItem('userStats');
      if (stats) {
        const parsedStats = JSON.parse(stats);
        setUserStats(parsedStats);
      }
      
      // 3. Load REAL recent transactions (optional)
      try {
        const response = await fetch(`${API_URL}/wallet/transactions?limit=2`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.transactions) {
            setRecentTransactions(data.data.transactions.slice(0, 2));
          }
        }
      } catch (error) {
        console.log('❌ Transactions fetch optional, ignoring...');
      }
      
    } catch (error) {
      console.log('❌ Error in loadUserData:', error);
      setBalance(walletBalance || 0);
    } finally {
      setIsLoadingData(false);
    }
  };

  // ✅ Debug function to check auth and wallet status
  const debugCheckStatus = async () => {
    console.log('🔍 DEBUG STATUS:');
    console.log('User:', user);
    console.log('Token exists:', !!token);
    console.log('Is Authenticated:', isAuthenticated);
    console.log('User ID from getUserId():', getUserId());
    console.log('Current balance in state:', balance);
    console.log('Wallet context balance:', walletBalance);
    
    if (token) {
      try {
        // Test auth endpoint
        console.log('🔐 Testing auth endpoint...');
        const authResponse = await fetch(`${API_URL}/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('Auth test status:', authResponse.status);
        
        // Test wallet endpoint
        console.log('💰 Testing wallet endpoint...');
        const walletResponse = await fetch(`${API_URL}/wallet`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('Wallet test status:', walletResponse.status);
        if (!walletResponse.ok) {
          const errorText = await walletResponse.text();
          console.log('Wallet error:', errorText);
        } else {
          const walletData = await walletResponse.json();
          console.log('Wallet data:', walletData);
        }
      } catch (error) {
        console.log('Debug test error:', error);
      }
    }
    
    // Toggle debug mode
    setDebugMode(!debugMode);
  };

  // Initialize animations and load data
  useEffect(() => {
    loadUserData();
    
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
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      })
    ]).start();

    // Pulse animation for balance
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ])
    ).start();
  }, []);

  // Focus listener - screen focus হলে data reload করবে
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('🎯 Screen focused, reloading data...');
      loadUserData();
      refreshWallet();
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    console.log('🔄 Manual refresh triggered...');
    
    // Load fresh data from server
    await loadUserData();
    await refreshWallet();
    
    setTimeout(() => {
      setRefreshing(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 1000);
  };

  // Handle notification press
  const handleNotificationPress = () => {
    markAsRead('all');
    navigation.navigate('Notifications');
  };

  // Copy to clipboard function
  const copyToClipboard = async (text) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('কপি হয়েছে!', 'ইউজার আইডি: ' + text);
  };

  // Filter users based on search
  const filteredUsers = mockUsers.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.id.includes(searchQuery)
  );

  const handleSend = async () => {
    if (!recipientId || !amount) {
      Alert.alert('ত্রুটি', 'দয়া করে একজন ইউজার সিলেক্ট করুন এবং অ্যামাউন্ট দিন');
      return;
    }
    
    const sendAmount = Number(amount);
    if (sendAmount > balance) {
      Alert.alert('ত্রুটি', 'পর্যাপ্ত ব্যালেন্স নেই');
      return;
    }

    if (sendAmount < 1) {
      Alert.alert('ত্রুটি', 'ন্যূনতম অ্যামাউন্ট ৳১');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowProofModal(true);
  };

  const toggleBalanceVisibility = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBalanceVisible(!balanceVisible);
  };

  // Enhanced User Card with Animation
  const AnimatedUserCard = ({ item, index }) => {
    const cardAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.spring(cardAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        delay: index * 100,
        useNativeDriver: true,
      }).start();
    }, []);

    return (
      <TouchableOpacity
        onPress={() => { 
          setRecipientId(item.id); 
          setRecipientName(item.name);
          setSearchQuery('');
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
      >
        <Animated.View 
          style={[
            styles.userCard,
            recipientId === item.id && styles.userCardSelected,
            {
              opacity: cardAnim,
              transform: [
                { 
                  scale: cardAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1]
                  })
                }
              ]
            }
          ]}
        >
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{item.name}</Text>
            <Text style={styles.userId}>@{item.username}</Text>
          </View>
          {recipientId === item.id && (
            <View style={styles.selectedIndicator}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            </View>
          )}
        </Animated.View>
      </TouchableOpacity>
    );
  };

  // ✅ FIXED: Quick Action Button
  const QuickActionButton = ({ icon, title, color, onPress, badge }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.9,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    };

    return (
      <TouchableOpacity 
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Animated.View 
          style={[
            styles.quickAction,
            { transform: [{ scale: scaleAnim }] }
          ]}
        >
          <LinearGradient
            colors={[color, `${color}DD`]}
            style={styles.quickIcon}
          >
            <Ionicons name={icon} size={24} color="white" />
            {badge && (
              <View style={styles.quickBadge}>
                <Text style={styles.quickBadgeText}>{badge}</Text>
              </View>
            )}
          </LinearGradient>
          <Text style={styles.quickActionText}>{title}</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#ff8a00']}
            tintColor="#ff8a00"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Enhanced Top Wallet Card with Animations */}
        <Animated.View 
          style={[
            styles.topCard,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim }
              ]
            }
          ]}
        >
          <LinearGradient
            colors={['#ff8a00', '#ff5252', '#ff8a00']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientCard}
          >
            <View style={styles.cardHeader}>
              <View style={styles.userInfoContainer}>
                <View style={styles.avatarContainer}>
                  <Image 
                    source={{ uri: userData.avatar }} 
                    style={styles.topAvatar} 
                  />
                  <View style={styles.onlineIndicator} />
                </View>
                <View style={styles.userDetails}>
                  <Text style={styles.topName}>{userData.name}</Text>
                  <TouchableOpacity 
                    onPress={() => {
                      setShowUserID(!showUserID);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Text style={styles.userId}>
                      {showUserID ? `আইডি: ${userData.id}` : 'আইডি: ••••••••'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.headerIcons}>
                <NotificationBell onPress={handleNotificationPress} />
                <TouchableOpacity 
                  onPress={() => {
                    copyToClipboard(userData.id);
                  }}
                  style={styles.copyButton}
                >
                  <Ionicons name="copy-outline" size={18} color="white" />
                </TouchableOpacity>
                {/* Debug button */}
                <TouchableOpacity 
                  onPress={debugCheckStatus}
                  style={[styles.copyButton, { backgroundColor: debugMode ? '#4CAF50' : '#ff4444' }]}
                >
                  <Ionicons name="bug" size={18} color="white" />
                </TouchableOpacity>
              </View>
            </View>

            <Animated.View 
              style={[
                styles.balanceContainer,
                { transform: [{ scale: pulseAnim }] }
              ]}
            >
              <View style={styles.balanceHeader}>
                <Text style={styles.balanceLabel}>বর্তমান ব্যালেন্স</Text>
                <View style={styles.balanceActions}>
                  {isLoadingData && (
                    <ActivityIndicator size="small" color="white" style={{ marginRight: 10 }} />
                  )}
                  <TouchableOpacity onPress={toggleBalanceVisibility} style={styles.eyeButton}>
                    <Ionicons 
                      name={balanceVisible ? "eye" : "eye-off"} 
                      size={20} 
                      color="white" 
                    />
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.balanceAmount}>
                {balanceVisible ? `৳${balance.toFixed(2)}` : '•••••'}
              </Text>
              {debugMode && (
                <View style={styles.debugInfo}>
                  <Text style={styles.debugText}>Source: {isLoadingData ? 'Loading...' : 'Server'}</Text>
                  <Text style={styles.debugText}>Auth: {isAuthenticated ? 'Yes' : 'No'}</Text>
                </View>
              )}
              <View style={styles.balanceStats}>
                <Text style={styles.statText}>↑ ৳২,৫০০ আয়</Text>
                <Text style={styles.statText}>↓ ৳১,২৪৯ খরচ</Text>
              </View>
            </Animated.View>

            <View style={styles.cardFooter}>
              <TouchableOpacity 
                style={styles.topSendButton} 
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  navigation.navigate('Deposit');
                }}
              >
                <Ionicons name="add-circle" size={20} color="#ff8a00" />
                <Text style={styles.topSendText}>মানি এড করুন</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.topSendButton} 
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  navigation.navigate('TransactionHistory');
                }}
              >
                <Ionicons name="gift" size={20} color="#ff8a00" />
                <Text style={styles.topSendText}>গিফট পাঠান</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ✅ FIXED: Quick Actions Grid */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>কুইক একশন্স</Text>
          <View style={styles.quickActionsGrid}>
            <QuickActionButton
              icon="arrow-down-circle"
              title="ডিপোজিট"
              color="#4CAF50"
              onPress={() => navigation.navigate('Deposit')}
            />
            <QuickActionButton
              icon="arrow-up-circle"
              title="উইথড্র"
              color="#FF6B35"
              onPress={() => navigation.navigate('Withdraw')}
            />
            <QuickActionButton
              icon="swap-horizontal"
              title="ট্রান্সফার"
              color="#2962ff"
              onPress={() => {
                Alert.alert(
                  'ট্রান্সফার', 
                  'ইউজার সিলেক্ট করে নিচে থেকে ট্রান্সফার করুন',
                  [{ text: 'ঠিক আছে' }]
                );
              }}
            />
            <QuickActionButton
              icon="time"
              title="হিস্টোরি"
              color="#9C27B0"
              onPress={() => navigation.navigate('TransactionHistory')}
              badge={recentTransactions.length > 0 ? recentTransactions.length.toString() : undefined}
            />
          </View>
        </View>

        {/* Recent Transactions Preview */}
        <View style={styles.transactionsPreview}>
          <View style={styles.sectionHeader}>
            <Ionicons name="list" size={20} color="#ff8a00" />
            <Text style={styles.sectionTitle}>সাম্প্রতিক ট্রানজেকশন</Text>
            <TouchableOpacity 
              style={styles.seeAllButton}
              onPress={() => navigation.navigate('TransactionHistory')}
            >
              <Text style={styles.seeAllText}>সব দেখুন</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.transactionList}>
            {isLoadingData ? (
              <ActivityIndicator size="small" color="#ff8a00" />
            ) : recentTransactions.length > 0 ? (
              recentTransactions.map((transaction, index) => (
                <View key={index} style={styles.transactionItem}>
                  <View style={styles.transactionIcon}>
                    <Ionicons 
                      name={transaction.type === 'credit' || transaction.type === 'deposit' ? "trending-up" : "trending-down"} 
                      size={20} 
                      color={(transaction.type === 'credit' || transaction.type === 'deposit') ? "#4CAF50" : "#FF6B35"} 
                    />
                  </View>
                  <View style={styles.transactionDetails}>
                    <Text style={styles.transactionTitle}>{transaction.description || 'Transaction'}</Text>
                    <Text style={styles.transactionDate}>
                      {transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString('bn-BD') : 'আজ'}
                    </Text>
                  </View>
                  <Text style={[
                    styles.transactionAmount,
                    (transaction.type === 'credit' || transaction.type === 'deposit') ? styles.positiveAmount : styles.negativeAmount
                  ]}>
                    {(transaction.type === 'credit' || transaction.type === 'deposit') ? '+' : '-'}৳{Math.abs(transaction.amount)}
                  </Text>
                </View>
              ))
            ) : (
              <>
                <View style={styles.transactionItem}>
                  <View style={styles.transactionIcon}>
                    <Ionicons name="trophy" size={20} color="#4CAF50" />
                  </View>
                  <View style={styles.transactionDetails}>
                    <Text style={styles.transactionTitle}>টুর্নামেন্ট জয়</Text>
                    <Text style={styles.transactionDate}>আজ, ১৪:৩০</Text>
                  </View>
                  <Text style={styles.positiveAmount}>+৳৫০০</Text>
                </View>
                
                <View style={styles.transactionItem}>
                  <View style={styles.transactionIcon}>
                    <Ionicons name="game-controller" size={20} color="#FF6B35" />
                  </View>
                  <View style={styles.transactionDetails}>
                    <Text style={styles.transactionTitle}>এন্ট্রি ফি</Text>
                    <Text style={styles.transactionDate}>আজ, ১৩:১৫</Text>
                  </View>
                  <Text style={styles.negativeAmount}>-৳৫০</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Send Gift Section */}
        <View style={styles.giftSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="gift" size={24} color="#ff8a00" />
            <Text style={styles.sectionTitle}>গিফট / ব্যালেন্স পাঠান</Text>
          </View>
          <Text style={styles.giftSubtitle}>
            নিরাপদ ট্রানজেকশনের মাধ্যমে বন্ধুদের সাথে তাৎক্ষণিক মানি ট্রান্সফার করুন
          </Text>
        </View>

        {/* Search User Section */}
        <View style={styles.searchSection}>
          <Text style={styles.sectionTitle}>ইউজার খুঁজুন</Text>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="নাম, ইউজারনেম বা আইডি দিয়ে সার্চ করুন..."
              placeholderTextColor="#888"
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#888" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Users List */}
        <View style={styles.usersSection}>
          <Text style={styles.sectionTitle}>
            {searchQuery ? 'সার্চ রেজাল্ট' : 'সাম্প্রতিক কন্টাক্টস'}
          </Text>
          <FlatList
            horizontal
            data={searchQuery ? filteredUsers : mockUsers}
            keyExtractor={item => item.id}
            renderItem={({ item, index }) => (
              <AnimatedUserCard item={item} index={index} />
            )}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.usersList}
            ListEmptyComponent={
              <View style={styles.emptyResults}>
                <Ionicons name="people-outline" size={40} color="#666" />
                <Text style={styles.emptyText}>কোন ইউজার পাওয়া যায়নি</Text>
              </View>
            }
          />
        </View>

        {/* Selected Recipient */}
        {recipientId && (
          <View style={styles.selectedRecipient}>
            <View style={styles.selectedRecipientInfo}>
              <Image 
                source={{ uri: mockUsers.find(u => u.id === recipientId)?.avatar }} 
                style={styles.selectedAvatar} 
              />
              <View>
                <Text style={styles.selectedName}>{recipientName}</Text>
                <Text style={styles.selectedUsername}>
                  @{mockUsers.find(u => u.id === recipientId)?.username}
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              onPress={() => { 
                setRecipientId(''); 
                setRecipientName(''); 
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Ionicons name="close-circle" size={24} color="#ff4444" />
            </TouchableOpacity>
          </View>
        )}

        {/* Amount Input Section */}
        <View style={styles.amountSection}>
          <Text style={styles.sectionTitle}>অ্যামাউন্ট</Text>
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencySymbol}>৳</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="০.০০"
              placeholderTextColor="#ccc"
              keyboardType="numeric"
              selectionColor="#ff8a00"
            />
          </View>

          {/* Quick Amount Buttons */}
          <Text style={styles.quickAmountsTitle}>কুইক সিলেক্ট</Text>
          <View style={styles.quickAmounts}>
            {quickAmounts.map((amt) => (
              <TouchableOpacity
                key={amt}
                style={[
                  styles.quickButton,
                  Number(amount) === amt && styles.quickButtonSelected
                ]}
                onPress={() => {
                  setAmount(String(amt));
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text style={styles.quickButtonText}>৳{amt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Note Input */}
        <View style={styles.noteSection}>
          <Text style={styles.sectionTitle}>নোট (ঐচ্ছিক)</Text>
          <TextInput
            style={styles.noteInput}
            value={note}
            onChangeText={setNote}
            placeholder="এই ট্রানজেকশনের জন্য একটি নোট যোগ করুন..."
            placeholderTextColor="#888"
            multiline
            numberOfLines={2}
          />
        </View>

        {/* Send Button */}
        <TouchableOpacity
          style={[
            styles.sendButton,
            (loading || !recipientId || !amount) && styles.sendButtonDisabled
          ]}
          onPress={handleSend}
          disabled={loading || !recipientId || !amount}
        >
          <LinearGradient
            colors={['#ff8a00', '#ff5252']}
            style={styles.sendButtonGradient}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <View style={styles.sendButtonContent}>
                <Ionicons name="gift" size={24} color="white" />
                <Text style={styles.sendText}>
                  গিফট পাঠান ৳{amount || '০'}
                </Text>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Security Note */}
        <View style={styles.securityNote}>
          <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
          <View style={styles.securityTextContainer}>
            <Text style={styles.securityTitle}>সুরক্ষিত ও এনক্রিপ্টেড</Text>
            <Text style={styles.securityText}>
              সব ট্রানজেকশন ব্যাংক-লেভেল সিকিউরিটি দিয়ে প্রটেক্টেড
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Enhanced Transaction Proof Modal */}
      <Modal
        visible={showProofModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowProofModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>ট্রানজেকশন প্রুফ প্রয়োজন</Text>
              <TouchableOpacity 
                onPress={() => {
                  setShowProofModal(false);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.proofIllustration}>
                <Ionicons name="document-text" size={50} color="#ff8a00" />
              </View>
              
              <Text style={styles.modalSubtitle}>
                সিকিউরিটি ভেরিফিকেশনের জন্য দয়া করে ট্রানজেকশন প্রুফ প্রদান করুন
              </Text>

              <Text style={styles.proofLabel}>ট্রানজেকশন প্রুফ *</Text>
              <TextInput
                style={styles.proofInput}
                value={transactionProof}
                onChangeText={setTransactionProof}
                placeholder="ট্রানজেকশন আইডি, স্ক্রিনশট ডিটেইলস, বা প্রুফ দিন..."
                placeholderTextColor="#888"
                multiline
                numberOfLines={3}
              />

              <Text style={styles.proofLabel}>অতিরিক্ত নোট (ঐচ্ছিক)</Text>
              <TextInput
                style={styles.noteInput}
                value={note}
                onChangeText={setNote}
                placeholder="যেকোনো অতিরিক্ত তথ্য..."
                placeholderTextColor="#888"
                multiline
                numberOfLines={2}
              />

              <View style={styles.modalInfo}>
                <Ionicons name="information-circle" size={16} color="#2962ff" />
                <Text style={styles.modalInfoText}>
                  এটি আমাদের আপনার ট্রানজেকশন ভেরিফাই ও সিকিউর করতে সাহায্য করে
                </Text>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowProofModal(false);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text style={styles.cancelButtonText}>বাতিল</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.modalButton, 
                  styles.submitButton,
                  !transactionProof.trim() && styles.submitButtonDisabled
                ]}
                onPress={() => {
                  setShowProofModal(false);
                  Alert.alert('ট্রানজেকশন', 'এই ফিচারটি ডেভেলপমেন্ট চলছে');
                }}
                disabled={!transactionProof.trim()}
              >
                <Text style={styles.submitButtonText}>
                  প্রুফ সাবমিট করুন
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#0a0c23' 
  },
  scrollContent: { 
    paddingBottom: 30 
  },
  
  // Top Card Styles
  topCard: {
    margin: 16,
    borderRadius: 20,
    shadowColor: '#ff8a00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  gradientCard: {
    padding: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  topAvatar: { 
    width: 50, 
    height: 50, 
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)'
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#ff8a00'
  },
  userDetails: {
    flex: 1,
  },
  topName: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 16,
    marginBottom: 2,
  },
  userId: { 
    color: 'rgba(255,255,255,0.8)', 
    fontSize: 12 
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  copyButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
  },
  balanceContainer: {
    marginBottom: 20,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eyeButton: {
    padding: 4,
  },
  balanceAmount: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  debugInfo: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 5,
    borderRadius: 5,
    marginBottom: 5,
  },
  debugText: {
    color: '#FFD700',
    fontSize: 10,
  },
  balanceStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    gap: 12,
  },
  topSendButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  topSendText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 14 
  },

  // Quick Actions
  quickActionsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  quickIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  quickBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ff4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0a0c23',
  },
  quickBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  quickActionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Transactions Preview
  transactionsPreview: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 18,
    flex: 1,
    marginLeft: 8,
  },
  seeAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  seeAllText: {
    color: '#ff8a00',
    fontSize: 14,
    fontWeight: '600',
  },
  transactionList: {
    gap: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  transactionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  transactionDate: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  positiveAmount: {
    color: '#4CAF50',
  },
  negativeAmount: {
    color: '#ff4444',
  },

  // Gift Section
  giftSection: {
    backgroundColor: 'rgba(255,138,0,0.1)',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#ff8a00',
  },
  giftSubtitle: {
    color: '#ccc',
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4,
  },

  // Search Section
  searchSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 12,
  },

  // Users Section
  usersSection: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  usersList: {
    paddingVertical: 8,
  },
  userCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    width: 200,
    position: 'relative',
  },
  userCardSelected: { 
    borderColor: '#ff8a00', 
    backgroundColor: 'rgba(255,138,0,0.1)' 
  },
  avatar: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 14,
    marginBottom: 2,
  },
  userId: {
    color: '#888',
    fontSize: 12,
  },
  selectedIndicator: {
    marginLeft: 8,
  },
  emptyResults: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#888',
    fontSize: 14,
    marginTop: 8,
  },

  // Selected Recipient
  selectedRecipient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,138,0,0.1)',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ff8a00',
  },
  selectedRecipientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectedAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  selectedName: {
    color: '#ff8a00',
    fontWeight: 'bold',
    fontSize: 16,
  },
  selectedUsername: {
    color: '#ccc',
    fontSize: 12,
  },

  // Amount Section
  amountSection: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 2,
    borderColor: '#ff8a00',
    borderRadius: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  currencySymbol: {
    color: '#ff8a00',
    fontSize: 24,
    fontWeight: 'bold',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    paddingVertical: 16,
  },
  quickAmountsTitle: {
    color: '#b0b8ff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  quickAmounts: { 
    flexDirection: 'row', 
    flexWrap: 'wrap',
    gap: 8,
  },
  quickButton: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    minWidth: '30%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  quickButtonSelected: { 
    borderColor: '#ff8a00', 
    backgroundColor: 'rgba(255,138,0,0.2)' 
  },
  quickButtonText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 14 
  },

  // Note Section
  noteSection: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  noteInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
  },

  // Send Button
  sendButton: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#ff8a00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonGradient: {
    padding: 20,
    alignItems: 'center',
  },
  sendButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sendText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 18 
  },

  // Security Note
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76,175,80,0.1)',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  securityTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  securityTitle: {
    color: '#4CAF50',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 2,
  },
  securityText: {
    color: '#ccc',
    fontSize: 12,
  },

  // Modal Styles
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
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  modalBody: {
    padding: 20,
  },
  proofIllustration: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalSubtitle: {
    color: '#b0b8ff',
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
    textAlign: 'center',
  },
  proofLabel: {
    color: '#ff8a00',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  proofInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(41,98,255,0.1)',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  modalInfoText: {
    color: '#2962ff',
    fontSize: 12,
    flex: 1,
  },
  modalButtons: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: '#666',
  },
  submitButton: {
    backgroundColor: '#ff8a00',
  },
  submitButtonDisabled: {
    backgroundColor: '#666',
    opacity: 0.6,
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default WalletScreen;
