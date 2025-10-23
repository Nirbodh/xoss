// screens/EnhancedHomeControl.js - COMPLETE VERSION
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  TextInput,
  Alert,
  Animated,
  Dimensions
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

const EnhancedHomeControl = ({ navigation }) => {
  // Section Visibility State
  const [sections, setSections] = useState({
    featuredTournaments: true,
    leaderboardPreview: true,
    quickActions: true,
    liveTournaments: true,
    statsSection: true,
    gamesSection: true,
    achievements: true,
    userStats: true
  });

  // Featured Games State
  const [featuredGames, setFeaturedGames] = useState([
    { id: 'pubg', name: 'PUBG Mobile', visible: true, order: 1, color: '#FF6B35' },
    { id: 'freefire', name: 'Free Fire', visible: true, order: 2, color: '#2962ff' },
    { id: 'cod', name: 'COD Mobile', visible: true, order: 3, color: '#4CAF50' },
    { id: 'ludo', name: 'Ludo King', visible: false, order: 4, color: '#9C27B0' },
    { id: 'fortnite', name: 'Fortnite', visible: false, order: 5, color: '#FF9800' },
    { id: 'valorant', name: 'Valorant', visible: true, order: 6, color: '#FF4444' }
  ]);

  // Quick Actions State
  const [quickActions, setQuickActions] = useState([
    { id: 1, title: 'Join Match', icon: 'game-controller', visible: true, color: '#2962ff' },
    { id: 2, title: 'My Team', icon: 'people', visible: true, color: '#FF6B35' },
    { id: 3, title: 'Wallet', icon: 'wallet', visible: true, color: '#4CAF50' },
    { id: 4, title: 'Leaderboard', icon: 'trophy', visible: true, color: '#9C27B0' },
    { id: 5, title: 'Invite', icon: 'person-add', visible: true, color: '#FF9800' },
    { id: 6, title: 'Achievements', icon: 'star', visible: true, color: '#FFD700' },
    { id: 7, title: 'Practice', icon: 'shield-checkmark', visible: false, color: '#00BCD4' },
    { id: 8, title: 'Analytics', icon: 'stats-chart', visible: true, color: '#E91E63' }
  ]);

  // Live Tournament State
  const [liveTournament, setLiveTournament] = useState({
    enabled: true,
    title: 'DAILY ROYALE TOURNAMENT',
    prize: '৳5,000',
    participants: 48,
    maxParticipants: 100,
    entryFee: '৳50',
    timeRemaining: '2H 30M'
  });

  // Stats Section State
  const [userStats, setUserStats] = useState({
    wins: 25,
    winRate: 87,
    earnings: 5200,
    level: 15
  });

  // Animation Values
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  // Toggle Functions
  const toggleSection = (section) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleGame = (gameId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFeaturedGames(prev => 
      prev.map(game => 
        game.id === gameId ? { ...game, visible: !game.visible } : game
      )
    );
  };

  const toggleQuickAction = (actionId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setQuickActions(prev =>
      prev.map(action =>
        action.id === actionId ? { ...action, visible: !action.visible } : action
      )
    );
  };

  // Reorder Functions
  const moveGame = (gameId, direction) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const currentIndex = featuredGames.findIndex(game => game.id === gameId);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex >= 0 && newIndex < featuredGames.length) {
      const newGames = [...featuredGames];
      const [movedGame] = newGames.splice(currentIndex, 1);
      newGames.splice(newIndex, 0, movedGame);
      
      const updatedGames = newGames.map((game, index) => ({
        ...game,
        order: index + 1
      }));
      
      setFeaturedGames(updatedGames);
    }
  };

  const moveQuickAction = (actionId, direction) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const currentIndex = quickActions.findIndex(action => action.id === actionId);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex >= 0 && newIndex < quickActions.length) {
      const newActions = [...quickActions];
      const [movedAction] = newActions.splice(currentIndex, 1);
      newActions.splice(newIndex, 0, movedAction);
      
      setQuickActions(newActions);
    }
  };

  // Save Function
  const saveChanges = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      'Success!',
      'Home screen settings have been saved successfully.',
      [{ text: 'OK' }]
    );
  };

  // Reset Function
  const resetToDefault = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to default?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: () => {
            // Reset all states to default
            setSections({
              featuredTournaments: true,
              leaderboardPreview: true,
              quickActions: true,
              liveTournaments: true,
              statsSection: true,
              gamesSection: true,
              achievements: true,
              userStats: true
            });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          }
        }
      ]
    );
  };

  // Add New Game Function
  const addNewGame = () => {
    Alert.prompt(
      'Add New Game',
      'Enter game name:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add',
          onPress: (gameName) => {
            if (gameName && gameName.trim()) {
              const newGame = {
                id: `game-${Date.now()}`,
                name: gameName.trim(),
                visible: true,
                order: featuredGames.length + 1,
                color: '#607D8B' // Default color
              };
              setFeaturedGames(prev => [...prev, newGame]);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          }
        }
      ]
    );
  };

  // Add New Quick Action Function
  const addNewQuickAction = () => {
    Alert.prompt(
      'Add New Quick Action',
      'Enter action name:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add',
          onPress: (actionName) => {
            if (actionName && actionName.trim()) {
              const newAction = {
                id: Date.now(),
                title: actionName.trim(),
                icon: 'add-circle',
                visible: true,
                color: '#795548'
              };
              setQuickActions(prev => [...prev, newAction]);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          }
        }
      ]
    );
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <LinearGradient colors={['#1a237e', '#283593']} style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Home Screen Control</Text>
            <Text style={styles.headerSubtitle}>Manage Enhanced Home Screen</Text>
          </View>
          <TouchableOpacity style={styles.helpButton}>
            <Ionicons name="help-circle" size={24} color="white" />
          </TouchableOpacity>
        </LinearGradient>

        {/* Section 1: Visibility Controls */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="eye" size={24} color="#2962ff" />
            <Text style={styles.sectionTitle}>Section Visibility</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Control which sections appear on the user's home screen
          </Text>
          
          <View style={styles.togglesContainer}>
            {Object.entries(sections).map(([key, value]) => (
              <View key={key} style={styles.toggleRow}>
                <View style={styles.toggleInfo}>
                  <Text style={styles.toggleLabel}>
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </Text>
                  <Text style={styles.toggleStatus}>
                    {value ? '🟢 Visible' : '🔴 Hidden'}
                  </Text>
                </View>
                <Switch
                  value={value}
                  onValueChange={() => toggleSection(key)}
                  trackColor={{ false: '#767577', true: '#2962ff' }}
                  thumbColor={value ? '#f4f3f4' : '#f4f3f4'}
                />
              </View>
            ))}
          </View>
        </View>

        {/* Section 2: Featured Games Management */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="game-controller" size={24} color="#FF6B35" />
            <Text style={styles.sectionTitle}>Featured Games</Text>
            <TouchableOpacity style={styles.addButton} onPress={addNewGame}>
              <Ionicons name="add" size={20} color="white" />
            </TouchableOpacity>
          </View>
          <Text style={styles.sectionDescription}>
            Manage games displayed on the home screen. Drag to reorder.
          </Text>
          
          <View style={styles.gamesList}>
            {featuredGames.map((game) => (
              <View key={game.id} style={styles.gameItem}>
                <View style={styles.gameMainInfo}>
                  <View style={[styles.gameColor, { backgroundColor: game.color }]} />
                  <View style={styles.gameDetails}>
                    <Text style={styles.gameName}>{game.name}</Text>
                    <View style={styles.gameMeta}>
                      <Text style={styles.gameOrder}>Position: {game.order}</Text>
                      <Text style={[
                        styles.gameVisibility, 
                        { color: game.visible ? '#4CAF50' : '#FF6B6B' }
                      ]}>
                        {game.visible ? 'Visible' : 'Hidden'}
                      </Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.gameControls}>
                  <TouchableOpacity 
                    style={[styles.orderBtn, game.order === 1 && styles.disabledBtn]}
                    onPress={() => moveGame(game.id, 'up')}
                    disabled={game.order === 1}
                  >
                    <Ionicons 
                      name="chevron-up" 
                      size={20} 
                      color={game.order === 1 ? '#666' : '#2962ff'} 
                    />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.orderBtn, game.order === featuredGames.length && styles.disabledBtn]}
                    onPress={() => moveGame(game.id, 'down')}
                    disabled={game.order === featuredGames.length}
                  >
                    <Ionicons 
                      name="chevron-down" 
                      size={20} 
                      color={game.order === featuredGames.length ? '#666' : '#2962ff'} 
                    />
                  </TouchableOpacity>
                  
                  <Switch
                    value={game.visible}
                    onValueChange={() => toggleGame(game.id)}
                    trackColor={{ false: '#767577', true: game.color }}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Section 3: Quick Actions Management */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="flash" size={24} color="#FFD700" />
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <TouchableOpacity style={styles.addButton} onPress={addNewQuickAction}>
              <Ionicons name="add" size={20} color="white" />
            </TouchableOpacity>
          </View>
          <Text style={styles.sectionDescription}>
            Manage quick action buttons. Users can tap these for quick navigation.
          </Text>
          
          <View style={styles.actionsGrid}>
            {quickActions.map((action) => (
              <View key={action.id} style={styles.actionItem}>
                <View style={styles.actionHeader}>
                  <View style={[styles.actionIcon, { backgroundColor: action.color }]}>
                    <Ionicons name={action.icon} size={18} color="white" />
                  </View>
                  <Text style={styles.actionName}>{action.title}</Text>
                </View>
                <View style={styles.actionControls}>
                  <TouchableOpacity 
                    style={styles.orderBtn}
                    onPress={() => moveQuickAction(action.id, 'up')}
                  >
                    <Ionicons name="chevron-up" size={16} color="#2962ff" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.orderBtn}
                    onPress={() => moveQuickAction(action.id, 'down')}
                  >
                    <Ionicons name="chevron-down" size={16} color="#2962ff" />
                  </TouchableOpacity>
                  <Switch
                    value={action.visible}
                    onValueChange={() => toggleQuickAction(action.id)}
                    trackColor={{ false: '#767577', true: action.color }}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Section 4: Live Tournament Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="trophy" size={24} color="#FFD700" />
            <Text style={styles.sectionTitle}>Live Tournament</Text>
          </View>
          
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Show Live Tournament</Text>
            <Switch
              value={liveTournament.enabled}
              onValueChange={(value) => setLiveTournament(prev => ({ ...prev, enabled: value }))}
              trackColor={{ false: '#767577', true: '#2962ff' }}
            />
          </View>

          {liveTournament.enabled && (
            <View style={styles.tournamentSettings}>
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Tournament Title</Text>
                <TextInput
                  style={styles.textInput}
                  value={liveTournament.title}
                  onChangeText={(text) => setLiveTournament(prev => ({ ...prev, title: text }))}
                  placeholder="Enter tournament title"
                  placeholderTextColor="#666"
                />
              </View>
              
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Prize Pool</Text>
                <TextInput
                  style={styles.textInput}
                  value={liveTournament.prize}
                  onChangeText={(text) => setLiveTournament(prev => ({ ...prev, prize: text }))}
                  placeholder="৳5,000"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statInput}>
                  <Text style={styles.inputLabel}>Participants</Text>
                  <TextInput
                    style={styles.numberInput}
                    value={liveTournament.participants.toString()}
                    onChangeText={(text) => setLiveTournament(prev => ({ ...prev, participants: parseInt(text) || 0 }))}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.statInput}>
                  <Text style={styles.inputLabel}>Max Participants</Text>
                  <TextInput
                    style={styles.numberInput}
                    value={liveTournament.maxParticipants.toString()}
                    onChangeText={(text) => setLiveTournament(prev => ({ ...prev, maxParticipants: parseInt(text) || 100 }))}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Section 5: User Stats Configuration */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="stats-chart" size={24} color="#4CAF50" />
            <Text style={styles.sectionTitle}>User Statistics</Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statInput}>
              <Text style={styles.inputLabel}>Total Wins</Text>
              <TextInput
                style={styles.numberInput}
                value={userStats.wins.toString()}
                onChangeText={(text) => setUserStats(prev => ({ ...prev, wins: parseInt(text) || 0 }))}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.statInput}>
              <Text style={styles.inputLabel}>Win Rate %</Text>
              <TextInput
                style={styles.numberInput}
                value={userStats.winRate.toString()}
                onChangeText={(text) => setUserStats(prev => ({ ...prev, winRate: parseInt(text) || 0 }))}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.statInput}>
              <Text style={styles.inputLabel}>Earnings (৳)</Text>
              <TextInput
                style={styles.numberInput}
                value={userStats.earnings.toString()}
                onChangeText={(text) => setUserStats(prev => ({ ...prev, earnings: parseInt(text) || 0 }))}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.statInput}>
              <Text style={styles.inputLabel}>User Level</Text>
              <TextInput
                style={styles.numberInput}
                value={userStats.level.toString()}
                onChangeText={(text) => setUserStats(prev => ({ ...prev, level: parseInt(text) || 1 }))}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Section 6: Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.primaryButton]}
            onPress={saveChanges}
          >
            <Ionicons name="save" size={20} color="white" />
            <Text style={styles.actionButtonText}>Save All Changes</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={resetToDefault}
          >
            <Ionicons name="refresh" size={20} color="#2962ff" />
            <Text style={[styles.actionButtonText, { color: '#2962ff' }]}>Reset to Default</Text>
          </TouchableOpacity>
        </View>

        {/* Preview Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="phone-portrait" size={24} color="#9C27B0" />
            <Text style={styles.sectionTitle}>Live Preview</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Changes will reflect on user's home screen immediately after saving.
          </Text>
          
          <View style={styles.previewStats}>
            <View style={styles.previewStat}>
              <Text style={styles.previewStatNumber}>{featuredGames.filter(g => g.visible).length}</Text>
              <Text style={styles.previewStatLabel}>Games Active</Text>
            </View>
            <View style={styles.previewStat}>
              <Text style={styles.previewStatNumber}>{quickActions.filter(a => a.visible).length}</Text>
              <Text style={styles.previewStatLabel}>Actions Active</Text>
            </View>
            <View style={styles.previewStat}>
              <Text style={styles.previewStatNumber}>{Object.values(sections).filter(Boolean).length}</Text>
              <Text style={styles.previewStatLabel}>Sections Active</Text>
            </View>
          </View>
        </View>

      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0c23',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#b0b8ff',
  },
  helpButton: {
    padding: 8,
  },
  section: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 12,
    flex: 1,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#b0b8ff',
    marginBottom: 20,
    lineHeight: 20,
  },
  addButton: {
    backgroundColor: '#2962ff',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  togglesContainer: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  toggleInfo: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: 16,
    color: 'white',
    marginBottom: 4,
  },
  toggleStatus: {
    fontSize: 12,
    color: '#b0b8ff',
  },
  gamesList: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 8,
  },
  gameItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  gameMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  gameColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  gameDetails: {
    flex: 1,
  },
  gameName: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
    marginBottom: 4,
  },
  gameMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gameOrder: {
    fontSize: 12,
    color: '#b0b8ff',
  },
  gameVisibility: {
    fontSize: 12,
    fontWeight: '600',
  },
  gameControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderBtn: {
    padding: 6,
    marginHorizontal: 2,
  },
  disabledBtn: {
    opacity: 0.3,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionItem: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  actionName: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
    flex: 1,
  },
  actionControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tournamentSettings: {
    marginTop: 16,
  },
  inputRow: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: 'white',
    marginBottom: 8,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 12,
    borderRadius: 8,
    color: 'white',
    fontSize: 16,
  },
  numberInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 12,
    borderRadius: 8,
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statInput: {
    width: '48%',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionSection: {
    padding: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#2962ff',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 2,
    borderColor: '#2962ff',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  previewStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  previewStat: {
    alignItems: 'center',
    flex: 1,
  },
  previewStatNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  previewStatLabel: {
    fontSize: 12,
    color: '#b0b8ff',
    textAlign: 'center',
  },
});

export default EnhancedHomeControl;
