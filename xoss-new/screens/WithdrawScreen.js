// screens/WithdrawScreen.js - COMPLETE WORKING VERSION
import React, { useState, useEffect } from 'react';
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
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useWallet } from '../context/WalletContext';
import { walletAPI } from '../api/walletAPI';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

const WithdrawScreen = ({ navigation, route }) => {
  const { user, token, isAuthenticated } = useAuth();
  const { balance, refreshWallet } = useWallet();
  
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bkash');
  const [accountNumber, setAccountNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [note, setNote] = useState('');
  const [eligibility, setEligibility] = useState({ eligible: true, errors: [] });

  const paymentMethods = [
    { 
      id: 'bkash', 
      name: 'bKash', 
      icon: '📱', 
      color: '#e2136e', 
      minAmount: 100, 
      maxAmount: 25000,
      accountPlaceholder: 'bKash Number (01XXXXXXXXX)',
      instructions: 'আপনার bKash নাম্বার দিন'
    },
    { 
      id: 'nagad', 
      name: 'Nagad', 
      icon: '💳', 
      color: '#f60', 
      minAmount: 100, 
      maxAmount: 25000,
      accountPlaceholder: 'Nagad Number (01XXXXXXXXX)',
      instructions: 'আপনার Nagad নাম্বার দিন'
    },
    { 
      id: 'rocket', 
      name: 'Rocket', 
      icon: '🚀', 
      color: '#784bd1', 
      minAmount: 100, 
      maxAmount: 25000,
      accountPlaceholder: 'Rocket Number (01XXXXXXXXX)',
      instructions: 'আপনার Rocket নাম্বার দিন'
    },
  ];

  const quickAmounts = [100, 200, 500, 1000, 2000, 5000];

  // Load available balance
  useEffect(() => {
    const loadBalance = async () => {
      try {
        if (balance > 0) {
          setAvailableBalance(balance);
        } else {
          const walletData = await walletAPI.getBalance();
          if (walletData.success && walletData.data?.balance !== undefined) {
            setAvailableBalance(parseFloat(walletData.data.balance));
          } else {
            setAvailableBalance(0);
          }
        }
      } catch (error) {
        console.error('Error loading balance:', error);
        setAvailableBalance(0);
      }
    };
    
    if (isAuthenticated) {
      loadBalance();
    }
  }, [balance, isAuthenticated]);

  // Check eligibility when amount changes
  useEffect(() => {
    const checkEligibility = async () => {
      if (amount && parseFloat(amount) > 0) {
        const result = await walletAPI.checkEligibility(parseFloat(amount));
        setEligibility(result);
      }
    };
    
    if (amount) {
      checkEligibility();
    }
  }, [amount]);

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
      Alert.alert('ত্রুটি', 'অনুগ্রহ করে একটি বৈধ মোবাইল নাম্বার দিন (01XXXXXXXXX)');
      return false;
    }

    return true;
  };

  const handleWithdraw = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (!validateForm()) {
      return;
    }

    setShowConfirmation(true);
  };

  const confirmWithdrawal = async () => {
    setLoading(true);
    setShowConfirmation(false);
    
    try {
      const withdrawAmount = parseFloat(amount);
      const selectedMethod = paymentMethods.find(m => m.id === method);

      console.log('🚀 Processing withdrawal...', {
        amount: withdrawAmount,
        method: selectedMethod?.name,
        account: accountNumber
      });

      // Prepare account details
      const account_details = {
        phone: accountNumber,
        account_name: user?.name || 'User',
        bank_name: selectedMethod?.name || 'Mobile Banking'
      };

      // Call withdrawal API
      const response = await walletAPI.withdrawRequest(
        withdrawAmount,
        method,
        account_details,
        note || `${selectedMethod?.name} উত্তোলন`
      );

      if (response.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Refresh wallet balance
        await refreshWallet();
        
        // Show success message
        Alert.alert(
          '✅ সফল!',
          `৳${withdrawAmount} উত্তোলনের রিকোয়েস্ট জমা হয়েছে।\n\nরিকোয়েস্ট আইডি: ${response.data?.withdrawal?._id?.substring(0, 8) || 'N/A'}\n\nএটি এপ্রুভালের জন্য পেন্ডিং থাকবে।`,
          [
            { 
              text: 'হিস্টোরি দেখুন', 
              onPress: () => navigation.navigate('TransactionHistory')
            },
            { 
              text: 'ঠিক আছে', 
              onPress: () => navigation.goBack()
            }
          ]
        );
        
        // Reset form
        setAmount('');
        setAccountNumber('');
        setNote('');
      } else {
        throw new Error(response.message || 'উত্তোলন ব্যর্থ হয়েছে');
      }
    } catch (error) {
      console.error('❌ Withdrawal error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      Alert.alert(
        'ত্রুটি',
        error.message || 'উত্তোলন ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।',
        [{ text: 'ঠিক আছে' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const selectedMethod = paymentMethods.find(m => m.id === method);

  return (
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
        <LinearGradient
          colors={['#1a237e', '#283593']}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>উইথড্র মানি</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Balance Info */}
          <View style={styles.balanceInfo}>
            <Text style={styles.balanceLabel}>বর্তমান ব্যালেন্স</Text>
            <Text style={styles.balanceAmount}>৳ {availableBalance.toLocaleString('bn-BD')}</Text>
            <Text style={styles.balanceNote}>
              ন্যূনতম: ৳১০০ | সর্বোচ্চ: ৳২৫,০০০
            </Text>
          </View>
        </LinearGradient>

        {/* Payment Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>পেমেন্ট মেথড সিলেক্ট করুন</Text>
          <View style={styles.methodsGrid}>
            {paymentMethods.map((paymentMethod) => (
              <TouchableOpacity
                key={paymentMethod.id}
                style={[
                  styles.methodButton,
                  method === paymentMethod.id && styles.methodButtonActive,
                  { borderColor: paymentMethod.color }
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setMethod(paymentMethod.id);
                }}
                disabled={loading}
              >
                <View style={[
                  styles.methodIconContainer,
                  { backgroundColor: `${paymentMethod.color}20` }
                ]}>
                  <Text style={styles.methodIcon}>{paymentMethod.icon}</Text>
                </View>
                <Text style={[
                  styles.methodName,
                  method === paymentMethod.id && { color: paymentMethod.color }
                ]}>
                  {paymentMethod.name}
                </Text>
                <Text style={styles.methodLimit}>
                  ৳{paymentMethod.minAmount}-{paymentMethod.maxAmount}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Amount Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>উত্তোলনের অ্যামাউন্ট</Text>
          
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencySymbol}>৳</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="অ্যামাউন্ট লিখুন"
              placeholderTextColor="#999"
              value={amount}
              onChangeText={(text) => {
                const numericText = text.replace(/[^0-9]/g, '');
                setAmount(numericText);
              }}
              keyboardType="numeric"
              maxLength={6}
              editable={!loading}
              selectionColor="#2962ff"
            />
            {amount ? (
              <TouchableOpacity 
                onPress={() => setAmount('')}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Eligibility Warning */}
          {!eligibility.eligible && eligibility.errors.length > 0 && (
            <View style={styles.warningBox}>
              <Ionicons name="warning" size={16} color="#FF6B6B" />
              <Text style={styles.warningText}>
                {eligibility.errors[0]}
              </Text>
            </View>
          )}

          {/* Quick Amounts */}
          <Text style={styles.quickAmountsTitle}>দ্রুত সিলেকশন</Text>
          <View style={styles.quickAmounts}>
            {quickAmounts.map((quickAmount) => (
              <TouchableOpacity
                key={quickAmount}
                style={[
                  styles.quickAmountButton,
                  amount === quickAmount.toString() && styles.quickAmountActive,
                  quickAmount > availableBalance && styles.quickAmountDisabled
                ]}
                onPress={() => {
                  if (quickAmount <= availableBalance) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setAmount(quickAmount.toString());
                  }
                }}
                disabled={loading || quickAmount > availableBalance}
              >
                <Text style={[
                  styles.quickAmountText,
                  quickAmount > availableBalance && styles.quickAmountTextDisabled
                ]}>
                  ৳{quickAmount}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Account Number */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            আপনার {selectedMethod?.name} নাম্বার
          </Text>
          
          <View style={styles.accountInputContainer}>
            <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.accountInput}
              placeholder={selectedMethod?.accountPlaceholder || 'মোবাইল নাম্বার'}
              placeholderTextColor="#999"
              value={accountNumber}
              onChangeText={(text) => {
                const numericText = text.replace(/[^0-9]/g, '');
                if (numericText.length <= 11) {
                  setAccountNumber(numericText);
                }
              }}
              keyboardType="phone-pad"
              maxLength={11}
              editable={!loading}
              selectionColor="#2962ff"
            />
            {accountNumber ? (
              <TouchableOpacity 
                onPress={() => setAccountNumber('')}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            ) : null}
          </View>
          <Text style={styles.accountHint}>
            {selectedMethod?.instructions}
          </Text>
        </View>

        {/* Note (Optional) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>নোট (ঐচ্ছিক)</Text>
          <TextInput
            style={styles.noteInput}
            placeholder="উত্তোলনের জন্য অতিরিক্ত তথ্য..."
            placeholderTextColor="#999"
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={3}
            editable={!loading}
            selectionColor="#2962ff"
          />
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={24} color="#2962ff" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>উত্তোলন প্রক্রিয়া</Text>
            <Text style={styles.infoText}>
              • ন্যূনতম উত্তোলন: ৳১০০{'\n'}
              • প্রসেসিং টাইম: ২-৪ ঘণ্টা{'\n'}
              • কোনো উত্তোলন ফি নেই{'\n'}
              • ২৪/৭ সাপোর্ট
            </Text>
          </View>
        </View>

        {/* Withdraw Button */}
        <TouchableOpacity 
          style={[
            styles.withdrawButton,
            (loading || !amount || !accountNumber) && styles.withdrawButtonDisabled
          ]}
          onPress={handleWithdraw}
          disabled={loading || !amount || !accountNumber}
        >
          <LinearGradient
            colors={['#2962ff', '#1a237e']}
            style={styles.withdrawButtonGradient}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="arrow-up-circle" size={24} color="white" />
                <Text style={styles.withdrawButtonText}>
                  উত্তোলন করুন ৳{amount || '০'}
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Support */}
        <View style={styles.supportBox}>
          <Ionicons name="headset-outline" size={16} color="#2962ff" />
          <Text style={styles.supportText}>
            সাহায্য প্রয়োজন? কল করুন: ০১৭৫১৩৩২৩৮৬
          </Text>
        </View>
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmation}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowConfirmation(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="checkmark-circle" size={40} color="#4CAF50" />
              <Text style={styles.modalTitle}>উত্তোলন নিশ্চিত করুন</Text>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.confirmationDetail}>
                <Text style={styles.confirmationLabel}>অ্যামাউন্ট:</Text>
                <Text style={styles.confirmationValue}>৳{amount}</Text>
              </View>
              
              <View style={styles.confirmationDetail}>
                <Text style={styles.confirmationLabel}>মেথড:</Text>
                <Text style={styles.confirmationValue}>{selectedMethod?.name}</Text>
              </View>
              
              <View style={styles.confirmationDetail}>
                <Text style={styles.confirmationLabel}>অ্যাকাউন্ট:</Text>
                <Text style={styles.confirmationValue}>{accountNumber}</Text>
              </View>
              
              <Text style={styles.confirmationNote}>
                আপনি উত্তোলন রিকোয়েস্ট করছেন। এপ্রুভালের জন্য ২-৪ ঘণ্টা সময় লাগতে পারে।
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowConfirmation(false);
                }}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>বাতিল</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmWithdrawal}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.confirmButtonText}>নিশ্চিত করুন</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color="#2962ff" />
            <Text style={styles.loadingText}>উত্তোলন প্রসেস হচ্ছে...</Text>
            <Text style={styles.loadingSubText}>অনুগ্রহ করে অপেক্ষা করুন</Text>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0c23',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 30,
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
    textAlign: 'center',
    flex: 1,
  },
  balanceInfo: {
    alignItems: 'center',
  },
  balanceLabel: {
    color: '#b0b8ff',
    fontSize: 16,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 8,
  },
  balanceNote: {
    color: '#90caf9',
    fontSize: 12,
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    margin: 16,
    marginTop: 10,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sectionTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  methodsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  methodButton: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 2,
  },
  methodButtonActive: {
    backgroundColor: 'rgba(41,98,255,0.1)',
  },
  methodIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  methodIcon: {
    fontSize: 20,
  },
  methodName: {
    color: '#ccc',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
  },
  methodLimit: {
    color: '#FF8A00',
    fontSize: 10,
    fontWeight: 'bold',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 2,
    borderColor: '#2962ff',
    borderRadius: 12,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  currencySymbol: {
    color: '#2962ff',
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    paddingVertical: 14,
  },
  clearButton: {
    padding: 4,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,107,107,0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
  },
  warningText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
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
    justifyContent: 'space-between',
  },
  quickAmountButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 10,
    minWidth: '30%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  quickAmountActive: {
    borderColor: '#2962ff',
    backgroundColor: 'rgba(41,98,255,0.2)',
  },
  quickAmountDisabled: {
    opacity: 0.5,
  },
  quickAmountText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  quickAmountTextDisabled: {
    color: '#666',
  },
  accountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 2,
    borderColor: '#2962ff',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  inputIcon: {
    marginRight: 8,
  },
  accountInput: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    paddingVertical: 14,
  },
  accountHint: {
    color: '#90caf9',
    fontSize: 12,
    marginTop: 4,
  },
  noteInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 16,
    color: 'white',
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(41,98,255,0.1)',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2962ff',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    color: '#2962ff',
    fontWeight: 'bold',
    marginBottom: 6,
    fontSize: 16,
  },
  infoText: {
    color: '#b0b8ff',
    fontSize: 12,
    lineHeight: 18,
  },
  withdrawButton: {
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#2962ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  withdrawButtonDisabled: {
    opacity: 0.6,
  },
  withdrawButtonGradient: {
    padding: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  withdrawButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  supportBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  supportText: {
    color: '#2962ff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1a1f3d',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 12,
  },
  modalBody: {
    marginBottom: 20,
  },
  confirmationDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  confirmationLabel: {
    color: '#b0b8ff',
    fontSize: 14,
  },
  confirmationValue: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmationNote: {
    color: '#90caf9',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
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
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    backgroundColor: '#1a1f3d',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    width: '80%',
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 8,
  },
  loadingSubText: {
    color: '#b0b8ff',
    fontSize: 14,
  },
});

export default WithdrawScreen;
