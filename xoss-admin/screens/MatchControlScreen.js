import React, { useState, useRef, useEffect } from 'react';
import { 
  View, Text, ScrollView, TouchableOpacity, StyleSheet, 
  TextInput, Alert, Animated, Dimensions, Modal, 
  RefreshControl, ActivityIndicator, FlatList, Switch,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useTournaments } from '../context/TournamentContext';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

// 🆕 ENHANCED DateTimePicker with Manual Input Option
const AdvancedDateTimePicker = ({ 
  value, 
  onChange, 
  mode = 'datetime',
  minimumDate = new Date(),
  isVisible,
  onClose,
  label = "Select Date & Time"
}) => {
  const [currentDate, setCurrentDate] = useState(value);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [manualError, setManualError] = useState('');

  const handleChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      onClose();
    }
    
    if (selectedDate) {
      setCurrentDate(selectedDate);
      onChange(selectedDate);
    }
  };

  const handleManualSubmit = () => {
    if (!manualInput.trim()) {
      setManualError('Please enter a date and time');
      return;
    }

    try {
      // Try to parse various date formats
      const parsedDate = new Date(manualInput);
      if (isNaN(parsedDate.getTime())) {
        setManualError('Invalid date format. Try: "Dec 25 2023 14:30" or "2023-12-25 14:30"');
        return;
      }

      if (parsedDate < new Date()) {
        setManualError('Date must be in the future');
        return;
      }

      setCurrentDate(parsedDate);
      onChange(parsedDate);
      setShowManualInput(false);
      setManualInput('');
      setManualError('');
      
    } catch (error) {
      setManualError('Invalid date format');
    }
  };

  const quickTimeOptions = [
    { label: '30 mins from now', minutes: 30 },
    { label: '1 hour from now', minutes: 60 },
    { label: '2 hours from now', minutes: 120 },
    { label: '6 hours from now', minutes: 360 },
    { label: 'Tomorrow same time', days: 1 },
    { label: 'Next weekend', days: getDaysUntilWeekend() }
  ];

  function getDaysUntilWeekend() {
    const today = new Date().getDay();
    return today === 0 ? 7 : 6 - today; // Next Saturday
  }

  const applyQuickTime = (option) => {
    const newDate = new Date();
    if (option.minutes) {
      newDate.setMinutes(newDate.getMinutes() + option.minutes);
    } else if (option.days) {
      newDate.setDate(newDate.getDate() + option.days);
    }
    setCurrentDate(newDate);
    onChange(newDate);
  };

  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.dateTimePickerOverlay}>
        <View style={styles.dateTimePickerContainer}>
          <View style={styles.dateTimePickerHeader}>
            <Text style={styles.dateTimePickerTitle}>{label}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {!showManualInput ? (
            <>
              {/* Quick Time Options */}
              <View style={styles.quickTimeSection}>
                <Text style={styles.quickTimeTitle}>Quick Select</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.quickTimeOptions}>
                    {quickTimeOptions.map((option, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.quickTimeOption}
                        onPress={() => applyQuickTime(option)}
                      >
                        <Text style={styles.quickTimeText}>{option.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Native DateTimePicker */}
              <View style={styles.pickerContainer}>
                <DateTimePicker
                  value={currentDate}
                  mode={mode}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleChange}
                  minimumDate={minimumDate}
                  style={styles.dateTimePicker}
                />
              </View>

              {/* Manual Input Option */}
              <TouchableOpacity 
                style={styles.manualInputButton}
                onPress={() => setShowManualInput(true)}
              >
                <Ionicons name="create-outline" size={18} color="#2962ff" />
                <Text style={styles.manualInputButtonText}>Enter Manually</Text>
              </TouchableOpacity>

              {/* Selected Date Display */}
              <View style={styles.selectedDateContainer}>
                <Text style={styles.selectedDateLabel}>Selected:</Text>
                <Text style={styles.selectedDateText}>
                  {currentDate.toLocaleString()}
                </Text>
              </View>
            </>
          ) : (
            /* Manual Input Mode */
            <View style={styles.manualInputContainer}>
              <Text style={styles.manualInputTitle}>Enter Date & Time</Text>
              <Text style={styles.manualInputSubtitle}>
                Examples: "Dec 25 2023 14:30", "2023-12-25 14:30", "tomorrow 2pm"
              </Text>
              
              <TextInput
                style={[styles.manualInput, manualError && styles.manualInputError]}
                value={manualInput}
                onChangeText={(text) => {
                  setManualInput(text);
                  setManualError('');
                }}
                placeholder="Enter date and time..."
                multiline
                autoFocus
              />
              
              {manualError ? (
                <Text style={styles.manualErrorText}>{manualError}</Text>
              ) : null}

              <View style={styles.manualInputActions}>
                <TouchableOpacity 
                  style={[styles.manualButton, styles.cancelManualButton]}
                  onPress={() => {
                    setShowManualInput(false);
                    setManualInput('');
                    setManualError('');
                  }}
                >
                  <Text style={styles.cancelManualText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.manualButton, styles.submitManualButton]}
                  onPress={handleManualSubmit}
                >
                  <Text style={styles.submitManualText}>Set Date</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

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
    icon: 'game-controller',
    color: '#4CAF50',
    modes: ['Solo', 'Duo', 'Squad', 'TPP', 'FPP'],
    maps: ['Erangel', 'Miramar', 'Sanhok', 'Vikendi']
  },
  cod: {
    name: 'Call of Duty',
    icon: 'shield',
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
    icon: 'phone-portrait',
    color: '#FF4444',
    modes: ['Solo', 'Duo', 'Squad'],
    maps: ['Erangel', 'Miramar', 'Livik', 'Sanhok']
  }
};

