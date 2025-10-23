// screens/MatchControlScreen.js - COMPLETE FIXED VERSION
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

// 🆕 Enhanced Match Card with Prize Distribution Indicators
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

  // 🆕 FIX: Null check for prizePool
  const displayPrizePool = match?.prizePool || 0;

  return (
    <TouchableOpacity
      onLongPress={() => onSelect(match.id)}
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
        {/* Selection Checkbox */}
        {isSelected && (
          <View style={styles.selectionOverlay}>
            <Ionicons name="checkmark-circle" size={24} color="#2962ff" />
          </View>
        )}

        <TouchableOpacity
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={() => onSelect(match.id)}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#1a1f3d', '#2d1b69']}
            style={styles.cardGradient}
          >
            {/* 🆕 PRIZE DISTRIBUTED BADGE - Visual Indicator */}
            {match.prizeDistributed && (
              <View style={styles.prizeDistributedBadge}>
                <Ionicons name="trophy" size={12} color="#FFD700" />
                <Text style={styles.prizeDistributedText}>PRIZES DISTRIBUTED</Text>
              </View>
            )}

            {/* Match Header */}
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
                </View>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(match.status) }]}>
                <Ionicons name={getStatusIcon(match.status)} size={12} color="white" />
                <Text style={styles.statusText}>{match.status.toUpperCase()}</Text>
              </View>
            </View>

            {/* Match Stats */}
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
                <Text style={styles.statValue}>{match.currentPlayers}/{match.maxPlayers}</Text>
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

            {/* Progress Bar */}
            <ProgressBar 
              progress={match.currentPlayers} 
              total={match.maxPlayers} 
              color={GAMES[match.game]?.color || '#2962ff'}
            />

            {/* Additional Match Information */}
            {(match.requirements || match.streamLink || match.contactInfo) && (
              <View style={styles.additionalInfo}>
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

            {/* Room Information */}
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

            {/* Quick Actions Bar */}
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
                onPress={() => onAction(match.id, 'share')}
              >
                <Ionicons name="share-social" size={14} color="#4CAF50" />
                <Text style={styles.quickActionText}>Share</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.quickAction}
                onPress={() => onAction(match.id, 'analytics')}
              >
                <Ionicons name="stats-chart" size={14} color="#FF9800" />
                <Text style={styles.quickActionText}>Stats</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.quickAction}
                onPress={() => onAction(match.id, 'duplicate')}
              >
                <Ionicons name="duplicate" size={14} color="#9C27B0" />
                <Text style={styles.quickActionText}>Duplicate</Text>
              </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              {match.status === 'live' && (
                <SimpleButton
                  title="MANAGE LIVE"
                  onPress={() => onAction(match.id, 'manage')}
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
                    onPress={() => onAction(match.id, 'edit')}
                    type="warning"
                    size="small"
                    icon="create-outline"
                    style={styles.actionButton}
                  />
                  <SimpleButton
                    title="START"
                    onPress={() => onAction(match.id, 'start')}
                    type="success"
                    size="small"
                    icon="play"
                    style={styles.actionButton}
                  />
                  <SimpleButton
                    title="CANCEL"
                    onPress={() => onAction(match.id, 'cancel')}
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
                    onPress={() => onAction(match.id, 'approve')}
                    type="success"
                    size="small"
                    icon="checkmark-circle"
                    style={styles.actionButton}
                  />
                  <SimpleButton
                    title="REJECT"
                    onPress={() => onAction(match.id, 'reject')}
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
                    onPress={() => onAction(match.id, 'verify')}
                    type="warning"
                    size="small"
                    icon="shield-checkmark"
                    style={styles.actionButton}
                  />
                  <SimpleButton
                    title={match.prizeDistributed ? "PRIZES SENT" : "DISTRIBUTE PRIZES"}
                    onPress={() => onAction(match.id, 'distribute')}
                    type={match.prizeDistributed ? "success" : "primary"}
                    size="small"
                    icon={match.prizeDistributed ? "checkmark-done" : "gift-outline"}
                    style={styles.actionButton}
                  />
                </>
              )}
              <SimpleButton
                title="ANALYTICS"
                onPress={() => onAction(match.id, 'analytics')}
                type="secondary"
                size="small"
                icon="stats-chart"
                style={styles.actionButton}
              />
            </View>

            {/* Live Badge */}
            {match.status === 'live' && (
              <View style={styles.liveBadge}>
                <View style={styles.livePulse} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            )}

            {/* Pending Badge */}
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

