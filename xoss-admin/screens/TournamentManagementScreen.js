// screens/TournamentManagementScreen.js - WITH APPROVE & REJECT BUTTONS
import React, { useState, useEffect } from 'react';
import { 
  View, Text, ScrollView, TouchableOpacity, StyleSheet, 
  TextInput, Alert, Modal, RefreshControl, FlatList,
  ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTournaments } from '../context/TournamentContext';

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

const TournamentManagementScreen = ({ navigation }) => {
  // ✅ FIXED: Add approveTournament and rejectTournament from context
  const { 
    tournaments, 
    loading, 
    error, 
    refreshTournaments, 
    createTournament, 
    deleteTournament,
    approveTournament,  // ✅ Add this
    rejectTournament    // ✅ Add this
  } = useTournaments();
  
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  
  // Date/Time Picker State
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentDateField, setCurrentDateField] = useState('');
  
  // ✅ FIXED: Proper initial state with ALL required fields
  const [newTournament, setNewTournament] = useState({
    title: 'Weekend Tournament',
    game: 'freefire',
    entryFee: '50',
    prizePool: '500',
    maxPlayers: '100',
    perKill: '10',
    roomId: '',
    password: '',
    description: 'Join our exciting weekend tournament!',
    rules: 'No cheating, fair play only',
    type: 'Squad',
    map: 'Bermuda',
    scheduleTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // ✅ REQUIRED
    endTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString() // ✅ REQUIRED
  });

  const GAMES = {
    freefire: { name: 'Free Fire', icon: 'flame', color: '#FF6B00' },
    pubg: { name: 'PUBG Mobile', icon: 'game-controller', color: '#4CAF50' },
    cod: { name: 'Call of Duty', icon: 'shield', color: '#2196F3' },
    ludo: { name: 'Ludo King', icon: 'dice', color: '#9C27B0' },
    bgmi: { name: 'BGMI', icon: 'phone-portrait', color: '#FF4444' }
  };

  useEffect(() => {
    refreshTournaments();
  }, []);

  // ✅ FIXED: Approve Tournament Function - Now uses TournamentContext
  const handleApproveTournament = async (tournamentId) => {
    Alert.alert(
      'Approve Tournament',
      'Are you sure you want to approve this tournament?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Approve', 
          style: 'default',
          onPress: async () => {
            try {
              console.log('✅ Approving tournament:', tournamentId);
              // ✅ Use TournamentContext's approveTournament function
              const result = await approveTournament(tournamentId);
              if (result.success) {
                Alert.alert('Success', result.message || 'Tournament approved successfully!');
                refreshTournaments();
              } else {
                Alert.alert('Error', result.error || 'Failed to approve tournament');
              }
            } catch (err) {
              console.error('❌ Approve tournament error:', err);
              Alert.alert('Error', err.message || 'Failed to approve tournament');
            }
          }
        }
      ]
    );
  };

  // ✅ FIXED: Reject Tournament Function - Now uses TournamentContext
  const handleRejectTournament = async (tournamentId) => {
    Alert.alert(
      'Reject Tournament',
      'Are you sure you want to reject this tournament?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reject', 
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('❌ Rejecting tournament:', tournamentId);
              // ✅ Use TournamentContext's rejectTournament function
              const result = await rejectTournament(tournamentId);
              if (result.success) {
                Alert.alert('Success', result.message || 'Tournament rejected successfully!');
                refreshTournaments();
              } else {
                Alert.alert('Error', result.error || 'Failed to reject tournament');
              }
            } catch (err) {
              console.error('❌ Reject tournament error:', err);
              Alert.alert('Error', err.message || 'Failed to reject tournament');
            }
          }
        }
      ]
    );
  };

  // ✅ Date/Time Picker Functions
  const openDatePicker = (field) => {
    setCurrentDateField(field);
    setShowDatePicker(true);
  };

  const handleDateConfirm = (date) => {
    setNewTournament(prev => ({
      ...prev,
      [currentDateField]: date.toISOString()
    }));
    setShowDatePicker(false);
  };

  const handleDateCancel = () => {
    setShowDatePicker(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshTournaments();
    setRefreshing(false);
  };

  // ✅ FIXED: Proper tournament creation
  const handleCreateTournament = async () => {
    // ✅ VALIDATE ALL REQUIRED FIELDS
    if (!newTournament.title || !newTournament.entryFee || !newTournament.prizePool || 
        !newTournament.maxPlayers || !newTournament.scheduleTime) {
      Alert.alert('Error', 'Please fill all required fields (*)');
      return;
    }

    setCreateLoading(true);

    const tournamentData = {
      title: newTournament.title,
      game: newTournament.game,
      entryFee: newTournament.entryFee,
      prizePool: newTournament.prizePool,
      maxPlayers: newTournament.maxPlayers,
      perKill: newTournament.perKill || 0,
      roomId: newTournament.roomId,
      password: newTournament.password,
      description: newTournament.description,
      rules: newTournament.rules,
      type: newTournament.type,
      map: newTournament.map,
      scheduleTime: newTournament.scheduleTime, // ✅ REQUIRED
      endTime: newTournament.endTime, // ✅ REQUIRED
      matchType: 'tournament'
    };

    console.log('🔄 Creating tournament with data:', tournamentData);

    const result = await createTournament(tournamentData);
    
    setCreateLoading(false);
    
    if (result.success) {
      Alert.alert('Success! 🎉', result.message || 'Tournament created successfully and auto-approved!', [
        { 
          text: 'OK', 
          onPress: () => {
            setShowCreateModal(false);
            // Reset form
            setNewTournament({
              title: 'Weekend Tournament',
              game: 'freefire',
              entryFee: '50',
              prizePool: '500',
              maxPlayers: '100',
              perKill: '10',
              roomId: '',
              password: '',
              description: 'Join our exciting weekend tournament!',
              rules: 'No cheating, fair play only',
              type: 'Squad',
              map: 'Bermuda',
              scheduleTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
              endTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()
            });
          }
        }
      ]);
    } else {
      Alert.alert('Error', result.error || 'Failed to create tournament');
    }
  };

  const handleDeleteTournament = async (tournamentId) => {
    Alert.alert(
      'Delete Tournament',
      'Are you sure you want to delete this tournament?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            const result = await deleteTournament(tournamentId);
            if (result.success) {
              Alert.alert('Success', 'Tournament deleted successfully!');
              refreshTournaments();
            } else {
              Alert.alert('Error', result.error || 'Failed to delete tournament');
            }
          }
        }
      ]
    );
  };

  const generateRoomId = () => {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    setNewTournament(prev => ({ ...prev, roomId }));
  };

  const generatePassword = () => {
    const password = Math.random().toString(36).substring(2, 6).toUpperCase();
    setNewTournament(prev => ({ ...prev, password }));
  };

  const TournamentCard = ({ tournament }) => {
    const gameInfo = GAMES[tournament.game] || GAMES.freefire;
    
    const participants = {
      current: tournament.currentPlayers || tournament.current_participants || 0,
      max: tournament.maxPlayers || tournament.max_participants || 50
    };

    const prizePool = tournament.prizePool || tournament.total_prize || 0;
    const entryFee = tournament.entryFee || tournament.entry_fee || 0;
    
    // ✅ FIXED: Check if tournament is pending for approval
    const isPending = tournament.approval_status === 'pending';
    
    return (
      <View style={styles.tournamentCard}>
        <LinearGradient colors={['#1a237e', '#283593']} style={styles.cardGradient}>
          <View style={styles.cardHeader}>
            <View style={styles.gameInfo}>
              <View style={[styles.gameIcon, { backgroundColor: gameInfo.color }]}>
                <Ionicons name={gameInfo.icon} size={20} color="white" />
              </View>
              <View style={styles.tournamentInfo}>
                <Text style={styles.tournamentTitle}>{tournament.title}</Text>
                <Text style={styles.tournamentSubtitle}>{gameInfo.name} • {tournament.type || 'Squad'}</Text>
                <Text style={styles.matchTypeBadge}>
                  {tournament.matchType === 'tournament' ? '🏆 TOURNAMENT' : '⚡ MATCH'}
                </Text>
              </View>
            </View>
            <View style={[
              styles.statusBadge,
              { 
                backgroundColor: tournament.status === 'live' ? '#4CAF50' : 
                                tournament.status === 'completed' ? '#2196F3' : 
                                isPending ? '#FF9800' : '#4CAF50' // ✅ Approved হলে সবুজ
              }
            ]}>
              <Text style={styles.statusText}>
                {isPending ? 'PENDING' : 
                 tournament.status ? tournament.status.toUpperCase() : 'UPCOMING'}
              </Text>
            </View>
          </View>

          {/* ✅ Approval Status Indicator */}
          {tournament.approval_status && (
            <View style={styles.approvalStatusContainer}>
              <View style={[
                styles.approvalBadge,
                { 
                  backgroundColor: tournament.approval_status === 'approved' ? '#4CAF50' :
                                  tournament.approval_status === 'rejected' ? '#F44336' :
                                  '#FF9800'
                }
              ]}>
                <Text style={styles.approvalText}>
                  {tournament.approval_status.toUpperCase()}
                </Text>
              </View>
              {tournament.approved_by && tournament.approved_by.username && (
                <Text style={styles.approvedByText}>
                  Approved by: {tournament.approved_by.username}
                </Text>
              )}
            </View>
          )}

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>৳{entryFee}</Text>
              <Text style={styles.statLabel}>Entry</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>৳{prizePool}</Text>
              <Text style={styles.statLabel}>Prize</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {participants.current}/{participants.max}
              </Text>
              <Text style={styles.statLabel}>Players</Text>
            </View>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${(participants.current / participants.max) * 100}%`,
                    backgroundColor: tournament.status === 'live' ? '#4CAF50' : '#2962ff'
                  }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {participants.current}/{participants.max} registered • {Math.round((participants.current / participants.max) * 100)}% full
            </Text>
          </View>

          {/* ✅ Approve & Reject Buttons (Only for pending tournaments) */}
          {isPending && (
            <View style={styles.adminActions}>
              <TouchableOpacity 
                style={styles.approveButton} 
                onPress={() => handleApproveTournament(tournament._id || tournament.id)}
              >
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.approveButtonText}>Approve</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.rejectButton} 
                onPress={() => handleRejectTournament(tournament._id || tournament.id)}
              >
                <Ionicons name="close-circle" size={16} color="#F44336" />
                <Text style={styles.rejectButtonText}>Reject</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.editButton}>
              <Ionicons name="create-outline" size={16} color="#2962ff" />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.deleteButton} 
              onPress={() => handleDeleteTournament(tournament._id || tournament.id)}
            >
              <Ionicons name="trash-outline" size={16} color="#F44336" />
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>

          {tournament.scheduleTime && (
            <View style={styles.timeInfo}>
              <Text style={styles.timeText}>
                Starts: {new Date(tournament.scheduleTime).toLocaleString()}
              </Text>
            </View>
          )}
        </LinearGradient>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tournament Management</Text>
        <TouchableOpacity onPress={() => setShowCreateModal(true)} style={styles.createButton}>
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {loading && tournaments.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2962ff" />
          <Text style={styles.loadingText}>Loading tournaments...</Text>
        </View>
      ) : (
        <FlatList
          data={tournaments.filter(t => t.matchType === 'tournament' || t.match_type === 'tournament')}
          keyExtractor={(item) => item._id || item.id || Math.random().toString()}
          renderItem={({ item }) => <TournamentCard tournament={item} />}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={handleRefresh}
              colors={['#2962ff']}
            />
          }
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="trophy-outline" size={64} color="#666" />
              <Text style={styles.emptyText}>No tournaments found</Text>
              <Text style={styles.emptySubtext}>Create your first tournament to get started</Text>
              <TouchableOpacity style={styles.emptyButton} onPress={() => setShowCreateModal(true)}>
                <Text style={styles.emptyButtonText}>Create Tournament</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Create Tournament Modal */}
      <Modal visible={showCreateModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Tournament (Auto-Approved)</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Tournament Title *</Text>
              <TextInput
                style={styles.textInput}
                value={newTournament.title}
                onChangeText={(text) => setNewTournament(prev => ({ ...prev, title: text }))}
                placeholder="Enter tournament title"
              />

              <Text style={styles.inputLabel}>Select Game *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.gameOptions}>
                  {Object.keys(GAMES).map((gameId) => (
                    <TouchableOpacity
                      key={gameId}
                      style={[
                        styles.gameOption,
                        newTournament.game === gameId && { backgroundColor: GAMES[gameId].color }
                      ]}
                      onPress={() => setNewTournament(prev => ({ ...prev, game: gameId }))}
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
              </ScrollView>

              <View style={styles.row}>
                <View style={styles.column}>
                  <Text style={styles.inputLabel}>Entry Fee (৳) *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={newTournament.entryFee}
                    onChangeText={(text) => setNewTournament(prev => ({ ...prev, entryFee: text.replace(/[^0-9]/g, '') }))}
                    keyboardType="numeric"
                    placeholder="50"
                  />
                </View>
                <View style={styles.column}>
                  <Text style={styles.inputLabel}>Prize Pool (৳) *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={newTournament.prizePool}
                    onChangeText={(text) => setNewTournament(prev => ({ ...prev, prizePool: text.replace(/[^0-9]/g, '') }))}
                    keyboardType="numeric"
                    placeholder="500"
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Max Players *</Text>
              <TextInput
                style={styles.textInput}
                value={newTournament.maxPlayers}
                onChangeText={(text) => setNewTournament(prev => ({ ...prev, maxPlayers: text.replace(/[^0-9]/g, '') }))}
                keyboardType="numeric"
                placeholder="100"
              />

              <View style={styles.row}>
                <View style={styles.column}>
                  <Text style={styles.inputLabel}>Type</Text>
                  <TextInput
                    style={styles.textInput}
                    value={newTournament.type}
                    onChangeText={(text) => setNewTournament(prev => ({ ...prev, type: text }))}
                    placeholder="Squad"
                  />
                </View>
                <View style={styles.column}>
                  <Text style={styles.inputLabel}>Map</Text>
                  <TextInput
                    style={styles.textInput}
                    value={newTournament.map}
                    onChangeText={(text) => setNewTournament(prev => ({ ...prev, map: text }))}
                    placeholder="Bermuda"
                  />
                </View>
              </View>

              {/* Date & Time Selection */}
              <Text style={styles.sectionTitle}>⏰ Timing Information</Text>

              <View style={styles.row}>
                <View style={styles.column}>
                  <Text style={styles.inputLabel}>Schedule Time *</Text>
                  <TouchableOpacity 
                    style={styles.dateInput}
                    onPress={() => openDatePicker('scheduleTime')}
                  >
                    <Text style={styles.dateInputText}>
                      {new Date(newTournament.scheduleTime).toLocaleString()}
                    </Text>
                    <Ionicons name="calendar" size={20} color="#2962ff" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.column}>
                  <Text style={styles.inputLabel}>End Time *</Text>
                  <TouchableOpacity 
                    style={styles.dateInput}
                    onPress={() => openDatePicker('endTime')}
                  >
                    <Text style={styles.dateInputText}>
                      {new Date(newTournament.endTime).toLocaleString()}
                    </Text>
                    <Ionicons name="time" size={20} color="#2962ff" />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.inputLabel}>Room ID *</Text>
              <View style={styles.inputWithButton}>
                <TextInput
                  style={[styles.textInput, { flex: 1 }]}
                  value={newTournament.roomId}
                  onChangeText={(text) => setNewTournament(prev => ({ ...prev, roomId: text }))}
                  placeholder="Enter room ID"
                />
                <TouchableOpacity style={styles.generateButton} onPress={generateRoomId}>
                  <Text style={styles.generateButtonText}>Generate</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Password *</Text>
              <View style={styles.inputWithButton}>
                <TextInput
                  style={[styles.textInput, { flex: 1 }]}
                  value={newTournament.password}
                  onChangeText={(text) => setNewTournament(prev => ({ ...prev, password: text }))}
                  placeholder="Enter password"
                  secureTextEntry
                />
                <TouchableOpacity style={styles.generateButton} onPress={generatePassword}>
                  <Text style={styles.generateButtonText}>Generate</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={newTournament.description}
                onChangeText={(text) => setNewTournament(prev => ({ ...prev, description: text }))}
                placeholder="Tournament description..."
                multiline
                numberOfLines={3}
              />

              <Text style={styles.inputLabel}>Rules</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={newTournament.rules}
                onChangeText={(text) => setNewTournament(prev => ({ ...prev, rules: text }))}
                placeholder="Tournament rules..."
                multiline
                numberOfLines={2}
              />

              <Text style={styles.helperText}>
                ℹ️ Note: Tournaments are auto-approved and will be immediately visible.
              </Text>

              <TouchableOpacity 
                style={[styles.createButtonModal, createLoading && styles.createButtonDisabled]} 
                onPress={handleCreateTournament}
                disabled={createLoading}
              >
                {createLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.createButtonText}>Create Tournament (Auto-Approved)</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Custom Date Picker Modal */}
      <CustomDatePicker 
        visible={showDatePicker}
        onConfirm={handleDateConfirm}
        onCancel={handleDateCancel}
        value={new Date(newTournament[currentDateField] || newTournament.scheduleTime)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0c23',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
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
  createButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    marginTop: 16,
    fontSize: 16,
  },
  listContent: {
    padding: 16,
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
  tournamentCard: {
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
  tournamentInfo: {
    flex: 1,
  },
  tournamentTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  tournamentSubtitle: {
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
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    textAlign: 'center',
  },
  
  // ✅ NEW: Approve & Reject Button Styles
  adminActions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 8,
    marginTop: 12,
    marginBottom: 8,
  },
  approveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  approveButtonText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: 'bold',
  },
  rejectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  rejectButtonText: {
    color: '#F44336',
    fontSize: 14,
    fontWeight: 'bold',
  },
  
  // ✅ NEW: Approval Status Styles
  approvalStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
  },
  approvalBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  approvalText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  approvedByText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
  },
  
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
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
  timeInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  timeText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: -10,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    color: '#333',
  },
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    marginHorizontal: -8,
    marginBottom: 16,
  },
  column: {
    flex: 1,
    paddingHorizontal: 8,
  },
  gameOptions: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  gameOption: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginRight: 12,
    minWidth: 80,
  },
  gameOptionText: {
    fontSize: 12,
    color: '#333',
    marginTop: 4,
  },
  gameOptionTextSelected: {
    color: 'white',
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
  createButtonModal: {
    backgroundColor: '#2962ff',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
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
});

export default TournamentManagementScreen;
