// screens/DepositScreen.js - COMPLETE FIXED VERSION
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
import { useAuth } from '../context/AuthContext';
import { useWallet } from '../context/WalletContext';

const { width } = Dimensions.get('window');

// ✅ Use the same BASE_URL as tournamentsAPI
const API_URL = 'https://xoss.onrender.com/api';

const DepositScreen = ({ navigation, route }) => {
  const { user, token, getUserId } = useAuth();
  const { balance, refreshWallet } = useWallet();
  
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
  const [depositStatus, setDepositStatus] = useState('pending');
  const [adminMessage, setAdminMessage] = useState('');
  const [userId, setUserId] = useState('');

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
      instructions: ['bKash app-এ যান', 'Send Money সিলেক্ট করুন', 'নাম্বার দিন', 'অ্যামাউন্ট দিন', 'Reference: XOSS দিন']
    },
    { 
      id: 'nagad', 
      name: 'Nagad', 
      icon: '💳', 
      color: '#f60', 
      number: '01751332386',
      type: 'Personal',
      instructions: ['Nagad app-এ যান', 'Send Money সিলেক্ট করুন', 'নাম্বার দিন', 'অ্যামাউন্ট দিন', 'Reference: XOSS দিন']
    },
    { 
      id: 'rocket', 
      name: 'Rocket', 
      icon: '🚀', 
      color: '#784bd1', 
      number: '01751332386',
      type: 'Personal',
      instructions: ['Rocket app-এ যান', 'Send Money সিলেক্ট করুন', 'নাম্বার দিন', 'অ্যামাউন্ট দিন', 'Reference: XOSS দিন']
    },
  ];

  const quickAmounts = [100, 200, 500, 1000, 2000, 5000];

  // Load user data
  useEffect(() => {
    loadRecentDeposits();
    
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

  // ✅ FIXED: Set user ID from AuthContext
  useEffect(() => {
    if (user && getUserId) {
      const currentUserId = getUserId();
      setUserId(currentUserId);
      console.log('👤 User ID from AuthContext:', currentUserId);
      console.log('🔐 Token from AuthContext:', token ? 'Yes' : 'No');
    }
  }, [user, getUserId, token]);

  // ✅ FIXED: Load recent deposits - REAL API CALL
  const loadRecentDeposits = async () => {
    try {
      console.log('📊 Loading deposits from backend...');
      
      const currentUserId = getUserId();
      
      if (!currentUserId) {
        console.log('❌ User ID not available');
        return;
      }

      if (!token) {
        console.log('❌ No token available - user not authenticated');
        return;
      }

      console.log('🔐 Using REAL token for deposits');
      
      // ✅ REAL API CALL - User's deposits
      const response = await fetch(`${API_URL}/deposits/user/${currentUserId}?limit=3`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📨 Deposits API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Deposits loaded from backend:', data.data?.length || 0);
        setRecentDeposits(data.data || []);
      } else {
        console.log('❌ Deposits API failed:', response.status);
        // Set empty array if API fails
        setRecentDeposits([]);
      }
    } catch (error) {
      console.log('❌ Error loading deposits:', error);
      setRecentDeposits([]);
    }
  };

  // Copy to clipboard function
  const copyToClipboard = async () => {
    const selected = paymentMethods.find(m => m.id === method);
    if (selected) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCopiedNumber(true);
      Alert.alert('নাম্বার কপি হয়েছে!', `ফোন নাম্বার: ${selected.number}`);
      setTimeout(() => setCopiedNumber(false), 2000);
    }
  };

  // ✅ FIXED: Image Picker with updated API
  const pickImage = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Sorry, we need camera roll permissions to select images!',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setScreenshot(result.assets[0]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('সফল', 'ছবি সিলেক্ট হয়েছে!');
      }
    } catch (error) {
      console.log('Image picker error:', error);
      Alert.alert('ত্রুটি', 'ছবি নির্বাচন করতে ব্যর্থ হয়েছে');
    }
  };

  const takePhoto = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('অনুমতি প্রয়োজন', 'ক্যামেরা ব্যবহারের অনুমতি প্রয়োজন');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setScreenshot(result.assets[0]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      Alert.alert('ত্রুটি', 'ছবি তুলতে ব্যর্থ হয়েছে');
    }
  };

  const removeScreenshot = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setScreenshot(null);
  };

  // ✅ FIXED: Convert image to Base64
  const convertImageToBase64 = async (imageUri) => {
    try {
      // For React Native, we can use the base64 from image picker directly
      if (screenshot?.base64) {
        return `data:image/jpeg;base64,${screenshot.base64}`;
      }
      
      // Fallback: fetch and convert
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Image conversion error:', error);
      throw error;
    }
  };

  // ✅ FIXED: Create deposit request - REAL API CALL
  const createDepositRequest = async (depositData) => {
    try {
      console.log('🔐 Preparing deposit request for backend...');
      
      if (!token) {
        throw new Error('User not authenticated. Please login again.');
      }

      console.log('🔐 Sending request with REAL token');
      
      // ✅ REAL API CALL - এখন ডেটাবেসে সেভ হবে
      const response = await fetch(`${API_URL}/deposits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(depositData)
      });

      console.log('📨 Deposit API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Deposit failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Deposit created successfully in database');
      return result;

    } catch (error) {
      console.error('❌ Deposit API Error:', error);
      throw error;
    }
  };

  // ✅ FIXED: Handle Deposit - COMPLETE VERSION
  const handleDeposit = async () => {
    const depositAmount = parseInt(amount);
    
    // ✅ Check authentication with REAL TOKEN
    if (!token) {
      Alert.alert(
        'লগিন প্রয়োজন', 
        'দয়া করে আগে লগিন করুন',
        [
          { text: 'লগিন', onPress: () => navigation.navigate('Login') },
          { text: 'বাতিল' }
        ]
      );
      return;
    }

    const currentUserId = getUserId();
    if (!currentUserId) {
      Alert.alert('ত্রুটি', 'ইউজার আইডি পাওয়া যায়নি। দয়া করে আবার লগিন করুন।');
      return;
    }

    // Validation
    if (!depositAmount || depositAmount < 10) {
      Alert.alert('ত্রুটি', 'ন্যূনতম ডিপোজিট অ্যামাউন্ট ৳১০');
      return;
    }

    if (depositAmount > 50000) {
      Alert.alert('ত্রুটি', 'সর্বোচ্চ ডিপোজিট অ্যামাউন্ট ৳৫০,০০০');
      return;
    }

    if (!transactionId.trim()) {
      Alert.alert('ত্রুটি', 'দয়া করে ট্রানজেকশন আইডি দিন');
      return;
    }

    if (transactionId.length < 8) {
      Alert.alert('ত্রুটি', 'দয়া করে একটি বৈধ ট্রানজেকশন আইডি দিন (ন্যূনতম ৮ অক্ষর)');
      return;
    }

    if (!screenshot) {
      Alert.alert('প্রুফ প্রয়োজন', 'ভেরিফিকেশনের জন্য পেমেন্ট স্ক্রিনশট আপলোড করুন');
      return;
    }

    setLoading(true);
    setDepositStatus('processing');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // 1. Convert screenshot to Base64
      setUploading(true);
      const screenshotBase64 = await convertImageToBase64(screenshot.uri);
      setUploading(false);

      // 2. Create deposit data according to BACKEND STRUCTURE
      const depositData = {
        amount: depositAmount,
        method: method,
        transactionId: transactionId,
        screenshot: screenshotBase64
      };

      console.log('📦 Sending deposit data to backend:', depositData);

      // 3. Send to backend with REAL TOKEN
      const result = await createDepositRequest(depositData);

      if (result.success) {
        setDepositStatus('pending');
        setAdminMessage('আপনার ডিপোজিট রিকুয়েস্ট এডমিন ভেরিফিকেশনের জন্য প্রেরণ করা হয়েছে। ভেরিফিকেশন সময়: ৫-১৫ মিনিট');

        Alert.alert(
          'রিকুয়েস্ট প্রেরিত!',
          'আপনার ডিপোজিট রিকুয়েস্ট সফলভাবে তৈরি হয়েছে। এডমিন ভেরিফিকেশনের পর টাকা আপনার ওয়ালেটে যোগ হবে।',
          [{ 
            text: 'ঠিক আছে', 
            onPress: () => {
              // Reset form
              setAmount('');
              setTransactionId('');
              setScreenshot(null);
              loadRecentDeposits();
              refreshWallet(); // Refresh wallet balance
            }
          }]
        );
      } else {
        throw new Error(result.message || 'Deposit request failed');
      }

    } catch (error) {
      console.error('Deposit error details:', error);
      
      if (error.message.includes('Authentication failed') || error.message.includes('401')) {
        Alert.alert(
          'সেশন শেষ', 
          'দয়া করে আবার লগিন করুন',
          [{ text: 'লগিন', onPress: () => navigation.navigate('Login') }]
        );
      } else if (error.message.includes('Transaction ID already used')) {
        Alert.alert('ত্রুটি', 'এই ট্রানজেকশন আইডি ইতিমধ্যে ব্যবহৃত হয়েছে। নতুন ট্রানজেকশন আইডি দিন।');
      } else {
        Alert.alert('ত্রুটি', error.message || 'ডিপোজিট রিকুয়েস্ট করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।');
      }
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    setAmount('');
    setTransactionId('');
    setScreenshot(null);
    setDepositStatus('pending');
    setAdminMessage('');
    loadRecentDeposits();
    navigation.goBack();
  };

  const selectedMethod = paymentMethods.find(m => m.id === method);

  // ✅ FIXED: AnimatedMethodButton
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
        activeOpacity={0.8}
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
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>ওয়ালেটে মানি যোগ করুন</Text>
          <View style={{ width: 24 }} />
        </Animated.View>

        {/* Current Balance Display */}
        <View style={styles.balanceSection}>
          <Text style={styles.balanceLabel}>বর্তমান ব্যালেন্স</Text>
          <Text style={styles.balanceAmount}>৳{balance}</Text>
        </View>

        {/* Payment Method Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>পেমেন্ট মেথড সিলেক্ট করুন</Text>
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
            <Text style={styles.instructionsTitle}>কিভাবে ডিপোজিট করবেন:</Text>
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
            <Text style={styles.paymentNumberLabel}>টাকা পাঠান এই নাম্বারে:</Text>
            <TouchableOpacity 
              onPress={copyToClipboard} 
              style={styles.copyButton}
              activeOpacity={0.7}
            >
              <Text style={styles.paymentNumber}>{selectedMethod?.number}</Text>
              <Ionicons 
                name={copiedNumber ? "checkmark" : "copy"} 
                size={16} 
                color={copiedNumber ? "#4CAF50" : "#FFD700"} 
              />
            </TouchableOpacity>
            <Text style={styles.paymentInstruction}>
              {selectedMethod?.name} app-এর মাধ্যমে সঠিক অ্যামাউন্ট পাঠান
            </Text>
            <Text style={styles.paymentType}>
              {selectedMethod?.type} অ্যাকাউন্ট
            </Text>
          </Animated.View>
        </View>

        {/* Amount Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ডিপোজিট অ্যামাউন্ট</Text>
          
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencySymbol}>৳</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="০"
              placeholderTextColor="#999"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              editable={depositStatus === 'pending'}
            />
          </View>

          {/* Quick Amount Buttons */}
          <Text style={styles.quickAmountsTitle}>কুইক সিলেক্ট</Text>
          <View style={styles.quickAmounts}>
            {quickAmounts.map((quickAmount) => (
              <TouchableOpacity
                key={quickAmount}
                style={[
                  styles.quickAmountButton,
                  amount === quickAmount.toString() && styles.quickAmountActive,
                  depositStatus !== 'pending' && styles.quickAmountDisabled
                ]}
                onPress={() => {
                  if (depositStatus === 'pending') {
                    setAmount(quickAmount.toString());
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                }}
                disabled={depositStatus !== 'pending'}
                activeOpacity={0.7}
              >
                <Text style={styles.quickAmountText}>৳{quickAmount}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Transaction ID */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ট্রানজেকশন আইডি</Text>
          
          <TextInput
            style={[
              styles.transactionInput,
              depositStatus !== 'pending' && styles.inputDisabled
            ]}
            placeholder="পেমেন্ট থেকে ট্রানজেকশন আইডি দিন"
            placeholderTextColor="#999"
            value={transactionId}
            onChangeText={setTransactionId}
            maxLength={20}
            editable={depositStatus === 'pending'}
          />
          
          <Text style={styles.helperText}>
            এটি আপনার {selectedMethod?.name} ট্রানজেকশন হিস্ট্রিতে পাবেন
          </Text>
        </View>

        {/* Screenshot Upload Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>পেমেন্ট প্রুফ আপলোড করুন</Text>
          <Text style={styles.uploadSubtitle}>
            ভেরিফিকেশনের জন্য আপনার সফল পেমেন্টের একটি স্ক্রিনশট আপলোড করুন
          </Text>

          {screenshot ? (
            <View style={styles.screenshotPreview}>
              <TouchableOpacity 
                style={styles.previewImageContainer}
                onPress={() => setShowPreview(true)}
                disabled={depositStatus !== 'pending'}
                activeOpacity={0.8}
              >
                <Image 
                  source={{ uri: screenshot.uri }} 
                  style={styles.previewImage}
                />
                <View style={styles.previewOverlay}>
                  <Ionicons name="expand" size={24} color="white" />
                </View>
              </TouchableOpacity>
              
              {depositStatus === 'pending' && (
                <View style={styles.screenshotActions}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={removeScreenshot}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash" size={20} color="#ff4444" />
                    <Text style={styles.actionTextRemove}>মুছুন</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ) : (
            depositStatus === 'pending' && (
              <View style={styles.uploadOptions}>
                <TouchableOpacity 
                  style={styles.uploadOption}
                  onPress={takePhoto}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#2962ff', '#2196F3']}
                    style={styles.uploadOptionIcon}
                  >
                    <Ionicons name="camera" size={28} color="white" />
                  </LinearGradient>
                  <Text style={styles.uploadOptionText}>ছবি তুলুন</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.uploadOption}
                  onPress={pickImage}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#4CAF50', '#45a049']}
                    style={styles.uploadOptionIcon}
                  >
                    <Ionicons name="image" size={28} color="white" />
                  </LinearGradient>
                  <Text style={styles.uploadOptionText}>গ্যালারী থেকে নির্বাচন</Text>
                </TouchableOpacity>
              </View>
            )
          )}
        </View>

        {/* Recent Deposits */}
        {recentDeposits.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>সাম্প্রতিক ডিপোজিট</Text>
            {recentDeposits.map((deposit, index) => (
              <View key={deposit.id || deposit._id || index} style={[
                styles.recentDeposit,
                deposit.status === 'approved' && styles.depositCompleted,
                deposit.status === 'rejected' && styles.depositRejected,
                deposit.status === 'pending' && styles.depositPending
              ]}>
                <View style={styles.depositInfo}>
                  <Text style={styles.depositMethod}>{deposit.method?.toUpperCase()}</Text>
                  <Text style={styles.depositAmount}>৳{deposit.amount}</Text>
                </View>
                <Text style={styles.depositDate}>
                  {new Date(deposit.createdAt).toLocaleDateString('bn-BD')}
                </Text>
                <View style={styles.depositStatusRow}>
                  <Text style={[
                    styles.depositStatus,
                    deposit.status === 'approved' && styles.statusCompleted,
                    deposit.status === 'rejected' && styles.statusRejected,
                    deposit.status === 'pending' && styles.statusPending
                  ]}>
                    {deposit.status === 'approved' ? 'অনুমোদিত' : 
                     deposit.status === 'rejected' ? 'বাতিল' : 
                     'পেন্ডিং'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Deposit Button */}
        <TouchableOpacity 
          style={[
            styles.depositButton,
            (loading || !amount || !transactionId || !screenshot || depositStatus !== 'pending') && styles.depositButtonDisabled
          ]}
          onPress={handleDeposit}
          disabled={loading || !amount || !transactionId || !screenshot || depositStatus !== 'pending'}
          activeOpacity={0.8}
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
                  {depositStatus === 'processing' ? 'ভেরিফাই হচ্ছে...' : 
                   depositStatus !== 'pending' ? 'রিকুয়েস্ট প্রেরিত' : 
                   `ওয়ালেটে ৳${amount || '০'} যোগ করুন`}
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

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
            <Text style={styles.successTitle}>ডিপোজিট Approved! 🎉</Text>
            <Text style={styles.successAmount}>৳{amount} আপনার ওয়ালেটে যোগ হয়েছে</Text>
            <TouchableOpacity 
              style={styles.successButton}
              onPress={closeSuccessModal}
              activeOpacity={0.8}
            >
              <Text style={styles.successButtonText}>চালিয়ে যান</Text>
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
            activeOpacity={0.8}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
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
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  balanceSection: {
    backgroundColor: 'rgba(255,138,0,0.1)',
    margin: 15,
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#ff8a00',
  },
  balanceLabel: {
    color: '#ff8a00',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  balanceAmount: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    margin: 15,
    marginTop: 0,
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(41,98,255,0.1)',
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
  quickAmountDisabled: {
    opacity: 0.5,
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
  inputDisabled: {
    opacity: 0.6,
  },
  helperText: {
    color: '#ccc',
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
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
  recentDeposit: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
  },
  depositCompleted: {
    borderLeftColor: '#4CAF50',
  },
  depositRejected: {
    borderLeftColor: '#ff4444',
  },
  depositPending: {
    borderLeftColor: '#FFA500',
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
  depositStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  depositStatus: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  statusCompleted: {
    color: '#4CAF50',
  },
  statusRejected: {
    color: '#ff4444',
  },
  statusPending: {
    color: '#FFA500',
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