// 🆕 FIXED Prize Distribution Modal with NULL CHECKS
const PrizeDistributionModal = ({ visible, match, onClose, onDistribute }) => {
  const slideAnim = useRef(new Animated.Value(height)).current;
  const [winners, setWinners] = useState([]);
  const [isDistributing, setIsDistributing] = useState(false);

  useEffect(() => {
    if (visible && match) {
      // 🆕 FIX: Null check for prizePool
      const prizePool = match?.prizePool || 0;
      
      const generatedWinners = [
        {
          id: '1',
          playerName: 'ProPlayer',
          playerId: 'USER001',
          rank: 1,
          kills: 8,
          damage: 2450,
          prize: Math.round(prizePool * 0.4),
          walletAddress: '0x742d35Cc6634C0532925a3b8D'
        },
        {
          id: '2',
          playerName: 'GamerKing',
          playerId: 'USER002',
          rank: 2,
          kills: 6,
          damage: 1800,
          prize: Math.round(prizePool * 0.3),
          walletAddress: '0x842d35Cc6634C0532925a3b8E'
        }
      ];
      
      setWinners(generatedWinners);
      
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(slideAnim, {
        toValue: height,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, match]);

  const handlePrizeChange = (winnerId, newPrize) => {
    setWinners(prev => 
      prev.map(winner => 
        winner.id === winnerId 
          ? { ...winner, prize: parseInt(newPrize) || 0 }
          : winner
      )
    );
  };

  const handleDistribute = async () => {
    if (winners.length === 0) {
      Alert.alert('No Winners', 'Please add winners before distributing prizes.');
      return;
    }

    if (!match) {
      Alert.alert('Error', 'Match data not found.');
      return;
    }

    // 🆕 FIX: Null check for prizePool
    const prizePool = match?.prizePool || 0;
    const totalDistributed = winners.reduce((sum, winner) => sum + (winner.prize || 0), 0);
    
    if (totalDistributed > prizePool) {
      Alert.alert('Insufficient Funds', `Total distribution (৳${totalDistributed}) exceeds prize pool (৳${prizePool})`);
      return;
    }

    setIsDistributing(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onDistribute(winners);
      Alert.alert('Success! 🎉', `Prizes distributed to ${winners.length} winners!`);
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Distribution Failed', 'Please try again later.');
    } finally {
      setIsDistributing(false);
    }
  };

  if (!match) return null;

  // 🆕 FIX: Null check for prizePool
  const prizePool = match?.prizePool || 0;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose}/>
        <Animated.View style={[styles.prizeModal, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>💰 Distribute Prizes</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <Text style={styles.modalLabel}>Match: {match.title}</Text>
            <View style={styles.prizeSummary}>
              <Text style={styles.prizePoolText}>Total Prize Pool: ৳{prizePool}</Text>
            </View>

            <View style={styles.winnersList}>
              <Text style={styles.sectionTitle}>Winner Distribution</Text>
              {winners.map((winner) => (
                <View key={winner.id} style={styles.winnerItem}>
                  <View style={styles.winnerPosition}>
                    <Text style={styles.positionText}>#{winner.rank}</Text>
                    <Ionicons name="trophy" size={20} color="#FFD700" />
                  </View>
                  <View style={styles.winnerInfo}>
                    <Text style={styles.winnerName}>{winner.playerName}</Text>
                    <Text style={styles.winnerStats}>{winner.kills} Kills • {winner.damage} Damage</Text>
                  </View>
                  <View style={styles.prizeInputContainer}>
                    <Text style={styles.prizeLabel}>Prize (৳)</Text>
                    <TextInput
                      style={styles.prizeInput}
                      value={winner.prize?.toString() || '0'}
                      onChangeText={(text) => handlePrizeChange(winner.id, text)}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              ))}
            </View>

            <SimpleButton
              title={isDistributing ? "DISTRIBUTING..." : "CONFIRM DISTRIBUTION"}
              onPress={handleDistribute}
              type="success"
              size="large"
              icon="gift"
              disabled={isDistributing}
              style={styles.distributeButton}
            />
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

// 🆕 FIXED Edit Match Modal
const EditMatchModal = ({ visible, match, onClose, onSave }) => {
  const slideAnim = useRef(new Animated.Value(height)).current;
  const [editedMatch, setEditedMatch] = useState(null);

  useEffect(() => {
    if (visible && match) {
      setEditedMatch({...match});
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(slideAnim, {
        toValue: height,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, match]);

  const handleSave = () => {
    if (!editedMatch.title || !editedMatch.entryFee || !editedMatch.prizePool) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    onSave(editedMatch);
    onClose();
  };

  if (!visible || !match || !editedMatch) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose}/>
        <Animated.View style={[styles.editModal, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Match</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <Text style={styles.modalLabel}>Match Title *</Text>
            <TextInput
              style={styles.modalInput}
              value={editedMatch.title}
              onChangeText={(text) => setEditedMatch(prev => ({ ...prev, title: text }))}
            />

            <View style={styles.rowInputs}>
              <View style={styles.halfInput}>
                <Text style={styles.modalLabel}>Entry Fee (৳) *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editedMatch.entryFee?.toString() || '0'}
                  onChangeText={(text) => setEditedMatch(prev => ({ ...prev, entryFee: parseInt(text) || 0 }))}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.modalLabel}>Prize Pool (৳) *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editedMatch.prizePool?.toString() || '0'}
                  onChangeText={(text) => setEditedMatch(prev => ({ ...prev, prizePool: parseInt(text) || 0 }))}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.rowInputs}>
              <View style={styles.halfInput}>
                <Text style={styles.modalLabel}>Max Players</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editedMatch.maxPlayers?.toString() || '0'}
                  onChangeText={(text) => setEditedMatch(prev => ({ ...prev, maxPlayers: parseInt(text) || 0 }))}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.modalLabel}>Per Kill Prize (৳)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editedMatch.perKill?.toString() || '0'}
                  onChangeText={(text) => setEditedMatch(prev => ({ ...prev, perKill: parseInt(text) || 0 }))}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <SimpleButton title="CANCEL" onPress={onClose} type="secondary" style={styles.modalButton}/>
              <SimpleButton title="SAVE CHANGES" onPress={handleSave} type="primary" style={styles.modalButton}/>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

// 🆕 FIXED Analytics Modal
const AnalyticsModal = ({ visible, matches, onClose }) => {
  const slideAnim = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(slideAnim, {
        toValue: height,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  // 🆕 FIX: Null checks for all calculations
  const totalRevenue = matches.reduce((sum, match) => sum + ((match.entryFee || 0) * (match.currentPlayers || 0)), 0);
  const totalPlayers = matches.reduce((sum, match) => sum + (match.currentPlayers || 0), 0);
  const liveMatches = matches.filter(m => m.status === 'live').length;
  const completedMatches = matches.filter(m => m.status === 'completed').length;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose}/>
        <Animated.View style={[styles.analyticsModal, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>📊 Match Analytics</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.analyticsGrid}>
              <View style={styles.analyticCard}>
                <Ionicons name="cash" size={24} color="#4CAF50" />
                <Text style={styles.analyticValue}>৳{totalRevenue}</Text>
                <Text style={styles.analyticLabel}>Total Revenue</Text>
              </View>
              <View style={styles.analyticCard}>
                <Ionicons name="people" size={24} color="#2962ff" />
                <Text style={styles.analyticValue}>{totalPlayers}</Text>
                <Text style={styles.analyticLabel}>Total Players</Text>
              </View>
              <View style={styles.analyticCard}>
                <Ionicons name="play-circle" size={24} color="#FF4444" />
                <Text style={styles.analyticValue}>{liveMatches}</Text>
                <Text style={styles.analyticLabel}>Live Matches</Text>
              </View>
              <View style={styles.analyticCard}>
                <Ionicons name="checkmark-done" size={24} color="#2196F3" />
                <Text style={styles.analyticValue}>{completedMatches}</Text>
                <Text style={styles.analyticLabel}>Completed</Text>
              </View>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

// 🆕 UPDATED Create Match Modal - KEEPING ALL PREVIOUS FIELDS + ADDING MATCH TYPE & ROOM INFO
const CreateMatchModal = ({ visible, onClose, onCreate }) => {
  const slideAnim = useRef(new Animated.Value(height)).current;
  const [newMatch, setNewMatch] = useState({
    title: '',
    game: 'freefire',
    type: 'Squad',
    map: 'Bermuda',
    entryFee: 20,
    prizePool: 500,
    maxPlayers: 50,
    perKill: 10,
    
    // 🆕 NEWLY ADDED FIELDS
    matchType: 'match', // 'match' or 'tournament'
    roomId: '',
    password: '',
    
    // ALL EXISTING FIELDS PRESERVED
    matchDescription: '',
    matchRules: '',
    requirements: '',
    streamLink: '',
    contactInfo: '',
    matchDuration: '30',
    registrationDeadline: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
    scheduleTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    serverRegion: 'Asia',
    matchFormat: 'Custom Room',
    teamSize: 4,
    maxTeams: 12,
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
    matchHashtag: '#GamingMatch',
    socialMediaShare: true,
    autoStart: true,
    practiceRoom: true
  });
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showRegDatePicker, setShowRegDatePicker] = useState(false);

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(slideAnim, {
        toValue: height,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleCreate = () => {
    if (!newMatch.title || !newMatch.entryFee || !newMatch.prizePool || !newMatch.roomId || !newMatch.password) {
      Alert.alert('Error', 'Please fill all required fields (*)');
      return;
    }

    const match = {
      ...newMatch,
      id: Date.now().toString(),
      currentPlayers: 0,
      status: 'upcoming',
      createdAt: new Date().toISOString(),
      prizeDistributed: false
    };

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

            {/* 🆕 NEW: Match Type Selection */}
            <Text style={styles.modalLabel}>Match Type *</Text>
            <View style={styles.typeButtons}>
              <TouchableOpacity 
                style={[
                  styles.typeButton,
                  newMatch.matchType === 'match' && styles.typeButtonActive
                ]}
                onPress={() => setNewMatch(prev => ({ ...prev, matchType: 'match' }))}
              >
                <Ionicons 
                  name="game-controller" 
                  size={20} 
                  color={newMatch.matchType === 'match' ? 'white' : '#2962ff'} 
                />
                <Text style={[
                  styles.typeButtonText,
                  newMatch.matchType === 'match' && styles.typeButtonTextActive
                ]}>
                  Regular Match
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.typeButton,
                  newMatch.matchType === 'tournament' && styles.typeButtonActive
                ]}
                onPress={() => setNewMatch(prev => ({ ...prev, matchType: 'tournament' }))}
              >
                <Ionicons 
                  name="trophy" 
                  size={20} 
                  color={newMatch.matchType === 'tournament' ? 'white' : '#FFD700'} 
                />
                <Text style={[
                  styles.typeButtonText,
                  newMatch.matchType === 'tournament' && styles.typeButtonTextActive
                ]}>
                  Tournament
                </Text>
              </TouchableOpacity>
            </View>

            {/* EXISTING TITLE FIELD */}
            <Text style={styles.modalLabel}>Match Title *</Text>
            <TextInput
              style={styles.modalInput}
              value={newMatch.title}
              onChangeText={(text) => setNewMatch(prev => ({ ...prev, title: text }))}
              placeholder="Enter match title"
            />

            {/* EXISTING DESCRIPTION FIELD */}
            <Text style={styles.modalLabel}>Match Description</Text>
            <TextInput
              style={[styles.modalInput, styles.textArea]}
              value={newMatch.matchDescription}
              onChangeText={(text) => setNewMatch(prev => ({ ...prev, matchDescription: text }))}
              placeholder="Describe your match..."
              multiline
              numberOfLines={3}
            />

            {/* EXISTING GAME SELECTION */}
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

            {/* EXISTING MODE AND MAP SELECTION */}
            <View style={styles.rowInputs}>
              <View style={styles.halfInput}>
                <Text style={styles.modalLabel}>Game Mode</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.modeSelection}>
                    {GAMES[newMatch.game]?.modes.map((mode) => (
                      <TouchableOpacity
                        key={mode}
                        style={[styles.modeOption, newMatch.type === mode && styles.modeOptionSelected]}
                        onPress={() => setNewMatch(prev => ({ ...prev, type: mode }))}
                      >
                        <Text style={[styles.modeOptionText, newMatch.type === mode && styles.modeOptionTextSelected]}>
                          {mode}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.modalLabel}>Map</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.mapSelection}>
                    {GAMES[newMatch.game]?.maps.map((map) => (
                      <TouchableOpacity
                        key={map}
                        style={[styles.mapOption, newMatch.map === map && styles.mapOptionSelected]}
                        onPress={() => setNewMatch(prev => ({ ...prev, map: map }))}
                      >
                        <Text style={[styles.mapOptionText, newMatch.map === map && styles.mapOptionTextSelected]}>
                          {map}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>

            {/* 🆕 NEW: Room Information Section */}
            <Text style={styles.sectionTitle}>🔑 Room Information</Text>

            <View style={styles.rowInputs}>
              <View style={styles.halfInput}>
                <Text style={styles.modalLabel}>Room ID *</Text>
                <View style={styles.roomInputContainer}>
                  <TextInput
                    style={[styles.modalInput, styles.roomInput]}
                    value={newMatch.roomId}
                    onChangeText={(text) => setNewMatch(prev => ({ ...prev, roomId: text }))}
                    placeholder="Enter room ID"
                  />
                  <TouchableOpacity style={styles.generateButton} onPress={generateRoomId}>
                    <Ionicons name="refresh" size={16} color="#2962ff" />
                    <Text style={styles.generateButtonText}>Generate</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.modalLabel}>Password *</Text>
                <View style={styles.roomInputContainer}>
                  <TextInput
                    style={[styles.modalInput, styles.roomInput]}
                    value={newMatch.password}
                    onChangeText={(text) => setNewMatch(prev => ({ ...prev, password: text }))}
                    placeholder="Enter password"
                  />
                  <TouchableOpacity style={styles.generateButton} onPress={generatePassword}>
                    <Ionicons name="refresh" size={16} color="#2962ff" />
                    <Text style={styles.generateButtonText}>Generate</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <Text style={styles.sectionTitle}>💰 Prize & Entry Details</Text>

            {/* EXISTING ENTRY FEE & PRIZE POOL */}
            <View style={styles.rowInputs}>
              <View style={styles.halfInput}>
                <Text style={styles.modalLabel}>Entry Fee (৳) *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newMatch.entryFee.toString()}
                  onChangeText={(text) => setNewMatch(prev => ({ ...prev, entryFee: parseInt(text) || 0 }))}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.modalLabel}>Prize Pool (৳) *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newMatch.prizePool.toString()}
                  onChangeText={(text) => setNewMatch(prev => ({ ...prev, prizePool: parseInt(text) || 0 }))}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* EXISTING MAX PLAYERS & PER KILL */}
            <View style={styles.rowInputs}>
              <View style={styles.halfInput}>
                <Text style={styles.modalLabel}>Max Players *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newMatch.maxPlayers.toString()}
                  onChangeText={(text) => setNewMatch(prev => ({ ...prev, maxPlayers: parseInt(text) || 0 }))}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.modalLabel}>Per Kill Prize (৳)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newMatch.perKill.toString()}
                  onChangeText={(text) => setNewMatch(prev => ({ ...prev, perKill: parseInt(text) || 0 }))}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* EXISTING PRIZE DISTRIBUTION */}
            <Text style={styles.modalLabel}>Prize Distribution</Text>
            <TextInput
              style={styles.modalInput}
              value={newMatch.prizeDistribution}
              onChangeText={(text) => setNewMatch(prev => ({ ...prev, prizeDistribution: text }))}
              placeholder="E.g., 50-30-20 for 1st,2nd,3rd"
            />

            {/* EXISTING BONUS PRIZES */}
            <Text style={styles.modalLabel}>Bonus Prizes</Text>
            <TextInput
              style={styles.modalInput}
              value={newMatch.bonusPrizes}
              onChangeText={(text) => setNewMatch(prev => ({ ...prev, bonusPrizes: text }))}
              placeholder="E.g., Most Kills: ৳50"
            />

            {/* EXISTING SCHEDULE SECTION */}
            <Text style={styles.sectionTitle}>⏰ Schedule & Timing</Text>

            <Text style={styles.modalLabel}>Match Schedule Time *</Text>
            <TouchableOpacity style={styles.datePickerButton} onPress={() => setShowDatePicker(true)}>
              <Ionicons name="calendar" size={20} color="#2962ff" />
              <Text style={styles.datePickerText}>{new Date(newMatch.scheduleTime).toLocaleString()}</Text>
            </TouchableOpacity>

            <Text style={styles.modalLabel}>Registration Deadline</Text>
            <TouchableOpacity style={styles.datePickerButton} onPress={() => setShowRegDatePicker(true)}>
              <Ionicons name="time-outline" size={20} color="#2962ff" />
              <Text style={styles.datePickerText}>{new Date(newMatch.registrationDeadline).toLocaleString()}</Text>
            </TouchableOpacity>

            <View style={styles.rowInputs}>
              <View style={styles.halfInput}>
                <Text style={styles.modalLabel}>Match Duration (min)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newMatch.matchDuration}
                  onChangeText={(text) => setNewMatch(prev => ({ ...prev, matchDuration: text }))}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.modalLabel}>Check-in Time (min)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newMatch.checkInTime}
                  onChangeText={(text) => setNewMatch(prev => ({ ...prev, checkInTime: text }))}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* EXISTING RULES SECTION */}
            <Text style={styles.sectionTitle}>📋 Rules & Requirements</Text>

            <Text style={styles.modalLabel}>Match Rules</Text>
            <TextInput
              style={[styles.modalInput, styles.textArea]}
              value={newMatch.matchRules}
              onChangeText={(text) => setNewMatch(prev => ({ ...prev, matchRules: text }))}
              placeholder="Enter match rules..."
              multiline
              numberOfLines={4}
            />

            <Text style={styles.modalLabel}>Player Requirements</Text>
            <TextInput
              style={[styles.modalInput, styles.textArea]}
              value={newMatch.requirements}
              onChangeText={(text) => setNewMatch(prev => ({ ...prev, requirements: text }))}
              placeholder="E.g., Level 20+, Microphone required..."
              multiline
              numberOfLines={3}
            />

            <View style={styles.rowInputs}>
              <View style={styles.halfInput}>
                <Text style={styles.modalLabel}>Minimum Level</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newMatch.minLevel}
                  onChangeText={(text) => setNewMatch(prev => ({ ...prev, minLevel: text }))}
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.modalLabel}>Maximum Level</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newMatch.maxLevel}
                  onChangeText={(text) => setNewMatch(prev => ({ ...prev, maxLevel: text }))}
                />
              </View>
            </View>

            {/* EXISTING ADVANCED SETTINGS */}
            <Text style={styles.sectionTitle}>🔧 Advanced Settings</Text>

            <View style={styles.rowInputs}>
              <View style={styles.halfInput}>
                <Text style={styles.modalLabel}>Server Region</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newMatch.serverRegion}
                  onChangeText={(text) => setNewMatch(prev => ({ ...prev, serverRegion: text }))}
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.modalLabel}>Ping Limit</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newMatch.pingLimit}
                  onChangeText={(text) => setNewMatch(prev => ({ ...prev, pingLimit: text }))}
                />
              </View>
            </View>

            <View style={styles.switchContainer}>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Anti-Cheat Required</Text>
                <Switch value={newMatch.antiCheatRequired} onValueChange={(value) => setNewMatch(prev => ({ ...prev, antiCheatRequired: value }))}/>
              </View>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Allow Spectators</Text>
                <Switch value={newMatch.allowSpectators} onValueChange={(value) => setNewMatch(prev => ({ ...prev, allowSpectators: value }))}/>
              </View>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Public Match</Text>
                <Switch value={newMatch.isPublic} onValueChange={(value) => setNewMatch(prev => ({ ...prev, isPublic: value }))}/>
              </View>
            </View>

            {/* EXISTING CONTACT INFORMATION */}
            <Text style={styles.sectionTitle}>📞 Contact Information</Text>

            <Text style={styles.modalLabel}>Contact Info *</Text>
            <TextInput
              style={styles.modalInput}
              value={newMatch.contactInfo}
              onChangeText={(text) => setNewMatch(prev => ({ ...prev, contactInfo: text }))}
              placeholder="WhatsApp/Telegram"
            />

            <Text style={styles.modalLabel}>Organizer Name</Text>
            <TextInput
              style={styles.modalInput}
              value={newMatch.organizerName}
              onChangeText={(text) => setNewMatch(prev => ({ ...prev, organizerName: text }))}
              placeholder="Your name or organization"
            />

            <Text style={styles.modalLabel}>Support Contact</Text>
            <TextInput
              style={styles.modalInput}
              value={newMatch.supportContact}
              onChangeText={(text) => setNewMatch(prev => ({ ...prev, supportContact: text }))}
              placeholder="Additional support contact"
            />

            {/* Date Pickers */}
            {showDatePicker && (
              <DateTimePicker value={new Date(newMatch.scheduleTime)} mode="datetime" display="default" onChange={handleDateChange}/>
            )}
            {showRegDatePicker && (
              <DateTimePicker value={new Date(newMatch.registrationDeadline)} mode="datetime" display="default" onChange={handleRegDateChange}/>
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

// 🆕 MAIN COMPONENT - ALL FUNCTIONALITIES FIXED
const MatchControlScreen = ({ navigation }) => {
  const [matches, setMatches] = useState([
    {
      id: '1',
      title: 'Free Fire Squad Battle',
      game: 'freefire',
      type: 'Squad',
      map: 'Bermuda',
      entryFee: 20,
      prizePool: 500,
      maxPlayers: 50,
      currentPlayers: 42,
      perKill: 10,
      roomId: '123456',
      password: 'ff2024',
      status: 'live',
      scheduleTime: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      prizeDistributed: false,
      matchType: 'match' // 🆕 ADDED
    },
    {
      id: '2',
      title: 'PUBG Mobile Tournament',
      game: 'pubg',
      type: 'Squad',
      map: 'Erangel',
      entryFee: 50,
      prizePool: 2000,
      maxPlayers: 100,
      currentPlayers: 78,
      perKill: 20,
      roomId: '789012',
      password: 'pubg123',
      status: 'upcoming',
      scheduleTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      prizeDistributed: false,
      matchType: 'tournament' // 🆕 ADDED
    },
    {
      id: '3',
      title: 'COD Mobile MP Match',
      game: 'cod',
      type: 'MP',
      map: 'Standoff',
      entryFee: 25,
      prizePool: 600,
      maxPlayers: 80,
      currentPlayers: 65,
      perKill: 12,
      roomId: '345678',
      password: 'cod2024',
      status: 'completed',
      scheduleTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      prizeDistributed: true,
      matchType: 'match' // 🆕 ADDED
    }
  ]);

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

  const filteredMatches = matches.filter(match => {
    const matchesSearch = match.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         match.game.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'req') return matchesSearch && match.status === 'pending';
    return matchesSearch && match.status === activeTab;
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await new Promise(resolve => setTimeout(resolve, 2000));
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

  // 🆕 FIXED: All action handlers now working properly
  const handleMatchAction = (matchId, action) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const match = matches.find(m => m.id === matchId);
    
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
        setMatches(prev => prev.map(m => 
          m.id === matchId ? { ...m, status: 'live' } : m
        ));
        Alert.alert('Match Started', `${match.title} is now LIVE!`);
        break;
      case 'cancel':
        Alert.alert('Cancel Match', `Cancel "${match.title}"?`, [
          { text: 'No', style: 'cancel' },
          { 
            text: 'Yes', 
            style: 'destructive',
            onPress: () => {
              setMatches(prev => prev.map(m => 
                m.id === matchId ? { ...m, status: 'cancelled' } : m
              ));
              Alert.alert('Match Cancelled', 'The match has been cancelled.');
            }
          }
        ]);
        break;
      case 'approve':
        setMatches(prev => prev.map(m => 
          m.id === matchId ? { ...m, status: 'upcoming' } : m
        ));
        Alert.alert('Match Approved', 'The match has been approved.');
        break;
      case 'reject':
        setMatches(prev => prev.map(m => 
          m.id === matchId ? { ...m, status: 'cancelled' } : m
        ));
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
        Clipboard.setStringAsync(`Join my match: ${match.title}\nRoom ID: ${match.roomId}\nPassword: ${match.password}\nPrize: ৳${match.prizePool || 0}`);
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
          createdAt: new Date().toISOString(),
          prizeDistributed: false
        };
        setMatches(prev => [duplicatedMatch, ...prev]);
        Alert.alert('Duplicated!', 'Match duplicated successfully!');
        break;
      default:
        break;
    }
  };

  const handlePrizeDistribution = (winners) => {
    if (!distributingMatch) return;
    
    setMatches(prev => prev.map(m => 
      m.id === distributingMatch.id 
        ? { ...m, prizeDistributed: true }
        : m
    ));
    
    setDistributingMatch(null);
    setShowPrizeModal(false);
  };

  const handleCreateMatch = (newMatch) => {
    const matchWithDefaults = {
      ...newMatch,
      roomId: newMatch.roomId || Math.random().toString(36).substring(2, 8).toUpperCase(),
      password: newMatch.password || Math.random().toString(36).substring(2, 6).toUpperCase(),
      currentPlayers: Math.floor(Math.random() * newMatch.maxPlayers * 0.8),
      status: 'upcoming',
      createdAt: new Date().toISOString(),
      prizeDistributed: false
    };

    setMatches(prev => [matchWithDefaults, ...prev]);
    Alert.alert('Success!', 'Match created successfully! 🎉');
  };

  const handleSaveMatch = (updatedMatch) => {
    setMatches(prev => prev.map(m => 
      m.id === updatedMatch.id ? updatedMatch : m
    ));
    Alert.alert('Success!', 'Match updated successfully!');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Match Control</Text>
              <Text style={styles.headerSubtitle}>Admin Dashboard</Text>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerActionButton} onPress={() => setShowAnalytics(true)}>
                <Ionicons name="stats-chart" size={20} color="white" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerActionButton} onPress={() => setShowCreateModal(true)}>
                <Ionicons name="add" size={20} color="white" />
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

      <View style={styles.tabContainer}>
        {['all', 'req', 'live', 'upcoming', 'completed', 'cancelled'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Ionicons 
              name={
                tab === 'all' ? 'grid' :
                tab === 'req' ? 'time-outline' :
                tab === 'live' ? 'play-circle' :
                tab === 'upcoming' ? 'time' : 
                tab === 'completed' ? 'checkmark-done' : 'close-circle'
              } 
              size={14} 
              color={activeTab === tab ? 'white' : '#b0b8ff'} 
            />
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'req' ? 'Pending' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.matchesListContainer}>
        <FlatList
          data={filteredMatches}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <MatchCard
              match={item}
              index={index}
              onAction={handleMatchAction}
              isSelected={selectedMatches.includes(item.id)}
              onSelect={handleMatchSelect}
            />
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#2962ff']}/>}
          contentContainerStyle={[styles.matchesListContent, filteredMatches.length === 0 && styles.emptyListContent]}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="trophy-outline" size={64} color="#666" />
              <Text style={styles.emptyText}>No matches found</Text>
              <Text style={styles.emptySubtext}>
                {searchQuery ? 'Try a different search' : 'Create your first match to get started'}
              </Text>
              <SimpleButton
                title="CREATE FIRST MATCH"
                onPress={() => setShowCreateModal(true)}
                type="primary"
                size="large"
                icon="add"
                style={styles.createFirstButton}
              />
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* All Modals */}
      <CreateMatchModal visible={showCreateModal} onClose={() => setShowCreateModal(false)} onCreate={handleCreateMatch}/>
      <EditMatchModal visible={showEditModal} match={editingMatch} onClose={() => setShowEditModal(false)} onSave={handleSaveMatch}/>
      <PrizeDistributionModal visible={showPrizeModal} match={distributingMatch} onClose={() => setShowPrizeModal(false)} onDistribute={handlePrizeDistribution}/>
      <AnalyticsModal visible={showAnalytics} matches={matches} onClose={() => setShowAnalytics(false)}/>

      <SimpleButton title="CREATE MATCH" onPress={() => setShowCreateModal(true)} type="primary" size="large" icon="add" style={styles.fab}/>
    </SafeAreaView>
  );
};

