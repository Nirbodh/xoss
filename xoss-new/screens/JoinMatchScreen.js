// screens/JoinMatchScreen.js - FIXED WITH PROPER API INTEGRATION
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
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage'; // ✅ ADDED
import { useAuth } from '../context/AuthContext';
import { useWallet } from '../context/WalletContext';

const JoinMatchScreen = ({ route, navigation }) => {
  const { match } = route.params || {};
  const { user, token } = useAuth();
  const { balance, refreshBalance, deductBalance } = useWallet();
  const [gameUID, setGameUID] = useState('');
  const [gameName, setGameName] = useState('');
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);

  // ✅ FIXED: Extract match data properly
  const matchData = {
    id: match?._id || match?.id,
    title: match?.title || 'Tournament',
    entryFee: match?.entry_fee || match?.entryFee || 0,
    totalPrize: match?.total_prize || match?.prizePool || 0,
    type: match?.type || match?.matchType || 'match',
    game: match?.game || 'freefire',
    roomId: match?.room_id || match?.roomId,
    password: match?.room_password || match?.password,
    maxParticipants: match?.max_participants || match?.maxPlayers || 50,
    currentParticipants: match?.current_participants || match?.currentPlayers || 0,
    status: match?.status || 'upcoming',
    scheduleTime: match?.schedule_time || match?.scheduleTime
  };

  useEffect(() => {
    console.log('🎮 JoinMatchScreen loaded with match:', {
      id: matchData.id,
      title: matchData.title,
      entryFee: matchData.entryFee,
      type: matchData.type
    });
  }, []);

  const handleJoinMatch = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // 1. Validation
    if (!gameUID.trim()) {
      Alert.alert('❌ Required', 'Please enter your Game UID');
      return;
    }

    if (!gameName.trim()) {
      Alert.alert('❌ Required', 'Please enter your Game Name');
      return;
    }

    if (!user?.id) {
      Alert.alert('🔐 Login Required', 'Please login to join tournaments', [
        { 
          text: 'Login', 
          onPress: () => navigation.navigate('Auth', { screen: 'Login' })
        },
        { text: 'Cancel', style: 'cancel' }
      ]);
      return;
    }

    // 2. Check balance for paid matches
    const entryFee = parseFloat(matchData.entryFee) || 0;
    if (entryFee > 0 && balance < entryFee) {
      const needed = entryFee - balance;
      Alert.alert(
        '💰 Insufficient Balance',
        `You need ৳${entryFee} to join this ${matchData.type}.\nYour balance: ৳${balance}\n\nAdd ৳${needed} more to join.`,
        [
          { 
            text: 'Add Money', 
            onPress: () => navigation.navigate('Wallet', { 
              screen: 'Deposit',
              params: { requiredAmount: needed }
            })
          },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
      return;
    }

    // 3. Confirm join
    Alert.alert(
      '🎮 Join Match',
      `Join "${matchData.title}"?\nEntry Fee: ৳${entryFee}\nPrize Pool: ৳${matchData.totalPrize}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Join Now', 
          style: 'destructive',
          onPress: async () => {
            await joinMatchAPI();
          }
        }
      ]
    );
  };

  // ✅✅✅ FIXED API CALL FUNCTION
  const joinMatchAPI = async () => {
    setLoading(true);
    setJoining(true);
    
    try {
      console.log('📡 Joining match via API...', {
        matchId: matchData.id,
        gameUID,
        gameName,
        userId: user.id
      });

      // 1. Get token from AsyncStorage
      const userToken = await AsyncStorage.getItem('token') || token;
      
      if (!userToken) {
        Alert.alert('Error', 'Authentication required. Please login again.');
        return;
      }

      // 2. Correct endpoint
      const endpoint = matchData.type === 'tournament' 
        ? `/tournaments/${matchData.id}/join-with-payment`
        : `/matches/${matchData.id}/join-with-payment`;
      
      const url = `https://xoss.onrender.com/api${endpoint}`;
      
      console.log('🔍 API URL:', url);

      // 3. Make API call directly with fetch
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          game_uid: gameUID,
          game_name: gameName
        })
      });

      console.log('🔍 Response status:', response.status);

      const data = await response.json();
      console.log('✅ API Response:', data);

      if (data.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // ✅ Deduct balance locally
        if (matchData.entryFee > 0) {
          await deductBalance(matchData.entryFee);
        }
        
        // ✅ Refresh wallet
        await refreshBalance();

        // ✅ Get room details
        const roomData = data.data || {};
        const roomId = roomData.room_id || matchData.roomId || `ROOM${matchData.id?.slice(-6)}`;
        const password = roomData.room_password || matchData.password || 'PASS123';

        // ✅ Show success with options
        Alert.alert(
          '✅ Successfully Joined!',
          `You have joined "${matchData.title}"\nEntry Fee: ৳${matchData.entryFee} deducted\n\nRoom ID: ${roomId}\nPassword: ${password}`,
          [
            {
              text: 'Copy Details',
              onPress: async () => {
                await Clipboard.setStringAsync(`Room ID: ${roomId}\nPassword: ${password}`);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert('📋 Copied!', 'Room details copied to clipboard');
              }
            },
            {
              text: 'Go to Room',
              style: 'destructive',
              onPress: () => {
                navigation.navigate('Room', {
                  matchId: matchData.id,
                  roomId: roomId,
                  password: password,
                  title: matchData.title,
                  game: matchData.game,
                  entryFee: matchData.entryFee
                });
              }
            },
            {
              text: 'Back to Matches',
              onPress: () => {
                navigation.navigate('MatchList');
              }
            }
          ]
        );
        
        // ✅ Reset form
        setGameUID('');
        setGameName('');
        
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('❌ Failed', data.message || 'Could not join match');
      }

    } catch (error) {
      console.error('❌ Join error details:', {
        message: error.message,
        error: error
      });
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      Alert.alert(
        '❌ Error',
        error.message || 'Network error. Please check your connection.'
      );
    } finally {
      setLoading(false);
      setJoining(false);
    }
  };

  const formatGameType = (type) => {
    const types = {
      'Solo': '🎮 Solo Match',
      'Duo': '👥 Duo Match', 
      'Squad': '👥 Squad Match',
      'tournament': '🏆 Tournament',
      'match': '⚡ Match'
    };
    return types[type] || type;
  };

  const formatGameName = (gameId) => {
    const games = {
      'freefire': 'Free Fire',
      'pubg': 'PUBG Mobile',
      'cod': 'Call of Duty Mobile',
      'ludo': 'Ludo King',
      'bgmi': 'BGMI'
    };
    return games[gameId] || gameId;
  };

  const entryFee = parseFloat(matchData.entryFee) || 0;
  const canJoin = !loading && gameUID.trim() && gameName.trim() && 
                  (entryFee === 0 || balance >= entryFee);

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.backButton}
            disabled={loading}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Join Match</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Match Info Card */}
        <View style={styles.matchCard}>
          <View style={styles.matchHeader}>
            <View style={styles.matchTypeBadge}>
              <Text style={styles.matchTypeText}>{formatGameType(matchData.type)}</Text>
            </View>
            <View style={[
              styles.statusBadge,
              { backgroundColor: matchData.status === 'live' ? '#4CAF50' : '#FF9800' }
            ]}>
              <Text style={styles.statusText}>
                {matchData.status === 'live' ? '🔴 LIVE' : '⏰ UPCOMING'}
              </Text>
            </View>
          </View>
          
          <Text style={styles.matchTitle}>{matchData.title}</Text>
          
          <View style={styles.gameInfo}>
            <Ionicons name="game-controller" size={18} color="#FF8A00" />
            <Text style={styles.gameText}>{formatGameName(matchData.game)}</Text>
          </View>

          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Ionicons name="trophy" size={20} color="#FFD700" />
              <View>
                <Text style={styles.detailLabel}>Prize Pool</Text>
                <Text style={styles.detailValue}>৳{matchData.totalPrize}</Text>
              </View>
            </View>
            
            <View style={styles.detailItem}>
              <Ionicons name="people" size={20} color="#4FC3F7" />
              <View>
                <Text style={styles.detailLabel}>Players</Text>
                <Text style={styles.detailValue}>
                  {matchData.currentParticipants}/{matchData.maxParticipants}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${(matchData.currentParticipants / matchData.maxParticipants) * 100}%`,
                    backgroundColor: matchData.status === 'live' ? '#4CAF50' : '#2962ff'
                  }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {Math.round((matchData.currentParticipants / matchData.maxParticipants) * 100)}% full
            </Text>
          </View>
        </View>

        {/* Balance Info */}
        {entryFee > 0 && (
          <View style={[
            styles.balanceCard,
            { 
              backgroundColor: balance >= entryFee ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
              borderLeftColor: balance >= entryFee ? '#4CAF50' : '#F44336'
            }
          ]}>
            <View style={styles.balanceRow}>
              <Ionicons 
                name={balance >= entryFee ? "checkmark-circle" : "warning"} 
                size={20} 
                color={balance >= entryFee ? "#4CAF50" : "#F44336"} 
              />
              <View style={styles.balanceInfo}>
                <Text style={styles.balanceLabel}>Your Balance</Text>
                <Text style={[
                  styles.balanceAmount,
                  { color: balance >= entryFee ? "#4CAF50" : "#F44336" }
                ]}>
                  ৳{balance.toFixed(2)}
                </Text>
              </View>
            </View>
            
            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>Entry Fee Required:</Text>
              <Text style={styles.feeAmount}>৳{entryFee}</Text>
            </View>
            
            {balance < entryFee && (
              <TouchableOpacity
                style={styles.addMoneyButton}
                onPress={() => navigation.navigate('Wallet', { 
                  screen: 'Deposit',
                  params: { requiredAmount: entryFee - balance }
                })}
              >
                <Text style={styles.addMoneyText}>Add ৳{(entryFee - balance).toFixed(2)}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Game Details Form */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Your Game Details</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              Game UID <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.textInput,
                loading && styles.inputDisabled
              ]}
              placeholder="Enter your Game UID/Player ID"
              placeholderTextColor="#666"
              value={gameUID}
              onChangeText={setGameUID}
              keyboardType="numeric"
              maxLength={15}
              editable={!loading}
            />
            <Text style={styles.inputHelp}>This is your unique game player ID</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              In-Game Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.textInput,
                loading && styles.inputDisabled
              ]}
              placeholder="Enter your in-game name"
              placeholderTextColor="#666"
              value={gameName}
              onChangeText={setGameName}
              maxLength={20}
              editable={!loading}
            />
            <Text style={styles.inputHelp}>This name will be visible to other players</Text>
          </View>

          {/* Terms */}
          <View style={styles.termsCard}>
            <Ionicons name="shield-checkmark" size={18} color="#2962ff" />
            <Text style={styles.termsText}>
              By joining, you agree to tournament rules and fair play policy
            </Text>
          </View>
        </View>

        {/* Join Button */}
        <TouchableOpacity 
          style={[
            styles.joinButton,
            !canJoin && styles.joinButtonDisabled
          ]}
          onPress={handleJoinMatch}
          disabled={!canJoin || loading}
        >
          {loading ? (
            <>
              <ActivityIndicator size="small" color="white" />
              <Text style={styles.joinButtonText}>Processing...</Text>
            </>
          ) : joining ? (
            <>
              <ActivityIndicator size="small" color="white" />
              <Text style={styles.joinButtonText}>Joining...</Text>
            </>
          ) : entryFee > 0 ? (
            <>
              <Ionicons name="wallet" size={20} color="white" />
              <Text style={styles.joinButtonText}>
                {balance >= entryFee ? `Pay & Join - ৳${entryFee}` : 'Insufficient Balance'}
              </Text>
            </>
          ) : (
            <>
              <Ionicons name="game-controller" size={20} color="white" />
              <Text style={styles.joinButtonText}>Join Free Match</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Security Note */}
        <View style={styles.securityNote}>
          <Ionicons name="lock-closed" size={14} color="#4CAF50" />
          <Text style={styles.securityText}>Secure payment • Instant confirmation</Text>
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
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  matchCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    margin: 15,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  matchTypeBadge: {
    backgroundColor: 'rgba(41, 98, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  matchTypeText: {
    color: '#2962ff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  matchTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  gameInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  gameText: {
    color: '#FF8A00',
    fontSize: 14,
    fontWeight: '600',
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  detailItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  detailValue: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressContainer: {
    marginTop: 10,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    textAlign: 'center',
  },
  balanceCard: {
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  balanceInfo: {
    flex: 1,
  },
  balanceLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  balanceAmount: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  feeLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
  feeAmount: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addMoneyButton: {
    backgroundColor: '#2962ff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  addMoneyText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    margin: 15,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  required: {
    color: '#FF4444',
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: 'white',
  },
  inputDisabled: {
    opacity: 0.5,
  },
  inputHelp: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    marginTop: 6,
  },
  termsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(41, 98, 255, 0.1)',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  termsText: {
    color: '#2962ff',
    fontSize: 12,
    flex: 1,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2962ff',
    marginHorizontal: 15,
    marginTop: 10,
    padding: 18,
    borderRadius: 12,
    gap: 10,
    shadowColor: '#2962ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  joinButtonDisabled: {
    backgroundColor: 'rgba(41, 98, 255, 0.5)',
    opacity: 0.7,
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
    marginTop: 20,
    gap: 8,
  },
  securityText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default JoinMatchScreen;
