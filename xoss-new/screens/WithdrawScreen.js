// screens/WithdrawScreen.js - COMPLETELY ENHANCED VERSION
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  Dimensions,
  Animated,
  SafeAreaView
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useWallet } from '../context/WalletContext';
import { walletAPI } from '../api/walletAPI';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

const WithdrawScreen = ({ navigation }) => {
  const { user, isAuthenticated } = useAuth();
  const { balance, requestWithdrawal, refreshWallet, getPendingWithdrawals } = useWallet();
  
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bkash');
  const [accountNumber, setAccountNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [note, setNote] = useState('');
  const [eligibility, setEligibility] = useState({ eligible: true, errors: [], currentBalance: 0 });
  const [stats, setStats] = useState({
    totalWithdrawn: 0,
    pendingWithdrawals: 0,
    completedWithdrawals: 0
  });
  const [recentWithdrawals, setRecentWithdrawals] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  const paymentMethods = [
    { 
      id: 'bkash', 
      name: 'bKash', 
      icon: 'mobile-alt', 
      color: '#E2136E',
      minAmount: 100,
      maxAmount: 25000,
      accountPlaceholder: 'bKash Number (01XXXXXXXXX)',
      instructions: 'আপনার bKash নাম্বার দিন'
    },
    { 
      id: 'nagad', 
      name: 'Nagad', 
      icon: 'money-check-alt', 
      color: '#F22D65',
      minAmount: 100,
      maxAmount: 25000,
      accountPlaceholder: 'Nagad Number (01XXXXXXXXX)',
      instructions: 'আপনার Nagad নাম্বার দিন'
    },
    { 
      id: 'rocket', 
      name: 'Rocket', 
      icon: 'rocket', 
      color: '#128C7E',
      minAmount: 100,
      maxAmount: 25000,
      accountPlaceholder: 'Rocket Number (01XXXXXXXXX)',
      instructions: 'আপনার Rocket নাম্বার দিন'
    },
  ];

  const quickAmounts = [100, 200, 500, 1000, 2000, 5000];

  // Initialize animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      })
    ]).start();
    
    loadInitialData();
  }, []);

  // Load initial data
  const loadInitialData = async () => {
    try {
      setAvailableBalance(balance);
      
      // Load stats
      const statsResponse = await walletAPI.getWithdrawalStats();
      if (statsResponse.success) {
        setStats(statsResponse.data);
      }
      
      // Load recent withdrawals
      const historyResponse = await walletAPI.getWithdrawalHistory(1, 3);
      if (historyResponse.success) {
        setRecentWithdrawals(historyResponse.data.withdrawals || []);
      }
    } catch (error) {
      console.error('❌ Error loading initial data:', error);
    }
  };

  // Check eligibility when amount changes
  useEffect(() => {
    const checkEligibility = async () => {
      if (amount && parseFloat(amount) > 0) {
        const result = await walletAPI.checkEligibility(amount);
        setEligibility(result);
      } else {
        setEligibility({ eligible: true, errors: [], currentBalance: availableBalance });
      }
    };
    
    const timer = setTimeout(checkEligibility, 300);
    return () => clearTimeout(timer);
  }, [amount, availableBalance]);

  // Validate form
  const validateForm = () => {
    const withdrawAmount = parseFloat(amount);
    
    if (!withdrawAmount || isNaN(withdrawAmount)) {
      Alert.alert('ত্রুটি', 'অনুগ্রহ করে একটি বৈধ অ্যামাউন্ট দিন');
      return false;
    }

    if (withdrawAmount < 100) {
      Alert.alert('ত্রুটি', 'ন্যূনতম উত্তোলনের পরিমাণ ৳১০০');
      return false;
    }

    if (withdrawAmount > 25000) {
      Alert.alert('ত্রুটি', 'সর্বোচ্চ উত্তোলনের পরিমাণ ৳২৫,০০০');
      return false;
    }

    if (withdrawAmount > availableBalance) {
      Alert.alert('ত্রুটি', 'আপনার ব্যালেন্স পর্যাপ্ত নয়');
      return false;
    }

    if (!accountNumber.trim()) {
      Alert.alert('ত্রুটি', 'অনুগ্রহ করে অ্যাকাউন্ট নাম্বার দিন');
      return false;
    }

    if (accountNumber.length !== 11 || !accountNumber.startsWith('01')) {
      Alert.alert('ত্রুটি', 'অনুগ্রহ করে একটি বৈধ ১১ ডিজিটের মোবাইল নাম্বার দিন (01XXXXXXXXX)');
      return false;
    }

    return true;
  };

  // Handle withdrawal
  const handleWithdraw = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (!validateForm()) {
      return;
    }

    setShowConfirmation(true);
  };

  // Confirm withdrawal
  const confirmWithdrawal = async () => {
    setLoading(true);
    setShowConfirmation(false);
    
    try {
      const withdrawAmount = parseFloat(amount);
      const selectedMethod = paymentMethods.find(m => m.id === method);

      // Prepare account details
      const accountDetails = {
        phone: accountNumber,
        account_name: user?.name || 'User',
        method: selectedMethod?.name
      };

      // Call withdrawal function from context
      const result = await requestWithdrawal(
        withdrawAmount,
        method,
        accountDetails,
        note
      );

      if (result.success) {
        // Update stats
        const newStats = {
          ...stats,
          pendingWithdrawals: stats.pendingWithdrawals + 1,
          totalWithdrawn: stats.totalWithdrawn + withdrawAmount
        };
        setStats(newStats);
        
        // Add to recent withdrawals
        const newWithdrawal = {
          id: result.withdrawal.id,
          amount: withdrawAmount,
          payment_method: method,
          account_details: accountDetails,
          status: 'pending',
          date: new Date(),
          note
        };
        setRecentWithdrawals(prev => [newWithdrawal, ...prev]);
        
        // Reset form
        setAmount('');
        setAccountNumber('');
        setNote('');
        setEligibility({ eligible: true, errors: [], currentBalance: availableBalance - withdrawAmount });
        
        Alert.alert(
          '✅ সফল!',
          `৳${withdrawAmount} উত্তোলনের রিকোয়েস্ট জমা হয়েছে।\n\nআপনার রিকোয়েস্ট এপ্রুভালের জন্য পেন্ডিং থাকবে।`,
          [
            { 
              text: 'হিস্টোরি দেখুন', 
              onPress: () => navigation.navigate('TransactionHistory')
            },
            { 
              text: 'ঠিক আছে', 
              onPress: () => {}
            }
          ]
        );
      } else {
        throw new Error('উত্তোলন ব্যর্থ হয়েছে');
      }
    } catch (error) {
      console.error('❌ Withdrawal error:', error);
      Alert.alert(
        'ত্রুটি',
        error.message || 'উত্তোলন ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।'
      );
    } finally {
      setLoading(false);
    }
  };

  // Format phone number
  const formatPhoneNumber = (value) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    if (numericValue.length <= 11) {
      setAccountNumber(numericValue);
    }
  };

  // Format amount
  const formatAmount = (value) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    if (numericValue.length <= 6) {
      setAmount(numericValue);
    }
  };

  const selectedMethod = paymentMethods.find(m => m.id === method);

  // Render withdrawal history item
  const renderWithdrawalItem = (item) => {
    const statusColors = {
      pending: '#FFA500',
      approved: '#4CAF50',
      rejected: '#ff4444',
      completed: '#4CAF50'
    };
    
    const statusText = {
      pending: 'পেন্ডিং',
      approved: 'এপ্রুভড',
      rejected: 'রিজেক্টেড',
      completed: 'সম্পন্ন'
    };
    
    return (
      <View key={item.id} style={styles.historyItem}>
        <View style={styles.historyHeader}>
          <View style={styles.historyLeft}>
            <FontAwesome5 
              name={paymentMethods.find(m => m.id === item.payment_method)?.icon || 'money-bill'} 
              size={16} 
              color="#667eea" 
            />
            <Text style={styles.historyMethod}>
              {item.payment_method?.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.historyAmount}>৳{item.amount}</Text>
        </View>
        
        <View style={styles.historyDetails}>
          <Text style={styles.historyAccount}>{item.account_details?.phone}</Text>
          <Text style={styles.historyDate}>
            {new Date(item.date).toLocaleDateString('bn-BD')}
          </Text>
        </View>
        
        <View style={styles.historyStatus}>
          <View style={[
            styles.statusBadge,
            { backgroundColor: `${statusColors[item.status]}20` }
          ]}>
            <Text style={[styles.statusText, { color: statusColors[item.status] }]}>
              {statusText[item.status] || item.status?.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View 
            style={[
              styles.header,
              {
                opacity: fadeAnim,
                transform: [
                  { translateY: slideAnim },
                  { scale: scaleAnim }
                ]
              }
            ]}
          >
            <View style={styles.headerTop}>
              <TouchableOpacity 
                onPress={() => navigation.goBack()}
                style={styles.backButton}
              >
                <Ionicons name="arrow-back" size={24} color="white" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>উইথড্র মানি</Text>
              <TouchableOpacity 
                style={styles.historyButton}
                onPress={() => setShowHistory(true)}
              >
                <Ionicons name="time-outline" size={24} color="white" />
              </TouchableOpacity>
            </View>

            {/* Balance Card */}
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.balanceCard}
            >
              <Text style={styles.balanceLabel}>Available Balance</Text>
              <Text style={styles.balanceAmount}>৳ {availableBalance.toLocaleString()}</Text>
              
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>৳{stats.totalWithdrawn?.toLocaleString() || '0'}</Text>
                  <Text style={styles.statLabel}>Total Withdrawn</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.pendingWithdrawals || 0}</Text>
                  <Text style={styles.statLabel}>Pending</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.completedWithdrawals || 0}</Text>
                  <Text style={styles.statLabel}>Completed</Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Quick Amounts */}
          <View style={styles.quickAmountsContainer}>
            <Text style={styles.sectionTitle}>Quick Select</Text>
            <View style={styles.quickAmountsRow}>
              {quickAmounts.map((quickAmount) => (
                <TouchableOpacity
                  key={quickAmount}
                  style={[
                    styles.quickAmountButton,
                    amount === quickAmount.toString() && styles.quickAmountButtonActive
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setAmount(quickAmount.toString());
                  }}
                >
                  <Text style={[
                    styles.quickAmountText,
                    amount === quickAmount.toString() && styles.quickAmountTextActive
                  ]}>
                    ৳{quickAmount}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Withdrawal Form */}
          <View style={styles.formCard}>
            {/* Amount Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Amount <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.amountInputContainer}>
                <Text style={styles.currencySymbol}>৳</Text>
                <TextInput
                  style={styles.amountInput}
                  value={amount}
                  onChangeText={formatAmount}
                  placeholder="100 - 25,000"
                  keyboardType="numeric"
                  maxLength={6}
                  editable={!loading}
                />
              </View>
              
              {/* Eligibility Status */}
              {eligibility && !eligibility.eligible && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={16} color="#ff4444" />
                  <Text style={styles.errorText}>
                    {eligibility.errors[0]}
                  </Text>
                </View>
              )}
              
              {eligibility && eligibility.eligible && amount && (
                <View style={styles.successContainer}>
                  <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                  <Text style={styles.successText}>
                    ✓ You can withdraw this amount
                  </Text>
                </View>
              )}
            </View>

            {/* Payment Method */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Payment Method <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.methodsContainer}>
                {paymentMethods.map((methodItem) => (
                  <TouchableOpacity
                    key={methodItem.id}
                    style={[
                      styles.methodButton,
                      method === methodItem.id && styles.methodButtonActive,
                      { borderColor: methodItem.color }
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setMethod(methodItem.id);
                    }}
                    disabled={loading}
                  >
                    <FontAwesome5 
                      name={methodItem.icon} 
                      size={20} 
                      color={method === methodItem.id ? '#fff' : methodItem.color} 
                    />
                    <Text style={[
                      styles.methodText,
                      method === methodItem.id && styles.methodTextActive
                    ]}>
                      {methodItem.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Account Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {selectedMethod?.name} Number <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.accountInputContainer}>
                <Text style={styles.countryCode}>+88</Text>
                <TextInput
                  style={styles.accountInput}
                  value={accountNumber}
                  onChangeText={formatPhoneNumber}
                  placeholder="01XXXXXXXXX"
                  keyboardType="phone-pad"
                  maxLength={11}
                  editable={!loading}
                />
              </View>
              
              {accountNumber && (accountNumber.length !== 11 || !accountNumber.startsWith('01')) && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={16} color="#ff4444" />
                  <Text style={styles.errorText}>
                    Please enter a valid 11-digit mobile number
                  </Text>
                </View>
              )}
            </View>

            {/* Note */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Note (Optional)</Text>
              <TextInput
                style={styles.noteInput}
                value={note}
                onChangeText={setNote}
                placeholder="Add a note for this withdrawal"
                multiline
                numberOfLines={3}
                editable={!loading}
              />
            </View>

            {/* Rules */}
            <View style={styles.rulesContainer}>
              <Text style={styles.rulesTitle}>📌 Withdrawal Rules:</Text>
              <View style={styles.ruleItem}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.ruleText}>Minimum withdrawal: ৳100</Text>
              </View>
              <View style={styles.ruleItem}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.ruleText}>Maximum withdrawal: ৳25,000</Text>
              </View>
              <View style={styles.ruleItem}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.ruleText}>Processing time: 24-48 hours</Text>
              </View>
              <View style={styles.ruleItem}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.ruleText}>No withdrawal fee</Text>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.withdrawButton,
                (loading || !amount || !accountNumber || (eligibility && !eligibility.eligible)) && 
                styles.withdrawButtonDisabled
              ]}
              onPress={handleWithdraw}
              disabled={loading || !amount || !accountNumber || (eligibility && !eligibility.eligible)}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <FontAwesome5 name="paper-plane" size={18} color="#fff" />
                  <Text style={styles.withdrawButtonText}>Request Withdrawal</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* History Modal */}
      <Modal
        visible={showHistory}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowHistory(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Withdrawal History</Text>
              <TouchableOpacity 
                onPress={() => setShowHistory(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {recentWithdrawals.length === 0 ? (
                <View style={styles.emptyHistory}>
                  <Ionicons name="receipt-outline" size={64} color="#ccc" />
                  <Text style={styles.emptyHistoryText}>No withdrawal history</Text>
                  <Text style={styles.emptyHistorySubText}>
                    Your withdrawal requests will appear here
                  </Text>
                </View>
              ) : (
                recentWithdrawals.map(renderWithdrawalItem)
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => {
                setShowHistory(false);
                navigation.navigate('TransactionHistory');
              }}
            >
              <Text style={styles.viewAllButtonText}>View All History</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmation}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowConfirmation(false)}
      >
        <View style={styles.confirmationModal}>
          <View style={styles.confirmationContent}>
            <View style={styles.confirmationHeader}>
              <Ionicons name="checkmark-circle" size={40} color="#4CAF50" />
              <Text style={styles.confirmationTitle}>Confirm Withdrawal</Text>
            </View>
            
            <View style={styles.confirmationBody}>
              <View style={styles.confirmationDetail}>
                <Text style={styles.confirmationLabel}>Amount:</Text>
                <Text style={styles.confirmationValue}>৳{amount}</Text>
              </View>
              
              <View style={styles.confirmationDetail}>
                <Text style={styles.confirmationLabel}>Method:</Text>
                <Text style={styles.confirmationValue}>{selectedMethod?.name}</Text>
              </View>
              
              <View style={styles.confirmationDetail}>
                <Text style={styles.confirmationLabel}>Account:</Text>
                <Text style={styles.confirmationValue}>{accountNumber}</Text>
              </View>
              
              {note && (
                <View style={styles.confirmationDetail}>
                  <Text style={styles.confirmationLabel}>Note:</Text>
                  <Text style={styles.confirmationValue}>{note}</Text>
                </View>
              )}
              
              <Text style={styles.confirmationNote}>
                Your money will be sent within 24-48 hours after approval.
              </Text>
            </View>
            
            <View style={styles.confirmationActions}>
              <TouchableOpacity
                style={[styles.confirmationButton, styles.cancelButton]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowConfirmation(false);
                }}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.confirmationButton, styles.confirmButton]}
                onPress={confirmWithdrawal}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.confirmButtonText}>Confirm</Text>
                )}
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
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#667eea',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  historyButton: {
    padding: 5,
  },
  balanceCard: {
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
  },
  balanceAmount: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
    marginTop: 5,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  statValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  quickAmountsContainer: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  quickAmountsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  quickAmountButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginBottom: 10,
    minWidth: '30%',
    alignItems: 'center',
  },
  quickAmountButtonActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  quickAmountTextActive: {
    color: '#fff',
  },
  formCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 30,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: '#ff4444',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    overflow: 'hidden',
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 15,
    backgroundColor: '#f0f0f0',
    paddingVertical: 15,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  successText: {
    color: '#2e7d32',
    fontSize: 14,
    marginLeft: 8,
  },
  methodsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  methodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginHorizontal: 5,
  },
  methodButtonActive: {
    backgroundColor: '#667eea',
  },
  methodText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  methodTextActive: {
    color: '#fff',
  },
  accountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    overflow: 'hidden',
  },
  countryCode: {
    fontSize: 16,
    color: '#333',
    paddingHorizontal: 15,
    backgroundColor: '#f0f0f0',
    paddingVertical: 15,
  },
  accountInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  noteInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  rulesContainer: {
    backgroundColor: '#f0f7ff',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  rulesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  ruleText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  withdrawButton: {
    backgroundColor: '#667eea',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 10,
    marginTop: 20,
  },
  withdrawButtonDisabled: {
    backgroundColor: '#a0a0a0',
  },
  withdrawButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
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
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  emptyHistory: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyHistoryText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#999',
    marginTop: 16,
  },
  emptyHistorySubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  historyItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyMethod: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  historyAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  historyDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyAccount: {
    fontSize: 14,
    color: '#666',
  },
  historyDate: {
    fontSize: 12,
    color: '#999',
  },
  historyStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  viewAllButton: {
    backgroundColor: '#667eea',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  viewAllButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmationModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmationContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  confirmationHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  confirmationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
  },
  confirmationBody: {
    marginBottom: 20,
  },
  confirmationDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  confirmationLabel: {
    color: '#666',
    fontSize: 14,
  },
  confirmationValue: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmationNote: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
  confirmationActions: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmationButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default WithdrawScreen;