// Styles
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0a0c23' },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, backgroundColor: 'rgba(10, 12, 35, 1)' },
  headerContent: { marginTop: 5 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  headerTitleContainer: { alignItems: 'center', flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: 'white' },
  headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerActionButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10 },
  searchInput: { flex: 1, color: 'white', fontSize: 13, marginLeft: 8 },
  tabContainer: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', margin: 12, marginBottom: 8, borderRadius: 10, padding: 3 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, gap: 4 },
  tabActive: { backgroundColor: '#2962ff' },
  tabText: { color: '#b0b8ff', fontSize: 11, fontWeight: 'bold' },
  tabTextActive: { color: 'white' },
  matchesListContainer: { flex: 1, marginBottom: 8 },
  matchesListContent: { padding: 12, paddingBottom: 100 },
  emptyListContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyText: { color: '#666', fontSize: 16, fontWeight: 'bold', marginTop: 16, textAlign: 'center' },
  emptySubtext: { color: '#666', fontSize: 14, marginTop: 8, textAlign: 'center' },
  createFirstButton: { marginTop: 20 },
  fab: { position: 'absolute', bottom: 24, right: 24, zIndex: 100 },
  
  // Button Styles
  primaryButton: { backgroundColor: '#2962ff', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  successButton: { backgroundColor: '#4CAF50', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  warningButton: { backgroundColor: '#FF9800', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  dangerButton: { backgroundColor: '#F44336', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  secondaryButton: { backgroundColor: '#6B7280', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  buttonLarge: { paddingHorizontal: 24, paddingVertical: 16 },
  buttonSmall: { paddingHorizontal: 12, paddingVertical: 8 },
  buttonDisabled: { backgroundColor: '#9CA3AF', opacity: 0.6 },
  buttonContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  buttonIcon: { marginRight: 8 },
  primaryButtonText: { color: 'white', fontSize: 14, fontWeight: 'bold' },
  successButtonText: { color: 'white', fontSize: 14, fontWeight: 'bold' },
  warningButtonText: { color: 'white', fontSize: 14, fontWeight: 'bold' },
  dangerButtonText: { color: 'white', fontSize: 14, fontWeight: 'bold' },
  secondaryButtonText: { color: 'white', fontSize: 14, fontWeight: 'bold' },
  buttonTextLarge: { fontSize: 16 },
  buttonTextSmall: { fontSize: 12 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBackdrop: { flex: 1 },
  createModal: { backgroundColor: '#1a1f3d', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' },
  editModal: { backgroundColor: '#1a1f3d', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%' },
  prizeModal: { backgroundColor: '#1a1f3d', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%' },
  analyticsModal: { backgroundColor: '#1a1f3d', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  modalTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  modalBody: { padding: 16 },
  sectionTitle: { color: 'white', fontSize: 16, fontWeight: 'bold', marginTop: 16, marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  modalLabel: { color: 'white', fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
  modalInput: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: 12, color: 'white', fontSize: 14, marginBottom: 16 },
  textArea: { height: 80, textAlignVertical: 'top' },
  rowInputs: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  halfInput: { flex: 1 },
  
  // 🆕 NEW STYLES FOR UPDATED CREATE MODAL
  typeButtons: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  typeButton: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', padding: 16, borderRadius: 12, alignItems: 'center', gap: 8 },
  typeButtonActive: { backgroundColor: '#2962ff' },
  typeButtonText: { color: 'white', fontSize: 14, fontWeight: 'bold' },
  typeButtonTextActive: { color: 'white' },
  
  roomInputContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  roomInput: { flex: 1, marginBottom: 0 },
  generateButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(41, 98, 255, 0.2)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, gap: 4 },
  generateButtonText: { color: '#2962ff', fontSize: 12, fontWeight: 'bold' },

  gameSelection: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  gameOption: { borderRadius: 12, overflow: 'hidden' },
  gameOptionContent: { paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center', minWidth: 80, backgroundColor: 'rgba(255,255,255,0.1)' },
  gameOptionContentSelected: { backgroundColor: '#2962ff' },
  gameOptionSelected: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  gameOptionText: { color: 'white', fontSize: 12, fontWeight: 'bold', marginTop: 4 },
  gameOptionTextSelected: { color: 'white' },
  modeSelection: { flexDirection: 'row', gap: 8 },
  modeOption: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  modeOptionSelected: { backgroundColor: '#2962ff' },
  modeOptionText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  modeOptionTextSelected: { color: 'white' },
  mapSelection: { flexDirection: 'row', gap: 8 },
  mapOption: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  mapOptionSelected: { backgroundColor: '#2962ff' },
  mapOptionText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  mapOptionTextSelected: { color: 'white' },
  switchContainer: { marginBottom: 16 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  switchLabel: { color: 'white', fontSize: 14, flex: 1 },
  datePickerButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', padding: 12, borderRadius: 8, gap: 8, marginBottom: 16 },
  datePickerText: { color: 'white', fontSize: 14 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  modalButton: { flex: 1 },

  // Match Card Styles
  matchCard: { marginBottom: 12, borderRadius: 16, overflow: 'hidden', position: 'relative' },
  selectedMatchCard: { borderWidth: 2, borderColor: '#2962ff' },
  prizeDistributedBadge: { position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: '#4CAF50', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4, zIndex: 5 },
  prizeDistributedText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  prizeDistributedValue: { color: '#4CAF50', fontWeight: 'bold' },
  selectionOverlay: { position: 'absolute', top: 8, right: 8, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 12, padding: 4 },
  cardGradient: { padding: 16, borderRadius: 16 },
  matchHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  gameInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  gameIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  matchTitleContainer: { flex: 1 },
  matchTitle: { color: 'white', fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
  matchSubtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
  statusText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  matchStats: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { color: 'white', fontSize: 14, fontWeight: 'bold', marginVertical: 2 },
  statLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10 },
  progressSection: { marginBottom: 12 },
  progressBar: { height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  progressFill: { height: '100%', borderRadius: 3 },
  progressText: { color: 'rgba(255,255,255,0.7)', fontSize: 10, textAlign: 'center' },
  additionalInfo: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  infoItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
  infoText: { color: 'rgba(255,255,255,0.7)', fontSize: 10, maxWidth: 120 },
  roomInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  roomDetail: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  roomText: { color: '#2962ff', fontSize: 12, fontWeight: 'bold' },
  quickActionsBar: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12, paddingVertical: 8, borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  quickAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  quickActionText: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 'bold' },
  actionButtons: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  actionButton: { flex: 1, minWidth: 100 },
  liveBadge: { position: 'absolute', top: 12, right: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FF4444', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
  livePulse: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'white' },
  liveText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  pendingBadge: { position: 'absolute', top: 12, right: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FF9800', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
  pendingText: { color: 'white', fontSize: 10, fontWeight: 'bold' },

  // Analytics Styles
  analyticsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  analyticCard: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 16, borderRadius: 12, alignItems: 'center', minWidth: '45%', flex: 1 },
  analyticValue: { color: 'white', fontSize: 18, fontWeight: 'bold', marginVertical: 4 },
  analyticLabel: { color: '#b0b8ff', fontSize: 12 },

  // Prize Distribution Styles
  prizeSummary: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 8, marginBottom: 16 },
  prizePoolText: { color: 'white', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  winnersList: { marginBottom: 16 },
  winnerItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 8, marginBottom: 8, gap: 12 },
  winnerPosition: { alignItems: 'center', gap: 2 },
  positionText: { color: 'white', fontSize: 14, fontWeight: 'bold' },
  winnerInfo: { flex: 1 },
  winnerName: { color: 'white', fontSize: 14, fontWeight: 'bold' },
  winnerStats: { color: '#888', fontSize: 12 },
  prizeInputContainer: { alignItems: 'center' },
  prizeLabel: { color: '#888', fontSize: 10, marginBottom: 4 },
  prizeInput: { backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', padding: 8, borderRadius: 6, width: 80, textAlign: 'center', fontSize: 14 },
  distributeButton: { marginBottom: 16 },
});

export default MatchControlScreen;
