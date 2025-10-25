// screens/MatchControlScreen.js - COMPLETELY FIXED WITH ALL REQUIRED FIELDS
import React, { useState, useRef, useEffect } from 'react';
import { 
  View, Text, ScrollView, TouchableOpacity, StyleSheet, 
  TextInput, Alert, Animated, Dimensions, Modal, 
  RefreshControl, ActivityIndicator, FlatList, Switch 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import DateTimePicker from '@react-native-community/datetimepicker';

// ✅ TournamentContext import
import { useTournaments } from '../context/TournamentContext';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

// 🆕 SIMPLE BUTTON COMPONENT
const SimpleButton = ({ 
  title, 
  onPress, 
  icon, 
  type = 'primary',
  size = 'medium',
  disabled = false,
  style 
}) => {
  const getButtonStyle = () => {
    switch (type) {
      case 'primary': return styles.primaryButton;
      case 'success': return styles.successButton;
      case 'warning': return styles.warningButton;
      case 'danger': return styles.dangerButton;
      case 'secondary': return styles.secondaryButton;
      default: return styles.primaryButton;
    }
  };

  const getTextStyle = () => {
    switch (type) {
      case 'primary': return styles.primaryButtonText;
      case 'success': return styles.successButtonText;
      case 'warning': return styles.warningButtonText;
      case 'danger': return styles.dangerButtonText;
      case 'secondary': return styles.secondaryButtonText;
      default: return styles.primaryButtonText;
    }
  };

  return (
    <TouchableOpacity
      style={[
        getButtonStyle(),
        size === 'large' && styles.buttonLarge,
        size === 'small' && styles.buttonSmall,
        disabled && styles.buttonDisabled,
        style
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View style={styles.buttonContent}>
        {icon && (
          <Ionicons 
            name={icon} 
            size={size === 'large' ? 18 : size === 'small' ? 14 : 16} 
            color="white" 
            style={styles.buttonIcon}
          />
        )}
        <Text style={[
          getTextStyle(),
          size === 'large' && styles.buttonTextLarge,
          size === 'small' && styles.buttonTextSmall
        ]}>
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// 🆕 Game Configuration
const GAMES = {
  freefire: {
    name: 'Free Fire',
    icon: 'flame',
    color: '#FF6B00',
    modes: ['Solo', 'Duo', 'Squad', 'Clash Squad'],
    maps: ['Bermuda', 'Purgatory', 'Kalahari', 'Bermuda Remastered']
  },
  pubg: {
    name: 'PUBG Mobile',
    icon: 'target',
    color: '#4CAF50',
    modes: ['Solo', 'Duo', 'Squad', 'TPP', 'FPP'],
    maps: ['Erangel', 'Miramar', 'Sanhok', 'Vikendi']
  },
  cod: {
    name: 'Call of Duty',
    icon: 'sports-esports',
    color: '#2196F3',
    modes: ['MP', 'Battle Royale', 'Zombies'],
    maps: ['Standoff', 'Crash', 'Raid', 'Firing Range']
  },
  ludo: {
    name: 'Ludo King',
    icon: 'dice',
    color: '#9C27B0',
    modes: ['Classic', 'Quick', 'Master'],
    maps: ['Classic Board']
  },
  bgmi: {
    name: 'BGMI',
    icon: 'mobile-alt',
    color: '#FF4444',
    modes: ['Solo', 'Duo', 'Squad'],
    maps: ['Erangel', 'Miramar', 'Livik', 'Sanhok']
  }
};

// 🆕 Enhanced Match Card
const MatchCard = ({ match, index, onAction, isSelected, onSelect }) => {
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(cardScale, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(cardScale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'live': return '#4CAF50';
      case 'upcoming': return '#FF9800';
      case 'completed': return '#2196F3';
      case 'cancelled': return '#F44336';
      case 'pending': return '#FF9800';
      default: return '#666';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'live': return 'play-circle';
      case 'upcoming': return 'time';
      case 'completed': return 'checkmark-done';
      case 'cancelled': return 'close-circle';
      case 'pending': return 'time-outline';
      default: return 'help-circle';
    }
  };

  const ProgressBar = ({ progress, total, color }) => {
    const percentage = (progress / total) * 100;
    return (
      <View style={styles.progressSection}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${percentage}%`,
                backgroundColor: color
              }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {progress}/{total} players • {Math.round(percentage)}%
        </Text>
      </View>
    );
  };

  const displayPrizePool = match?.prizePool || match?.totalPrize || 0;

  return (
    <TouchableOpacity
      onLongPress={() => onSelect(match.id || match._id)}
      activeOpacity={0.9}
    >
      <Animated.View style={[
        styles.matchCard,
        isSelected && styles.selectedMatchCard,
        {
          opacity: fadeAnim,
          transform: [
            { scale: cardScale },
            { 
              translateY: slideAnim.interpolate({
                inputRange: [0, 50],
                outputRange: [0, 50]
              })
            }
          ]
        }
      ]}>
        {isSelected && (
          <View style={styles.selectionOverlay}>
            <Ionicons name="checkmark-circle" size={24} color="#2962ff" />
          </View>
        )}

        <TouchableOpacity
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={() => onSelect(match.id || match._id)}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#1a1f3d', '#2d1b69']}
            style={styles.cardGradient}
          >
            {match.prizeDistributed && (
              <View style={styles.prizeDistributedBadge}>
                <Ionicons name="trophy" size={12} color="#FFD700" />
                <Text style={styles.prizeDistributedText}>PRIZES DISTRIBUTED</Text>
              </View>
            )}

            <View style={styles.matchHeader}>
              <View style={styles.gameInfo}>
                <LinearGradient
                  colors={[GAMES[match.game]?.color || '#2962ff', `${GAMES[match.game]?.color || '#2962ff'}DD`]}
                  style={styles.gameIcon}
                >
                  <Ionicons 
                    name={GAMES[match.game]?.icon || 'game-controller'} 
                    size={20} 
                    color="white" 
                  />
                </LinearGradient>
                <View style={styles.matchTitleContainer}>
                  <Text style={styles.matchTitle}>{match.title}</Text>
                  <Text style={styles.matchSubtitle}>
                    {GAMES[match.game]?.name} • {match.type} • {match.map}
                  </Text>
                  <Text style={styles.matchTypeBadge}>
                    {match.matchType === 'tournament' ? '🏆 TOURNAMENT' : '⚡ MATCH'}
                  </Text>
                </View>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(match.status) }]}>
                <Ionicons name={getStatusIcon(match.status)} size={12} color="white" />
                <Text style={styles.statusText}>{match.status.toUpperCase()}</Text>
              </View>
            </View>

            <View style={styles.matchStats}>
              <View style={styles.statItem}>
                <Ionicons name="cash-outline" size={16} color="#4CAF50" />
                <Text style={styles.statValue}>৳{match.entryFee}</Text>
                <Text style={styles.statLabel}>Entry</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="trophy-outline" size={16} color="#FFD700" />
                <Text style={[
                  styles.statValue,
                  match.prizeDistributed && styles.prizeDistributedValue
                ]}>৳{displayPrizePool}</Text>
                <Text style={styles.statLabel}>Prize</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="people-outline" size={16} color="#2962ff" />
                <Text style={styles.statValue}>
                  {match.currentPlayers || match.currentParticipants || 0}/{match.maxPlayers || match.maxParticipants || 50}
                </Text>
                <Text style={styles.statLabel}>Players</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="time-outline" size={16} color="#FF9800" />
                <Text style={styles.statValue}>
                  {new Date(match.scheduleTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </Text>
                <Text style={styles.statLabel}>Time</Text>
              </View>
            </View>

            <ProgressBar 
              progress={match.currentPlayers || match.currentParticipants || 0} 
              total={match.maxPlayers || match.maxParticipants || 50} 
              color={GAMES[match.game]?.color || '#2962ff'}
            />

            {/* ✅ ADDED: Description and Rules */}
            {(match.description || match.rules) && (
              <View style={styles.additionalInfo}>
                {match.description && (
                  <View style={styles.infoItem}>
                    <Ionicons name="document-text-outline" size={12} color="#4FC3F7" />
                    <Text style={styles.infoText} numberOfLines={1}>{match.description}</Text>
                  </View>
                )}
                {match.rules && (
                  <View style={styles.infoItem}>
                    <Ionicons name="list-outline" size={12} color="#FF9800" />
                    <Text style={styles.infoText} numberOfLines={1}>Rules: {match.rules}</Text>
                  </View>
                )}
                {match.requirements && (
                  <View style={styles.infoItem}>
                    <Ionicons name="document-text-outline" size={12} color="#FF9800" />
                    <Text style={styles.infoText} numberOfLines={1}>{match.requirements}</Text>
                  </View>
                )}
                {match.streamLink && (
                  <View style={styles.infoItem}>
                    <Ionicons name="videocam-outline" size={12} color="#FF4444" />
                    <Text style={styles.infoText} numberOfLines={1}>Live Stream</Text>
                  </View>
                )}
                {match.contactInfo && (
                  <View style={styles.infoItem}>
                    <Ionicons name="call-outline" size={12} color="#4CAF50" />
                    <Text style={styles.infoText} numberOfLines={1}>Contact Admin</Text>
                  </View>
                )}
              </View>
            )}

            {/* ✅ ADDED: End Time Display */}
            {match.endTime && (
              <View style={styles.timeInfo}>
                <View style={styles.timeItem}>
                  <Ionicons name="play" size={12} color="#4CAF50" />
                  <Text style={styles.timeText}>
                    Start: {new Date(match.scheduleTime).toLocaleString()}
                  </Text>
                </View>
                <View style={styles.timeItem}>
                  <Ionicons name="stop" size={12} color="#F44336" />
                  <Text style={styles.timeText}>
                    End: {new Date(match.endTime).toLocaleString()}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.roomInfo}>
              <View style={styles.roomDetail}>
                <Ionicons name="key-outline" size={14} color="#2962ff" />
                <Text style={styles.roomText}>ID: {match.roomId}</Text>
              </View>
              <View style={styles.roomDetail}>
                <Ionicons name="lock-closed-outline" size={14} color="#2962ff" />
                <Text style={styles.roomText}>PW: {match.password}</Text>
              </View>
            </View>

            {/* ✅ ADDED: Created By Info */}
            {match.created_by && (
              <View style={styles.creatorInfo}>
                <Ionicons name="person-outline" size={12} color="#9C27B0" />
                <Text style={styles.creatorText}>Created by: {match.created_by}</Text>
              </View>
            )}

            <View style={styles.quickActionsBar}>
              <TouchableOpacity 
                style={styles.quickAction}
                onPress={() => {
                  Clipboard.setStringAsync(`Room ID: ${match.roomId}\nPassword: ${match.password}`);
                  Alert.alert('Copied!', 'Room details copied to clipboard');
                }}
              >
                <Ionicons name="copy" size={14} color="#2962ff" />
                <Text style={styles.quickActionText}>Copy Room</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.quickAction}
                onPress={() => onAction(match.id || match._id, 'share')}
              >
                <Ionicons name="share-social" size={14} color="#4CAF50" />
                <Text style={styles.quickActionText}>Share</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.quickAction}
                onPress={() => onAction(match.id || match._id, 'analytics')}
              >
                <Ionicons name="stats-chart" size={14} color="#FF9800" />
                <Text style={styles.quickActionText}>Stats</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.quickAction}
                onPress={() => onAction(match.id || match._id, 'duplicate')}
              >
                <Ionicons name="duplicate" size={14} color="#9C27B0" />
                <Text style={styles.quickActionText}>Duplicate</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.actionButtons}>
              {match.status === 'live' && (
                <SimpleButton
                  title="MANAGE LIVE"
                  onPress={() => onAction(match.id || match._id, 'manage')}
                  type="danger"
                  size="small"
                  icon="play-circle"
                  style={styles.actionButton}
                />
              )}
              {match.status === 'upcoming' && (
                <>
                  <SimpleButton
                    title="EDIT"
                    onPress={() => onAction(match.id || match._id, 'edit')}
                    type="warning"
                    size="small"
                    icon="create-outline"
                    style={styles.actionButton}
                  />
                  <SimpleButton
                    title="START"
                    onPress={() => onAction(match.id || match._id, 'start')}
                    type="success"
                    size="small"
                    icon="play"
                    style={styles.actionButton}
                  />
                  <SimpleButton
                    title="CANCEL"
                    onPress={() => onAction(match.id || match._id, 'cancel')}
                    type="danger"
                    size="small"
                    icon="close-circle"
                    style={styles.actionButton}
                  />
                </>
              )}
              {match.status === 'pending' && (
                <>
                  <SimpleButton
                    title="APPROVE"
                    onPress={() => onAction(match.id || match._id, 'approve')}
                    type="success"
                    size="small"
                    icon="checkmark-circle"
                    style={styles.actionButton}
                  />
                  <SimpleButton
                    title="REJECT"
                    onPress={() => onAction(match.id || match._id, 'reject')}
                    type="danger"
                    size="small"
                    icon="close-circle"
                    style={styles.actionButton}
                  />
                </>
              )}
              {match.status === 'completed' && (
                <>
                  <SimpleButton
                    title="VERIFY RESULTS"
                    onPress={() => onAction(match.id || match._id, 'verify')}
                    type="warning"
                    size="small"
                    icon="shield-checkmark"
                    style={styles.actionButton}
                  />
                  <SimpleButton
                    title={match.prizeDistributed ? "PRIZES SENT" : "DISTRIBUTE PRIZES"}
                    onPress={() => onAction(match.id || match._id, 'distribute')}
                    type={match.prizeDistributed ? "success" : "primary"}
                    size="small"
                    icon={match.prizeDistributed ? "checkmark-done" : "gift-outline"}
                    style={styles.actionButton}
                  />
                </>
              )}
              <SimpleButton
                title="ANALYTICS"
                onPress={() => onAction(match.id || match._id, 'analytics')}
                type="secondary"
                size="small"
                icon="stats-chart"
                style={styles.actionButton}
              />
            </View>

            {match.status === 'live' && (
              <View style={styles.liveBadge}>
                <View style={styles.livePulse} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            )}

            {match.status === 'pending' && (
              <View style={styles.pendingBadge}>
                <Ionicons name="time" size={10} color="white" />
                <Text style={styles.pendingText}>PENDING</Text>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </TouchableOpacity>
  );
};

// Create Match Modal - FIXED VERSION WITH ALL REQUIRED FIELDS
const CreateMatchModal = ({ visible, onClose, onCreate }) => {
  const slideAnim = useRef(new Animated.Value(height)).current;
  const { user: authUser } = useAuth();
  
  // ✅ FIXED: All required fields added
  const [newMatch, setNewMatch] = useState({
    title: 'Solo Battle',
    game: 'pubg',
    type: 'Solo',
    map: 'Erangel',
    entryFee: 50,
    prizePool: 500,
    totalPrize: 500, // ✅ ADDED: total_prize alias
    maxPlayers: 100,
    maxParticipants: 100, // ✅ ADDED: max_participants alias
    perKill: 10,
    matchType: 'match',
    roomId: '',
    password: '',
    description: 'A 100 player solo tournament', // ✅ ADDED: description
    matchDescription: 'A 100 player solo tournament', // alias
    rules: 'No cheating, fair play only', // ✅ ADDED: rules
    matchRules: 'No cheating, fair play only', // alias
    requirements: '',
    streamLink: '',
    contactInfo: '',
    matchDuration: '120', // 2 hours
    registrationDeadline: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
    scheduleTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // ✅ ADDED: start_time alias
    endTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // ✅ ADDED: end_time
    serverRegion: 'Asia',
    matchFormat: 'Custom Room',
    teamSize: 1, // Solo
    maxTeams: 100,
    warmupTime: '5',
    checkInTime: '15',
    prizeDistribution: '50-30-20',
    bonusPrizes: '',
    minLevel: '10',
    maxLevel: '100',
    allowedDevices: 'Mobile Only',
    pingLimit: '150ms',
    antiCheatRequired: true,
    recordingRequired: false,
    allowSpectators: true,
    isPublic: true,
    customMessage: '',
    organizerName: '',
    supportContact: '',
    paymentMethods: 'Bkash, Nagad',
    refundPolicy: 'No refund after registration',
    matchHashtag: '#PUBGSolo',
    socialMediaShare: true,
    autoStart: true,
    practiceRoom: true,
    created_by: 'adminUserId' // ✅ ADDED: created_by
  });
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showRegDatePicker, setShowRegDatePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
      
      // ✅ Set created_by to current user
      if (authUser) {
        setNewMatch(prev => ({ 
          ...prev, 
          created_by: authUser.id || authUser._id || 'adminUserId' 
        }));
      }
    } else {
      Animated.spring(slideAnim, {
        toValue: height,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  // ✅ FIXED: Create match function with all required fields
  const handleCreate = () => {
    if (!newMatch.title || !newMatch.entryFee || !newMatch.prizePool || !newMatch.roomId || !newMatch.password) {
      Alert.alert('Error', 'Please fill all required fields (*)');
      return;
    }

    // ✅ FIXED: Ensure all required fields are included
    const match = {
      ...newMatch,
      id: Date.now().toString(),
      currentPlayers: 0,
      currentParticipants: 0,
      status: 'upcoming',
      createdAt: new Date().toISOString(),
      prizeDistributed: false,
      totalPrize: newMatch.prizePool, // Ensure totalPrize is set
      maxParticipants: newMatch.maxPlayers, // Ensure maxParticipants is set
      matchType: 'match',
      // ✅ ADDED: All required fields from checklist
      total_prize: newMatch.prizePool,
      entry_fee: newMatch.entryFee,
      start_time: newMatch.scheduleTime,
      end_time: newMatch.endTime,
      max_participants: newMatch.maxPlayers,
      description: newMatch.description,
      rules: newMatch.rules,
      created_by: newMatch.created_by
    };

    console.log('🎯 Creating match with all required fields:', {
      title: match.title,
      game: match.game,
      total_prize: match.total_prize,
      entry_fee: match.entry_fee,
      start_time: match.start_time,
      end_time: match.end_time,
      max_participants: match.max_participants,
      description: match.description,
      rules: match.rules,
      created_by: match.created_by
    });
    
    onCreate(match);
    onClose();
  };

  const generateRoomId = () => {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    setNewMatch(prev => ({ ...prev, roomId }));
  };

  const generatePassword = () => {
    const password = Math.random().toString(36).substring(2, 6).toUpperCase();
    setNewMatch(prev => ({ ...prev, password }));
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setNewMatch(prev => ({ ...prev, scheduleTime: selectedDate.toISOString() }));
      // Auto-set end time to 2 hours after start time
      const endTime = new Date(selectedDate.getTime() + 2 * 60 * 60 * 1000);
      setNewMatch(prev => ({ ...prev, endTime: endTime.toISOString() }));
    }
  };

  const handleEndTimeChange = (event, selectedDate) => {
    setShowEndTimePicker(false);
    if (selectedDate) {
      setNewMatch(prev => ({ ...prev, endTime: selectedDate.toISOString() }));
    }
  };

  const handleRegDateChange = (event, selectedDate) => {
    setShowRegDatePicker(false);
    if (selectedDate) {
      setNewMatch(prev => ({ ...prev, registrationDeadline: selectedDate.toISOString() }));
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose}/>
        <Animated.View style={[styles.createModal, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create New Match</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={true}>
            <Text style={styles.sectionTitle}>🎮 Basic Match Information</Text>

            <Text style={styles.modalLabel}>Match Title *</Text>
            <TextInput
              style={styles.modalInput}
              value={newMatch.title}
              onChangeText={(text) => setNewMatch(prev => ({ ...prev, title: text }))}
              placeholder="Enter match title"
            />

            {/* ✅ ADDED: Description Field */}
            <Text style={styles.modalLabel}>Match Description</Text>
            <TextInput
              style={[styles.modalInput, styles.textArea]}
              value={newMatch.description}
              onChangeText={(text) => setNewMatch(prev => ({ ...prev, description: text, matchDescription: text }))}
              placeholder="Describe your match..."
              multiline
              numberOfLines={3}
            />

            {/* ✅ ADDED: Rules Field */}
            <Text style={styles.modalLabel}>Match Rules</Text>
            <TextInput
              style={[styles.modalInput, styles.textArea]}
              value={newMatch.rules}
              onChangeText={(text) => setNewMatch(prev => ({ ...prev, rules: text, matchRules: text }))}
              placeholder="Enter match rules..."
              multiline
              numberOfLines={2}
            />

            <Text style={styles.modalLabel}>Select Game *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.gameSelection}>
                {Object.keys(GAMES).map((gameId) => (
                  <TouchableOpacity
                    key={gameId}
                    style={[styles.gameOption, newMatch.game === gameId && styles.gameOptionSelected]}
                    onPress={() => setNewMatch(prev => ({ 
                      ...prev, 
                      game: gameId, 
                      map: GAMES[gameId].maps[0], 
                      type: GAMES[gameId].modes[0] 
                    }))}
                  >
                    <View style={[styles.gameOptionContent, newMatch.game === gameId && styles.gameOptionContentSelected]}>
                      <Ionicons name={GAMES[gameId].icon} size={20} color={newMatch.game === gameId ? 'white' : GAMES[gameId].color} />
                      <Text style={[styles.gameOptionText, newMatch.game === gameId && styles.gameOptionTextSelected]}>
                        {GAMES[gameId].name}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.formRow}>
              <View style={styles.formColumn}>
                <Text style={styles.modalLabel}>Entry Fee (৳) *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newMatch.entryFee.toString()}
                  onChangeText={(text) => setNewMatch(prev => ({ ...prev, entryFee: parseInt(text) || 0 }))}
                  placeholder="50"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.formColumn}>
                <Text style={styles.modalLabel}>Prize Pool (৳) *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newMatch.prizePool.toString()}
                  onChangeText={(text) => setNewMatch(prev => ({ ...prev, prizePool: parseInt(text) || 0, totalPrize: parseInt(text) || 0 }))}
                  placeholder="500"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={styles.formColumn}>
                <Text style={styles.modalLabel}>Max Players *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newMatch.maxPlayers.toString()}
                  onChangeText={(text) => setNewMatch(prev => ({ ...prev, maxPlayers: parseInt(text) || 0, maxParticipants: parseInt(text) || 0 }))}
                  placeholder="100"
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* ✅ ADDED: Start Time and End Time Fields */}
            <Text style={styles.modalLabel}>Start Time *</Text>
            <TouchableOpacity 
              style={styles.datePickerButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar" size={20} color="#2962ff" />
              <Text style={styles.datePickerText}>
                {new Date(newMatch.scheduleTime).toLocaleString()}
              </Text>
            </TouchableOpacity>

            <Text style={styles.modalLabel}>End Time *</Text>
            <TouchableOpacity 
              style={styles.datePickerButton}
              onPress={() => setShowEndTimePicker(true)}
            >
              <Ionicons name="calendar" size={20} color="#2962ff" />
              <Text style={styles.datePickerText}>
                {new Date(newMatch.endTime).toLocaleString()}
              </Text>
            </TouchableOpacity>

            <Text style={styles.modalLabel}>Room ID *</Text>
            <View style={styles.inputWithButton}>
              <TextInput
                style={[styles.modalInput, { flex: 1 }]}
                value={newMatch.roomId}
                onChangeText={(text) => setNewMatch(prev => ({ ...prev, roomId: text }))}
                placeholder="Enter room ID"
              />
              <TouchableOpacity style={styles.generateButton} onPress={generateRoomId}>
                <Text style={styles.generateButtonText}>Generate</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Password *</Text>
            <View style={styles.inputWithButton}>
              <TextInput
                style={[styles.modalInput, { flex: 1 }]}
                value={newMatch.password}
                onChangeText={(text) => setNewMatch(prev => ({ ...prev, password: text }))}
                placeholder="Enter password"
              />
              <TouchableOpacity style={styles.generateButton} onPress={generatePassword}>
                <Text style={styles.generateButtonText}>Generate</Text>
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={new Date(newMatch.scheduleTime)}
                mode="datetime"
                display="default"
                onChange={handleDateChange}
              />
            )}

            {showEndTimePicker && (
              <DateTimePicker
                value={new Date(newMatch.endTime)}
                mode="datetime"
                display="default"
                onChange={handleEndTimeChange}
              />
            )}

            {showRegDatePicker && (
              <DateTimePicker
                value={new Date(newMatch.registrationDeadline)}
                mode="datetime"
                display="default"
                onChange={handleRegDateChange}
              />
            )}

            <View style={styles.modalActions}>
              <SimpleButton title="CANCEL" onPress={onClose} type="secondary" style={styles.modalButton}/>
              <SimpleButton title="CREATE MATCH" onPress={handleCreate} type="primary" style={styles.modalButton}/>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

// 🆕 MAIN COMPONENT - FIXED VERSION
const MatchControlScreen = ({ navigation }) => {
  const { tournaments, loading, error, createTournament, updateTournament, deleteTournament, refreshTournaments } = useTournaments();
  const { user: authUser } = useAuth();

  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMatches, setSelectedMatches] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMatch, setEditingMatch] = useState(null);
  const [showPrizeModal, setShowPrizeModal] = useState(false);
  const [distributingMatch, setDistributingMatch] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // ✅ FIXED: Add auto-refresh
  useEffect(() => {
    console.log('🔄 MatchControlScreen mounted');
    refreshTournaments();
  }, []);

  // ✅ FIXED: Add focus listener
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('🎯 Screen focused - refreshing data');
      refreshTournaments();
    });
    return unsubscribe;
  }, [navigation]);

  // ✅ FIXED: Filter matches - Show all types in admin
  const filteredMatches = tournaments.filter(match => {
    if (!match) return false;
    
    const matchesSearch = 
      (match.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (match.game?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'req') return matchesSearch && match.status === 'pending';
    return matchesSearch && match.status === activeTab;
  });

  // ✅ FIXED: Refresh function
  const handleRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await refreshTournaments();
    setRefreshing(false);
  };

  const handleMatchSelect = (matchId) => {
    setSelectedMatches(prev => 
      prev.includes(matchId) 
        ? prev.filter(id => id !== matchId)
        : [...prev, matchId]
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // ✅ FIXED: Match actions
  const handleMatchAction = (matchId, action) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const match = tournaments.find(m => m.id === matchId || m._id === matchId);
    
    if (!match) {
      Alert.alert('Error', 'Match not found');
      return;
    }
    
    switch(action) {
      case 'manage':
        Alert.alert('Manage Live Match', `Managing: ${match.title}\n\nRoom ID: ${match.roomId}\nPassword: ${match.password}`);
        break;
      case 'edit':
        setEditingMatch(match);
        setShowEditModal(true);
        break;
      case 'start':
        updateTournament(matchId, { status: 'live' });
        Alert.alert('Match Started', `${match.title} is now LIVE!`);
        break;
      case 'cancel':
        Alert.alert('Cancel Match', `Cancel "${match.title}"?`, [
          { text: 'No', style: 'cancel' },
          { 
            text: 'Yes', 
            style: 'destructive',
            onPress: () => {
              updateTournament(matchId, { status: 'cancelled' });
              Alert.alert('Match Cancelled', 'The match has been cancelled.');
            }
          }
        ]);
        break;
      case 'approve':
        updateTournament(matchId, { status: 'upcoming' });
        Alert.alert('Match Approved', 'The match has been approved.');
        break;
      case 'reject':
        updateTournament(matchId, { status: 'cancelled' });
        Alert.alert('Match Rejected', 'The match has been rejected.');
        break;
      case 'verify':
        Alert.alert('Verify Results', `Verify results for: ${match.title}\n\nPlease check the final standings and confirm the winners.`);
        break;
      case 'distribute':
        setDistributingMatch(match);
        setShowPrizeModal(true);
        break;
      case 'share':
        Clipboard.setStringAsync(`Join my match: ${match.title}\nRoom ID: ${match.roomId}\nPassword: ${match.password}\nPrize: ৳${match.prizePool || match.totalPrize || 0}`);
        Alert.alert('Copied!', 'Match details copied to clipboard');
        break;
      case 'analytics':
        setShowAnalytics(true);
        break;
      case 'duplicate':
        const duplicatedMatch = {
          ...match,
          id: Date.now().toString(),
          title: `${match.title} (Copy)`,
          status: 'upcoming',
          currentPlayers: 0,
          currentParticipants: 0,
          createdAt: new Date().toISOString(),
          prizeDistributed: false,
          matchType: match.matchType || 'match',
          created_by: authUser?.id || authUser?._id || 'adminUserId' // ✅ ADDED: created_by
        };
        createTournament(duplicatedMatch);
        Alert.alert('Duplicated!', 'Match duplicated successfully!');
        break;
      default:
        break;
    }
  };

  // ✅ CRITICAL FIX: Updated handleCreateMatch function with all required fields
  const handleCreateMatch = async (newMatch) => {
    try {
      console.log('🔄 Creating match with all fields:', {
        title: newMatch.title,
        game: newMatch.game,
        total_prize: newMatch.total_prize,
        entry_fee: newMatch.entry_fee,
        start_time: newMatch.start_time,
        end_time: newMatch.end_time,
        max_participants: newMatch.max_participants,
        description: newMatch.description,
        rules: newMatch.rules,
        created_by: newMatch.created_by
      });
      
      // ✅ ENSURE all required fields are set
      const matchData = {
        ...newMatch,
        matchType: newMatch.matchType || 'match',
        totalPrize: newMatch.prizePool,
        total_prize: newMatch.prizePool,
        entry_fee: newMatch.entryFee,
        start_time: newMatch.scheduleTime,
        end_time: newMatch.endTime,
        max_participants: newMatch.maxPlayers,
        description: newMatch.description,
        rules: newMatch.rules,
        created_by: newMatch.created_by || authUser?.id || authUser?._id || 'adminUserId'
      };
      
      const result = await createTournament(matchData);
      
      if (result && result.success) {
        console.log('✅ Match created successfully with all fields');
        
        Alert.alert('Success! 🎉', 'Match created successfully!', [
          { 
            text: 'OK', 
            onPress: () => {
              setShowCreateModal(false);
              refreshTournaments();
            }
          }
        ]);
        
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
      } else {
        Alert.alert('Error', result?.error || 'Failed to create match');
      }
    } catch (error) {
      console.log('❌ Create match error:', error);
      Alert.alert('Error', 'Please try again');
    }
  };

  // Render loading state
  if (loading && tournaments.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2962ff" />
          <Text style={styles.loadingText}>Loading matches...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Match Control</Text>
              <Text style={styles.headerSubtitle}>Admin Dashboard</Text>
              <Text style={styles.syncStatus}>
                {tournaments.length} matches • {loading ? 'Syncing...' : 'Synced'}
              </Text>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerActionButton} onPress={() => setShowAnalytics(true)}>
                <Ionicons name="stats-chart" size={20} color="white" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerActionButton} onPress={() => setShowCreateModal(true)}>
                <Ionicons name="add" size={20} color="white" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerActionButton} onPress={refreshTournaments}>
                <Ionicons name="refresh" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={18} color="#b0b8ff" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search matches..."
              placeholderTextColor="#b0b8ff"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close" size={18} color="#b0b8ff" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.container}>
        <View style={styles.tabContainer}>
          {[
            { key: 'all', label: 'All' },
            { key: 'upcoming', label: 'Upcoming' },
            { key: 'live', label: 'Live' },
            { key: 'completed', label: 'Completed' },
            { key: 'req', label: 'Requests' }
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.activeTab]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Match List */}
        <FlatList
          data={filteredMatches}
          keyExtractor={(item) => item.id || item._id}
          renderItem={({ item, index }) => (
            <MatchCard
              match={item}
              index={index}
              onAction={handleMatchAction}
              isSelected={selectedMatches.includes(item.id || item._id)}
              onSelect={handleMatchSelect}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#2962ff']}
              tintColor="#2962ff"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="game-controller-outline" size={64} color="#444" />
              <Text style={styles.emptyText}>No matches found</Text>
              <Text style={styles.emptySubtext}>
                {searchQuery ? 'Try a different search' : 'Create your first match to get started'}
              </Text>
              <SimpleButton
                title="CREATE MATCH"
                onPress={() => setShowCreateModal(true)}
                type="primary"
                icon="add"
                style={styles.emptyButton}
              />
            </View>
          }
          contentContainerStyle={styles.matchList}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* All Modals */}
      <CreateMatchModal 
        visible={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
        onCreate={handleCreateMatch}
      />
    </SafeAreaView>
  );
};

// ✅ COMPLETE STYLES SECTION - FIXED LAYOUT WITH NEW STYLES
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0a0c23',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0c23',
  },
  loadingText: {
    color: 'white',
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    backgroundColor: '#1a1f3d',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    marginTop: 10,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#b0b8ff',
    textAlign: 'center',
    marginTop: 4,
  },
  syncStatus: {
    fontSize: 12,
    color: '#4CAF50',
    textAlign: 'center',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerActionButton: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginLeft: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    color: 'white',
    marginLeft: 8,
    fontSize: 16,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#2962ff',
  },
  tabText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '500',
  },
  activeTabText: {
    color: 'white',
    fontWeight: 'bold',
  },
  matchList: {
    paddingBottom: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    marginTop: 8,
  },
  matchCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  selectedMatchCard: {
    borderColor: '#2962ff',
    borderWidth: 2,
  },
  cardGradient: {
    padding: 16,
    position: 'relative',
  },
  selectionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(41, 98, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  prizeDistributedBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 2,
  },
  prizeDistributedText: {
    fontSize: 8,
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  gameInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  gameIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  matchTitleContainer: {
    flex: 1,
  },
  matchTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  matchSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  matchTypeBadge: {
    fontSize: 10,
    color: '#2962ff',
    fontWeight: 'bold',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    color: 'white',
    marginLeft: 4,
    fontWeight: 'bold',
  },
  matchStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  prizeDistributedValue: {
    textDecorationLine: 'line-through',
    color: 'rgba(255,255,255,0.5)',
  },
  progressSection: {
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  additionalInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    marginLeft: 4,
  },
  // ✅ ADDED: New Styles for Time Info
  timeInfo: {
    marginBottom: 12,
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
  },
  timeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    marginLeft: 6,
  },
  // ✅ ADDED: Creator Info Styles
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 6,
    backgroundColor: 'rgba(156, 39, 176, 0.1)',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  creatorText: {
    fontSize: 10,
    color: '#9C27B0',
    marginLeft: 4,
    fontWeight: '500',
  },
  roomInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  roomDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roomText: {
    fontSize: 12,
    color: 'white',
    marginLeft: 4,
    fontWeight: '500',
  },
  quickActionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  quickAction: {
    alignItems: 'center',
  },
  quickActionText: {
    fontSize: 10,
    color: 'white',
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    marginBottom: 8,
    flexBasis: '48%',
  },
  liveBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  livePulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'white',
    marginRight: 4,
  },
  liveText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  pendingBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF9800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendingText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  // Button Styles
  primaryButton: {
    backgroundColor: '#2962ff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  successButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  warningButton: {
    backgroundColor: '#FF9800',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  dangerButton: {
    backgroundColor: '#F44336',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#9E9E9E',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  buttonLarge: {
    paddingVertical: 16,
  },
  buttonSmall: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonTextLarge: {
    fontSize: 16,
  },
  buttonTextSmall: {
    fontSize: 12,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  createModal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    color: '#333',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  // ✅ ADDED: Form Layout Styles
  formRow: {
    flexDirection: 'row',
    marginHorizontal: -8,
    marginBottom: 16,
  },
  formColumn: {
    flex: 1,
    paddingHorizontal: 8,
  },
  // ✅ ADDED: Date Picker Styles
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  datePickerText: {
    marginLeft: 8,
    color: '#333',
    fontSize: 14,
  },
  // ✅ ADDED: Input with Button Styles
  inputWithButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  generateButton: {
    backgroundColor: '#2962ff',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  generateButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  gameSelection: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  gameOption: {
    marginRight: 12,
  },
  gameOptionSelected: {
    // No additional styles needed
  },
  gameOptionContent: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  gameOptionContentSelected: {
    backgroundColor: '#2962ff',
    borderColor: '#2962ff',
  },
  gameOptionText: {
    fontSize: 12,
    color: '#333',
    marginTop: 4,
  },
  gameOptionTextSelected: {
    color: 'white',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 8,
  },
});

export default MatchControlScreen;
