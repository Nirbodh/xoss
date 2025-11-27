// screens/CreateTournamentScreen.js - NEW FILE
import React, { useState } from 'react';
import { 
  View, Text, ScrollView, TouchableOpacity, StyleSheet, 
  TextInput, Alert, ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTournaments } from '../context/TournamentContext';
import { useAuth } from '../context/AuthContext';

const CreateTournamentScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const { createTournament } = useTournaments();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    title: 'Premium Tournament',
    game: 'freefire',
    type: 'Squad',
    map: 'Bermuda',
    entryFee: '100',
    prizePool: '5000',
    maxPlayers: '100',
    perKill: '25',
    roomId: '',
    password: '',
    description: 'Join this premium tournament for big prizes!',
    rules: 'No cheating, fair play only. Respect other players.',
    scheduleTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
    matchType: 'tournament' // ✅ This makes it a tournament
  });

  // ✅ FIXED: Tournament creation handler
  const handleCreateTournament = async () => {
    if (!formData.title || !formData.entryFee || !formData.prizePool || !formData.maxPlayers) {
      Alert.alert('Error', 'Please fill all required fields (*)');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'Please login to create tournaments');
      return;
    }

    setLoading(true);

    try {
      console.log('🎯 Creating tournament...', formData);

      const tournamentData = {
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
        maxPlayers: Number(formData.maxPlayers) || 100,
        
        // Room info
        roomId: formData.roomId,
        password: formData.password,
        
        // Game settings
        map: formData.map,
        type: formData.type,
        
        // Status and timing
        status: 'pending',
        matchType: 'tournament', // ✅ CRITICAL: This makes it a tournament
        scheduleTime: formData.scheduleTime,
        endTime: formData.endTime
      };

      const result = await createTournament(tournamentData);
      
      if (result && result.success) {
        Alert.alert(
          '✅ Tournament Created!',
          'Your tournament has been created and sent for admin approval!',
          [{ 
            text: 'OK', 
            onPress: () => navigation.navigate('Tournaments') 
          }]
        );
      } else {
        throw new Error(result?.error || 'Tournament creation failed');
      }

    } catch (err) {
      console.error('❌ Create tournament error:', err);
      Alert.alert('❌ Error', err.message || 'Failed to create tournament');
    } finally {
      setLoading(false);
    }
  };

  const generateRoomId = () => {
    const roomId = Math.random().toString(36).substring(2, 10).toUpperCase();
    setFormData(prev => ({ ...prev, roomId }));
  };

  const generatePassword = () => {
    const password = Math.random().toString(36).substring(2, 8).toUpperCase();
    setFormData(prev => ({ ...prev, password }));
  };

  // Game Configuration
  const GAMES = {
    freefire: { name: 'Free Fire', icon: 'flame', color: '#FF6B00' },
    pubg: { name: 'PUBG Mobile', icon: 'game-controller', color: '#4CAF50' },
    cod: { name: 'Call of Duty', icon: 'shield', color: '#2196F3' },
    bgmi: { name: 'BGMI', icon: 'phone-portrait', color: '#FF4444' }
  };

  const GAME_MODES = {
    freefire: ['Solo', 'Duo', 'Squad', 'Clash Squad'],
    pubg: ['Solo', 'Duo', 'Squad'],
    cod: ['MP', 'Battle Royale', 'Zombies'],
    bgmi: ['Solo', 'Duo', 'Squad']
  };

  const GAME_MAPS = {
    freefire: ['Bermuda', 'Purgatory', 'Kalahari', 'Bermuda Remastered'],
    pubg: ['Erangel', 'Miramar', 'Sanhok', 'Vikendi'],
    cod: ['Standoff', 'Crash', 'Raid', 'Firing Range'],
    bgmi: ['Erangel', 'Miramar', 'Livik', 'Sanhok']
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Tournament</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>🏆 Tournament Information</Text>

        {/* Tournament Title */}
        <Text style={styles.label}>Tournament Title *</Text>
        <TextInput
          style={styles.input}
          value={formData.title}
          onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
          placeholder="Enter tournament title"
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
                  type: GAME_MODES[gameId]?.[0] || 'Squad',
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

        {/* Financial Information */}
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
              placeholder="100"
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
              placeholder="5000"
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
              placeholder="25"
              keyboardType="numeric"
              placeholderTextColor="#888"
            />
          </View>
        </View>

        {/* Room Information */}
        <Text style={styles.label}>Room ID</Text>
        <View style={styles.inputWithButton}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={formData.roomId}
            onChangeText={(text) => setFormData(prev => ({ ...prev, roomId: text }))}
            placeholder="Enter room ID (optional)"
            placeholderTextColor="#888"
          />
          <TouchableOpacity style={styles.generateButton} onPress={generateRoomId}>
            <Text style={styles.generateButtonText}>Generate</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Password</Text>
        <View style={styles.inputWithButton}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={formData.password}
            onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
            placeholder="Enter password (optional)"
            placeholderTextColor="#888"
            secureTextEntry
          />
          <TouchableOpacity style={styles.generateButton} onPress={generatePassword}>
            <Text style={styles.generateButtonText}>Generate</Text>
          </TouchableOpacity>
        </View>

        {/* Description and Rules */}
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.description}
          onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
          placeholder="Describe your tournament..."
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
          placeholder="Enter tournament rules..."
          placeholderTextColor="#888"
          multiline
          numberOfLines={2}
          textAlignVertical="top"
        />

        {/* Create Button */}
        <TouchableOpacity 
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={handleCreateTournament}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.createButtonText}>CREATE TOURNAMENT</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.note}>
          Note: Your tournament will be reviewed by admin before going live
        </Text>
      </ScrollView>
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
    fontSize: 20, 
    fontWeight: 'bold', 
    marginBottom: 20, 
    textAlign: 'center' 
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
    backgroundColor: '#FF9800', 
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
    backgroundColor: '#FF9800',
    borderColor: '#FF9800',
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
    backgroundColor: '#FF9800',
    borderColor: '#FF9800',
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
});

export default CreateTournamentScreen;
