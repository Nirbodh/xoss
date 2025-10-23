import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet,
  Switch,
  Alert,
  ActivityIndicator,
  Modal,
  TouchableWithoutFeedback,
  Keyboard,
  RefreshControl
} from 'react-native';

// Simple Header Component
const Header = ({ title, subtitle }) => (
  <View style={styles.header}>
    <Text style={styles.headerTitle}>{title}</Text>
    <Text style={styles.headerSubtitle}>{subtitle}</Text>
  </View>
);

// Improved StatusBar Component  
const StatusBar = ({ username, balance, onRefresh, refreshing }) => (
  <TouchableOpacity 
    style={styles.statusBar} 
    onPress={onRefresh} 
    activeOpacity={0.8}
    disabled={refreshing}
  >
    <View style={styles.userInfo}>
      <View style={styles.avatarPlaceholder}>
        <Text style={styles.avatarText}>
          {username ? username.charAt(0).toUpperCase() : 'U'}
        </Text>
      </View>
      <View style={styles.userDetails}>
        <Text style={styles.username} numberOfLines={1}>
          {username || 'Loading...'}
        </Text>
        <Text style={styles.balance}>
          ব্যালেন্স: ৳{balance?.toLocaleString() || '0'}
        </Text>
      </View>
    </View>
    <View style={styles.refreshSection}>
      <Text style={styles.refreshText}>
        {refreshing ? '🔄' : '↻'}
      </Text>
      <Text style={styles.refreshLabel}>
        {refreshing ? 'আপডেট হচ্ছে...' : 'রিফ্রেশ'}
      </Text>
    </View>
  </TouchableOpacity>
);

// Mock API function
const mockApi = async (url, options = {}) => {
  console.log('Mock API call:', url, options);
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const isSuccess = Math.random() > 0.2;
  
  if (isSuccess) {
    return { 
      success: true, 
      message: 'Top-up request submitted successfully!',
      transactionId: 'TXN_' + Math.random().toString(36).substr(2, 9).toUpperCase()
    };
  } else {
    throw new Error('Payment failed. Please try again.');
  }
};

// Mock user data - FIXED: No random balance increase
const getUserData = () => {
  return {
    username: "ovimahathirmohammad",
    balance: 500, // Fixed balance, won't change on refresh
    points: 1250
  };
};

