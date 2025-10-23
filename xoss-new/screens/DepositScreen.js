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
  Modal,
  ActivityIndicator,
  Image,
  Animated,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const DepositScreen = ({ navigation, route }) => {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState(route.params?.defaultMethod || 'bkash');
  const [transactionId, setTransactionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [recentDeposits, setRecentDeposits] = useState([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [screenshot, setScreenshot] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const paymentMethods = [
    { 
      id: 'bkash', 
      name: 'bKash', 
      icon: '📱', 
      color: '#e2136e', 
      number: '01751332386',
      type: 'Personal',
      instructions: ['Go to bKash app', 'Send Money', 'Enter Number', 'Enter Amount', 'Enter Reference: XOSS']
    },
    { 
      id: 'nagad', 
      name: 'Nagad', 
      icon: '💳', 
      color: '#f60', 
      number: '01751332386',
      type: 'Personal',
      instructions: ['Go to Nagad app', 'Send Money', 'Enter Number', 'Enter Amount', 'Enter Reference: XOSS']
    },
    { 
      id: 'rocket', 
      name: 'Rocket', 
      icon: '🚀', 
      color: '#784bd1', 
      number: '01751332386',
      type: 'Personal',
      instructions: ['Go to Rocket app', 'Send Money', 'Enter Number', 'Enter Amount', 'Enter Reference: XOSS']
    },
  ];

  const quickAmounts = [100, 200, 500, 1000, 2000, 5000];

  // Initialize animations
  useEffect(() => {
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

    // Pulse animation
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

    loadRecentDeposits();
  }, []);

  const loadRecentDeposits = async () => {
    try {
      const transactions = JSON.parse(await AsyncStorage.getItem('walletTransactions') || '[]');
      const deposits = transactions
        .filter(t => t.type === 'deposit')
        .slice(0, 3);
      setRecentDeposits(deposits);
    } catch (error) {
      console.log('Error loading recent deposits:', error);
    }
  };

  // Simple clipboard function without expo-clipboard
  const copyToClipboard = async () => {
    const selected = paymentMethods.find(m => m.id === method);
    if (selected) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCopiedNumber(true);
      Alert.alert('Number Copied!', `Phone number: ${selected.number}`);
      setTimeout(() => setCopiedNumber(false), 2000);
    }
  };

  // Image Picker Functions
  const pickImage = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission required', 'We need camera roll permissions to upload screenshots');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setScreenshot(result.assets[0]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePhoto = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission required', 'We need camera permissions to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setScreenshot(result.assets[0]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const removeScreenshot = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setScreenshot(null);
  };

  const uploadScreenshot = async () => {
    if (!screenshot) return;

    setUploading(true);
    
    try {
      // Simulate upload process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Screenshot uploaded successfully!');
      setUploading(false);
    } catch (error) {
      Alert.alert('Upload Failed', 'Please try again');
      setUploading(false);
    }
  };

  const handleDeposit = async () => {
    const depositAmount = parseInt(amount);
    
    if (!depositAmount || depositAmount < 10) {
      Alert.alert('Error', 'Minimum deposit amount is ৳10');
      return;
    }

    if (depositAmount > 50000) {
      Alert.alert('Error', 'Maximum deposit amount is ৳50,000');
      return;
    }

    if (!transactionId.trim()) {
      Alert.alert('Error', 'Please enter transaction ID');
      return;
    }

    if (transactionId.length < 8) {
      Alert.alert('Error', 'Please enter a valid transaction ID (min 8 characters)');
      return;
    }

    if (!screenshot) {
      Alert.alert('Proof Required', 'Please upload payment screenshot for verification');
      return;
    }

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Simulate API call
    setTimeout(async () => {
      try {
        // Update balance
        const currentBalance = parseInt(await AsyncStorage.getItem('walletBalance') || '1500');
        const newBalance = currentBalance + depositAmount;
        
        // Save transaction
        const newTransaction = {
          id: Date.now(),
          type: 'deposit',
          amount: depositAmount,
          description: `${method.toUpperCase()} Deposit`,
          date: new Date().toLocaleString(),
          status: 'completed',
          method: method,
          transactionId: transactionId,
          screenshot: screenshot.uri,
          timestamp: new Date().toISOString()
        };

        const currentTransactions = JSON.parse(await AsyncStorage.getItem('walletTransactions') || '[]');
        const updatedTransactions = [newTransaction, ...currentTransactions];

        await AsyncStorage.setItem('walletBalance', newBalance.toString());
        await AsyncStorage.setItem('walletTransactions', JSON.stringify(updatedTransactions));

        // Show success modal
        setShowSuccessModal(true);
        
      } catch (error) {
        Alert.alert('Error', 'Deposit failed. Please try again.');
      } finally {
        setLoading(false);
      }
    }, 2000);
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    setAmount('');
    setTransactionId('');
    setScreenshot(null);
    loadRecentDeposits();
    navigation.goBack();
  };

  const selectedMethod = paymentMethods.find(m => m.id === method);

  // Animated Method Button Component
  const AnimatedMethodButton = ({ paymentMethod }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.95,
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
        onPress={() => {
          setMethod(paymentMethod.id);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Animated.View 
          style={[
            styles.methodButton,
            method === paymentMethod.id && [styles.methodButtonActive, { borderColor: paymentMethod.color }],
            { transform: [{ scale: scaleAnim }] }
          ]}
        >
          <Text style={styles.methodIcon}>{paymentMethod.icon}</Text>
          <Text style={[
            styles.methodName,
            method === paymentMethod.id && [styles.methodNameActive, { color: paymentMethod.color }]
          ]}>
            {paymentMethod.name}
          </Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header with Animation */}
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Money to Wallet</Text>
          <View style={{ width: 24 }} />
        </Animated.View>

        {/* Payment Method Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Payment Method</Text>
          <View style={styles.methodsGrid}>
            {paymentMethods.map((paymentMethod) => (
              <AnimatedMethodButton 
                key={paymentMethod.id} 
                paymentMethod={paymentMethod} 
              />
            ))}
          </View>

          {/* Payment Instructions */}
          <View style={styles.instructionsBox}>
            <Text style={styles.instructionsTitle}>How to Deposit:</Text>
            {selectedMethod?.instructions.map((step, index) => (
              <View key={index} style={styles.instructionStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.instructionText}>{step}</Text>
              </View>
            ))}
          </View>

          {/* Payment Number with Animation */}
          <Animated.View 
            style={[
              styles.paymentNumberBox,
              { transform: [{ scale: pulseAnim }] }
            ]}
          >
            <Text style={styles.paymentNumberLabel}>Send Money to:</Text>
            <TouchableOpacity onPress={copyToClipboard} style={styles.copyButton}>
              <Text style={styles.paymentNumber}>{selectedMethod?.number}</Text>
              <Ionicons 
                name={copiedNumber ? "checkmark" : "copy"} 
                size={16} 
                color={copiedNumber ? "#4CAF50" : "#FFD700"} 
              />
            </TouchableOpacity>
            <Text style={styles.paymentInstruction}>
              Send exact amount via {selectedMethod?.name} app
            </Text>
            <Text style={styles.paymentType}>
              {selectedMethod?.type} Account
            </Text>
          </Animated.View>
        </View>

        {/* Amount Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Deposit Amount</Text>
          
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencySymbol}>৳</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0"
              placeholderTextColor="#999"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />
          </View>

          {/* Quick Amount Buttons */}
          <Text style={styles.quickAmountsTitle}>Quick Select</Text>
          <View style={styles.quickAmounts}>
            {quickAmounts.map((quickAmount) => (
              <TouchableOpacity
                key={quickAmount}
                style={[
                  styles.quickAmountButton,
                  amount === quickAmount.toString() && styles.quickAmountActive
                ]}
                onPress={() => {
                  setAmount(quickAmount.toString());
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text style={styles.quickAmountText}>৳{quickAmount}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Transaction ID */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transaction ID</Text>
          
          <TextInput
            style={styles.transactionInput}
            placeholder="Enter transaction ID from payment"
            placeholderTextColor="#999"
            value={transactionId}
            onChangeText={setTransactionId}
            maxLength={20}
          />
          
          <Text style={styles.helperText}>
            Find this in your {selectedMethod?.name} transaction history
          </Text>
        </View>

        {/* Screenshot Upload Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upload Payment Proof</Text>
          <Text style={styles.uploadSubtitle}>
            Take a screenshot of your successful payment for verification
          </Text>

          {screenshot ? (
            <View style={styles.screenshotPreview}>
              <TouchableOpacity 
                style={styles.previewImageContainer}
                onPress={() => setShowPreview(true)}
              >
                <Image 
                  source={{ uri: screenshot.uri }} 
                  style={styles.previewImage}
                />
                <View style={styles.previewOverlay}>
                  <Ionicons name="expand" size={24} color="white" />
                </View>
              </TouchableOpacity>
              
              <View style={styles.screenshotActions}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={removeScreenshot}
                >
                  <Ionicons name="trash" size={20} color="#ff4444" />
                  <Text style={styles.actionTextRemove}>Remove</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={uploadScreenshot}
                  disabled={uploading}
                >
                  {uploading ? (
                    <ActivityIndicator size="small" color="#2962ff" />
                  ) : (
                    <Ionicons name="cloud-upload" size={20} color="#2962ff" />
                  )}
                  <Text style={styles.actionTextUpload}>
                    {uploading ? 'Uploading...' : 'Upload'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.uploadOptions}>
              <TouchableOpacity 
                style={styles.uploadOption}
                onPress={takePhoto}
              >
                <LinearGradient
                  colors={['#2962ff', '#2196F3']}
                  style={styles.uploadOptionIcon}
                >
                  <Ionicons name="camera" size={28} color="white" />
                </LinearGradient>
                <Text style={styles.uploadOptionText}>Take Photo</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.uploadOption}
                onPress={pickImage}
              >
                <LinearGradient
                  colors={['#4CAF50', '#45a049']}
                  style={styles.uploadOptionIcon}
                >
                  <Ionicons name="image" size={28} color="white" />
                </LinearGradient>
                <Text style={styles.uploadOptionText}>Choose from Gallery</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Recent Deposits */}
        {recentDeposits.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Deposits</Text>
            {recentDeposits.map((deposit, index) => (
              <View key={deposit.id} style={styles.recentDeposit}>
                <View style={styles.depositInfo}>
                  <Text style={styles.depositMethod}>{deposit.method.toUpperCase()}</Text>
                  <Text style={styles.depositAmount}>৳{deposit.amount}</Text>
                </View>
                <Text style={styles.depositDate}>{deposit.date}</Text>
                <Text style={styles.depositStatus}>{deposit.status}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Deposit Info */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#2962ff" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Instant Deposit</Text>
            <Text style={styles.infoText}>
              • Minimum deposit: ৳10{'\n'}
              • Maximum deposit: ৳50,000{'\n'}
              • Processed instantly{'\n'}
              • 24/7 support available{'\n'}
              • No hidden fees
            </Text>
          </View>
        </View>

        {/* Deposit Button */}
        <TouchableOpacity 
          style={[
            styles.depositButton,
            (loading || !amount || !transactionId || !screenshot) && styles.depositButtonDisabled
          ]}
          onPress={handleDeposit}
          disabled={loading || !amount || !transactionId || !screenshot}
        >
          <LinearGradient
            colors={['#4CAF50', '#45a049']}
            style={styles.depositButtonGradient}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Ionicons name="add-circle" size={20} color="white" />
                <Text style={styles.depositButtonText}>
                  Add ৳{amount || '0'} to Wallet
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Support Info */}
        <View style={styles.supportBox}>
          <Text style={styles.supportText}>
            💬 Need help? WhatsApp: +880123456789
          </Text>
          <Text style={styles.supportSubText}>
            Response time: 5-10 minutes
          </Text>
        </View>
      </ScrollView>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        animationType="fade"
        transparent={true}
        onRequestClose={closeSuccessModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successModal}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
            </View>
            <Text style={styles.successTitle}>Deposit Successful! 🎉</Text>
            <Text style={styles.successAmount}>৳{amount} added to your wallet</Text>
            <Text style={styles.successMessage}>
              Your funds are now available for gaming and withdrawals
            </Text>
            <TouchableOpacity 
              style={styles.successButton}
              onPress={closeSuccessModal}
            >
              <Text style={styles.successButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Screenshot Preview Modal */}
      <Modal
        visible={showPreview}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPreview(false)}
      >
        <View style={styles.previewModal}>
          <TouchableOpacity 
            style={styles.previewClose}
            onPress={() => setShowPreview(false)}
          >
            <Ionicons name="close" size={30} color="white" />
          </TouchableOpacity>
          
          {screenshot && (
            <Image 
              source={{ uri: screenshot.uri }} 
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
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
    marginBottom: 15,
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
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  methodIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  methodName: {
    color: '#ccc',
    fontWeight: 'bold',
    fontSize: 12,
  },
  methodNameActive: {
    fontWeight: 'bold',
  },
  instructionsBox: {
    backgroundColor: 'rgba(41,98,255,0.05)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  instructionsTitle: {
    color: '#2962ff',
    fontWeight: 'bold',
    marginBottom: 10,
    fontSize: 14,
  },
  instructionStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#2962ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  stepNumberText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  instructionText: {
    color: '#ccc',
    fontSize: 12,
    flex: 1,
  },
  paymentNumberBox: {
    backgroundColor: 'rgba(41,98,255,0.1)',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2962ff',
  },
  paymentNumberLabel: {
    color: '#ccc',
    marginBottom: 5,
    fontSize: 14,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 5,
  },
  paymentNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  paymentInstruction: {
    color: '#FF8A00',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  paymentType: {
    color: '#4CAF50',
    fontSize: 11,
    fontWeight: 'bold',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 2,
    borderColor: '#2962ff',
    borderRadius: 12,
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  currencySymbol: {
    color: '#ff8a00',
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    paddingVertical: 15,
  },
  quickAmountsTitle: {
    color: '#b0b8ff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  quickAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  quickAmountButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
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
    fontSize: 14,
  },
  transactionInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 2,
    borderColor: '#2962ff',
    borderRadius: 12,
    padding: 15,
    color: 'white',
    fontSize: 16,
  },
  helperText: {
    color: '#ccc',
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
  // Screenshot Upload Styles
  uploadSubtitle: {
    color: '#ccc',
    fontSize: 12,
    marginBottom: 15,
    textAlign: 'center',
  },
  uploadOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  uploadOption: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  uploadOptionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  uploadOptionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  screenshotPreview: {
    alignItems: 'center',
  },
  previewImageContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  previewImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
  },
  previewOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenshotActions: {
    flexDirection: 'row',
    gap: 20,
  },
  actionButton: {
    alignItems: 'center',
    padding: 10,
  },
  actionTextRemove: {
    color: '#ff4444',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  actionTextUpload: {
    color: '#2962ff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  recentDeposit: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  depositInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  depositMethod: {
    color: '#ff8a00',
    fontWeight: 'bold',
    fontSize: 14,
  },
  depositAmount: {
    color: '#4CAF50',
    fontWeight: 'bold',
    fontSize: 16,
  },
  depositDate: {
    color: '#ccc',
    fontSize: 12,
    marginBottom: 2,
  },
  depositStatus: {
    color: '#4CAF50',
    fontSize: 11,
    fontWeight: 'bold',
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
    fontSize: 16,
  },
  infoText: {
    color: '#ccc',
    fontSize: 12,
    lineHeight: 18,
  },
  depositButton: {
    margin: 15,
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  depositButtonGradient: {
    padding: 18,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  depositButtonDisabled: {
    opacity: 0.6,
  },
  depositButtonText: {
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
    fontSize: 14,
    marginBottom: 4,
  },
  supportSubText: {
    color: '#888',
    fontSize: 12,
  },
  // Success Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successModal: {
    backgroundColor: '#1a1f3d',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: '100%',
    maxWidth: 350,
  },
  successIcon: {
    marginBottom: 20,
  },
  successTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  successAmount: {
    color: '#4CAF50',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  successMessage: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 20,
  },
  successButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  successButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Preview Modal Styles
  previewModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewClose: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
  },
  fullScreenImage: {
    width: '100%',
    height: '80%',
  },
});

export default DepositScreen;
