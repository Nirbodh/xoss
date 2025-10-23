// components/MatchList.js
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, Animated, Easing, 
  TextInput, ScrollView, RefreshControl 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const MatchList = ({ 
  matches, 
  onJoin, 
  onDetails,
  currentUserId,
  searchable = false,
  filterable = false,
  sortable = false,
  onRefresh,
  loading = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const filters = [
    { id: 'all', label: 'All Matches' },
    { id: 'solo', label: 'Solo' },
    { id: 'duo', label: 'Duo' },
    { id: 'squad', label: 'Squad' },
    { id: 'free', label: 'Free Entry' },
    { id: 'paid', label: 'Paid Entry' },
  ];

  const sortOptions = [
    { id: 'date', label: 'Date' },
    { id: 'prize', label: 'Prize Pool' },
    { id: 'entry', label: 'Entry Fee' },
    { id: 'participants', label: 'Participants' },
  ];

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh?.();
    setRefreshing(false);
  };

  const filteredAndSortedMatches = matches
    .filter(match => {
      // Search filter
      const matchesSearch = match.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          match.game?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Type filter
      const matchesFilter = selectedFilter === 'all' || 
                           match.type?.toLowerCase() === selectedFilter ||
                           (selectedFilter === 'free' && match.entryFee === 0) ||
                           (selectedFilter === 'paid' && match.entryFee > 0);

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'prize':
          return b.totalPrize - a.totalPrize;
        case 'entry':
          return a.entryFee - b.entryFee;
        case 'participants':
          return b.currentParticipants - a.currentParticipants;
        case 'date':
        default:
          return new Date(a.startTime) - new Date(b.startTime);
      }
    });

  const MatchCard = ({ match, index }) => {
    const cardAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
      Animated.spring(cardAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        delay: index * 100,
        useNativeDriver: true,
      }).start();
    }, []);

    const hasJoined = match.participants?.some(p => 
      p.userId && p.userId.toString() === currentUserId
    );
    const isFull = match.currentParticipants >= match.maxParticipants;
    const isLive = match.status === 'live';
    const timeLeft = calculateTimeLeft(match.startTime);

    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }).start();
    };

    return (
      <Animated.View
        style={[
          styles.matchCard,
          {
            opacity: cardAnim,
            transform: [
              { 
                translateY: cardAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0]
                })
              },
              { scale: scaleAnim }
            ]
          }
        ]}
      >
        <TouchableOpacity
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={() => onDetails?.(match)}
          activeOpacity={0.9}
          style={styles.cardTouchable}
        >
          {/* Status Badge */}
          <View style={styles.statusContainer}>
            {isLive && (
              <View style={styles.liveBadge}>
                <View style={styles.livePulse} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            )}
            {hasJoined && (
              <View style={styles.joinedBadge}>
                <Ionicons name="checkmark" size={12} color="white" />
                <Text style={styles.joinedText}>JOINED</Text>
              </View>
            )}
          </View>

          {/* Header */}
          <View style={styles.cardHeader}>
            <View style={styles.gameInfo}>
              <Text style={styles.matchGame}>{match.game}</Text>
              <Text style={styles.matchTitle}>{match.title}</Text>
            </View>
            <View style={styles.prizeContainer}>
              <Ionicons name="trophy" size={16} color="#FFD700" />
              <Text style={styles.prizeText}>৳{match.totalPrize}</Text>
            </View>
          </View>

          {/* Details */}
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Ionicons name="people" size={14} color="#2962ff" />
              <Text style={styles.detailText}>
                {match.currentParticipants}/{match.maxParticipants}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="time" size={14} color="#FF8A00" />
              <Text style={styles.detailText}>
                {isLive ? 'Live' : timeLeft}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="cash" size={14} color="#4CAF50" />
              <Text style={styles.detailText}>৳{match.entryFee}</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBackground}>
              <View 
                style={[
                  styles.progressFill,
                  { 
                    width: `${(match.currentParticipants / match.maxParticipants) * 100}%`,
                    backgroundColor: isFull ? '#FF4444' : '#4CAF50'
                  }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {isFull ? 'Tournament Full' : `${match.maxParticipants - match.currentParticipants} spots left`}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.detailsButton]}
              onPress={() => onDetails?.(match)}
            >
              <Ionicons name="information-circle" size={16} color="#2962ff" />
              <Text style={styles.detailsButtonText}>Details</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.actionButton, 
                styles.joinButton,
                (hasJoined || isFull) && styles.joinButtonDisabled
              ]}
              onPress={() => !hasJoined && !isFull && onJoin?.(match._id)}
              disabled={hasJoined || isFull}
            >
              <Ionicons 
                name={hasJoined ? "checkmark" : "enter"} 
                size={16} 
                color="white" 
              />
              <Text style={styles.joinButtonText}>
                {hasJoined ? 'Joined' : isFull ? 'Full' : 'Join'}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (matches.length === 0 && !loading) {
    return (
      <Animated.View style={[styles.noMatchesContainer, { opacity: fadeAnim }]}>
        <Ionicons name="trophy-outline" size={64} color="#2962ff" />
        <Text style={styles.noMatchesTitle}>No Tournaments Available</Text>
        <Text style={styles.noMatchesText}>
          Check back later for new tournaments
        </Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Search and Filter Section */}
      {(searchable || filterable || sortable) && (
        <View style={styles.controlsContainer}>
          {/* Search Bar */}
          {searchable && (
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#b0b8ff" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search tournaments..."
                placeholderTextColor="#b0b8ff"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#b0b8ff" />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Filter and Sort Row */}
          {(filterable || sortable) && (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.filterScrollView}
              contentContainerStyle={styles.filterContainer}
            >
              {filterable && filters.map(filter => (
                <TouchableOpacity
                  key={filter.id}
                  style={[
                    styles.filterButton,
                    selectedFilter === filter.id && styles.filterButtonActive
                  ]}
                  onPress={() => setSelectedFilter(filter.id)}
                >
                  <Text style={[
                    styles.filterText,
                    selectedFilter === filter.id && styles.filterTextActive
                  ]}>
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}

              {sortable && sortOptions.map(option => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.sortButton,
                    sortBy === option.id && styles.sortButtonActive
                  ]}
                  onPress={() => setSortBy(option.id)}
                >
                  <Text style={[
                    styles.sortText,
                    sortBy === option.id && styles.sortTextActive
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      )}

      {/* Matches List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing || loading}
            onRefresh={handleRefresh}
            colors={['#2962ff']}
            tintColor="#2962ff"
          />
        }
        contentContainerStyle={styles.matchesList}
      >
        {filteredAndSortedMatches.map((match, index) => (
          <MatchCard key={match._id} match={match} index={index} />
        ))}
      </ScrollView>

      {/* Results Count */}
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsText}>
          {filteredAndSortedMatches.length} tournament(s) found
        </Text>
      </View>
    </Animated.View>
  );
};

// Helper function to calculate time left
const calculateTimeLeft = (startTime) => {
  const now = new Date();
  const start = new Date(startTime);
  const diff = start - now;

  if (diff <= 0) return 'Started';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return `${hours}h ${minutes}m`;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  controlsContainer: {
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(41, 98, 255, 0.2)',
  },
  searchInput: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    marginLeft: 10,
    marginRight: 10,
  },
  filterScrollView: {
    marginBottom: 10,
  },
  filterContainer: {
    paddingRight: 20,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  filterButtonActive: {
    backgroundColor: 'rgba(41, 98, 255, 0.2)',
    borderColor: '#2962ff',
  },
  filterText: {
    color: '#b0b8ff',
    fontSize: 12,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#2962ff',
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 15,
    marginRight: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sortButtonActive: {
    backgroundColor: 'rgba(255, 138, 0, 0.2)',
    borderColor: '#FF8A00',
  },
  sortText: {
    color: '#b0b8ff',
    fontSize: 11,
    fontWeight: '600',
  },
  sortTextActive: {
    color: '#FF8A00',
  },
  matchesList: {
    paddingBottom: 20,
  },
  matchCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(41, 98, 255, 0.1)',
    overflow: 'hidden',
  },
  cardTouchable: {
    padding: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  livePulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'white',
    marginRight: 4,
  },
  liveText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  joinedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  joinedText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  gameInfo: {
    flex: 1,
  },
  matchGame: {
    color: '#b0b8ff',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  matchTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  prizeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,215,0,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  prizeText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  detailText: {
    color: '#e0e0e0',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBackground: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    color: '#b0b8ff',
    fontSize: 11,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  detailsButton: {
    backgroundColor: 'rgba(41, 98, 255, 0.1)',
    borderWidth: 1,
    borderColor: '#2962ff',
  },
  joinButton: {
    backgroundColor: '#2962ff',
    flex: 1,
    marginLeft: 8,
    justifyContent: 'center',
  },
  joinButtonDisabled: {
    backgroundColor: '#666',
  },
  detailsButtonText: {
    color: '#2962ff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  joinButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  noMatchesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  noMatchesTitle: {
    color: '#2962ff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  noMatchesText: {
    color: '#b0b8ff',
    fontSize: 14,
    textAlign: 'center',
  },
  resultsContainer: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  resultsText: {
    color: '#b0b8ff',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default MatchList;