const TopUpScreen = () => {
  const [playerId, setPlayerId] = useState('');
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [usePoints, setUsePoints] = useState(false);
  const [showBkashNumber, setShowBkashNumber] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [transactions, setTransactions] = useState([]);
  
  // FIXED: Use fixed user data without random increases
  const [userData, setUserData] = useState(getUserData());

  // Package prices in Bangladeshi Taka (BDT)
  const diamondPackages = [
    { id: 1, diamonds: 100, price: 109, bonus: 0, popular: false },
    { id: 2, diamonds: 310, price: 329, bonus: 10, popular: true },
    { id: 3, diamonds: 520, price: 549, bonus: 20, popular: false },
    { id: 4, diamonds: 1060, price: 1099, bonus: 60, popular: true }
  ];

  const paymentMethods = [
    { id: 'bkash', name: 'bKash', color: '#e2136e', fee: 0 },
    { id: 'nagad', name: 'Nagad', color: '#f60', fee: 5 },
    { id: 'rocket', name: 'Rocket', color: '#784bd1', fee: 5 },
    { id: 'paypal', name: 'PayPal', color: '#0070ba', fee: 15 }
  ];

  // Load initial data - FIXED: No random balance
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = () => {
    // Fixed user data - no random changes
    setUserData(getUserData());
    
    // Mock transaction history
    const mockTransactions = [
      { type: 'ডায়মন্ড টপ-আপ', amount: '৳329', date: '১০ ডিসেম্বর ২০২৪', status: 'completed' },
      { type: 'ডায়মন্ড টপ-আপ', amount: '৳109', date: '৮ ডিসেম্বর ২০২৪', status: 'completed' },
      { type: 'রেফার বোনাস', amount: '৳50', date: '৫ ডিসেম্বর ২০২৪', status: 'completed' }
    ];
    setTransactions(mockTransactions);
  };

  // FIXED: Refresh without changing balance randomly
  const handleRefresh = async () => {
    setRefreshing(true);
    
    // Simulate API call to refresh data WITHOUT changing balance
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Just reload the same fixed data
    loadInitialData();
    setRefreshing(false);
    
    Alert.alert('সফল', 'ডেটা সফলভাবে আপডেট হয়েছে', [{ text: 'ঠিক আছে' }]);
  };

  const handleTopUp = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const selectedPkg = diamondPackages.find(pkg => pkg.id === selectedPackage);
      const payment = paymentMethods.find(method => method.id === paymentMethod);
      
      const result = await mockApi('/api/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: playerId.trim(),
          package: selectedPkg,
          paymentMethod,
          transactionId: transactionId.trim(),
          usePoints,
          timestamp: new Date().toISOString()
        })
      });

      // Add to transaction history
      const newTransaction = {
        type: 'ডায়মন্ড টপ-আপ',
        amount: `৳${selectedPkg.price}`,
        date: new Date().toLocaleDateString('bn-BD'),
        status: 'completed'
      };
      
      setTransactions(prev => [newTransaction, ...prev]);

      Alert.alert(
        'সফল হয়েছে ✅', 
        `টপ-আপ সফল!\n\n💎 ${selectedPkg.diamonds} ডায়মন্ড\n💰 ৳${selectedPkg.price}\n📱 ${payment.name}\n🔗 ${result.transactionId}`,
        [{ text: 'ঠিক আছে', onPress: resetForm }]
      );
      
    } catch (err) {
      Alert.alert('পেমেন্ট ব্যর্থ', err.message || 'কিছু সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!playerId.trim()) {
      Alert.alert('ত্রুটি', 'দয়া করে আপনার Player ID লিখুন');
      return false;
    }

    if (playerId.trim().length < 3) {
      Alert.alert('ত্রুটি', 'Player ID কমপক্ষে ৩ ক্যারেক্টার হতে হবে');
      return false;
    }

    if (!selectedPackage) {
      Alert.alert('ত্রুটি', 'দয়া করে একটি ডায়মন্ড প্যাকেজ সিলেক্ট করুন');
      return false;
    }

    if (!paymentMethod) {
      Alert.alert('ত্রুটি', 'দয়া করে একটি পেমেন্ট মেথড সিলেক্ট করুন');
      return false;
    }

    if (paymentMethod === 'bkash' && !transactionId.trim()) {
      Alert.alert('ত্রুটি', 'দয়া করে আপনার bKash ট্রানজেকশন ID লিখুন');
      return false;
    }

    return true;
  };

  const resetForm = () => {
    setPlayerId('');
    setSelectedPackage(null);
    setPaymentMethod('');
    setTransactionId('');
    setUsePoints(false);
    setShowBkashNumber(false);
  };

  const getSelectedPackage = () => {
    return diamondPackages.find(pkg => pkg.id === selectedPackage);
  };

  const getPaymentMethod = () => {
    return paymentMethods.find(method => method.id === paymentMethod);
  };

  const calculateTotal = () => {
    const pkg = getSelectedPackage();
    const payment = getPaymentMethod();
    if (!pkg || !payment) return 0;
    return pkg.price + payment.fee;
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#ff8a00']}
            tintColor="#ff8a00"
          />
        }
      >
        {/* Help Button */}
        <TouchableOpacity 
          style={styles.helpButton}
          onPress={() => setHelpModalVisible(true)}
        >
          <Text style={styles.helpButtonText}>❓ সাহায্য</Text>
        </TouchableOpacity>

        <Header 
          title="ডায়মন্ড টপ-আপ" 
          subtitle="দ্রুত ও সুরক্ষিত ডায়মন্ড ডেলিভারি" 
        />
        
        {/* FIXED: Improved StatusBar with better design */}
        <StatusBar 
          username={userData.username} 
          balance={userData.balance} 
          onRefresh={handleRefresh}
          refreshing={refreshing}
        />
        
        {/* Player ID Input */}
        <View style={styles.formGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Player ID *</Text>
            <TouchableOpacity onPress={() => setHelpModalVisible(true)}>
              <Text style={styles.helperLink}>Player ID কোথায়?</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.input}
            value={playerId}
            onChangeText={setPlayerId}
            placeholder="আপনার গেম Player ID লিখুন"
            placeholderTextColor="#999"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Rest of the component remains the same */}
        {/* ... (previous code for packages, payment methods, etc) ... */}

        {/* Diamond Packages */}
        <Text style={styles.sectionTitle}>ডায়মন্ড প্যাকেজ সিলেক্ট করুন *</Text>
        <View style={styles.packageGrid}>
          {diamondPackages.map((pkg) => (
            <TouchableOpacity
              key={pkg.id}
              style={[
                styles.packageCard,
                selectedPackage === pkg.id && styles.packageCardActive,
                pkg.popular && styles.popularPackage
              ]}
              onPress={() => setSelectedPackage(pkg.id)}
              activeOpacity={0.7}
            >
              {pkg.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>জনপ্রিয়</Text>
                </View>
              )}
              <Text style={styles.diamondAmount}>💎 {pkg.diamonds}</Text>
              <Text style={styles.packagePrice}>৳{pkg.price}</Text>
              {pkg.bonus > 0 && (
                <Text style={styles.packageBonus}>+{pkg.bonus} বোনাস</Text>
              )}
              <Text style={styles.valueText}>
                ৳{(pkg.price / (pkg.diamonds + pkg.bonus)).toFixed(2)}/ডায়মন্ড
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Points Section */}
        <View style={styles.pointsSection}>
          <Text style={styles.pointsTitle}>লয়্যালটি পয়েন্ট</Text>
          <Text style={styles.pointsText}>বর্তমান পয়েন্ট: {userData.points?.toLocaleString()}</Text>
          <Text style={styles.pointsSubtext}>1 ডায়মন্ড = 50 পয়েন্ট</Text>
          
          <View style={styles.pointsToggle}>
            <View>
              <Text style={styles.toggleText}>আমার পয়েন্ট ব্যবহার করুন</Text>
              <Text style={styles.toggleSubtext}>
                {usePoints ? '50 পয়েন্ট ব্যবহার করা হবে' : 'নগদ পেমেন্ট করুন'}
              </Text>
            </View>
            <Switch
              value={usePoints}
              onValueChange={setUsePoints}
              trackColor={{ false: '#767577', true: '#ff8a00' }}
              thumbColor={usePoints ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Payment Methods */}
        <Text style={styles.sectionTitle}>পেমেন্ট মেথড *</Text>
        <View style={styles.paymentMethods}>
          {paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.paymentOption,
                paymentMethod === method.id && [
                  styles.paymentOptionActive,
                  { borderColor: method.color }
                ]
              ]}
              onPress={() => {
                setPaymentMethod(method.id);
                if (method.id !== 'bkash') {
                  setTransactionId('');
                }
              }}
              activeOpacity={0.7}
            >
              <View style={styles.paymentInfo}>
                <Text style={[
                  styles.paymentText,
                  paymentMethod === method.id && { color: method.color, fontWeight: 'bold' }
                ]}>
                  {method.name}
                </Text>
                {method.fee > 0 && (
                  <Text style={styles.feeText}>ফি: ৳{method.fee}</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* bKash Specific Section */}
        {paymentMethod === 'bkash' && (
          <View style={styles.bkashSection}>
            <Text style={styles.bkashTitle}>bKash পেমেন্ট নির্দেশিকা</Text>
            
            <TouchableOpacity 
              style={styles.showNumberBtn}
              onPress={() => setShowBkashNumber(!showBkashNumber)}
              activeOpacity={0.7}
            >
              <Text style={styles.showNumberText}>
                {showBkashNumber ? '📱 bKash নম্বর লুকান' : '📱 bKash নম্বর দেখুন'}
              </Text>
            </TouchableOpacity>
            
            {showBkashNumber && (
              <>
                <View style={styles.bkashNumberContainer}>
                  <Text style={styles.bkashNumber}>০১৭৫১৩৩২৩৮৬</Text>
                  <Text style={styles.bkashName}>(জন ডো)</Text>
                </View>
                <Text style={styles.bkashInstruction}>
                  ১. bKash অ্যাপ খুলুন{"\n"}
                  ২. এই নম্বরে মানি সেন্ড করুন{"\n"}
                  ৩. Amount: ৳{getSelectedPackage()?.price || '০'}{"\n"}
                  ৪. Transaction ID কপি করুন
                </Text>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>bKash Transaction ID *</Text>
                  <TextInput
                    style={styles.input}
                    value={transactionId}
                    onChangeText={setTransactionId}
                    placeholder="আপনার bKash transaction ID লিখুন"
                    placeholderTextColor="#999"
                    autoCapitalize="none"
                  />
                </View>
              </>
            )}
          </View>
        )}

        {/* Order Summary */}
        {selectedPackage && paymentMethod && (
          <View style={styles.summarySection}>
            <Text style={styles.summaryTitle}>অর্ডার সামারি</Text>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryText}>প্যাকেজ:</Text>
              <Text style={styles.summaryText}>
                💎 {getSelectedPackage()?.diamonds} ডায়মন্ড
                {getSelectedPackage()?.bonus > 0 && ` + ${getSelectedPackage()?.bonus} বোনাস`}
              </Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryText}>প্যাকেজ মূল্য:</Text>
              <Text style={styles.summaryText}>৳{getSelectedPackage()?.price}</Text>
            </View>
            
            {getPaymentMethod()?.fee > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryText}>সার্ভিস চার্জ:</Text>
                <Text style={styles.summaryText}>৳{getPaymentMethod()?.fee}</Text>
              </View>
            )}
            
            <View style={styles.summaryDivider} />
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryTotal}>মোট প্রদেয়:</Text>
              <Text style={styles.summaryTotal}>৳{calculateTotal()}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryText}>পেমেন্ট মেথড:</Text>
              <Text style={styles.summaryText}>
                {getPaymentMethod()?.name}
              </Text>
            </View>
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity 
          style={[
            styles.submitButton, 
            (loading || !playerId || !selectedPackage || !paymentMethod || (paymentMethod === 'bkash' && !transactionId)) && 
            styles.submitButtonDisabled
          ]}
          onPress={handleTopUp}
          disabled={loading || !playerId || !selectedPackage || !paymentMethod || (paymentMethod === 'bkash' && !transactionId)}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.submitText}>
              {getSelectedPackage() ? `৳${calculateTotal()} পেমেন্ট করুন` : 'টপ-আপ সাবমিট করুন'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Security Note */}
        <View style={styles.footer}>
          <Text style={styles.securityNote}>
            🔒 আপনার পেমেন্ট সুরক্ষিত এবং এনক্রিপ্টেড
          </Text>
          <Text style={styles.supportText}>
            সাহায্যের জন্য: support@gamerzone.com | ০৯৬৩৮-৭৮৭৮৭৮
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0c23',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  helpButton: {
    position: 'absolute',
    top: 10,
    right: 16,
    backgroundColor: 'rgba(255,138,0,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    zIndex: 10,
  },
  helpButtonText: {
    color: '#ff8a00',
    fontSize: 12,
    fontWeight: '600',
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 28,
    color: '#ff8a00',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
  },
  // FIXED: Improved StatusBar styles
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,138,0,0.3)',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ff8a00',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  username: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  balance: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '600',
  },
  refreshSection: {
    alignItems: 'center',
  },
  refreshText: {
    color: '#ff8a00',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  refreshLabel: {
    color: '#ccc',
    fontSize: 10,
  },
  formGroup: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    color: '#ff8a00',
    fontWeight: '600',
    fontSize: 16,
  },
  helperLink: {
    color: '#4fc3f7',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: '#ff8a00',
    borderRadius: 10,
    padding: 14,
    color: 'white',
    fontSize: 16,
  },
  sectionTitle: {
    color: '#ff8a00',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop: 8,
  },
  packageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  packageCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  packageCardActive: {
    borderColor: '#ff8a00',
    backgroundColor: 'rgba(255, 138, 0, 0.15)',
    transform: [{ scale: 1.02 }],
  },
  popularPackage: {
    borderColor: '#4CAF50',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  popularText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  diamondAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ff8a00',
    marginBottom: 6,
  },
  packagePrice: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  packageBonus: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  valueText: {
    color: '#ccc',
    fontSize: 10,
  },
  pointsSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  pointsTitle: {
    color: '#ff8a00',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
  },
  pointsText: {
    color: '#fff',
    fontWeight: '600',
    marginBottom: 4,
  },
  pointsSubtext: {
    color: '#ccc',
    fontSize: 12,
    marginBottom: 16,
  },
  pointsToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleText: {
    color: '#ccc',
    fontSize: 14,
    fontWeight: '600',
  },
  toggleSubtext: {
    color: '#999',
    fontSize: 12,
    marginTop: 2,
  },
  bkashSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  bkashTitle: {
    color: '#e2136e',
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 12,
    textAlign: 'center',
  },
  showNumberBtn: {
    backgroundColor: '#e2136e',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  showNumberText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  bkashNumberContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 10,
    padding: 16,
    marginVertical: 12,
    alignItems: 'center',
  },
  bkashNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e2136e',
    textAlign: 'center',
    marginBottom: 4,
  },
  bkashName: {
    color: '#ccc',
    fontSize: 12,
  },
  bkashInstruction: {
    color: '#ccc',
    lineHeight: 20,
    marginBottom: 16,
  },
  paymentMethods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  paymentOption: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  paymentOptionActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  paymentInfo: {
    alignItems: 'center',
  },
  paymentText: {
    color: '#ccc',
    fontWeight: '500',
    fontSize: 14,
  },
  feeText: {
    color: '#999',
    fontSize: 10,
    marginTop: 4,
  },
  summarySection: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  summaryTitle: {
    color: '#ff8a00',
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryText: {
    color: '#fff',
    fontSize: 14,
  },
  summaryTotal: {
    color: '#ff8a00',
    fontSize: 16,
    fontWeight: 'bold',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 8,
  },
  submitButton: {
    backgroundColor: '#ff8a00',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#ff8a00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonDisabled: {
    backgroundColor: '#666',
    shadowColor: 'transparent',
  },
  submitText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  footer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  securityNote: {
    color: '#4CAF50',
    textAlign: 'center',
    fontSize: 12,
    marginBottom: 8,
  },
  supportText: {
    color: '#999',
    textAlign: 'center',
    fontSize: 11,
  },
});

export default TopUpScreen;
