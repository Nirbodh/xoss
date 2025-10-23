// screens/TeamManagementScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Animated,
  TextInput,
  Alert,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const TeamManagementScreen = ({ navigation }) => {
  const [teams, setTeams] = useState([]);
  const [activeTab, setActiveTab] = useState('myTeams');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const fadeAnim = new Animated.Value(0);

  const sampleTeams = [
    {
      id: 1,
      name: 'XOSS Elite',
      game: 'Free Fire',
      members: 4,
      maxMembers: 4,
      wins: 15,
      created: '2 months ago',
      membersList: [
        { id: 1, name: 'You', role: 'Leader', status: 'online' },
        { id: 2, name: 'ProPlayer', role: 'Member', status: 'online' },
        { id: 3, name: 'GameMaster', role: 'Member', status: 'offline' },
        { id: 4, name: 'SniperKing', role: 'Member', status: 'online' }
      ]
    },
    {
      id: 2,
      name: 'Victory Squad',
      game: 'PUBG Mobile',
      members: 3,
      maxMembers: 4,
      wins: 8,
      created: '1 month ago',
      membersList: [
        { id: 1, name: 'You', role: 'Leader', status: 'online' },
        { id: 2, name: 'PUBGPro', role: 'Member', status: 'online' },
        { id: 3, name: 'ChickenDinner', role: 'Member', status: 'offline' }
      ]
    }
  ];

  const samplePlayers = [
    { id: 1, name: 'TournamentKing', level: 25, winRate: '82%', status: 'online', game: 'Free Fire' },
    { id: 2, name: 'EliteGamer', level: 22, winRate: '78%', status: 'online', game: 'PUBG Mobile' },
    { id: 3, name: 'ProShooter', level: 20, winRate: '75%', status: 'offline', game: 'Free Fire' },
    { id: 4, name: 'GameChanger', level: 18, winRate: '70%', status: 'online', game: 'PUBG Mobile' }
  ];

  useEffect(() => {
    loadData();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [activeTab]);

  const loadData = () => {
    setRefreshing(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const TeamCard = ({ team }) => (
    <View style={[styles.teamCard, { opacity: fadeAnim }]}>
      <View style={styles.teamHeader}>
        <View style={styles.teamInfo}>
          <Text style={styles.teamName}>{team.name}</Text>
          <Text style={styles.teamGame}>{team.game} • {team.wins} Wins</Text>
        </View>
        <View style={styles.memberCount}>
          <Ionicons name="people" size={16} color="#ff8a00" />
          <Text style={styles.memberText}>{team.members}/{team.maxMembers}</Text>
        </View>
      </View>

      <View style={styles.membersList}>
        {team.membersList.map((member) => (
          <View key={member.id} style={styles.memberItem}>
            <View style={styles.memberLeft}>
              <View style={[styles.statusDot, 
                member.status === 'online' ? styles.online : styles.offline
              ]} />
              <Text style={styles.memberName}>{member.name}</Text>
              {member.role === 'Leader' && (
                <View style={styles.leaderBadge}>
                  <Text style={styles.leaderText}>Leader</Text>
                </View>
              )}
            </View>
            <Text style={styles.memberRole}>{member.role}</Text>
          </View>
        ))}
      </View>

      <View style={styles.teamActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="chatbubble" size={16} color="#2962ff" />
          <Text style={styles.actionText}>Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="trophy" size={16} color="#FFD700" />
          <Text style={styles.actionText}>Tournament</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="settings" size={16} color="#ccc" />
          <Text style={styles.actionText}>Manage</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const PlayerCard = ({ player }) => (
    <View style={[styles.playerCard, { opacity: fadeAnim }]}>
      <View style={styles.playerInfo}>
        <View style={styles.playerLeft}>
          <View style={[styles.statusDot, 
            player.status === 'online' ? styles.online : styles.offline
          ]} />
          <View>
            <Text style={styles.playerName}>{player.name}</Text>
            <Text style={styles.playerGame}>{player.game} • Level {player.level}</Text>
          </View>
        </View>
        <View style={styles.playerStats}>
          <Text style={styles.winRate}>{player.winRate} Win Rate</Text>
        </View>
      </View>
      
      <TouchableOpacity style={styles.inviteButton}>
        <Ionicons name="person-add" size={16} color="#fff" />
        <Text style={styles.inviteText}>Invite</Text>
      </TouchableOpacity>
    </View>
  );

  const TabButton = ({ title, value }) => (
    <TouchableOpacity
      style={[
        styles.tabButton,
        activeTab === value && styles.tabButtonActive
      ]}
      onPress={() => setActiveTab(value)}
    >
      <Text style={[
        styles.tabText,
        activeTab === value && styles.tabTextActive
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
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
        <Text style={styles.headerTitle}>Team Management</Text>
        <TouchableOpacity style={styles.createButton}>
          <Ionicons name="add" size={24} color="#ff8a00" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search teams or players..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TabButton title="My Teams" value="myTeams" />
        <TabButton title="Find Players" value="findPlayers" />
        <TabButton title="Invitations" value="invitations" />
      </View>

      {/* Content */}
      {activeTab === 'myTeams' && (
        <FlatList
          data={teams}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <TeamCard team={item} />}
          contentContainerStyle={styles.listContainer}
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
              <Ionicons name="people-outline" size={64} color="#ff8a00" />
              <Text style={styles.emptyText}>No Teams Yet</Text>
              <Text style={styles.emptySubtext}>Create your first team to start playing together</Text>
              <TouchableOpacity style={styles.createTeamButton}>
                <Text style={styles.createTeamText}>Create Team</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {activeTab === 'findPlayers' && (
        <FlatList
          data={samplePlayers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <PlayerCard player={item} />}
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickActionButton}>
          <Ionicons name="add-circle" size={24} color="#ff8a00" />
          <Text style={styles.quickActionText}>Create Team</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionButton}>
          <Ionicons name="search" size={24} color="#2962ff" />
          <Text style={styles.quickActionText}>Find Players</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionButton}>
          <Ionicons name="trophy" size={24} color="#FFD700" />
          <Text style={styles.quickActionText}>Team Tournaments</Text>
        </TouchableOpacity>
      </View>
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
  },
  createButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    margin: 20,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    marginLeft: 10,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 15,
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
  listContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  teamCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  teamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  teamGame: {
    color: '#ff8a00',
    fontSize: 14,
  },
  memberCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberText: {
    color: '#ccc',
    fontSize: 14,
    marginLeft: 4,
  },
  membersList: {
    marginBottom: 15,
  },
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  memberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  online: {
    backgroundColor: '#4CAF50',
  },
  offline: {
    backgroundColor: '#666',
  },
  memberName: {
    color: '#fff',
    fontSize: 14,
    marginRight: 8,
  },
  leaderBadge: {
    backgroundColor: '#ff8a00',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  leaderText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  memberRole: {
    color: '#ccc',
    fontSize: 12,
  },
  teamActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  actionText: {
    color: '#ccc',
    fontSize: 12,
    marginLeft: 4,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  playerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  playerName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  playerGame: {
    color: '#ccc',
    fontSize: 12,
  },
  playerStats: {
    alignItems: 'flex-end',
  },
  winRate: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '600',
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff8a00',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 10,
  },
  inviteText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
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
    marginBottom: 20,
  },
  createTeamButton: {
    backgroundColor: '#ff8a00',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 20,
  },
  createTeamText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  quickActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  quickActionButton: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
  },
  quickActionText: {
    color: '#ccc',
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
});

export default TeamManagementScreen;
