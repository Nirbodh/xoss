// screens/WithdrawScreen.js - UPDATED WITH PROPER NAVIGATION
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WithdrawScreen = ({ navigation, route }) => {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bkash');
  const [accountNumber, setAccountNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const paymentMethods = [
    { id: 'bkash', name: 'bKash', icon: '📱', color: '#e2136e', minAmount: 100, maxAmount: 10000 },
    { id: 'nagad', name: 'Nagad', icon: '💳', color: '#f60', minAmount: 100, maxAmount: 10000 },
    { id: 'rocket', name: 'Rocket', icon: '🚀', color: '#784bd1', minAmount: 100, maxAmount: 10000 },
  ];

  const quickAmounts = [100, 200, 500, 1000, 2000, 5000];

  const handleWithdraw = async () => {
    const withdrawAmount = parseInt(amount);
    
    if (!withdrawAmount || withdrawAmount < 100) {
      Alert.alert('Error', 'Minimum withdrawal amount is ৳100');
      return;
    }

    if (withdrawAmount > 10000) {
      Alert.alert('Error', 'Maximum withdrawal amount is ৳10,000');
      return;
    }

    if (!accountNumber.trim()) {
      Alert.alert('Error', 'Please enter your account number');
      return;
    }

    if (accountNumber.length < 11) {
      Alert.alert('Error', 'Please enter a valid account number');
      return;
    }

    setLoading(true);

    setTimeout(async () => {
      try {
        const newRequest = {
          id: Date.now(),
          type: 'withdraw',
          amount: -withdrawAmount,
          description: `Withdrawal to ${method.toUpperCase()}`,
          date: new Date().toLocaleString(),
          status: 'pending',
          method: method,
          accountNumber: accountNumber
        };

        const currentBalance = parseInt(await AsyncStorage.getItem('walletBalance') || '1500');
        const newBalance = currentBalance - withdrawAmount;
        
        const currentTransactions = JSON.parse(await AsyncStorage.getItem('walletTransactions') || '[]');
        const updatedTransactions = [newRequest, ...currentTransactions];

        await AsyncStorage.setItem('walletBalance', newBalance.toString());
        await AsyncStorage.setItem('walletTransactions', JSON.stringify(updatedTransactions));

        Alert.alert(
          '✅ Withdrawal Request Submitted!',
          `৳${withdrawAmount} withdrawal to ${method.toUpperCase()} (${accountNumber}) is being processed. It may take 2-4 hours.`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } catch (error) {
        Alert.alert('Error', 'Withdrawal failed. Please try again.');
      } finally {
        setLoading(false);
      }
    }, 2000);
  };

  const selectedMethod = paymentMethods.find(m => m.id === method);

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={"android" === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Withdraw Money</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.balanceInfo}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>৳ 1,500</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Method</Text>
          <View style={styles.methodsGrid}>
            {paymentMethods.map((paymentMethod) => (
              <TouchableOpacity
                key={paymentMethod.id}
                style={[
                  styles.methodButton,
                  method === paymentMethod.id && styles.methodButtonActive
                ]}
                onPress={() => setMethod(paymentMethod.id)}
              >
                <Text style={styles.methodIcon}>{paymentMethod.icon}</Text>
                <Text style={[
                  styles.methodName,
                  method === paymentMethod.id && styles.methodNameActive
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Withdrawal Amount</Text>
          
          <TextInput
            style={styles.amountInput}
            placeholder="Enter amount (৳100 - ৳10,000)"
            placeholderTextColor="#999"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            maxLength={5}
          />

          <View style={styles.quickAmounts}>
            {quickAmounts.map((quickAmount) => (
              <TouchableOpacity
                key={quickAmount}
                style={[
                  styles.quickAmountButton,
                  amount === quickAmount.toString() && styles.quickAmountActive
                ]}
                onPress={() => setAmount(quickAmount.toString())}
              >
                <Text style={styles.quickAmountText}>৳{quickAmount}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Your {selectedMethod?.name} Number
          </Text>
          
          <TextInput
            style={styles.accountInput}
            placeholder={`Enter your ${selectedMethod?.name} number`}
            placeholderTextColor="#999"
            value={accountNumber}
            onChangeText={setAccountNumber}
            keyboardType="phone-pad"
            maxLength={11}
          />
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#2962ff" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Withdrawal Process</Text>
            <Text style={styles.infoText}>
              • Minimum withdrawal: ৳100{'\n'}
              • Processing time: 2-4 hours{'\n'}
              • No withdrawal fee{'\n'}
              • 24/7 support available
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[
            styles.withdrawButton,
            loading && styles.withdrawButtonDisabled
          ]}
          onPress={handleWithdraw}
          disabled={loading}
        >
          {loading ? (
            <Text style={styles.withdrawButtonText}>Processing...</Text>
          ) : (
            <>
              <Ionicons name="arrow-down-circle" size={20} color="white" />
              <Text style={styles.withdrawButtonText}>
                Withdraw ৳{amount || '0'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.supportBox}>
          <Text style={styles.supportText}>
            💬 Need help? WhatsApp: +880123456789
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0c23',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
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
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  balanceInfo: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    margin: 15,
    borderRadius: 15,
  },
  balanceLabel: {
    color: '#ccc',
    fontSize: 16,
    marginBottom: 5,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  section: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    margin: 15,
    marginTop: 0,
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#2962ff20',
  },
  sectionTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  methodsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  methodButton: {
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 5,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  methodButtonActive: {
    borderColor: '#2962ff',
    backgroundColor: 'rgba(41,98,255,0.2)',
  },
  methodIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  methodName: {
    color: '#ccc',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  methodNameActive: {
    color: '#2962ff',
  },
  methodLimit: {
    color: '#FF8A00',
    fontSize: 10,
    fontWeight: 'bold',
  },
  amountInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 2,
    borderColor: '#2962ff',
    borderRadius: 12,
    padding: 15,
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  quickAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickAmountButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 10,
    paddingHorizontal: 15,
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
  quickAmountText: {
    color: 'white',
    fontWeight: 'bold',
  },
  accountInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 2,
    borderColor: '#2962ff',
    borderRadius: 12,
    padding: 15,
    color: 'white',
    fontSize: 16,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(41,98,255,0.1)',
    margin: 15,
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2962ff',
  },
  infoContent: {
    flex: 1,
    marginLeft: 10,
  },
  infoTitle: {
    color: '#2962ff',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  infoText: {
    color: '#ccc',
    fontSize: 12,
    lineHeight: 18,
  },
  withdrawButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2962ff',
    margin: 15,
    padding: 18,
    borderRadius: 15,
    gap: 10,
    shadowColor: '#2962ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  withdrawButtonDisabled: {
    backgroundColor: '#666',
  },
  withdrawButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  supportBox: {
    alignItems: 'center',
    padding: 15,
  },
  supportText: {
    color: '#2962ff',
    fontWeight: 'bold',
  },
});

export default WithdrawScreen;
