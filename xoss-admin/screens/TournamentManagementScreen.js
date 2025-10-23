// screens/TournamentManagementScreen.js - COMPLETE FIXED CODE
import React, { useState, useRef, useEffect } from 'react';
import { 
  View, Text, ScrollView, TouchableOpacity, StyleSheet, 
  TextInput, Alert, Animated, Dimensions, Modal, 
  RefreshControl, FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width, height } = Dimensions.get('window');

// Simple Button Component
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

// Game Configuration
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
  }
};

// Tournament Card Component
const TournamentCard = ({ tournament, index, onAction, isSelected, onSelect, onEdit, onStart, onManage, onViewResults, onDelete }) => {
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

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

  const getStatusColor = (status) => {
    switch(status) {
      case 'live': return '#4CAF50';
      case 'upcoming': return '#FF9800';
      case 'completed': return '#2196F3';
      case 'cancelled': return '#F44336';
      default: return '#666';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'live': return 'play-circle';
      case 'upcoming': return 'time';
      case 'completed': return 'checkmark-done';
      case 'cancelled': return 'close-circle';
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
          {progress}/{total} teams • {Math.round(percentage)}%
        </Text>
      </View>
    );
  };

  const handleAction = (action) => {
    switch(action) {
      case 'edit':
        onEdit(tournament);
        break;
      case 'start':
        onStart(tournament.id);
        break;
      case 'manage':
        onManage(tournament);
        break;
      case 'results':
        onViewResults(tournament);
        break;
      case 'share':
        onAction(tournament.id, 'share');
        break;
      case 'brackets':
        onAction(tournament.id, 'brackets');
        break;
      case 'analytics':
        onAction(tournament.id, 'analytics');
        break;
      default:
        onAction(tournament.id, action);
    }
  };

  return (
    <Animated.View style={[
      styles.tournamentCard,
      {
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }]
      }
    ]}>
      <TouchableOpacity 
        activeOpacity={0.9} 
        onPress={() => onSelect(tournament.id)}
        onLongPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onSelect(tournament.id);
        }}
      >
        <LinearGradient 
          colors={['#1a237e', '#283593']} 
          style={styles.cardGradient}
        >
          {/* Header Section */}
          <View style={styles.cardHeader}>
            <View style={styles.gameInfo}>
              <View style={[styles.gameIcon, { backgroundColor: GAMES[tournament.game]?.color || '#2962ff' }]}>
                <Ionicons name={GAMES[tournament.game]?.icon || 'trophy'} size={20} color="white" />
              </View>
              <View style={styles.tournamentTitleContainer}>
                <Text style={styles.tournamentTitle}>{tournament.title}</Text>
                <Text style={styles.tournamentSubtitle}>
                  {GAMES[tournament.game]?.name} • {tournament.mode} • {tournament.format}
                </Text>
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(tournament.status) }]}>
              <Ionicons name={getStatusIcon(tournament.status)} size={12} color="white" />
              <Text style={styles.statusText}>{tournament.status.toUpperCase()}</Text>
            </View>
          </View>

          {/* Stats Section */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons name="cash-outline" size={16} color="#4CAF50" />
              <Text style={styles.statValue}>৳{tournament.entryFee}</Text>
              <Text style={styles.statLabel}>Entry</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="trophy-outline" size={16} color="#FFD700" />
              <Text style={styles.statValue}>৳{tournament.prizePool}</Text>
              <Text style={styles.statLabel}>Prize</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="people-outline" size={16} color="#2962ff" />
              <Text style={styles.statValue}>{tournament.currentTeams}/{tournament.maxTeams}</Text>
              <Text style={styles.statLabel}>Teams</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={16} color="#FF9800" />
              <Text style={styles.statValue}>
                {new Date(tournament.scheduleTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </Text>
              <Text style={styles.statLabel}>Time</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <ProgressBar 
            progress={tournament.currentTeams} 
            total={tournament.maxTeams} 
            color={GAMES[tournament.game]?.color || '#2962ff'}
          />

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickAction} onPress={() => handleAction('share')}>
              <Ionicons name="share-social" size={16} color="#2962ff" />
              <Text style={styles.quickActionText}>Share</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickAction} onPress={() => handleAction('brackets')}>
              <Ionicons name="sitemap" size={16} color="#4CAF50" />
              <Text style={styles.quickActionText}>Brackets</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickAction} onPress={() => handleAction('analytics')}>
              <Ionicons name="stats-chart" size={16} color="#FF9800" />
              <Text style={styles.quickActionText}>Stats</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickAction} onPress={() => handleAction('more')}>
              <Ionicons name="ellipsis-horizontal" size={16} color="#666" />
              <Text style={styles.quickActionText}>More</Text>
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {tournament.status === 'live' && (
              <SimpleButton
                title="MANAGE LIVE"
                onPress={() => handleAction('manage')}
                type="danger"
                size="small"
                icon="play-circle"
                style={styles.actionButton}
              />
            )}
            {tournament.status === 'upcoming' && (
              <>
                <SimpleButton
                  title="EDIT"
                  onPress={() => handleAction('edit')}
                  type="warning"
                  size="small"
                  icon="create-outline"
                  style={styles.actionButton}
                />
                <SimpleButton
                  title="START"
                  onPress={() => handleAction('start')}
                  type="success"
                  size="small"
                  icon="play"
                  style={styles.actionButton}
                />
              </>
            )}
            {tournament.status === 'completed' && (
              <SimpleButton
                title="VIEW RESULTS"
                onPress={() => handleAction('results')}
                type="primary"
                size="small"
                icon="trophy"
                style={styles.actionButton}
              />
            )}
            {tournament.status === 'cancelled' && (
              <SimpleButton
                title="DELETE"
                onPress={() => onDelete(tournament.id)}
                type="danger"
                size="small"
                icon="trash"
                style={styles.actionButton}
              />
            )}
          </View>

          {/* Selection Indicator */}
          {isSelected && (
            <View style={styles.selectionIndicator}>
              <Ionicons name="checkmark-circle" size={20} color="#2962ff" />
            </View>
          )}

          {/* Live Badge */}
          {tournament.status === 'live' && (
            <View style={styles.liveBadge}>
              <View style={styles.livePulse} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Create/Edit Tournament Modal
const TournamentModal = ({ visible, onClose, onCreate, onUpdate, tournament, isEdit = false }) => {
  const slideAnim = useRef(new Animated.Value(height)).current;
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [newTournament, setNewTournament] = useState({
    title: '',
    game: 'freefire',
    format: 'Solo',
    mode: 'Single Elimination',
    entryFee: '100',
    prizePool: '2000',
    maxTeams: '16',
    totalRounds: '4',
    roomId: '',
    password: '',
    description: '',
    rules: '',
    contactInfo: '',
    scheduleDate: new Date(),
    scheduleTime: new Date()
  });

  useEffect(() => {
    if (isEdit && tournament) {
      const scheduleTime = new Date(tournament.scheduleTime);
      setNewTournament({
        ...tournament,
        entryFee: tournament.entryFee.toString(),
        prizePool: tournament.prizePool.toString(),
        maxTeams: tournament.maxTeams.toString(),
        totalRounds: tournament.totalRounds.toString(),
        scheduleDate: scheduleTime,
        scheduleTime: scheduleTime
      });
    } else {
      setNewTournament({
        title: '',
        game: 'freefire',
        format: 'Solo',
        mode: 'Single Elimination',
        entryFee: '100',
        prizePool: '2000',
        maxTeams: '16',
        totalRounds: '4',
        roomId: '',
        password: '',
        description: '',
        rules: '',
        contactInfo: '',
        scheduleDate: new Date(),
        scheduleTime: new Date()
      });
    }
  }, [isEdit, tournament]);

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

  const handleSave = () => {
    if (!newTournament.title || !newTournament.entryFee || !newTournament.prizePool) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    const scheduleDateTime = new Date(newTournament.scheduleDate);
    const time = newTournament.scheduleTime;
    scheduleDateTime.setHours(time.getHours());
    scheduleDateTime.setMinutes(time.getMinutes());

    const tournamentData = {
      ...newTournament,
      entryFee: parseInt(newTournament.entryFee),
      prizePool: parseInt(newTournament.prizePool),
      maxTeams: parseInt(newTournament.maxTeams),
      totalRounds: parseInt(newTournament.totalRounds),
      scheduleTime: scheduleDateTime.toISOString(),
    };

    if (isEdit) {
      tournamentData.id = tournament.id;
      onUpdate(tournamentData);
    } else {
      tournamentData.id = Date.now().toString();
      tournamentData.currentTeams = 0;
      tournamentData.status = 'upcoming';
      tournamentData.createdAt = new Date().toISOString();
      tournamentData.prizeDistributed = false;
      tournamentData.matchType = 'tournament';
      onCreate(tournamentData);
    }
    
    onClose();
  };

  const generateRoomId = () => {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    setNewTournament(prev => ({ ...prev, roomId }));
  };

  const generatePassword = () => {
    const password = Math.random().toString(36).substring(2, 6).toUpperCase();
    setNewTournament(prev => ({ ...prev, password }));
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setNewTournament(prev => ({ ...prev, scheduleDate: selectedDate }));
    }
  };

  const onTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setNewTournament(prev => ({ ...prev, scheduleTime: selectedTime }));
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalContainer}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose}/>
        <Animated.View style={[styles.modalContent, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isEdit ? 'Edit Tournament' : 'Create Tournament'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tournament Title *</Text>
              <TextInput
                style={styles.textInput}
                value={newTournament.title}
                onChangeText={(text) => setNewTournament(prev => ({ ...prev, title: text }))}
                placeholder="Enter tournament title"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Select Game *</Text>
              <View style={styles.gameOptions}>
                {Object.keys(GAMES).map((gameId) => (
                  <TouchableOpacity
                    key={gameId}
                    style={[
                      styles.gameOption,
                      newTournament.game === gameId && styles.gameOptionSelected
                    ]}
                    onPress={() => setNewTournament(prev => ({ ...prev, game: gameId, format: GAMES[gameId].modes[0] }))}
                  >
                    <Ionicons 
                      name={GAMES[gameId].icon} 
                      size={20} 
                      color={newTournament.game === gameId ? 'white' : GAMES[gameId].color} 
                    />
                    <Text style={[
                      styles.gameOptionText,
                      newTournament.game === gameId && styles.gameOptionTextSelected
                    ]}>
                      {GAMES[gameId].name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Game Mode</Text>
              <View style={styles.formatOptions}>
                {GAMES[newTournament.game]?.modes.map((mode) => (
                  <TouchableOpacity
                    key={mode}
                    style={[
                      styles.formatOption,
                      newTournament.format === mode && styles.formatOptionSelected
                    ]}
                    onPress={() => setNewTournament(prev => ({ ...prev, format: mode }))}
                  >
                    <Text style={[
                      styles.formatOptionText,
                      newTournament.format === mode && styles.formatOptionTextSelected
                    ]}>
                      {mode}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tournament Format</Text>
              <View style={styles.formatOptions}>
                {['Single Elimination', 'Double Elimination', 'Round Robin'].map((format) => (
                  <TouchableOpacity
                    key={format}
                    style={[
                      styles.formatOption,
                      newTournament.mode === format && styles.formatOptionSelected
                    ]}
                    onPress={() => setNewTournament(prev => ({ ...prev, mode: format }))}
                  >
                    <Text style={[
                      styles.formatOptionText,
                      newTournament.mode === format && styles.formatOptionTextSelected
                    ]}>
                      {format}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.rowGroup}>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Schedule Date</Text>
                <TouchableOpacity 
                  style={styles.dateTimeButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar" size={16} color="#666" />
                  <Text style={styles.dateTimeText}>
                    {newTournament.scheduleDate.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Schedule Time</Text>
                <TouchableOpacity 
                  style={styles.dateTimeButton}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Ionicons name="time" size={16} color="#666" />
                  <Text style={styles.dateTimeText}>
                    {newTournament.scheduleTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={newTournament.scheduleDate}
                mode="date"
                display="default"
                onChange={onDateChange}
                minimumDate={new Date()}
              />
            )}
            {showTimePicker && (
              <DateTimePicker
                value={newTournament.scheduleTime}
                mode="time"
                display="default"
                onChange={onTimeChange}
              />
            )}

            <View style={styles.rowGroup}>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Entry Fee (৳) *</Text>
                <TextInput
                  style={styles.textInput}
                  value={newTournament.entryFee}
                  onChangeText={(text) => setNewTournament(prev => ({ ...prev, entryFee: text.replace(/[^0-9]/g, '') }))}
                  keyboardType="numeric"
                  placeholder="100"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Prize Pool (৳) *</Text>
                <TextInput
                  style={styles.textInput}
                  value={newTournament.prizePool}
                  onChangeText={(text) => setNewTournament(prev => ({ ...prev, prizePool: text.replace(/[^0-9]/g, '') }))}
                  keyboardType="numeric"
                  placeholder="2000"
                />
              </View>
            </View>

            <View style={styles.rowGroup}>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Max Teams *</Text>
                <TextInput
                  style={styles.textInput}
                  value={newTournament.maxTeams}
                  onChangeText={(text) => setNewTournament(prev => ({ ...prev, maxTeams: text.replace(/[^0-9]/g, '') }))}
                  keyboardType="numeric"
                  placeholder="16"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Total Rounds</Text>
                <TextInput
                  style={styles.textInput}
                  value={newTournament.totalRounds}
                  onChangeText={(text) => setNewTournament(prev => ({ ...prev, totalRounds: text.replace(/[^0-9]/g, '') }))}
                  keyboardType="numeric"
                  placeholder="4"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.sectionTitle}>Room Information</Text>
              <View style={styles.rowGroup}>
                <View style={styles.halfInput}>
                  <Text style={styles.inputLabel}>Room ID</Text>
                  <View style={styles.roomInputContainer}>
                    <TextInput
                      style={[styles.textInput, styles.roomInput]}
                      value={newTournament.roomId}
                      onChangeText={(text) => setNewTournament(prev => ({ ...prev, roomId: text }))}
                      placeholder="Enter room ID"
                    />
                    <TouchableOpacity style={styles.generateButton} onPress={generateRoomId}>
                      <Text style={styles.generateButtonText}>Generate</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <View style={styles.roomInputContainer}>
                    <TextInput
                      style={[styles.textInput, styles.roomInput]}
                      value={newTournament.password}
                      onChangeText={(text) => setNewTournament(prev => ({ ...prev, password: text }))}
                      placeholder="Enter password"
                    />
                    <TouchableOpacity style={styles.generateButton} onPress={generatePassword}>
                      <Text style={styles.generateButtonText}>Generate</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={newTournament.description}
                onChangeText={(text) => setNewTournament(prev => ({ ...prev, description: text }))}
                placeholder="Tournament description..."
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.createButton} onPress={handleSave}>
                <Text style={styles.createButtonText}>
                  {isEdit ? 'Update Tournament' : 'Create Tournament'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

// Tournament Details Modal
const TournamentDetailsModal = ({ visible, tournament, onClose, onAction }) => {
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

  if (!tournament) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalContainer}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose}/>
        <Animated.View style={[styles.modalContent, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Tournament Details</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.detailsSection}>
              <Text style={styles.detailTitle}>{tournament.title}</Text>
              <Text style={styles.detailSubtitle}>
                {GAMES[tournament.game]?.name} • {tournament.mode} • {tournament.format}
              </Text>
              
              <View style={styles.detailGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Entry Fee</Text>
                  <Text style={styles.detailValue}>৳{tournament.entryFee}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Prize Pool</Text>
                  <Text style={styles.detailValue}>৳{tournament.prizePool}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Teams</Text>
                  <Text style={styles.detailValue}>{tournament.currentTeams}/{tournament.maxTeams}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Rounds</Text>
                  <Text style={styles.detailValue}>{tournament.totalRounds}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Room ID</Text>
                <Text style={styles.detailValue}>{tournament.roomId}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Password</Text>
                <Text style={styles.detailValue}>{tournament.password}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Schedule Time</Text>
                <Text style={styles.detailValue}>
                  {new Date(tournament.scheduleTime).toLocaleString()}
                </Text>
              </View>

              {tournament.description && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Description</Text>
                  <Text style={styles.detailValue}>{tournament.description}</Text>
                </View>
              )}
            </View>

            <View style={styles.detailActions}>
              <TouchableOpacity 
                style={styles.detailActionButton}
                onPress={() => onAction('share')}
              >
                <Ionicons name="share-social" size={20} color="#2962ff" />
                <Text style={styles.detailActionText}>Share</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.detailActionButton}
                onPress={() => onAction('brackets')}
              >
                <Ionicons name="sitemap" size={20} color="#4CAF50" />
                <Text style={styles.detailActionText}>Brackets</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.detailActionButton}
                onPress={() => onAction('analytics')}
              >
                <Ionicons name="stats-chart" size={20} color="#FF9800" />
                <Text style={styles.detailActionText}>Analytics</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

// Main Tournament Management Screen
const TournamentManagementScreen = ({ navigation }) => {
  const [tournaments, setTournaments] = useState([
    {
      id: '1',
      title: 'Free Fire Championship',
      game: 'freefire',
      format: 'Solo',
      mode: 'Single Elimination',
      entryFee: 100,
      prizePool: 2000,
      maxTeams: 16,
      currentTeams: 12,
      totalRounds: 4,
      roomId: 'FF123456',
      password: 'TOUR123',
      status: 'live',
      scheduleTime: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      prizeDistributed: false,
      matchType: 'tournament',
      description: 'Free Fire solo championship tournament with amazing prizes!'
    },
    {
      id: '2',
      title: 'PUBG Mobile Tournament',
      game: 'pubg',
      format: 'Squad',
      mode: 'Double Elimination',
      entryFee: 200,
      prizePool: 5000,
      maxTeams: 32,
      currentTeams: 24,
      totalRounds: 6,
      roomId: 'PUBG7890',
      password: 'SQUAD123',
      status: 'upcoming',
      scheduleTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      prizeDistributed: false,
      matchType: 'tournament',
      description: 'PUBG Mobile squad tournament - show your skills!'
    }
  ]);

  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTournaments, setSelectedTournaments] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editingTournament, setEditingTournament] = useState(null);
  const [selectedTournament, setSelectedTournament] = useState(null);

  const filteredTournaments = tournaments.filter(tournament => {
    const matchesSearch = tournament.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tournament.game.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    return matchesSearch && tournament.status === activeTab;
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setRefreshing(false);
  };

  const handleTournamentSelect = (tournamentId) => {
    setSelectedTournaments(prev => 
      prev.includes(tournamentId) 
        ? prev.filter(id => id !== tournamentId)
        : [...prev, tournamentId]
    );
  };

  const handleEditTournament = (tournament) => {
    setEditingTournament(tournament);
    setShowEditModal(true);
  };

  const handleUpdateTournament = (updatedTournament) => {
    setTournaments(prev => prev.map(t => 
      t.id === updatedTournament.id ? { ...t, ...updatedTournament } : t
    ));
    Alert.alert('Success!', 'Tournament updated successfully!');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleStartTournament = (tournamentId) => {
    setTournaments(prev => prev.map(t => 
      t.id === tournamentId ? { ...t, status: 'live' } : t
    ));
    Alert.alert('Tournament Started!', 'The tournament is now live!');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleManageTournament = (tournament) => {
    setSelectedTournament(tournament);
    setShowDetailsModal(true);
  };

  const handleViewResults = (tournament) => {
    Alert.alert(
      'Tournament Results',
      `Results for: ${tournament.title}\n\n🏆 Winner: Team Alpha\n🥈 Runner-up: Team Beta\n🥉 Third: Team Gamma`,
      [
        { text: 'Close', style: 'cancel' },
        { text: 'Share Results', onPress: () => handleShareTournament(tournament) }
      ]
    );
  };

  const handleDeleteTournament = (tournamentId) => {
    Alert.alert(
      'Delete Tournament',
      'Are you sure you want to delete this tournament? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            setTournaments(prev => prev.filter(t => t.id !== tournamentId));
            Alert.alert('Deleted!', 'Tournament has been deleted.');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          }
        }
      ]
    );
  };

  const handleCompleteTournament = (tournamentId) => {
    setTournaments(prev => prev.map(t => 
      t.id === tournamentId ? { ...t, status: 'completed' } : t
    ));
    Alert.alert('Completed!', 'Tournament marked as completed.');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleCancelTournament = (tournamentId) => {
    Alert.alert(
      'Cancel Tournament',
      'Are you sure you want to cancel this tournament?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes, Cancel', 
          style: 'destructive',
          onPress: () => {
            setTournaments(prev => prev.map(t => 
              t.id === tournamentId ? { ...t, status: 'cancelled' } : t
            ));
            Alert.alert('Cancelled!', 'Tournament has been cancelled.');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          }
        }
      ]
    );
  };

  const handleShareTournament = async (tournament) => {
    try {
      const shareText = `🎮 ${tournament.title}\n🏆 Prize: ৳${tournament.prizePool}\n🎯 Game: ${GAMES[tournament.game]?.name}\n👥 Teams: ${tournament.currentTeams}/${tournament.maxTeams}\n⏰ Time: ${new Date(tournament.scheduleTime).toLocaleString()}\n🔑 Room: ${tournament.roomId} | Password: ${tournament.password}`;
      
      await Clipboard.setStringAsync(shareText);
      Alert.alert('Copied!', 'Tournament details copied to clipboard');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert('Error', 'Failed to copy details');
    }
  };

  const handleTournamentAction = (tournamentId, action) => {
    const tournament = tournaments.find(t => t.id === tournamentId);
    
    if (!tournament) return;

    switch(action) {
      case 'share':
        handleShareTournament(tournament);
        break;
      case 'brackets':
        Alert.alert('Tournament Brackets', `Brackets for: ${tournament.title}\n\nRound 1: Completed\nRound 2: In Progress\nRound 3: Upcoming`);
        break;
      case 'analytics':
        Alert.alert(
          'Tournament Analytics',
          `Analytics for: ${tournament.title}\n\n📊 Participation: ${((tournament.currentTeams / tournament.maxTeams) * 100).toFixed(1)}%\n💰 Prize Distribution: Ready\n⏱️ Duration: 2 hours\n🎯 Success Rate: 85%`
        );
        break;
      case 'more':
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options: ['Cancel', 'Complete Tournament', 'Cancel Tournament', 'View Details'],
            cancelButtonIndex: 0,
            destructiveButtonIndex: 2,
          },
          (buttonIndex) => {
            switch (buttonIndex) {
              case 1:
                handleCompleteTournament(tournamentId);
                break;
              case 2:
                handleCancelTournament(tournamentId);
                break;
              case 3:
                handleManageTournament(tournament);
                break;
            }
          }
        );
        break;
      default:
        break;
    }
  };

  const handleCreateTournament = (newTournament) => {
    const tournamentWithDefaults = {
      ...newTournament,
      id: Date.now().toString(),
      currentTeams: 0,
      status: 'upcoming',
      createdAt: new Date().toISOString(),
      prizeDistributed: false,
      matchType: 'tournament'
    };

    setTournaments(prev => [tournamentWithDefaults, ...prev]);
    Alert.alert('Success!', 'Tournament created successfully!');
    setShowCreateModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleDetailsAction = (action) => {
    if (!selectedTournament) return;

    switch(action) {
      case 'share':
        handleShareTournament(selectedTournament);
        break;
      case 'brackets':
        Alert.alert('Tournament Brackets', `Brackets for: ${selectedTournament.title}`);
        break;
      case 'analytics':
        Alert.alert('Tournament Analytics', `Analytics for: ${selectedTournament.title}`);
        break;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Tournament Management</Text>
            <Text style={styles.headerSubtitle}>Manage your tournaments</Text>
          </View>
          <TouchableOpacity 
            style={styles.createButtonHeader} 
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add" size={20} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tournaments..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close" size={20} color="#666" />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.tabContainer}>
          {['all', 'upcoming', 'live', 'completed'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={filteredTournaments}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <TournamentCard
            tournament={item}
            index={index}
            onAction={handleTournamentAction}
            onEdit={handleEditTournament}
            onStart={handleStartTournament}
            onManage={handleManageTournament}
            onViewResults={handleViewResults}
            onDelete={handleDeleteTournament}
            isSelected={selectedTournaments.includes(item.id)}
            onSelect={handleTournamentSelect}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#2962ff']}
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="trophy-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No tournaments found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Try a different search' : 'Create your first tournament'}
            </Text>
            <TouchableOpacity 
              style={styles.emptyActionButton}
              onPress={() => setShowCreateModal(true)}
            >
              <Text style={styles.emptyActionText}>Create Tournament</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <TournamentModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateTournament}
        isEdit={false}
      />

      <TournamentModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        onUpdate={handleUpdateTournament}
        tournament={editingTournament}
        isEdit={true}
      />

      <TournamentDetailsModal
        visible={showDetailsModal}
        tournament={selectedTournament}
        onClose={() => setShowDetailsModal(false)}
        onAction={handleDetailsAction}
      />

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => setShowCreateModal(true)}
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>

      {selectedTournaments.length > 0 && (
        <View style={styles.bulkActions}>
          <Text style={styles.bulkActionsText}>
            {selectedTournaments.length} selected
          </Text>
          <TouchableOpacity 
            style={styles.bulkActionButton}
            onPress={() => {
              Alert.alert(
                'Bulk Action',
                `Perform action on ${selectedTournaments.length} tournaments?`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Delete All', 
                    style: 'destructive',
                    onPress: () => {
                      setTournaments(prev => prev.filter(t => !selectedTournaments.includes(t.id)));
                      setSelectedTournaments([]);
                      Alert.alert('Deleted!', `${selectedTournaments.length} tournaments deleted.`);
                    }
                  }
                ]
              );
            }}
          >
            <Text style={styles.bulkActionText}>Delete Selected</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.bulkActionClose}
            onPress={() => setSelectedTournaments([])}
          >
            <Ionicons name="close" size={20} color="white" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#1a237e',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  createButtonHeader: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: 'white',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  tabTextActive: {
    color: '#1a237e',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  tournamentCard: {
    marginBottom: 16,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardGradient: {
    padding: 16,
    borderRadius: 16,
  },
  cardHeader: {
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
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tournamentTitleContainer: {
    flex: 1,
  },
  tournamentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  tournamentSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
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
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    textAlign: 'center',
  },
  quickActions: {
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
    gap: 4,
  },
  quickActionText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
  selectionIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  liveBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  livePulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'white',
  },
  liveText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyActionButton: {
    backgroundColor: '#2962ff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  emptyActionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2962ff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  bulkActions: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: '#1a237e',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  bulkActionsText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  bulkActionButton: {
    backgroundColor: '#F44336',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 8,
  },
  bulkActionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  bulkActionClose: {
    padding: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  gameOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  gameOption: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f8f9fa',
  },
  gameOptionSelected: {
    backgroundColor: '#2962ff',
    borderColor: '#2962ff',
  },
  gameOptionText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    color: '#666',
  },
  gameOptionTextSelected: {
    color: 'white',
  },
  formatOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  formatOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
  },
  formatOptionSelected: {
    backgroundColor: '#2962ff',
    borderColor: '#2962ff',
  },
  formatOptionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  formatOptionTextSelected: {
    color: 'white',
  },
  rowGroup: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  halfInput: {
    flex: 1,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f8f9fa',
    gap: 8,
  },
  dateTimeText: {
    fontSize: 16,
    color: '#333',
  },
  roomInputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  roomInput: {
    flex: 1,
  },
  generateButton: {
    backgroundColor: '#2962ff',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  createButton: {
    flex: 2,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#2962ff',
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  detailsSection: {
    marginBottom: 20,
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  detailSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    gap: 12,
  },
  detailItem: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  detailActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  detailActionButton: {
    alignItems: 'center',
    padding: 12,
  },
  detailActionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    marginTop: 4,
  },
  primaryButton: {
    backgroundColor: '#2962ff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningButton: {
    backgroundColor: '#FF9800',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerButton: {
    backgroundColor: '#F44336',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    backgroundColor: '#6B7280',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLarge: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  buttonSmall: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  successButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  warningButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  dangerButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  secondaryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  buttonTextLarge: {
    fontSize: 16,
  },
  buttonTextSmall: {
    fontSize: 12,
  },
});

export default TournamentManagementScreen;
