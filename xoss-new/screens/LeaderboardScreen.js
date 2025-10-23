// screens/LeaderboardScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Image,
  RefreshControl,
  Modal,
  TextInput,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const LeaderboardScreen = ({ navigation }) => {
  const [selectedTab, setSelectedTab] = useState('weekly');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const sampleData = {
    weekly: [
      { id: 1, rank: 1, name: 'ProPlayer', earnings: 2500, wins: 15, avatar: '🥇', level: 25, country: 'BD', games: 45, winRate: 87, isOnline: true },
      { id: 2, rank: 2, name: 'GameMaster', earnings: 1800, wins: 12, avatar: '🥈', level: 22, country: 'US', games: 38, winRate: 82, isOnline: false },
      { id: 3, rank: 3, name: 'TournamentKing', earnings: 1500, wins: 10, avatar: '🥉', level: 20, country: 'BD', games: 32, winRate: 78, isOnline: true },
      { id: 4, rank: 4, name: 'XOSS Warrior', earnings: 1200, wins: 8, avatar: '⚔️', level: 18, country: 'IN', games: 28, winRate: 75, isOnline: true },
      { id: 5, rank: 5, name: 'EliteGamer', earnings: 900, wins: 7, avatar: '🎮', level: 16, country: 'BD', games: 25, winRate: 72, isOnline: false },
      { id: 6, rank: 6, name: 'BanglaGamer', earnings: 800, wins: 6, avatar: '🇧🇩', level: 15, country: 'BD', games: 22, winRate: 70, isOnline: true },
      { id: 7, rank: 7, name: 'DhakaPro', earnings: 700, wins: 5, avatar: '🏙️', level: 14, country: 'BD', games: 20, winRate: 68, isOnline: false },
    ],
    monthly: [
      { id: 1, rank: 1, name: 'Champion', earnings: 8500, wins: 45, avatar: '🏆', level: 30, country: 'US', games: 150, winRate: 85, isOnline: true },
      { id: 2, rank: 2, name: 'ProPlayer', earnings: 7200, wins: 38, avatar: '🥇', level: 28, country: 'BD', games: 132, winRate: 83, isOnline: false },
      { id: 3, rank: 3, name: 'VictoryRoyale', earnings: 6500, wins: 35, avatar: '👑', level: 27, country: 'UK', games: 125, winRate: 80, isOnline: true },
    ],
    allTime: [
      { id: 1, rank: 1, name: 'Legend', earnings: 25500, wins: 128, avatar: '🌟', level: 50, country: 'BD', games: 450, winRate: 88, isOnline: true },
      { id: 2, rank: 2, name: 'Champion', earnings: 18700, wins: 95, avatar: '🏆', level: 45, country: 'US', games: 380, winRate: 84, isOnline: false },
      { id: 3, rank: 3, name: 'ProPlayer', earnings: 15200, wins: 78, avatar: '⚡', level: 42, country: 'BD', games: 320, winRate: 82, isOnline: true },
    ]
  };

  const filters = [
    { id: 'all', name: 'সকল', icon: 'people' },
    { id: 'online', name: 'অনলাইন', icon: 'wifi' },
    { id: 'bd', name: 'বাংলাদেশ', icon: 'flag' },
    { id: 'top10', name: 'টপ ১০', icon: 'star' }
  ];

  useEffect(() => {
    loadLeaderboard();
    startAnimation();
  }, [selectedTab, selectedFilter, searchQuery]);

  const startAnimation = () => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  };

  const loadLeaderboard = () => {
    let data = sampleData[selectedTab];
    
    // Apply filters
    if (selectedFilter === 'online') {
      data = data.filter(item => item.isOnline);
    } else if (selectedFilter === 'bd') {
      data = data.filter(item => item.country === 'BD');
    } else if (selectedFilter === 'top10') {
      data = data.slice(0, 10);
    }
    
    // Apply search
    if (searchQuery) {
      data = data.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setLeaderboardData(data);
    setRefreshing(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadLeaderboard();
  };

  const getRankColor = (rank) => {
    switch(rank) {
      case 1: return '#FFD700';
      case 2: return '#C0C0C0';
      case 3: return '#CD7F32';
      default: return '#2962ff';
    }
  };

  const getRankIcon = (rank) => {
    switch(rank) {
      case 1: return 'trophy';
      case 2: return 'medal';
      case 3: return 'ribbon';
      default: return 'person';
    }
  };

  const getCountryFlag = (country) => {
    const flags = {
      'BD': '🇧🇩',
      'US': '🇺🇸',
      'UK': '🇬🇧',
      'IN': '🇮🇳'
    };
    return flags[country] || '🏳️';
  };

  const LeaderboardItem = ({ item, index }) => {
    const itemAnim = useRef(new Animated.Value(0)).current;
    
    useEffect(() => {
      Animated.timing(itemAnim, {
        toValue: 1,
        duration: 600,
        delay: index * 100,
        useNativeDriver: true,
      }).start();
    }, []);

    return (
      <Animated.View 
        style={[
          styles.leaderboardItem,
          { 
            opacity: itemAnim,
            transform: [{
              translateY: itemAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              })
            }]
          }
        ]}
      >
        <TouchableOpacity 
          style={styles.itemContent}
          onPress={() => setShowUserProfile(item)}
          activeOpacity={0.7}
        >
          <View style={styles.rankContainer}>
            <View style={[styles.rankBadge, { backgroundColor: getRankColor(item.rank) }]}>
              <Ionicons name={getRankIcon(item.rank)} size={16} color="#fff" />
              <Text style={styles.rankText}>{item.rank}</Text>
            </View>
          </View>

          <View style={styles.playerInfo}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatar}>{item.avatar}</Text>
              {item.isOnline && <View style={styles.onlineIndicator} />}
            </View>
            <View style={styles.playerDetails}>
              <View style={styles.nameRow}>
                <Text style={styles.playerName}>{item.name}</Text>
                <Text style={styles.countryFlag}>{getCountryFlag(item.country)}</Text>
              </View>
              <View style={styles.levelRow}>
                <Text style={styles.playerLevel}>লেভেল {item.level}</Text>
                <View style={styles.statsMini}>
                  <Text style={styles.winRateMini}>{item.winRate}%</Text>
                  <Text style={styles.winsMini}>জয়</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.stats}>
            <Text style={styles.earnings}>৳ {item.earnings.toLocaleString()}</Text>
            <Text style={styles.wins}>{item.wins} জয়</Text>
            <Text style={styles.gamesPlayed}>{item.games} গেম</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const TabButton = ({ title, value }) => (
    <TouchableOpacity
      style={[
        styles.tabButton,
        selectedTab === value && styles.tabButtonActive
      ]}
      onPress={() => setSelectedTab(value)}
    >
      <Text style={[
        styles.tabText,
        selectedTab === value && styles.tabTextActive
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const FilterButton = ({ filter }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        selectedFilter === filter.id && styles.filterButtonActive
      ]}
      onPress={() => setSelectedFilter(filter.id)}
    >
      <Ionicons 
        name={filter.icon} 
        size={16} 
        color={selectedFilter === filter.id ? '#ff8a00' : '#ccc'} 
      />
      <Text style={[
        styles.filterText,
        selectedFilter === filter.id && styles.filterTextActive
      ]}>
        {filter.name}
      </Text>
    </TouchableOpacity>
  );

  const UserProfileModal = ({ user, visible, onClose }) => {
    if (!user) return null;
    
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={visible}
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>প্লেয়ার প্রোফাইল</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.profileHeader}>
              <View style={styles.profileAvatarContainer}>
                <Text style={styles.profileAvatar}>{user.avatar}</Text>
                {user.isOnline && <View style={styles.profileOnlineIndicator} />}
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{user.name}</Text>
                <View style={styles.profileDetails}>
                  <Text style={styles.profileLevel}>লেভেল {user.level}</Text>
                  <Text style={styles.profileCountry}>{getCountryFlag(user.country)} {user.country}</Text>
                </View>
                <Text style={styles.profileStatus}>
                  {user.isOnline ? '🟢 অনলাইন' : '⚫ অফলাইন'}
                </Text>
              </View>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>৳{user.earnings.toLocaleString()}</Text>
                <Text style={styles.statLabel}>মোট আয়</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{user.wins}</Text>
                <Text style={styles.statLabel}>জয়</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{user.games}</Text>
                <Text style={styles.statLabel}>গেম</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{user.winRate}%</Text>
                <Text style={styles.statLabel}>জয়ের হার</Text>
              </View>
            </View>

            <View style={styles.achievements}>
              <Text style={styles.sectionTitle}>অর্জনসমূহ</Text>
              <View style={styles.achievementList}>
                <View style={styles.achievementItem}>
                  <Ionicons name="trophy" size={20} color="#FFD700" />
                  <Text style={styles.achievementText}>টপ {user.rank} প্লেয়ার</Text>
                </View>
                <View style={styles.achievementItem}>
                  <Ionicons name="flash" size={20} color="#4CAF50" />
                  <Text style={styles.achievementText}>{user.winRate}% জয়ের হার</Text>
                </View>
                {user.rank <= 3 && (
                  <View style={styles.achievementItem}>
                    <Ionicons name="star" size={20} color="#FF9800" />
                    <Text style={styles.achievementText}>লিডারবোর্ড চ্যাম্পিয়ন</Text>
                  </View>
                )}
              </View>
            </View>

            <TouchableOpacity style={styles.challengeButton}>
              <Ionicons name="game-controller" size={20} color="#fff" />
              <Text style={styles.challengeButtonText}>চ্যালেঞ্জ করুন</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

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
        <Text style={styles.headerTitle}>লিডারবোর্ড</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Ionicons name="filter" size={20} color="#ff8a00" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="trophy" size={20} color="#FFD700" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#ccc" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="প্লেয়ার খুঁজুন..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#ccc" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* User Rank Card */}
      <Animated.View 
        style={[
          styles.userRankCard,
          {
            opacity: fadeAnim,
            transform: [{
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [30, 0],
              })
            }]
          }
        ]}
      >
        <View style={styles.userRankInfo}>
          <Text style={styles.userRankLabel}>আপনার র‍্যাংক</Text>
          <Text style={styles.userRank}>#28</Text>
          <Text style={styles.userEarnings}>৳ ১,২৫০ আয় করেছেন</Text>
        </View>
        <View style={styles.userStats}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>15</Text>
            <Text style={styles.statLabel}>জয়</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>87%</Text>
            <Text style={styles.statLabel}>জয়ের হার</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>45</Text>
            <Text style={styles.statLabel}>গেম</Text>
          </View>
        </View>
      </Animated.View>

      {/* Time Tabs */}
      <View style={styles.tabContainer}>
        <TabButton title="সাপ্তাহিক" value="weekly" />
        <TabButton title="মাসিক" value="monthly" />
        <TabButton title="সর্বকালের" value="allTime" />
      </View>

      {/* Filter Tabs */}
      {showFilters && (
        <Animated.View 
          style={[
            styles.filterContainer,
            {
              opacity: fadeAnim,
              transform: [{
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                })
              }]
            }
          ]}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {filters.map(filter => (
              <FilterButton key={filter.id} filter={filter} />
            ))}
          </ScrollView>
        </Animated.View>
      )}

      {/* Stats Overview */}
      <View style={styles.statsOverview}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statItemValue}>{leaderboardData.length}</Text>
            <Text style={styles.statItemLabel}>প্লেয়ার</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statItemValue}>
              {leaderboardData.filter(p => p.isOnline).length}
            </Text>
            <Text style={styles.statItemLabel}>অনলাইন</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statItemValue}>
              {leaderboardData.filter(p => p.country === 'BD').length}
            </Text>
            <Text style={styles.statItemLabel}>বাংলাদেশ</Text>
          </View>
        </View>
      </View>

      {/* Leaderboard List */}
      <FlatList
        data={leaderboardData}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, index }) => <LeaderboardItem item={item} index={index} />}
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
            <Ionicons name="trophy-outline" size={64} color="#666" />
            <Text style={styles.emptyText}>কোন প্লেয়ার পাওয়া যায়নি</Text>
            <Text style={styles.emptySubtext}>অনুসন্ধান বা ফিল্টার পরিবর্তন করুন</Text>
          </View>
        }
        ListHeaderComponent={
          leaderboardData.length > 0 ? (
            <View style={styles.listHeader}>
              <Text style={styles.listHeaderText}>
                মোট {leaderboardData.length} জন প্লেয়ার
              </Text>
            </View>
          ) : null
        }
      />

      {/* Rewards Banner */}
      <Animated.View 
        style={[
          styles.rewardsBanner,
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
        <Ionicons name="gift" size={24} color="#FFD700" />
        <View style={styles.rewardsText}>
          <Text style={styles.rewardsTitle}>টপ ৩ পুরস্কার</Text>
          <Text style={styles.rewardsSubtitle}>প্রতি সপ্তাহে জেতুন অসাধারণ পুরস্কার!</Text>
        </View>
        <TouchableOpacity style={styles.viewRewardsButton}>
          <Text style={styles.viewRewardsText}>দেখুন</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* User Profile Modal */}
      <UserProfileModal 
        user={showUserProfile} 
        visible={!!showUserProfile}
        onClose={() => setShowUserProfile(false)}
      />
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
    paddingBottom: 15,
    backgroundColor: '#1a1a1a',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  headerButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    margin: 15,
    marginTop: 5,
    paddingHorizontal: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 12,
  },
  userRankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,138,0,0.1)',
    margin: 15,
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#ff8a0030',
  },
  userRankInfo: {
    flex: 1,
  },
  userRankLabel: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 5,
  },
  userRank: {
    color: '#ff8a00',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  userEarnings: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '600',
  },
  userStats: {
    flexDirection: 'row',
    gap: 15,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statLabel: {
    color: '#ccc',
    fontSize: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#1a1a1a',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  tabButtonActive: {
    backgroundColor: 'rgba(255,138,0,0.2)',
    borderWidth: 1,
    borderColor: '#ff8a00',
  },
  tabText: {
    color: '#ccc',
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#ff8a00',
  },
  filterContainer: {
    padding: 10,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  filterButtonActive: {
    backgroundColor: 'rgba(255,138,0,0.2)',
    borderWidth: 1,
    borderColor: '#ff8a00',
  },
  filterText: {
    color: '#ccc',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  filterTextActive: {
    color: '#ff8a00',
  },
  statsOverview: {
    padding: 15,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statItemValue: {
    color: '#ff8a00',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statItemLabel: {
    color: '#ccc',
    fontSize: 12,
  },
  listHeader: {
    padding: 10,
    alignItems: 'center',
  },
  listHeaderText: {
    color: '#ccc',
    fontSize: 12,
  },
  listContainer: {
    padding: 15,
    paddingBottom: 80,
  },
  leaderboardItem: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#333',
    overflow: 'hidden',
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  rankContainer: {
    marginRight: 15,
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    minWidth: 40,
    justifyContent: 'center',
  },
  rankText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    fontSize: 24,
  },
  onlineIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    backgroundColor: '#4CAF50',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#0a0a0a',
  },
  playerDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  playerName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  countryFlag: {
    fontSize: 14,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playerLevel: {
    color: '#ccc',
    fontSize: 12,
  },
  statsMini: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  winRateMini: {
    color: '#4CAF50',
    fontSize: 11,
    fontWeight: 'bold',
    marginRight: 4,
  },
  winsMini: {
    color: '#ccc',
    fontSize: 11,
  },
  stats: {
    alignItems: 'flex-end',
  },
  earnings: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  wins: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  gamesPlayed: {
    color: '#ccc',
    fontSize: 10,
  },
  rewardsBanner: {
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
  rewardsText: {
    flex: 1,
    marginLeft: 12,
  },
  rewardsTitle: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  rewardsSubtitle: {
    color: '#ccc',
    fontSize: 12,
  },
  viewRewardsButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
  },
  viewRewardsText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
  emptySubtext: {
    color: '#666',
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#ff8a00',
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileAvatarContainer: {
    position: 'relative',
    marginRight: 15,
  },
  profileAvatar: {
    fontSize: 48,
  },
  profileOnlineIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 16,
    height: 16,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1a1a1a',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  profileDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  profileLevel: {
    color: '#ff8a00',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 10,
  },
  profileCountry: {
    color: '#ccc',
    fontSize: 14,
  },
  profileStatus: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: {
    color: '#ff8a00',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statLabel: {
    color: '#ccc',
    fontSize: 12,
  },
  achievements: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#ff8a00',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  achievementList: {
    gap: 10,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12,
    borderRadius: 10,
  },
  achievementText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 10,
  },
  challengeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff8a00',
    padding: 15,
    borderRadius: 12,
    gap: 10,
  },
  challengeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LeaderboardScreen;
