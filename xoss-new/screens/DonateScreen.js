import React, { useState, useRef } from 'react';
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
  Animated,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

const DonateScreen = ({ navigation }) => {
  const [amount, setAmount] = useState('');
  const [selectedCause, setSelectedCause] = useState('education');
  const [message, setMessage] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const donationCauses = [
    {
      id: 'education',
      title: '📚 Education for All',
      description: 'Help underprivileged children get access to quality education',
      color: '#4CAF50',
      icon: 'school',
      raised: 12500,
      goal: 50000
    },
    {
      id: 'healthcare',
      title: '🏥 Medical Assistance',
      description: 'Support life-saving treatments for those in need',
      color: '#F44336',
      icon: 'medical',
      raised: 8750,
      goal: 30000
    },
    {
      id: 'environment',
      title: '🌱 Environment Protection',
      description: 'Plant trees and protect our natural resources',
      color: '#4CAF50',
      icon: 'leaf',
      raised: 15600,
      goal: 40000
    },
    {
      id: 'orphanage',
      title: '🏠 Orphan Care',
      description: 'Provide shelter, food and education for orphans',
      color: '#FF9800',
      icon: 'home',
      raised: 9200,
      goal: 25000
    },
    {
      id: 'disaster',
      title: '🚨 Disaster Relief',
      description: 'Emergency aid for flood, cyclone and disaster victims',
      color: '#9C27B0',
      icon: 'warning',
      raised: 34200,
      goal: 100000
    },
    {
      id: 'animal',
      title: '🐾 Animal Welfare',
      description: 'Rescue and care for street animals and wildlife',
      color: '#795548',
      icon: 'paw',
      raised: 5600,
      goal: 20000
    }
  ];

  const quickAmounts = [50, 100, 200, 500, 1000, 2000];

  // Initialize animations
  React.useEffect(() => {
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
  }, []);

  const handleDonate = async () => {
    const donateAmount = parseInt(amount);
    
    if (!donateAmount || donateAmount < 10) {
      Alert.alert('Error', 'Minimum donation amount is ৳10');
      return;
    }

    if (donateAmount > 50000) {
      Alert.alert('Error', 'Maximum donation amount is ৳50,000');
      return;
    }

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Simulate donation process
    setTimeout(() => {
      setLoading(false);
      setShowSuccessModal(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 2000);
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    setAmount('');
    setMessage('');
    navigation.goBack();
  };

  const selectedCauseData = donationCauses.find(cause => cause.id === selectedCause);

  const calculateProgress = (raised, goal) => {
    return (raised / goal) * 100;
  };

  // Animated Cause Card Component
  const AnimatedCauseCard = ({ cause, index }) => {
    const cardAnim = useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
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
          setSelectedCause(cause.id);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
      >
        <Animated.View 
          style={[
            styles.causeCard,
            selectedCause === cause.id && [styles.causeCardSelected, { borderColor: cause.color }],
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
          <View style={styles.causeHeader}>
            <Text style={styles.causeIcon}>{cause.title.split(' ')[0]}</Text>
            <View style={[styles.causeIndicator, selectedCause === cause.id && { backgroundColor: cause.color }]} />
          </View>
          
          <Text style={styles.causeTitle}>{cause.title}</Text>
          <Text style={styles.causeDescription}>{cause.description}</Text>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${calculateProgress(cause.raised, cause.goal)}%`,
                    backgroundColor: cause.color
                  }
                ]} 
              />
            </View>
            <View style={styles.progressText}>
              <Text style={styles.raisedText}>৳{cause.raised.toLocaleString()} raised</Text>
              <Text style={styles.goalText}>৳{cause.goal.toLocaleString()} goal</Text>
            </View>
          </View>
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
          <Text style={styles.headerTitle}>Make a Difference</Text>
          <View style={{ width: 24 }} />
        </Animated.View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <LinearGradient
            colors={['#FF6B6B', '#FF8E8E']}
            style={styles.heroGradient}
          >
            <Text style={styles.heroTitle}>💝 Spread Love & Kindness</Text>
            <Text style={styles.heroSubtitle}>
              Your donation can change lives. Join us in making the world a better place.
            </Text>
          </LinearGradient>
        </View>

        {/* Causes Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose a Cause</Text>
          <Text style={styles.sectionSubtitle}>
            Select a cause that resonates with your heart
          </Text>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.causesContainer}
          >
            {donationCauses.map((cause, index) => (
              <AnimatedCauseCard key={cause.id} cause={cause} index={index} />
            ))}
          </ScrollView>
        </View>

        {/* Selected Cause Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About This Cause</Text>
          <View style={styles.causeDetails}>
            <Text style={styles.causeDetailTitle}>{selectedCauseData?.title}</Text>
            <Text style={styles.causeDetailDescription}>
              {selectedCauseData?.description}
            </Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>৳{selectedCauseData?.raised.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Raised</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>৳{selectedCauseData?.goal.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Goal</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {Math.round(calculateProgress(selectedCauseData?.raised, selectedCauseData?.goal))}%
                </Text>
                <Text style={styles.statLabel}>Progress</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Donation Amount */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Donation Amount</Text>
          
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

        {/* Personal Message */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Message (Optional)</Text>
          <TextInput
            style={styles.messageInput}
            placeholder="Add an encouraging message..."
            placeholderTextColor="#999"
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Anonymous Donation */}
        <View style={styles.anonymousSection}>
          <TouchableOpacity 
            style={styles.anonymousButton}
            onPress={() => {
              setAnonymous(!anonymous);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <View style={[
              styles.checkbox,
              anonymous && [styles.checkboxChecked, { backgroundColor: '#FF6B6B' }]
            ]}>
              {anonymous && <Ionicons name="checkmark" size={16} color="white" />}
            </View>
            <Text style={styles.anonymousText}>Donate anonymously</Text>
          </TouchableOpacity>
        </View>

        {/* Impact Information */}
        <View style={styles.infoBox}>
          <Ionicons name="heart" size={20} color="#FF6B6B" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Your Impact</Text>
            <Text style={styles.infoText}>
              • ৳100 can provide meals for 5 children{'\n'}
              • ৳500 can support a child's education for a month{'\n'}
              • ৳1000 can provide medical aid to a family{'\n'}
              • Every donation makes a difference
            </Text>
          </View>
        </View>

        {/* Donate Button */}
        <TouchableOpacity 
          style={[
            styles.donateButton,
            (loading || !amount) && styles.donateButtonDisabled
          ]}
          onPress={handleDonate}
          disabled={loading || !amount}
        >
          <LinearGradient
            colors={['#FF6B6B', '#FF5252']}
            style={styles.donateButtonGradient}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Ionicons name="heart" size={24} color="white" />
                <Text style={styles.donateButtonText}>
                  Donate ৳{amount || '0'} to {selectedCauseData?.title.split(' ')[0]}
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Transparency Note */}
        <View style={styles.transparencyBox}>
          <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
          <View style={styles.transparencyContent}>
            <Text style={styles.transparencyTitle}>100% Transparent</Text>
            <Text style={styles.transparencyText}>
              We ensure every taka reaches the intended cause. Regular updates and reports are shared with donors.
            </Text>
          </View>
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
              <Ionicons name="heart-circle" size={80} color="#FF6B6B" />
            </View>
            <Text style={styles.successTitle}>Thank You! 💝</Text>
            <Text style={styles.successAmount}>৳{amount} donated to {selectedCauseData?.title}</Text>
            <Text style={styles.successMessage}>
              Your generosity will make a real difference. We'll keep you updated on the impact of your donation.
            </Text>
            
            <View style={styles.successDetails}>
              <Text style={styles.successDetail}>
                📧 Receipt sent to your email
              </Text>
              <Text style={styles.successDetail}>
                📊 Impact report in 30 days
              </Text>
              {anonymous && (
                <Text style={styles.successDetail}>
                  👤 Donated anonymously
                </Text>
              )}
            </View>

            <TouchableOpacity 
              style={styles.successButton}
              onPress={closeSuccessModal}
            >
              <Text style={styles.successButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
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
  heroSection: {
    margin: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  heroGradient: {
    padding: 25,
    borderRadius: 20,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    margin: 16,
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
    marginBottom: 8,
  },
  sectionSubtitle: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 15,
  },
  causesContainer: {
    paddingVertical: 8,
  },
  causeCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    width: 280,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  causeCardSelected: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  causeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  causeIcon: {
    fontSize: 24,
  },
  causeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'transparent',
  },
  causeTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  causeDescription: {
    color: '#ccc',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 15,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  raisedText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: 'bold',
  },
  goalText: {
    color: '#ccc',
    fontSize: 12,
  },
  causeDetails: {
    marginTop: 10,
  },
  causeDetailTitle: {
    color: '#FF6B6B',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  causeDetailDescription: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 15,
    borderRadius: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    color: '#FF6B6B',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: '#ccc',
    fontSize: 12,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 2,
    borderColor: '#FF6B6B',
    borderRadius: 12,
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  currencySymbol: {
    color: '#FF6B6B',
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
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    minWidth: '30%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  quickAmountActive: {
    borderColor: '#FF6B6B',
    backgroundColor: 'rgba(255,107,107,0.2)',
  },
  quickAmountText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  messageInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 15,
    color: 'white',
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  anonymousSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  anonymousButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 15,
    borderRadius: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#FF6B6B',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    borderColor: '#FF6B6B',
  },
  anonymousText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,107,107,0.1)',
    margin: 16,
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
  },
  infoContent: {
    flex: 1,
    marginLeft: 10,
  },
  infoTitle: {
    color: '#FF6B6B',
    fontWeight: 'bold',
    marginBottom: 5,
    fontSize: 16,
  },
  infoText: {
    color: '#ccc',
    fontSize: 12,
    lineHeight: 18,
  },
  donateButton: {
    margin: 16,
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  donateButtonGradient: {
    padding: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  donateButtonDisabled: {
    opacity: 0.6,
  },
  donateButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  transparencyBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(76,175,80,0.1)',
    margin: 16,
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  transparencyContent: {
    flex: 1,
    marginLeft: 10,
  },
  transparencyTitle: {
    color: '#4CAF50',
    fontWeight: 'bold',
    marginBottom: 5,
    fontSize: 16,
  },
  transparencyText: {
    color: '#ccc',
    fontSize: 12,
    lineHeight: 16,
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
    color: '#FF6B6B',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  successMessage: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  successDetails: {
    width: '100%',
    marginBottom: 25,
  },
  successDetail: {
    color: '#4CAF50',
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  successButton: {
    backgroundColor: '#FF6B6B',
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
});

export default DonateScreen;