// Create Match Modal with Enhanced Date/Time Picker
const CreateMatchModal = ({ visible, onClose, onCreate }) => {
  const slideAnim = useRef(new Animated.Value(height)).current;
  const { user: authUser } = useAuth();
  
  const [newMatch, setNewMatch] = useState({
    title: 'Solo Battle',
    game: 'pubg',
    type: 'Solo',
    map: 'Erangel',
    entryFee: '50',
    prizePool: '500',
    maxPlayers: '100',
    perKill: '10',
    matchType: 'match',
    roomId: '',
    password: '',
    description: 'A 100 player solo tournament',
    rules: 'No cheating, fair play only',
    scheduleTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
    endTime: new Date(Date.now() + 4 * 60 * 60 * 1000)
  });
  
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

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

  // ✅ FIXED: Proper data structure for backend with number conversion
  const handleCreate = () => {
    // Validate required fields
    if (!newMatch.title || !newMatch.entryFee || !newMatch.prizePool || !newMatch.maxPlayers || !newMatch.roomId || !newMatch.password) {
      Alert.alert('Error', 'Please fill all required fields (*)');
      return;
    }

    // ✅ FIXED: Use proper data structure matching backend with number conversion
    const match = {
      // Basic info
      title: newMatch.title,
      game: newMatch.game,
      description: newMatch.description,
      rules: newMatch.rules,
      
      // Financial info - ✅ FIXED: Convert to numbers
      entryFee: Number(newMatch.entryFee) || 0,
      prizePool: Number(newMatch.prizePool) || 0,
      perKill: Number(newMatch.perKill) || 0,
      
      // Participants info - ✅ CRITICAL FIX: Convert to number
      maxPlayers: Number(newMatch.maxPlayers) || 25,
      
      // Room info
      roomId: newMatch.roomId,
      password: newMatch.password,
      
      // Game settings
      map: newMatch.map,
      type: newMatch.type,
      
      // Status and timing
      status: 'upcoming',
      matchType: newMatch.matchType,
      scheduleTime: new Date(newMatch.scheduleTime).toISOString(),
      endTime: new Date(newMatch.endTime).toISOString()
    };

    console.log('🔄 Creating match with data:', match);
    
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

  const handleStartTimeChange = (selectedDate) => {
    setShowStartTimePicker(false);
    if (selectedDate) {
      setNewMatch(prev => ({ ...prev, scheduleTime: selectedDate }));
      // Auto-set end time to 2 hours after start time
      const endTime = new Date(selectedDate.getTime() + 2 * 60 * 60 * 1000);
      setNewMatch(prev => ({ ...prev, endTime }));
    }
  };

  const handleEndTimeChange = (selectedDate) => {
    setShowEndTimePicker(false);
    if (selectedDate) {
      setNewMatch(prev => ({ ...prev, endTime: selectedDate }));
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

            <Text style={styles.modalLabel}>Description</Text>
            <TextInput
              style={[styles.modalInput, styles.textArea]}
              value={newMatch.description}
              onChangeText={(text) => setNewMatch(prev => ({ ...prev, description: text }))}
              placeholder="Describe your match..."
              multiline
              numberOfLines={3}
            />

            <Text style={styles.modalLabel}>Rules</Text>
            <TextInput
              style={[styles.modalInput, styles.textArea]}
              value={newMatch.rules}
              onChangeText={(text) => setNewMatch(prev => ({ ...prev, rules: text }))}
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
                  value={newMatch.entryFee}
                  onChangeText={(text) => setNewMatch(prev => ({ 
                    ...prev, 
                    entryFee: text.replace(/[^0-9]/g, '') // ✅ Only numbers allowed
                  }))}
                  placeholder="50"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.formColumn}>
                <Text style={styles.modalLabel}>Prize Pool (৳) *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newMatch.prizePool}
                  onChangeText={(text) => setNewMatch(prev => ({ 
                    ...prev, 
                    prizePool: text.replace(/[^0-9]/g, '') // ✅ Only numbers allowed
                  }))}
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
                  value={newMatch.maxPlayers}
                  onChangeText={(text) => setNewMatch(prev => ({ 
                    ...prev, 
                    maxPlayers: text.replace(/[^0-9]/g, '') // ✅ Only numbers allowed
                  }))}
                  placeholder="100"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.formColumn}>
                <Text style={styles.modalLabel}>Per Kill Prize (৳)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newMatch.perKill}
                  onChangeText={(text) => setNewMatch(prev => ({ 
                    ...prev, 
                    perKill: text.replace(/[^0-9]/g, '') // ✅ Only numbers allowed
                  }))}
                  placeholder="10"
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Enhanced Start Time Picker */}
            <Text style={styles.modalLabel}>Start Time *</Text>
            <TouchableOpacity 
              style={styles.datePickerButton}
              onPress={() => setShowStartTimePicker(true)}
            >
              <Ionicons name="calendar" size={20} color="#2962ff" />
              <View style={styles.datePickerTextContainer}>
                <Text style={styles.datePickerLabel}>Starts at</Text>
                <Text style={styles.datePickerText}>
                  {newMatch.scheduleTime.toLocaleString()}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={16} color="#666" />
            </TouchableOpacity>

            {/* Enhanced End Time Picker */}
            <Text style={styles.modalLabel}>End Time *</Text>
            <TouchableOpacity 
              style={styles.datePickerButton}
              onPress={() => setShowEndTimePicker(true)}
            >
              <Ionicons name="calendar" size={20} color="#2962ff" />
              <View style={styles.datePickerTextContainer}>
                <Text style={styles.datePickerLabel}>Ends at</Text>
                <Text style={styles.datePickerText}>
                  {newMatch.endTime.toLocaleString()}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={16} color="#666" />
            </TouchableOpacity>

            {/* Enhanced Date Pickers */}
            <AdvancedDateTimePicker
              value={newMatch.scheduleTime}
              onChange={handleStartTimeChange}
              isVisible={showStartTimePicker}
              onClose={() => setShowStartTimePicker(false)}
              label="Select Start Time"
            />

            <AdvancedDateTimePicker
              value={newMatch.endTime}
              onChange={handleEndTimeChange}
              isVisible={showEndTimePicker}
              onClose={() => setShowEndTimePicker(false)}
              label="Select End Time"
            />

            {/* Room ID */}
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

            {/* Password */}
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

