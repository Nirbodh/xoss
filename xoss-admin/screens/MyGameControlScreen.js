// screens/MyGameControlScreen.js - FIXED VERSION
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  RefreshControl,
  ActivityIndicator,
  FlatList,
  Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const MyGameControlScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('liveMatches');
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadGameData();
  }, []);

  const loadGameData = async () => {
    try {
      setLoading(true);
      const mockMatches = [
        {
          id: 'M001',
          title: 'SOLO MATCH | FREE FIRE',
          game: 'freefire',
          type: 'solo',
          entryFee: 10,
          prizePool: 400,
          maxPlayers: 48,
          currentPlayers: 32,
          status: 'live',
          roomId: '4598XY',
          roomPassword: '1234',
          scheduleTime: new Date().toISOString()
        },
        {
          id: 'M002',
          title: 'SQUAD TOURNAMENT | PUBG',
          game: 'pubg',
          type: 'squad',
          entryFee: 50,
          prizePool: 2000,
          maxPlayers: 100,
          currentPlayers: 76,
          status: 'upcoming',
          roomId: 'PUBG889',
          roomPassword: '5566',
          scheduleTime: new Date().toISOString()
        },
        {
          id: 'M003',
          title: 'LUDO CHAMPIONSHIP',
          game: 'ludo',
          type: '1v1',
          entryFee: 20,
          prizePool: 500,
          maxPlayers: 16,
          currentPlayers: 16,
          status: 'completed',
          roomId: 'LUDO123',
          roomPassword: '7890',
          scheduleTime: new Date().toISOString()
        }
      ];
      setMatches(mockMatches);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadGameData();
  };

  const handleMatchAction = (matchId, action) => {
    switch(action) {
      case 'start':
        setMatches(prev => 
          prev.map(match => 
            match.id === matchId ? { ...match, status: 'live' } : match
          )
        );
        Alert.alert('Started', 'Match has been started!');
        break;
      case 'end':
        setMatches(prev => 
          prev.map(match => 
            match.id === matchId ? { ...match, status: 'completed' } : match
          )
        );
        Alert.alert('Ended', 'Match has been ended!');
        break;
      case 'cancel':
        setMatches(prev => 
          prev.map(match => 
            match.id === matchId ? { ...match, status: 'cancelled' } : match
          )
        );
        Alert.alert('Cancelled', 'Match has been cancelled.');
        break;
    }
  };

  const getGameIcon = (game) => {
    switch(game) {
      case 'freefire': return 'fire';
      case 'pubg': return 'mobile-alt';
      case 'ludo': return 'dice';
      case 'cod': return 'crosshairs';
      case 'valorant': return 'skull';
      default: return 'gamepad';
    }
  };

  const getGameColor = (game) => {
    switch(game) {
      case 'freefire': return '#FF6B00';
      case 'pubg': return '#4CAF50';
      case 'ludo': return '#9C27B0';
      case 'cod': return '#2196F3';
      case 'valorant': return '#FF4444';
      default: return '#2962ff';
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'live': return '#4CAF50';
      case 'upcoming': return '#FF9800';
      case 'completed': return '#2962ff';
      case 'cancelled': return '#F44336';
      default: return '#666';
    }
  };

  const MatchItem = ({ item }) => (
    <View style={styles.matchCard}>
      <View style={styles.matchHeader}>
        <View style={styles.matchMainInfo}>
          <View style={[styles.gameIcon, { backgroundColor: getGameColor(item.game) }]}>
            <FontAwesome5 name={getGameIcon(item.game)} size={20} color="white" />
          </View>
          <View style={styles.matchDetails}>
            <Text style={styles.matchTitle}>{item.title}</Text>
            <Text style={styles.matchGame}>
              {item.game.toUpperCase()} • {item.type.toUpperCase()}
            </Text>
          </View>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(item.status) }
        ]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.matchStats}>
        <View style={styles.matchStat}>
          <Ionicons name="people" size={16} color="#b0b8ff" />
          <Text style={styles.matchStatText}>
            {item.currentPlayers}/{item.maxPlayers}
          </Text>
          <Text style={styles.matchStatLabel}>Players</Text>
        </View>
        
        <View style={styles.matchStat}>
          <Ionicons name="trophy" size={16} color="#FFD700" />
          <Text style={styles.matchStatText}>৳{item.prizePool}</Text>
          <Text style={styles.matchStatLabel}>Prize</Text>
        </View>
        
        <View style={styles.matchStat}>
          <Ionicons name="cash" size={16} color="#4CAF50" />
          <Text style={styles.matchStatText}>৳{item.entryFee}</Text>
          <Text style={styles.matchStatLabel}>Entry</Text>
        </View>
        
        <View style={styles.matchStat}>
          <Ionicons name="key" size={16} color="#2962ff" />
          <Text style={styles.matchStatText}>{item.roomId}</Text>
          <Text style={styles.matchStatLabel}>Room ID</Text>
        </View>
      </View>

      <View style={styles.matchActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.viewButton]}
          onPress={() => Alert.alert('Match Details', `Room: ${item.roomId}\nPass: ${item.roomPassword}`)}
        >
          <Ionicons name="eye" size={16} color="white" />
          <Text style={styles.actionButtonText}>View</Text>
        </TouchableOpacity>
        
        {item.status === 'upcoming' && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.startButton]}
            onPress={() => handleMatchAction(item.id, 'start')}
          >
            <Ionicons name="play" size={16} color="white" />
            <Text style={styles.actionButtonText}>Start</Text>
          </TouchableOpacity>
        )}

        {item.status === 'live' && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.endButton]}
            onPress={() => handleMatchAction(item.id, 'end')}
          >
            <Ionicons name="stop" size={16} color="white" />
            <Text style={styles.actionButtonText}>End</Text>
          </TouchableOpacity>
        )}

        {(item.status === 'upcoming' || item.status === 'live') && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.cancelButton]}
            onPress={() => handleMatchAction(item.id, 'cancel')}
          >
            <Ionicons name="close" size={16} color="white" />
            <Text style={styles.actionButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>

      {(item.status === 'live' || item.status === 'upcoming') && (
        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { 
                  width: `${(item.currentPlayers / item.maxPlayers) * 100}%`,
                  backgroundColor: item.status === 'live' ? '#4CAF50' : '#FF9800'
                }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {item.currentPlayers} of {item.maxPlayers} players registered
            {item.status === 'live' && ' • LIVE'}
          </Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2962ff" />
          <Text style={styles.loadingText}>Loading Game Control...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={['#1a237e', '#283593']} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Game Control</Text>
            <TouchableOpacity onPress={() => Alert.alert('Create Match', 'Create new match feature')}>
              <Ionicons name="add" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.tabContainer}>
        {['liveMatches', 'upcoming', 'completed', 'rooms'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'liveMatches' ? 'Live' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.contentContainer}>
          <FlatList
            data={matches.filter(match => {
              if (activeTab === 'liveMatches') return match.status === 'live';
              if (activeTab === 'upcoming') return match.status === 'upcoming';
              if (activeTab === 'completed') return match.status === 'completed';
              return true;
            })}
            renderItem={({ item }) => <MatchItem item={item} />}
            keyExtractor={item => item.id}
            scrollEnabled={false}
          />

          {matches.filter(match => {
            if (activeTab === 'liveMatches') return match.status === 'live';
            if (activeTab === 'upcoming') return match.status === 'upcoming';
            if (activeTab === 'completed') return match.status === 'completed';
            return true;
          }).length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="game-controller-outline" size={64} color="#666" />
              <Text style={styles.emptyText}>No matches found</Text>
              <Text style={styles.emptySubtext}>
                {activeTab === 'liveMatches' ? 'No live matches at the moment' :
                 activeTab === 'upcoming' ? 'No upcoming matches scheduled' :
                 'No completed matches found'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0a0c23',
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  headerContent: {
    marginTop: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    margin: 16,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#2962ff',
  },
  tabText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: 'bold',
  },
  tabTextActive: {
    color: 'white',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  matchCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  matchMainInfo: {
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
  matchDetails: {
    flex: 1,
  },
  matchTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  matchGame: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  matchStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  matchStat: {
    alignItems: 'center',
    flex: 1,
  },
  matchStatText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  matchStatLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
  },
  matchActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  viewButton: {
    backgroundColor: '#2962ff',
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  endButton: {
    backgroundColor: '#F44336',
  },
  cancelButton: {
    backgroundColor: '#FFC107',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressSection: {
    marginTop: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#666',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySubtext: {
    color: '#666',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    marginTop: 12,
    fontSize: 16,
  },
});

export default MyGameControlScreen;
