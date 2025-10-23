// screens/JoinMatchScreen.js - BOOM BATTLE STYLE
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

const JoinMatchScreen = ({ route, navigation }) => {
  const { match } = route.params;
  const [gameUID, setGameUID] = useState('');
  const [gameName, setGameName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoinMatch = async () => {
    if (!gameUID.trim() || !gameName.trim()) {
      Alert.alert('Error', 'Please enter your Game UID and Name');
      return;
    }

    if (gameUID.length < 6) {
      Alert.alert('Error', 'Please enter a valid Game UID');
      return;
    }

    setLoading(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        '✅ Payment Successful!',
        `You have joined ${match.title}\nEntry Fee: ৳${match.entryFee} deducted`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    }, 2000);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={"android" === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Join Tournament</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Match Info Card */}
        <View style={styles.matchCard}>
          <Text style={styles.matchTitle}>{match.title}</Text>
          <View style={styles.matchDetails}>
            <View style={styles.detailRow}>
              <Ionicons name="trophy" size={16} color="#FFD700" />
              <Text style={styles.detailText}>Prize: ৳{match.totalPrize}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="people" size={16} color="#2962ff" />
              <Text style={styles.detailText}>{match.participants} Players</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="time" size={16} color="#FF4444" />
              <Text style={styles.detailText}>{match.schedule}</Text>
            </View>
          </View>
        </View>

        {/* Payment Summary */}
        <View style={styles.paymentCard}>
          <Text style={styles.paymentTitle}>Payment Summary</Text>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Entry Fee</Text>
            <Text style={styles.paymentAmount}>৳{match.entryFee}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Platform Fee</Text>
            <Text style={styles.paymentAmount}>৳0</Text>
          </View>
          <View style={[styles.paymentRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalAmount}>৳{match.entryFee}</Text>
          </View>
        </View>

        {/* Game Details Form */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Enter Game Details</Text>
          
          <Text style={styles.inputLabel}>Your Game UID *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter your Free Fire UID"
            placeholderTextColor="#999"
            value={gameUID}
            onChangeText={setGameUID}
            keyboardType="numeric"
            maxLength={10}
          />

          <Text style={styles.inputLabel}>Your Game Name *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter your in-game name"
            placeholderTextColor="#999"
            value={gameName}
            onChangeText={setGameName}
            maxLength={20}
          />

          {/* Terms Checkbox */}
          <View style={styles.termsContainer}>
            <Ionicons name="checkmark-circle" size={20} color="#2962ff" />
            <Text style={styles.termsText}>
              I agree to the tournament rules and terms of service
            </Text>
          </View>
        </View>

        {/* Join Button */}
        <TouchableOpacity 
          style={[styles.joinButton, loading && styles.joinButtonDisabled]}
          onPress={handleJoinMatch}
          disabled={loading}
        >
          {loading ? (
            <Text style={styles.joinButtonText}>Processing Payment...</Text>
          ) : (
            <>
              <Ionicons name="wallet" size={20} color="white" />
              <Text style={styles.joinButtonText}>Pay & Join - ৳{match.entryFee}</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Security Note */}
        <View style={styles.securityNote}>
          <Ionicons name="shield-checkmark" size={16} color="#4CAF50" />
          <Text style={styles.securityText}>100% Secure Payment • Instant Join</Text>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
    backgroundColor: 'white',
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
  matchCard: {
    backgroundColor: 'white',
    margin: 15,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  matchTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  matchDetails: {
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    color: '#666',
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },
  paymentCard: {
    backgroundColor: 'white',
    margin: 15,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  paymentLabel: {
    color: '#666',
    fontSize: 14,
  },
  paymentAmount: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 10,
    marginTop: 5,
  },
  totalLabel: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalAmount: {
    color: '#2962ff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  formCard: {
    backgroundColor: 'white',
    margin: 15,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  inputLabel: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 15,
  },
  textInput: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    color: '#333',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
  },
  termsText: {
    color: '#2962ff',
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2962ff',
    margin: 15,
    padding: 18,
    borderRadius: 12,
    shadowColor: '#2962ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    gap: 10,
  },
  joinButtonDisabled: {
    backgroundColor: '#999',
  },
  joinButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    gap: 5,
  },
  securityText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default JoinMatchScreen;