// Main Component
const MatchControlScreen = ({ navigation }) => {
  const { tournaments, loading, error, createTournament, updateTournament, deleteTournament, refreshTournaments } = useTournaments();
  const { user: authUser } = useAuth();

  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMatches, setSelectedMatches] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    refreshTournaments();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refreshTournaments();
    });
    return unsubscribe;
  }, [navigation]);

  const filteredMatches = tournaments.filter(match => {
    if (!match) return false;
    
    const matchesSearch = 
      (match.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (match.game?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'pending') return matchesSearch && match.status === 'pending';
    return matchesSearch && match.status === activeTab;
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await refreshTournaments();
    setRefreshing(false);
  };

  // ✅ FIXED: Updated handleCreateMatch function with proper data structure
  const handleCreateMatch = async (newMatch) => {
    try {
      console.log('🔄 Creating match with all fields:', newMatch);
      
      const result = await createTournament(newMatch);
      
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
            { key: 'pending', label: 'Pending' }
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
            <View style={styles.matchCard}>
              <LinearGradient colors={['#1a237e', '#283593']} style={styles.cardGradient}>
                <View style={styles.cardHeader}>
                  <View style={styles.gameInfo}>
                    <View style={[styles.gameIcon, { backgroundColor: GAMES[item.game]?.color || '#2962ff' }]}>
                      <Ionicons name={GAMES[item.game]?.icon || 'trophy'} size={20} color="white" />
                    </View>
                    <View style={styles.matchInfo}>
                      <Text style={styles.matchTitle}>{item.title}</Text>
                      <Text style={styles.matchSubtitle}>{GAMES[item.game]?.name}</Text>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, { 
                    backgroundColor: item.status === 'live' ? '#4CAF50' : 
                                    item.status === 'completed' ? '#2196F3' : '#FF9800'
                  }]}>
                    <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
                  </View>
                </View>

                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>৳{item.entryFee || item.entry_fee}</Text>
                    <Text style={styles.statLabel}>Entry</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>৳{item.prizePool || item.total_prize}</Text>
                    <Text style={styles.statLabel}>Prize</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                      {item.currentPlayers || item.current_participants || 0}/
                      {item.maxPlayers || item.max_participants || 50}
                    </Text>
                    <Text style={styles.statLabel}>Players</Text>
                  </View>
                </View>

                <View style={styles.timeInfo}>
                  <Text style={styles.timeText}>
                    Starts: {new Date(item.scheduleTime).toLocaleString()}
                  </Text>
                  <Text style={styles.timeText}>
                    Ends: {new Date(item.end_time).toLocaleString()}
                  </Text>
                </View>
              </LinearGradient>
            </View>
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

      {/* Create Match Modal */}
      <CreateMatchModal 
        visible={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
        onCreate={handleCreateMatch}
      />

      {/* Floating Create Button */}
      <TouchableOpacity 
        style={styles.floatingButton}
        onPress={() => setShowCreateModal(true)}
      >
        <LinearGradient
          colors={['#2962ff', '#448AFF']}
          style={styles.floatingButtonGradient}
        >
          <Ionicons name="add" size={24} color="white" />
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

// Enhanced Styles with Date/Time Picker Styles
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
  },
  cardGradient: {
    padding: 16,
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
  matchInfo: {
    flex: 1,
  },
  matchTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  matchSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
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
  },
  statValue: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  timeInfo: {
    marginTop: 8,
  },
  timeText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginBottom: 2,
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
  formRow: {
    flexDirection: 'row',
    marginHorizontal: -8,
    marginBottom: 16,
  },
  formColumn: {
    flex: 1,
    paddingHorizontal: 8,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  datePickerTextContainer: {
    flex: 1,
    marginLeft: 8,
  },
  datePickerLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  datePickerText: {
    fontSize: 14,
    color: '#333',
  },
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
  gameOptionSelected: {},
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
  floatingButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    borderRadius: 30,
    overflow: 'hidden',
  },
  floatingButtonGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
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
  // Enhanced DateTime Picker Styles
  dateTimePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  dateTimePickerContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    maxHeight: '80%',
  },
  dateTimePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  dateTimePickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  quickTimeSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  quickTimeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  quickTimeOptions: {
    flexDirection: 'row',
  },
  quickTimeOption: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  quickTimeText: {
    fontSize: 12,
    color: '#333',
  },
  pickerContainer: {
    padding: 16,
    alignItems: 'center',
  },
  dateTimePicker: {
    width: Platform.OS === 'ios' ? '100%' : 'auto',
  },
  manualInputButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  manualInputButtonText: {
    color: '#2962ff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  selectedDateContainer: {
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  selectedDateLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  selectedDateText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  manualInputContainer: {
    padding: 20,
  },
  manualInputTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  manualInputSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 16,
    lineHeight: 16,
  },
  manualInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  manualInputError: {
    borderColor: '#F44336',
  },
  manualErrorText: {
    color: '#F44336',
    fontSize: 12,
    marginBottom: 12,
  },
  manualInputActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  manualButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  cancelManualButton: {
    backgroundColor: '#f5f5f5',
  },
  submitManualButton: {
    backgroundColor: '#2962ff',
  },
  cancelManualText: {
    color: '#333',
    fontWeight: '500',
  },
  submitManualText: {
    color: 'white',
    fontWeight: '500',
  },
});

export default MatchControlScreen;
