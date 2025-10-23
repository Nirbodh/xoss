// screens/LiveMatchesScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Animated,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const LiveMatchesScreen = ({ navigation }) => {
  const [liveMatches, setLiveMatches] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = new Animated.Value(0);

  const sampleMatches = [
    {
      id: 1,
      game: 'Free Fire',
      tournament: 'Squad Showdown',
      players: '45/50',
      prize: 2000,
      timeLeft: '15:30',
      status: 'live',
      viewers: 128
    },
    {
      id: 2,
      game: 'PUBG Mobile',
      tournament: 'Duo Championship',
      players: '23/25',
      prize: 1500,
      timeLeft: '22:15',
      status: 'live',
      viewers: 89
    },
    {
      id: 3,
      game: 'Free Fire',
      tournament: 'Solo Battle',
      players: '48/50',
      prize: 1000,
      timeLeft: '08:45',
      status: 'starting',
      viewers: 64
    }
  ];

  useEffect(() => {
    loadLiveMatches();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadLiveMatches = () => {
    setLiveMatches(sampleMatches);
    setRefreshing(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadLiveMatches();
  };

  const LiveMatchCard = ({ item, index }) => (
    <View 
      style={[
        styles.matchCard,
        { 
          opacity: fadeAnim,
          transform: [{
            translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [50, 0],
            })
          }]
        }
      ]}
    >
      <View style={styles.matchHeader}>
        <View style={styles.gameInfo}>
          <Text style={styles.gameName}>{item.game}</Text>
          <Text style={styles.tournamentName}>{item.tournament}</Text>
        </View>
        <View style={[styles.statusBadge, 
          item.status === 'live' ? styles.liveBadge : styles.startingBadge
        ]}>
          <View style={styles.liveDot} />
          <Text style={styles.statusText}>
            {item.status === 'live' ? 'LIVE' : 'STARTING'}
          </Text>
        </View>
      </View>

      <View style={styles.matchDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="people" size={16} color="#ff8a00" />
          <Text style={styles.detailText}>{item.players} Players</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="trophy" size={16} color="#FFD700" />
          <Text style={styles.detailText}>৳ {item.prize}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="time" size={16} color="#FF4444" />
          <Text style={styles.detailText}>{item.timeLeft}</Text>
        </View>
      </View>

      <View style={styles.matchFooter}>
        <View style={styles.viewersInfo}>
          <Ionicons name="eye" size={14} color="#ccc" />
          <Text style={styles.viewersText}>{item.viewers} watching</Text>
        </View>
        <TouchableOpacity 
          style={styles.watchButton}
          onPress={() => navigation.navigate('MatchDetails', { match: item })}
        >
          <Ionicons name="play-circle" size={16} color="#fff" />
          <Text style={styles.watchButtonText}>Watch</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Live Matches</Text>
          <Text style={styles.headerSubtitle}>Watch & Learn from Pros</Text>
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Live Stats */}
      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{liveMatches.length}</Text>
          <Text style={styles.statLabel}>Live Now</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>284</Text>
          <Text style={styles.statLabel}>Total Viewers</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>৳ 4,500</Text>
          <Text style={styles.statLabel}>Prize Pool</Text>
        </View>
      </View>

      {/* Live Matches List */}
      <FlatList
        data={liveMatches}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, index }) => <LiveMatchCard item={item} index={index} />}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#ff8a00']}
            tintColor="#ff8a00"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="tv-outline" size={64} color="#ff8a00" />
            <Text style={styles.emptyText}>No Live Matches</Text>
            <Text style={styles.emptySubtext}>Check back later for live tournaments</Text>
          </View>
        }
      />

      {/* Quick Join Banner */}
      <TouchableOpacity style={styles.quickJoinBanner}>
        <Ionicons name="flash" size={24} color="#FFD700" />
        <View style={styles.quickJoinText}>
          <Text style={styles.quickJoinTitle}>Quick Join Available</Text>
          <Text style={styles.quickJoinSubtitle}>Join matches instantly</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#FFD700" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#1a1a1a',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  headerSubtitle: {
    color: '#ff8a00',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
  },
  filterButton: {
    padding: 8,
  },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255,255,255,0.05)',
    margin: 20,
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: '#ff8a00',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statLabel: {
    color: '#ccc',
    fontSize: 12,
  },
  listContainer: {
    padding: 15,
    paddingBottom: 80,
  },
  matchCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  gameInfo: {
    flex: 1,
  },
  gameName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  tournamentName: {
    color: '#ff8a00',
    fontSize: 14,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  liveBadge: {
    backgroundColor: 'rgba(255,68,68,0.2)',
    borderWidth: 1,
    borderColor: '#FF4444',
  },
  startingBadge: {
    backgroundColor: 'rgba(255,138,0,0.2)',
    borderWidth: 1,
    borderColor: '#ff8a00',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF4444',
    marginRight: 6,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  matchDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    color: '#ccc',
    fontSize: 12,
    marginLeft: 6,
  },
  matchFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  viewersInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewersText: {
    color: '#ccc',
    fontSize: 12,
    marginLeft: 6,
  },
  watchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff8a00',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  watchButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#ff8a00',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
  },
  emptySubtext: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 5,
  },
  quickJoinBanner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,215,0,0.1)',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#FFD70030',
  },
  quickJoinText: {
    flex: 1,
    marginLeft: 12,
  },
  quickJoinTitle: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  quickJoinSubtitle: {
    color: '#ccc',
    fontSize: 12,
  },
});

export default LiveMatchesScreen;
