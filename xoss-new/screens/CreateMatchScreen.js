// screens/CreateMatchScreen.js - COMPLETELY FIXED WITH CUSTOM DATE PICKER
import React, { useState } from 'react';
import { 
  View, Text, ScrollView, TouchableOpacity, StyleSheet, 
  TextInput, Alert, Modal, ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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

const CreateMatchScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const { createTournament } = useTournaments();

  // Date/Time Picker State
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentDateField, setCurrentDateField] = useState('');

  const [formData, setFormData] = useState({
    title: 'Solo Battle Match',
    game: 'freefire',
    type: 'Solo',
    map: 'Bermuda',
    entryFee: '50',
    prizePool: '500',
    maxPlayers: '100',
    perKill: '10',
    roomId: '',
    password: '',
    description: 'Join this exciting solo battle match!',
    rules: 'No cheating, fair play only. Respect other players.',
    scheduleTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
  });

  // ✅ Date/Time Picker Functions
  const openDatePicker = (field) => {
    setCurrentDateField(field);
    setShowDatePicker(true);
  };

  const handleDateConfirm = (date) => {
    setFormData(prev => ({
      ...prev,
      [currentDateField]: date.toISOString()
    }));
    setShowDatePicker(false);
  };

  const handleDateCancel = () => {
    setShowDatePicker(false);
  };

  // ✅ FIXED: Single API call with consistent field names
  const handleCreateMatch = async () => {
    if (!formData.title || !formData.entryFee || !formData.prizePool || !formData.maxPlayers || !formData.roomId || !formData.password) {
      Alert.alert('Error', 'Please fill all required fields (*)');
      return;
    }

    setLoading(true);

    try {
      // ✅ IMPORTANT: Set status to 'pending' for admin approval
      const matchData = {
        // Basic info
        title: formData.title,
        game: formData.game,
        description: formData.description,
        rules: formData.rules,
        
        // Financial info
        entryFee: Number(formData.entryFee) || 0,
        prizePool: Number(formData.prizePool) || 0,
        perKill: Number(formData.perKill) || 0,
        
        // Participants info
        maxPlayers: Number(formData.maxPlayers) || 25,
        
        // Room info
        roomId: formData.roomId,
        password: formData.password,
        
        // Game settings
        map: formData.map,
        type: formData.type,
        
        // Status and timing - ✅ CRITICAL: Set to 'pending' for approval
        status: 'pending', // This will make it appear in MatchControlScreen pending tab
        matchType: 'match', // This creates a match, not tournament
        scheduleTime: formData.scheduleTime,
        endTime: formData.endTime,
        
        // Approval status
        approval_status: 'pending' // Backend field for approval
      };

      console.log('🔄 Creating match with PENDING status:', matchData);

      // ✅ SINGLE API CALL to matches endpoint
      const result = await createTournament(matchData);
      
      if (result && result.success) {
        Alert.alert(
          '✅ Success!',
          'Your match has been created and sent for admin approval!',
          [{ 
            text: 'OK', 
            onPress: () => navigation.goBack() 
          }]
        );
      } else {
        throw new Error(result?.error || 'Match creation failed');
      }

    } catch (err) {
      console.error('❌ Create match error:', err);
      Alert.alert('❌ Error', err.message || 'Failed to create match');
    } finally {
      setLoading(false);
    }
  };

  const generateRoomId = () => {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    setFormData(prev => ({ ...prev, roomId }));
  };

  const generatePassword = () => {
    const password = Math.random().toString(36).substring(2, 6).toUpperCase();
    setFormData(prev => ({ ...prev, password }));
  };

  // Game Configuration
  const GAMES = {
    freefire: { name: 'Free Fire', icon: 'flame', color: '#FF6B00' },
    pubg: { name: 'PUBG Mobile', icon: 'game-controller', color: '#4CAF50' },
    cod: { name: 'Call of Duty', icon: 'shield', color: '#2196F3' },
    ludo: { name: 'Ludo King', icon: 'dice', color: '#9C27B0' },
    bgmi: { name: 'BGMI', icon: 'phone-portrait', color: '#FF4444' }
  };

  const GAME_MODES = {
    freefire: ['Solo', 'Duo', 'Squad', 'Clash Squad'],
    pubg: ['Solo', 'Duo', 'Squad', 'TPP', 'FPP'],
    cod: ['MP', 'Battle Royale', 'Zombies'],
    ludo: ['Classic', 'Quick', 'Master'],
    bgmi: ['Solo', 'Duo', 'Squad']
  };

  const GAME_MAPS = {
    freefire: ['Bermuda', 'Purgatory', 'Kalahari', 'Bermuda Remastered'],
    pubg: ['Erangel', 'Miramar', 'Sanhok', 'Vikendi'],
    cod: ['Standoff', 'Crash', 'Raid', 'Firing Range'],
    ludo: ['Classic Board'],
    bgmi: ['Erangel', 'Miramar', 'Livik', 'Sanhok']
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Match</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>🎮 Match Information</Text>

        {/* Match Title */}
        <Text style={styles.label}>Match Title *</Text>
        <TextInput
          style={styles.input}
          value={formData.title}
          onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
          placeholder="Enter match title"
          placeholderTextColor="#888"
        />

        {/* Game Selection */}
        <Text style={styles.label}>Select Game *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gameScroll}>
          <View style={styles.gameSelection}>
            {Object.keys(GAMES).map((gameId) => (
              <TouchableOpacity
                key={gameId}
                style={[
                  styles.gameOption,
                  formData.game === gameId && styles.gameOptionSelected
                ]}
                onPress={() => setFormData(prev => ({ 
                  ...prev, 
                  game: gameId,
                  type: GAME_MODES[gameId]?.[0] || 'Solo',
                  map: GAME_MAPS[gameId]?.[0] || 'Default'
                }))}
              >
                <View style={[
                  styles.gameOptionContent,
                  formData.game === gameId && styles.gameOptionContentSelected
                ]}>
                  <Ionicons 
                    name={GAMES[gameId].icon} 
                    size={20} 
                    color={formData.game === gameId ? 'white' : GAMES[gameId].color} 
                  />
                  <Text style={[
                    styles.gameOptionText,
                    formData.game === gameId && styles.gameOptionTextSelected
                  ]}>
                    {GAMES[gameId].name}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Game Type and Map */}
        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={styles.label}>Game Type</Text>
            <View style={styles.pickerContainer}>
              {GAME_MODES[formData.game]?.map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.pickerOption,
                    formData.type === mode && styles.pickerOptionSelected
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, type: mode }))}
                >
                  <Text style={[
                    styles.pickerOptionText,
                    formData.type === mode && styles.pickerOptionTextSelected
                  ]}>
                    {mode}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.column}>
            <Text style={styles.label}>Map</Text>
            <View style={styles.pickerContainer}>
              {GAME_MAPS[formData.game]?.map((map) => (
                <TouchableOpacity
                  key={map}
                  style={[
                    styles.pickerOption,
                    formData.map === map && styles.pickerOptionSelected
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, map }))}
                >
                  <Text style={[
                    styles.pickerOptionText,
                    formData.map === map && styles.pickerOptionTextSelected
                  ]}>
                    {map}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Date & Time Selection */}
        <Text style={styles.sectionTitle}>⏰ Timing Information</Text>

        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={styles.label}>Schedule Time *</Text>
            <TouchableOpacity 
              style={styles.dateInput}
              onPress={() => openDatePicker('scheduleTime')}
            >
              <Text style={styles.dateInputText}>
                {new Date(formData.scheduleTime).toLocaleString()}
              </Text>
              <Ionicons name="calendar" size={20} color="#2962ff" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.column}>
            <Text style={styles.label}>End Time *</Text>
            <TouchableOpacity 
              style={styles.dateInput}
              onPress={() => openDatePicker('endTime')}
            >
              <Text style={styles.dateInputText}>
                {new Date(formData.endTime).toLocaleString()}
              </Text>
              <Ionicons name="time" size={20} color="#2962ff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Financial Information */}
        <Text style={styles.sectionTitle}>💰 Financial Information</Text>

        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={styles.label}>Entry Fee (৳) *</Text>
            <TextInput
              style={styles.input}
              value={formData.entryFee}
              onChangeText={(text) => setFormData(prev => ({ 
                ...prev, 
                entryFee: text.replace(/[^0-9]/g, '')
              }))}
              placeholder="50"
              keyboardType="numeric"
              placeholderTextColor="#888"
            />
          </View>
          <View style={styles.column}>
            <Text style={styles.label}>Prize Pool (৳) *</Text>
            <TextInput
              style={styles.input}
              value={formData.prizePool}
              onChangeText={(text) => setFormData(prev => ({ 
                ...prev, 
                prizePool: text.replace(/[^0-9]/g, '')
              }))}
              placeholder="500"
              keyboardType="numeric"
              placeholderTextColor="#888"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={styles.label}>Max Players *</Text>
            <TextInput
              style={styles.input}
              value={formData.maxPlayers}
              onChangeText={(text) => setFormData(prev => ({ 
                ...prev, 
                maxPlayers: text.replace(/[^0-9]/g, '')
              }))}
              placeholder="100"
              keyboardType="numeric"
              placeholderTextColor="#888"
            />
          </View>
          <View style={styles.column}>
            <Text style={styles.label}>Per Kill Prize (৳)</Text>
            <TextInput
              style={styles.input}
              value={formData.perKill}
              onChangeText={(text) => setFormData(prev => ({ 
                ...prev, 
                perKill: text.replace(/[^0-9]/g, '')
              }))}
              placeholder="10"
              keyboardType="numeric"
              placeholderTextColor="#888"
            />
          </View>
        </View>

        {/* Room Information */}
        <Text style={styles.sectionTitle}>🔐 Room Information</Text>

        <Text style={styles.label}>Room ID *</Text>
        <View style={styles.inputWithButton}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={formData.roomId}
            onChangeText={(text) => setFormData(prev => ({ ...prev, roomId: text }))}
            placeholder="Enter room ID"
            placeholderTextColor="#888"
          />
          <TouchableOpacity style={styles.generateButton} onPress={generateRoomId}>
            <Text style={styles.generateButtonText}>Generate</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Password *</Text>
        <View style={styles.inputWithButton}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={formData.password}
            onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
            placeholder="Enter password"
            placeholderTextColor="#888"
            secureTextEntry
          />
          <TouchableOpacity style={styles.generateButton} onPress={generatePassword}>
            <Text style={styles.generateButtonText}>Generate</Text>
          </TouchableOpacity>
        </View>

        {/* Description and Rules */}
        <Text style={styles.sectionTitle}>📝 Additional Information</Text>

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.description}
          onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
          placeholder="Describe your match..."
          placeholderTextColor="#888"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        <Text style={styles.label}>Rules</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.rules}
          onChangeText={(text) => setFormData(prev => ({ ...prev, rules: text }))}
          placeholder="Enter match rules..."
          placeholderTextColor="#888"
          multiline
          numberOfLines={2}
          textAlignVertical="top"
        />

        {/* Create Button */}
        <TouchableOpacity 
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={handleCreateMatch}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.createButtonText}>CREATE MATCH</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.note}>
          Note: Your match will be reviewed by admin before going live
        </Text>
      </ScrollView>

      {/* Custom Date Picker Modal */}
      <CustomDatePicker 
        visible={showDatePicker}
        onConfirm={handleDateConfirm}
        onCancel={handleDateCancel}
        value={new Date(formData[currentDateField] || formData.scheduleTime)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#0a0c23' 
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 16, 
    backgroundColor: '#1a237e' 
  },
  backButton: { 
    padding: 8 
  },
  headerTitle: { 
    color: 'white', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  placeholder: { 
    width: 40 
  },
  formContainer: { 
    flex: 1, 
    padding: 16 
  },
  sectionTitle: { 
    color: 'white', 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginBottom: 16, 
    marginTop: 20,
    textAlign: 'left' 
  },
  label: { 
    color: 'white', 
    fontSize: 14, 
    fontWeight: '600', 
    marginBottom: 8, 
    marginTop: 12 
  },
  input: { 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    borderWidth: 1, 
    borderColor: '#2962ff', 
    borderRadius: 8, 
    padding: 12, 
    color: 'white', 
    fontSize: 16 
  },
  dateInput: {
    backgroundColor: 'rgba(255,255,255,0.1)', 
    borderWidth: 1, 
    borderColor: '#2962ff', 
    borderRadius: 8, 
    padding: 12, 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateInputText: {
    color: 'white', 
    fontSize: 14,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  inputWithButton: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  generateButton: { 
    backgroundColor: '#2962ff', 
    paddingHorizontal: 12, 
    paddingVertical: 12, 
    borderRadius: 8, 
    marginLeft: 8 
  },
  generateButtonText: { 
    color: 'white', 
    fontSize: 12, 
    fontWeight: 'bold' 
  },
  createButton: { 
    backgroundColor: '#2962ff', 
    padding: 16, 
    borderRadius: 8, 
    alignItems: 'center', 
    marginTop: 30,
    marginBottom: 10
  },
  createButtonDisabled: { 
    opacity: 0.6 
  },
  createButtonText: { 
    color: 'white', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  note: { 
    color: '#FF9800', 
    fontSize: 12, 
    textAlign: 'center', 
    marginTop: 16, 
    fontStyle: 'italic' 
  },
  gameScroll: {
    marginBottom: 10,
  },
  gameSelection: {
    flexDirection: 'row',
    paddingVertical: 5,
  },
  gameOption: {
    marginRight: 10,
  },
  gameOptionSelected: {},
  gameOptionContent: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
    minWidth: 80,
  },
  gameOptionContentSelected: {
    backgroundColor: '#2962ff',
    borderColor: '#2962ff',
  },
  gameOptionText: {
    fontSize: 12,
    color: 'white',
    marginTop: 4,
    fontWeight: '500',
  },
  gameOptionTextSelected: {
    color: 'white',
  },
  row: {
    flexDirection: 'row',
    marginHorizontal: -5,
    marginBottom: 10,
  },
  column: {
    flex: 1,
    paddingHorizontal: 5,
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  pickerOption: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#444',
    marginBottom: 5,
  },
  pickerOptionSelected: {
    backgroundColor: '#2962ff',
    borderColor: '#2962ff',
  },
  pickerOptionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  pickerOptionTextSelected: {
    color: 'white',
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

export default CreateMatchScreen;
