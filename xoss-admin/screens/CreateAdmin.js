// screens/CreateAdmin.js
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTournaments } from '../context/TournamentContext';

const CreateAdmin = ({ navigation }) => {
  const { createTournament, loading } = useTournaments();
  const [debugMode, setDebugMode] = useState(true);
  const [apiResponse, setApiResponse] = useState(null);
  const [formData, setFormData] = useState({
    title: 'Test Match - ' + new Date().toLocaleTimeString(),
    game: 'freefire',
    entry_fee: '50',
    total_prize: '500',
    max_participants: '100',
    start_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    end_time: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    scheduleTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    roomId: 'TEST' + Math.random().toString(36).substring(2, 6).toUpperCase(),
    password: '1234',
    description: 'Test match created via admin panel',
    rules: 'Standard rules apply',
    map: 'Bermuda',
    type: 'Squad',
    status: 'upcoming',
    matchType: 'match',
    created_by: 'admin'
  });

  const GAMES = {
    freefire: { name: 'Free Fire', icon: 'flame', color: '#FF6B00' },
    pubg: { name: 'PUBG Mobile', icon: 'game-controller', color: '#4CAF50' },
    cod: { name: 'Call of Duty', icon: 'shield', color: '#2196F3' },
    ludo: { name: 'Ludo King', icon: 'dice', color: '#9C27B0' }
  };

  const handleCreateMatch = async () => {
    try {
      setApiResponse(null);
      
      // Convert numbers
      const submitData = {
        ...formData,
        entry_fee: Number(formData.entry_fee),
        total_prize: Number(formData.total_prize),
        max_participants: Number(formData.max_participants),
        current_participants: 0
      };

      console.log('🔄 Sending data to API:', JSON.stringify(submitData, null, 2));

      const result = await createTournament(submitData);
      
      setApiResponse(result);
      
      if (result.success) {
        Alert.alert('✅ Success', 'Match created successfully!');
        console.log('🎉 Match created:', result.tournament);
      } else {
        Alert.alert('❌ Error', result.error || 'Failed to create match');
        console.log('💥 Error:', result);
      }
    } catch (error) {
      console.log('🔥 Exception:', error);
      setApiResponse({ error: error.message });
      Alert.alert('🚨 Exception', error.message);
    }
  };

  const generateCurlCommand = () => {
    const curlData = {
      title: formData.title,
      game: formData.game,
      entry_fee: Number(formData.entry_fee),
      total_prize: Number(formData.total_prize),
      max_participants: Number(formData.max_participants),
      start_time: formData.start_time,
      end_time: formData.end_time,
      scheduleTime: formData.scheduleTime,
      roomId: formData.roomId,
      password: formData.password,
      description: formData.description,
      rules: formData.rules,
      map: formData.map,
      type: formData.type,
      status: formData.status,
      matchType: formData.matchType,
      created_by: formData.created_by
    };

    return `curl -X POST http://localhost:5000/api/tournaments/create \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(curlData, null, 2)}'`;
  };

  const updateField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateRandomData = () => {
    setFormData(prev => ({
      ...prev,
      title: 'Test Match - ' + new Date().toLocaleTimeString(),
      roomId: 'TEST' + Math.random().toString(36).substring(2, 6).toUpperCase(),
      password: Math.random().toString(36).substring(2, 6).toUpperCase()
    }));
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Debug Panel</Text>
        <View style={styles.debugToggle}>
          <Text style={styles.debugText}>Debug</Text>
          <Switch
            value={debugMode}
            onValueChange={setDebugMode}
            trackColor={{ false: '#767577', true: '#2962ff' }}
          />
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Debug Info */}
        {debugMode && (
          <View style={styles.debugSection}>
            <Text style={styles.sectionTitle}>🔧 Debug Information</Text>
            <Text style={styles.debugText}>
              Use this panel to test match creation and debug API issues
            </Text>
            
            {/* API Response */}
            {apiResponse && (
              <View style={styles.responseSection}>
                <Text style={styles.responseTitle}>
                  {apiResponse.success ? '✅ API Response' : '❌ API Error'}
                </Text>
                <Text style={styles.responseText}>
                  {JSON.stringify(apiResponse, null, 2)}
                </Text>
              </View>
            )}

            {/* Curl Command */}
            <View style={styles.curlSection}>
              <Text style={styles.curlTitle}>📡 CURL Command for Testing:</Text>
              <TextInput
                style={styles.curlInput}
                value={generateCurlCommand()}
                multiline
                editable={false}
                numberOfLines={10}
              />
              <TouchableOpacity 
                style={styles.copyButton}
                onPress={() => {
                  // Here you would copy to clipboard
                  Alert.alert('Copied', 'CURL command copied to clipboard');
                }}
              >
                <Text style={styles.copyButtonText}>Copy CURL Command</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Quick Test Form */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>🚀 Quick Test Match</Text>
          
          <View style={styles.formRow}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                value={formData.title}
                onChangeText={(text) => updateField('title', text)}
                placeholder="Match title"
              />
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Game *</Text>
              <View style={styles.gameButtons}>
                {Object.keys(GAMES).map(game => (
                  <TouchableOpacity
                    key={game}
                    style={[
                      styles.gameButton,
                      formData.game === game && styles.gameButtonSelected
                    ]}
                    onPress={() => updateField('game', game)}
                  >
                    <Text style={[
                      styles.gameButtonText,
                      formData.game === game && styles.gameButtonTextSelected
                    ]}>
                      {GAMES[game].name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Entry Fee (৳) *</Text>
              <TextInput
                style={styles.input}
                value={formData.entry_fee}
                onChangeText={(text) => updateField('entry_fee', text.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                placeholder="50"
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Prize Pool (৳) *</Text>
              <TextInput
                style={styles.input}
                value={formData.total_prize}
                onChangeText={(text) => updateField('total_prize', text.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                placeholder="500"
              />
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Max Players *</Text>
              <TextInput
                style={styles.input}
                value={formData.max_participants}
                onChangeText={(text) => updateField('max_participants', text.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                placeholder="100"
              />
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Room ID</Text>
              <TextInput
                style={styles.input}
                value={formData.roomId}
                onChangeText={(text) => updateField('roomId', text)}
                placeholder="Room ID"
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={formData.password}
                onChangeText={(text) => updateField('password', text)}
                placeholder="Password"
              />
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.testButton}
              onPress={generateRandomData}
            >
              <Text style={styles.testButtonText}>🎲 Generate Test Data</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.createButton, loading && styles.createButtonDisabled]}
              onPress={handleCreateMatch}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.createButtonText}>🚀 Create Test Match</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
    padding: 16,
    backgroundColor: '#1a237e',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  debugToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  debugText: {
    color: 'white',
    marginRight: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  debugSection: {
    backgroundColor: 'rgba(41, 98, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  debugText: {
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 12,
  },
  responseSection: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  responseTitle: {
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  responseText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  curlSection: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 12,
    borderRadius: 8,
  },
  curlTitle: {
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  curlInput: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    color: '#4CAF50',
    padding: 8,
    borderRadius: 4,
    fontSize: 10,
    fontFamily: 'monospace',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  copyButton: {
    backgroundColor: '#2962ff',
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 8,
  },
  copyButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  formSection: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 12,
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  formGroup: {
    flex: 1,
    marginHorizontal: 4,
  },
  label: {
    color: 'white',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.3)',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    color: 'white',
  },
  gameButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gameButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  gameButtonSelected: {
    backgroundColor: '#2962ff',
  },
  gameButtonText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  gameButtonTextSelected: {
    color: 'white',
    fontWeight: 'bold',
  },
  actionButtons: {
    marginTop: 16,
  },
  testButton: {
    backgroundColor: '#9C27B0',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  testButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  createButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: '#666',
  },
  createButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default CreateAdmin;
