// screens/MatchControlScreen.js - COMPLETELY FIXED WITH EDIT MODAL
import React, { useState, useRef, useEffect } from 'react';
import { 
  View, Text, ScrollView, TouchableOpacity, StyleSheet, 
  TextInput, Alert, Animated, Dimensions, Modal, 
  RefreshControl, ActivityIndicator, FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useMatches } from '../context/MatchContext';
import { useAuth } from '../context/AuthContext';
import EditMatchModal from './EditMatchModal'; // ✅ Import Edit Modal

const { width, height } = Dimensions.get('window');

// Custom Date Picker Component (No External Dependencies)
const CustomDatePicker = ({ visible, onConfirm, onCancel, value }) => {
  const [selectedDate, setSelectedDate] = useState(value || new Date());
  
  // Generate months and years
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear + i);
  
  const daysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  const getDaysArray = (month, year) => {
    const daysCount = daysInMonth(month, year);
    return Array.from({ length: daysCount }, (_, i) => i + 1);
  };

  const [days, setDays] = useState(getDaysArray(selectedDate.getMonth(), selectedDate.getFullYear()));
  const [hours, setHours] = useState(selectedDate.getHours());
  const [minutes, setMinutes] = useState(selectedDate.getMinutes());

  const updateDays = (month, year) => {
    setDays(getDaysArray(month, year));
  };

  const handleMonthChange = (monthIndex) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(monthIndex);
    setSelectedDate(newDate);
    updateDays(monthIndex, newDate.getFullYear());
  };

  const handleYearChange = (year) => {
    const newDate = new Date(selectedDate);
    newDate.setFullYear(year);
    setSelectedDate(newDate);
    updateDays(newDate.getMonth(), year);
  };

  const handleDayChange = (day) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(day);
    setSelectedDate(newDate);
  };

  const handleTimeChange = (type, value) => {
    const newDate = new Date(selectedDate);
    if (type === 'hour') {
      newDate.setHours(value);
      setHours(value);
    } else {
      newDate.setMinutes(value);
      setMinutes(value);
    }
    setSelectedDate(newDate);
  };

  const handleConfirm = () => {
    onConfirm(selectedDate);
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.customPickerOverlay}>
        <View style={styles.customPickerContent}>
          <View style={styles.customPickerHeader}>
            <Text style={styles.customPickerTitle}>Select Date & Time</Text>
          </View>
          
          <View style={styles.pickerContainer}>
            {/* Date Selection */}
            <View style={styles.pickerSection}>
              <Text style={styles.pickerLabel}>Date</Text>
              <View style={styles.pickerRow}>
                {/* Month */}
                <View style={styles.pickerColumn}>
                  <Text style={styles.pickerSubLabel}>Month</Text>
                  <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                    {months.map((month, index) => (
                      <TouchableOpacity
                        key={month}
                        style={[
                          styles.pickerItem,
                          selectedDate.getMonth() === index && styles.pickerItemSelected
                        ]}
                        onPress={() => handleMonthChange(index)}
                      >
                        <Text style={[
                          styles.pickerItemText,
                          selectedDate.getMonth() === index && styles.pickerItemTextSelected
                        ]}>
                          {month}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Day */}
                <View style={styles.pickerColumn}>
                  <Text style={styles.pickerSubLabel}>Day</Text>
                  <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                    {days.map(day => (
                      <TouchableOpacity
                        key={day}
                        style={[
                          styles.pickerItem,
                          selectedDate.getDate() === day && styles.pickerItemSelected
                        ]}
                        onPress={() => handleDayChange(day)}
                      >
                        <Text style={[
                          styles.pickerItemText,
                          selectedDate.getDate() === day && styles.pickerItemTextSelected
                        ]}>
                          {day}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Year */}
                <View style={styles.pickerColumn}>
                  <Text style={styles.pickerSubLabel}>Year</Text>
                  <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                    {years.map(year => (
                      <TouchableOpacity
                        key={year}
                        style={[
                          styles.pickerItem,
                          selectedDate.getFullYear() === year && styles.pickerItemSelected
                        ]}
                        onPress={() => handleYearChange(year)}
                      >
                        <Text style={[
                          styles.pickerItemText,
                          selectedDate.getFullYear() === year && styles.pickerItemTextSelected
                        ]}>
                          {year}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            </View>

            {/* Time Selection */}
            <View style={styles.pickerSection}>
              <Text style={styles.pickerLabel}>Time</Text>
              <View style={styles.pickerRow}>
                {/* Hours */}
                <View style={styles.pickerColumn}>
                  <Text style={styles.pickerSubLabel}>Hour</Text>
                  <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                    {Array.from({ length: 24 }, (_, i) => i).map(hour => (
                      <TouchableOpacity
                        key={hour}
                        style={[
                          styles.pickerItem,
                          hours === hour && styles.pickerItemSelected
                        ]}
                        onPress={() => handleTimeChange('hour', hour)}
                      >
                        <Text style={[
                          styles.pickerItemText,
                          hours === hour && styles.pickerItemTextSelected
                        ]}>
                          {hour.toString().padStart(2, '0')}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Minutes */}
                <View style={styles.pickerColumn}>
                  <Text style={styles.pickerSubLabel}>Minute</Text>
                  <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                    {Array.from({ length: 60 }, (_, i) => i).map(minute => (
                      <TouchableOpacity
                        key={minute}
                        style={[
                          styles.pickerItem,
                          minutes === minute && styles.pickerItemSelected
                        ]}
                        onPress={() => handleTimeChange('minute', minute)}
                      >
                        <Text style={[
                          styles.pickerItemText,
                          minutes === minute && styles.pickerItemTextSelected
                        ]}>
                          {minute.toString().padStart(2, '0')}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            </View>

            {/* Selected Date Preview */}
            <View style={styles.selectedDatePreview}>
              <Text style={styles.selectedDateText}>
                Selected: {selectedDate.toLocaleString()}
              </Text>
            </View>
          </View>

          <View style={styles.customPickerActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
              <Text style={styles.confirmButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
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

// Simple Button Component
const SimpleButton = ({ 
  title, 
  onPress, 
  icon, 
  type = 'primary',
  disabled = false,
  style 
}) => {
  const getButtonStyle = () => {
    switch (type) {
      case 'primary': return styles.primaryButton;
      case 'danger': return styles.dangerButton;
      case 'secondary': return styles.secondaryButton;
      case 'success': return styles.successButton;
      default: return styles.primaryButton;
    }
  };

  return (
    <TouchableOpacity
      style={[
        getButtonStyle(),
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
            size={16} 
            color="white" 
            style={styles.buttonIcon}
          />
        )}
        <Text style={styles.primaryButtonText}>
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// Create Match Modal Component
const CreateMatchModal = ({ visible, onClose, onCreate }) => {
  const slideAnim = useRef(new Animated.Value(height)).current;
  const { user: authUser } = useAuth();
  
  // Date/Time Picker State
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentDateField, setCurrentDateField] = useState('');
  
  const [newMatch, setNewMatch] = useState({
    title: 'Solo Battle',
    game: 'freefire',
    type: 'Solo',
    map: 'Bermuda',
    entryFee: '50',
    prizePool: '500',
    maxPlayers: '100',
    perKill: '10',
    matchType: 'match',
    roomId: '',
    password: '',
    description: 'A 100 player solo match',
    rules: 'No cheating, fair play only',
    scheduleTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
    endTime: new Date(Date.now() + 4 * 60 * 60 * 1000)
  });

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

  // ✅ Date/Time Picker Functions
  const openDatePicker = (field) => {
    setCurrentDateField(field);
    setShowDatePicker(true);
  };

  const handleDateConfirm = (date) => {
    setNewMatch(prev => ({
      ...prev,
      [currentDateField]: date.toISOString()
    }));
    setShowDatePicker(false);
  };

  const handleDateCancel = () => {
    setShowDatePicker(false);
  };

  const handleCreate = () => {
    if (!newMatch.title || !newMatch.entryFee || !newMatch.prizePool || !newMatch.maxPlayers || !newMatch.roomId || !newMatch.password) {
      Alert.alert('Error', 'Please fill all required fields (*)');
      return;
    }

    const matchData = {
      title: newMatch.title,
      game: newMatch.game,
      description: newMatch.description,
      rules: newMatch.rules,
      entryFee: Number(newMatch.entryFee) || 0,
      prizePool: Number(newMatch.prizePool) || 0,
      perKill: Number(newMatch.perKill) || 0,
      maxPlayers: Number(newMatch.maxPlayers) || 25,
      roomId: newMatch.roomId,
      password: newMatch.password,
      map: newMatch.map,
      type: newMatch.type,
      status: 'pending', // ✅ Now goes to pending for approval
      matchType: 'match',
      scheduleTime: new Date(newMatch.scheduleTime).toISOString(),
      endTime: new Date(newMatch.endTime).toISOString(),
      created_by: authUser?.userId || 'admin'
    };

    console.log('🔄 Creating match (Pending Approval):', matchData);
    onCreate(matchData);
  };

  const generateRoomId = () => {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    setNewMatch(prev => ({ ...prev, roomId }));
  };

  const generatePassword = () => {
    const password = Math.random().toString(36).substring(2, 6).toUpperCase();
    setNewMatch(prev => ({ ...prev, password }));
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

          <ScrollView style={styles.modalBody}>
            <Text style={styles.sectionTitle}>🎮 Match Information</Text>

            <Text style={styles.modalLabel}>Match Title *</Text>
            <TextInput
              style={styles.modalInput}
              value={newMatch.title}
              onChangeText={(text) => setNewMatch(prev => ({ ...prev, title: text }))}
              placeholder="Enter match title"
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
                  onChangeText={(text) => setNewMatch(prev => ({ ...prev, entryFee: text.replace(/[^0-9]/g, '') }))}
                  placeholder="50"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.formColumn}>
                <Text style={styles.modalLabel}>Prize Pool (৳) *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newMatch.prizePool}
                  onChangeText={(text) => setNewMatch(prev => ({ ...prev, prizePool: text.replace(/[^0-9]/g, '') }))}
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
                  onChangeText={(text) => setNewMatch(prev => ({ ...prev, maxPlayers: text.replace(/[^0-9]/g, '') }))}
                  placeholder="100"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.formColumn}>
                <Text style={styles.modalLabel}>Per Kill Prize (৳)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newMatch.perKill}
                  onChangeText={(text) => setNewMatch(prev => ({ ...prev, perKill: text.replace(/[^0-9]/g, '') }))}
                  placeholder="10"
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Date & Time Selection */}
            <Text style={styles.sectionTitle}>⏰ Timing Information</Text>

            <View style={styles.formRow}>
              <View style={styles.formColumn}>
                <Text style={styles.modalLabel}>Schedule Time *</Text>
                <TouchableOpacity 
                  style={styles.dateInput}
                  onPress={() => openDatePicker('scheduleTime')}
                >
                  <Text style={styles.dateInputText}>
                    {new Date(newMatch.scheduleTime).toLocaleString()}
                  </Text>
                  <Ionicons name="calendar" size={20} color="#2962ff" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.formColumn}>
                <Text style={styles.modalLabel}>End Time *</Text>
                <TouchableOpacity 
                  style={styles.dateInput}
                  onPress={() => openDatePicker('endTime')}
                >
                  <Text style={styles.dateInputText}>
                    {new Date(newMatch.endTime).toLocaleString()}
                  </Text>
                  <Ionicons name="time" size={20} color="#2962ff" />
                </TouchableOpacity>
              </View>
            </View>

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

            {/* Approval Notice */}
            <View style={styles.approvalNotice}>
              <Ionicons name="information-circle" size={20} color="#2962ff" />
              <Text style={styles.approvalNoticeText}>
                This match will be submitted for admin approval and will appear in the Pending tab.
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.secondaryButton} onPress={onClose}>
                <Text style={styles.secondaryButtonText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryButton} onPress={handleCreate}>
                <Text style={styles.primaryButtonText}>CREATE MATCH</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      </View>

      {/* Custom Date Picker Modal */}
      <CustomDatePicker 
        visible={showDatePicker}
        onConfirm={handleDateConfirm}
        onCancel={handleDateCancel}
        value={new Date(newMatch[currentDateField] || newMatch.scheduleTime)}
      />
    </Modal>
  );
};

// Main Component
const MatchControlScreen = ({ navigation }) => {
  const { matches, loading, error, createMatch, refreshMatches, deleteMatch, approveMatch, rejectMatch, updateMatch } = useMatches();
  const { user: authUser } = useAuth();

  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false); // ✅ NEW: Edit Modal State
  const [selectedMatch, setSelectedMatch] = useState(null); // ✅ NEW: Selected Match for Editing

  useEffect(() => {
    refreshMatches();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refreshMatches();
    });
    return unsubscribe;
  }, [navigation]);

  // ✅ FIXED: Proper filtering with approval_status
  const filteredMatches = matches.filter(match => {
    if (!match) return false;
    
    const matchesSearch = 
      (match.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (match.game?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'pending') return matchesSearch && 
      (match.approval_status === 'pending' || match.approvalStatus === 'pending');
    if (activeTab === 'approved') return matchesSearch && 
      (match.approval_status === 'approved' || match.approvalStatus === 'approved');
    if (activeTab === 'rejected') return matchesSearch && 
      (match.approval_status === 'rejected' || match.approvalStatus === 'rejected');
    if (activeTab === 'upcoming') return matchesSearch && 
      (match.status === 'upcoming' || match.status === 'pending');
    if (activeTab === 'live') return matchesSearch && match.status === 'live';
    if (activeTab === 'completed') return matchesSearch && match.status === 'completed';
    
    return matchesSearch;
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await refreshMatches();
    setRefreshing(false);
  };

  // ✅ FIXED: Now using createMatch instead of createTournament
  const handleCreateMatch = async (newMatch) => {
    try {
      console.log('🔄 Creating match (Pending Approval):', newMatch);
      
      const result = await createMatch(newMatch);
      
      if (result && result.success) {
        Alert.alert('Success! 🎉', 'Match created successfully! Waiting for admin approval.', [
          { 
            text: 'OK', 
            onPress: () => {
              setShowCreateModal(false);
              refreshMatches();
              setActiveTab('pending'); // Switch to pending tab
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

  // ✅ FIXED: Now using deleteMatch instead of deleteTournament
  const handleDeleteMatch = async (matchId) => {
    Alert.alert(
      'Delete Match',
      'Are you sure you want to delete this match?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            const result = await deleteMatch(matchId);
            if (result.success) {
              Alert.alert('Success', 'Match deleted successfully!');
              refreshMatches();
            } else {
              Alert.alert('Error', result.error || 'Failed to delete match');
            }
          }
        }
      ]
    );
  };

  // ✅ NEW: Approve Match Function
  const handleApproveMatch = async (matchId) => {
    Alert.alert(
      'Approve Match',
      'Are you sure you want to approve this match?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Approve', 
          style: 'default',
          onPress: async () => {
            const result = await approveMatch(matchId);
            if (result.success) {
              Alert.alert('Success', 'Match approved successfully!');
              refreshMatches();
            } else {
              Alert.alert('Error', result.error || 'Failed to approve match');
            }
          }
        }
      ]
    );
  };

  // ✅ NEW: Reject Match Function
  const handleRejectMatch = async (matchId) => {
    Alert.alert(
      'Reject Match',
      'Are you sure you want to reject this match?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reject', 
          style: 'destructive',
          onPress: async () => {
            const result = await rejectMatch(matchId);
            if (result.success) {
              Alert.alert('Success', 'Match rejected successfully!');
              refreshMatches();
            } else {
              Alert.alert('Error', result.error || 'Failed to reject match');
            }
          }
        }
      ]
    );
  };

  // ✅ NEW: Edit Match Function
  const handleEditMatch = (match) => {
    setSelectedMatch(match);
    setShowEditModal(true);
  };

  // ✅ NEW: Update Match Function
  const handleUpdateMatch = async (matchId, updateData) => {
    try {
      const result = await updateMatch(matchId, updateData);
      if (result.success) {
        Alert.alert('Success', 'Match updated successfully!');
        refreshMatches();
      } else {
        Alert.alert('Error', result.error || 'Failed to update match');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update match');
    }
  };

  // Match Card Component
  const MatchCard = ({ match, index }) => {
    const gameInfo = GAMES[match.game] || GAMES.freefire;
    const isPending = match.approval_status === 'pending' || match.approvalStatus === 'pending';
    const isApproved = match.approval_status === 'approved' || match.approvalStatus === 'approved';
    const isRejected = match.approval_status === 'rejected' || match.approvalStatus === 'rejected';
    
    return (
      <View style={styles.matchCard}>
        <LinearGradient colors={['#1a237e', '#283593']} style={styles.cardGradient}>
          <View style={styles.cardHeader}>
            <View style={styles.gameInfo}>
              <View style={[styles.gameIcon, { backgroundColor: gameInfo.color }]}>
                <Ionicons name={gameInfo.icon} size={20} color="white" />
              </View>
              <View style={styles.matchInfo}>
                <Text style={styles.matchTitle}>{match.title}</Text>
                <Text style={styles.matchSubtitle}>{gameInfo.name} • {match.type}</Text>
                <Text style={styles.matchTypeBadge}>
                  {match.matchType === 'tournament' ? '🏆 TOURNAMENT' : '⚡ MATCH'}
                </Text>
              </View>
            </View>
            <View style={[
              styles.statusBadge,
              { 
                backgroundColor: isPending ? '#FF9800' : 
                                isRejected ? '#F44336' : 
                                match.status === 'live' ? '#4CAF50' : 
                                match.status === 'completed' ? '#2196F3' : 
                                '#2962ff'
              }
            ]}>
              <Text style={styles.statusText}>
                {isPending ? 'PENDING' : 
                 isRejected ? 'REJECTED' : 
                 match.status?.toUpperCase() || 'UPCOMING'}
              </Text>
            </View>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>৳{match.entryFee || 0}</Text>
              <Text style={styles.statLabel}>Entry</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>৳{match.prizePool || 0}</Text>
              <Text style={styles.statLabel}>Prize</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {match.currentPlayers || 0}/{match.maxPlayers || 50}
              </Text>
              <Text style={styles.statLabel}>Players</Text>
            </View>
          </View>

          <View style={styles.timeInfo}>
            <Text style={styles.timeText}>
              Starts: {new Date(match.scheduleTime).toLocaleString()}
            </Text>
          </View>

          <View style={styles.actionButtons}>
            {isPending && (
              <>
                <TouchableOpacity 
                  style={styles.approveButton}
                  onPress={() => handleApproveMatch(match._id || match.id)}
                >
                  <Ionicons name="checkmark" size={16} color="#4CAF50" />
                  <Text style={styles.approveButtonText}>Approve</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.rejectButton}
                  onPress={() => handleRejectMatch(match._id || match.id)}
                >
                  <Ionicons name="close" size={16} color="#F44336" />
                  <Text style={styles.rejectButtonText}>Reject</Text>
                </TouchableOpacity>
              </>
            )}
            
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => handleEditMatch(match)}
            >
              <Ionicons name="create-outline" size={16} color="#2962ff" />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={() => handleDeleteMatch(match._id || match.id)}
            >
              <Ionicons name="trash-outline" size={16} color="#F44336" />
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  };

  if (loading && matches.length === 0) {
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
              {/* ✅ FIXED: Show matches count instead of tournaments */}
              <Text style={styles.syncStatus}>
                {filteredMatches.length} matches • {loading ? 'Syncing...' : 'Synced'}
              </Text>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerActionButton} onPress={() => setShowCreateModal(true)}>
                <Ionicons name="add" size={20} color="white" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerActionButton} onPress={refreshMatches}>
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
            { key: 'pending', label: 'Pending' },
            { key: 'upcoming', label: 'Upcoming' },
            { key: 'live', label: 'Live' },
            { key: 'completed', label: 'Completed' },
            { key: 'rejected', label: 'Rejected' }
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

        {/* Match List - ✅ FIXED: Using filteredMatches */}
        <FlatList
          data={filteredMatches}
          keyExtractor={(item) => item.id || item._id || Math.random().toString()}
          renderItem={({ item, index }) => <MatchCard match={item} index={index} />}
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
              <TouchableOpacity 
                style={styles.emptyButton}
                onPress={() => setShowCreateModal(true)}
              >
                <Text style={styles.emptyButtonText}>CREATE MATCH</Text>
              </TouchableOpacity>
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

      {/* ✅ NEW: Edit Match Modal */}
      <EditMatchModal
        visible={showEditModal}
        match={selectedMatch}
        onClose={() => {
          setShowEditModal(false);
          setSelectedMatch(null);
        }}
        onUpdate={handleUpdateMatch}
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

// Complete Styles
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
    backgroundColor: '#2962ff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
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
  matchTypeBadge: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 2,
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
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  // ✅ NEW: Approve Button Styles
  approveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  approveButtonText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // ✅ NEW: Reject Button Styles
  rejectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  rejectButtonText: {
    color: '#F44336',
    fontSize: 12,
    fontWeight: 'bold',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(41, 98, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  editButtonText: {
    color: '#2962ff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  deleteButtonText: {
    color: '#F44336',
    fontSize: 12,
    fontWeight: 'bold',
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
  formRow: {
    flexDirection: 'row',
    marginHorizontal: -8,
    marginBottom: 16,
  },
  formColumn: {
    flex: 1,
    paddingHorizontal: 8,
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
  // ✅ NEW: Approval Notice Styles
  approvalNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(41, 98, 255, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  approvalNoticeText: {
    color: '#2962ff',
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  // Button Styles
  primaryButton: {
    backgroundColor: '#2962ff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: 8,
  },
  primaryButtonText: {
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
    flex: 1,
    marginHorizontal: 8,
  },
  secondaryButtonText: {
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
  successButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
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
  // Custom Picker Styles
  customPickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  customPickerContent: {
    backgroundColor: '#1e1e1e',
    borderRadius: 15,
    padding: 20,
    maxHeight: '80%',
  },
  customPickerHeader: {
    marginBottom: 15,
  },
  customPickerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  pickerContainer: {
    marginBottom: 20,
  },
  pickerSection: {
    marginBottom: 20,
  },
  pickerLabel: {
    color: 'white',
    fontSize: 16,
    marginBottom: 10,
    fontWeight: '600',
  },
  pickerSubLabel: {
    color: '#bbb',
    fontSize: 12,
    marginBottom: 5,
    textAlign: 'center',
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pickerColumn: {
    flex: 1,
    marginHorizontal: 5,
  },
  pickerScroll: {
    maxHeight: 150,
    backgroundColor: '#2d2d2d',
    borderRadius: 8,
  },
  pickerItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
    alignItems: 'center',
  },
  pickerItemSelected: {
    backgroundColor: '#2962ff',
  },
  pickerItemText: {
    color: 'white',
    fontSize: 14,
  },
  pickerItemTextSelected: {
    color: 'white',
    fontWeight: 'bold',
  },
  selectedDatePreview: {
    backgroundColor: '#2d2d2d',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  selectedDateText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: 'bold',
  },
  customPickerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cancelButton: {
    backgroundColor: '#666',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmButton: {
    backgroundColor: '#2962ff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Date input styles
  dateInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateInputText: {
    color: '#333',
    fontSize: 14,
  },
});

export default MatchControlScreen;
