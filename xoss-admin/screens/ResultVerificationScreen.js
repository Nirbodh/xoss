// screens/ResultVerificationScreen.js - COMPLETE RESULT VERIFICATION SYSTEM
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, Alert, Dimensions, Modal, ActivityIndicator,
  FlatList, RefreshControl, TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system';

const { width, height } = Dimensions.get('window');

// 🆕 Result Submission Card
const ResultSubmissionCard = ({ submission, onApprove, onReject, onViewDetails }) => {
  const [expanded, setExpanded] = useState(false);

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return '#FF9800';
      case 'approved': return '#4CAF50';
      case 'rejected': return '#F44336';
      default: return '#666';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'pending': return 'time';
      case 'approved': return 'checkmark-circle';
      case 'rejected': return 'close-circle';
      default: return 'help-circle';
    }
  };

  return (
    <View style={styles.submissionCard}>
      <TouchableOpacity 
        style={styles.submissionHeader}
        onPress={() => setExpanded(!expanded)}
      >
        <View style={styles.submissionInfo}>
          <View style={styles.playerAvatar}>
            <Text style={styles.playerInitial}>
              {submission.playerName?.charAt(0) || 'P'}
            </Text>
          </View>
          <View style={styles.submissionDetails}>
            <Text style={styles.playerName}>{submission.playerName}</Text>
            <Text style={styles.matchTitle}>{submission.matchTitle}</Text>
            <Text style={styles.submissionTime}>
              {new Date(submission.submittedAt).toLocaleString()}
            </Text>
          </View>
        </View>
        
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(submission.status) }]}>
          <Ionicons name={getStatusIcon(submission.status)} size={12} color="white" />
          <Text style={styles.statusText}>{submission.status.toUpperCase()}</Text>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.expandedContent}>
          {/* Screenshot Preview */}
          <View style={styles.screenshotSection}>
            <Text style={styles.sectionTitle}>📸 Submitted Screenshot</Text>
            <TouchableOpacity 
              style={styles.screenshotContainer}
              onPress={() => onViewDetails(submission)}
            >
              <Image 
                source={{ uri: submission.screenshot }} 
                style={styles.screenshotImage}
                resizeMode="cover"
              />
              <View style={styles.screenshotOverlay}>
                <Ionicons name="expand" size={24} color="white" />
                <Text style={styles.viewText}>Tap to view full size</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Result Details */}
          <View style={styles.resultDetails}>
            <Text style={styles.sectionTitle}>📊 Result Details</Text>
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Rank Achieved</Text>
                <Text style={styles.detailValue}>#{submission.rank}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Kills</Text>
                <Text style={styles.detailValue}>{submission.kills}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Damage</Text>
                <Text style={styles.detailValue}>{submission.damage}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Prize Won</Text>
                <Text style={styles.detailValue}>৳{submission.prizeWon}</Text>
              </View>
            </View>
          </View>

          {/* Admin Actions */}
          {submission.status === 'pending' && (
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.approveButton]}
                onPress={() => onApprove(submission.id)}
              >
                <Ionicons name="checkmark" size={16} color="white" />
                <Text style={styles.actionButtonText}>Approve</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => onReject(submission.id)}
              >
                <Ionicons name="close" size={16} color="white" />
                <Text style={styles.actionButtonText}>Reject</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.detailsButton]}
                onPress={() => onViewDetails(submission)}
              >
                <Ionicons name="eye" size={16} color="#2962ff" />
                <Text style={[styles.actionButtonText, { color: '#2962ff' }]}>Details</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Status History */}
          <View style={styles.statusHistory}>
            <Text style={styles.sectionTitle}>🕒 Status History</Text>
            <View style={styles.historyItem}>
              <Ionicons name="cloud-upload" size={14} color="#FF9800" />
              <Text style={styles.historyText}>
                Submitted on {new Date(submission.submittedAt).toLocaleString()}
              </Text>
            </View>
            {submission.reviewedAt && (
              <View style={styles.historyItem}>
                <Ionicons name="shield-checkmark" size={14} color="#2962ff" />
                <Text style={styles.historyText}>
                  Reviewed by Admin on {new Date(submission.reviewedAt).toLocaleString()}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

// 🆕 Screenshot Modal Component
const ScreenshotModal = ({ visible, submission, onClose, onApprove, onReject }) => {
  const [rejectionReason, setRejectionReason] = useState('');

  if (!submission) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.screenshotModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Result Verification</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Player Info */}
            <View style={styles.playerInfoModal}>
              <View style={styles.playerAvatarModal}>
                <Text style={styles.playerInitialModal}>
                  {submission.playerName?.charAt(0) || 'P'}
                </Text>
              </View>
              <View style={styles.playerDetailsModal}>
                <Text style={styles.playerNameModal}>{submission.playerName}</Text>
                <Text style={styles.matchTitleModal}>{submission.matchTitle}</Text>
              </View>
            </View>

            {/* Full Size Screenshot */}
            <View style={styles.fullScreenshotContainer}>
              <Image 
                source={{ uri: submission.screenshot }} 
                style={styles.fullScreenshot}
                resizeMode="contain"
              />
            </View>

            {/* Result Stats */}
            <View style={styles.resultStatsModal}>
              <View style={styles.statItemModal}>
                <Text style={styles.statLabelModal}>Rank</Text>
                <Text style={styles.statValueModal}>#{submission.rank}</Text>
              </View>
              <View style={styles.statItemModal}>
                <Text style={styles.statLabelModal}>Kills</Text>
                <Text style={styles.statValueModal}>{submission.kills}</Text>
              </View>
              <View style={styles.statItemModal}>
                <Text style={styles.statLabelModal}>Damage</Text>
                <Text style={styles.statValueModal}>{submission.damage}</Text>
              </View>
              <View style={styles.statItemModal}>
                <Text style={styles.statLabelModal}>Prize</Text>
                <Text style={styles.statValueModal}>৳{submission.prizeWon}</Text>
              </View>
            </View>

            {/* Rejection Reason Input */}
            <View style={styles.rejectionSection}>
              <Text style={styles.rejectionLabel}>Rejection Reason (Optional)</Text>
              <TextInput
                style={styles.rejectionInput}
                value={rejectionReason}
                onChangeText={setRejectionReason}
                placeholder="Enter reason for rejection..."
                placeholderTextColor="#666"
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalApproveButton]}
                onPress={() => onApprove(submission.id)}
              >
                <Ionicons name="checkmark" size={20} color="white" />
                <Text style={styles.modalButtonText}>Approve Result</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalRejectButton]}
                onPress={() => onReject(submission.id, rejectionReason)}
              >
                <Ionicons name="close" size={20} color="white" />
                <Text style={styles.modalButtonText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// 🆕 Statistics Overview
const StatisticsOverview = ({ submissions }) => {
  const pendingCount = submissions.filter(s => s.status === 'pending').length;
  const approvedCount = submissions.filter(s => s.status === 'approved').length;
  const rejectedCount = submissions.filter(s => s.status === 'rejected').length;
  const totalPrizeDistributed = submissions
    .filter(s => s.status === 'approved')
    .reduce((sum, s) => sum + s.prizeWon, 0);

  const stats = [
    {
      title: 'Pending Review',
      value: pendingCount,
      color: '#FF9800',
      icon: 'time'
    },
    {
      title: 'Approved',
      value: approvedCount,
      color: '#4CAF50',
      icon: 'checkmark-circle'
    },
    {
      title: 'Rejected',
      value: rejectedCount,
      color: '#F44336',
      icon: 'close-circle'
    },
    {
      title: 'Prize Distributed',
      value: `৳${totalPrizeDistributed}`,
      color: '#FFD700',
      icon: 'cash'
    }
  ];

  return (
    <View style={styles.statsContainer}>
      <Text style={styles.statsTitle}>📊 Verification Statistics</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: stat.color }]}>
                <Ionicons name={stat.icon} size={16} color="white" />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.title}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const ResultVerificationScreen = ({ navigation }) => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [screenshotModalVisible, setScreenshotModalVisible] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadSubmissions();
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Need camera roll permissions to verify screenshots');
    }
  };

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      // Mock data - Replace with actual API call
      const mockSubmissions = [
        {
          id: '1',
          playerName: 'ProPlayer',
          playerId: 'USER001',
          matchTitle: 'SOLO SHOWDOWN | FREE FIRE',
          matchId: 'M001',
          screenshot: 'https://via.placeholder.com/400x800/2962ff/ffffff?text=Game+Result+Screenshot',
          rank: 1,
          kills: 8,
          damage: 2450,
          prizeWon: 150,
          status: 'pending',
          submittedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          reviewedAt: null,
          reviewedBy: null,
          rejectionReason: ''
        },
        {
          id: '2',
          playerName: 'GamerKing',
          playerId: 'USER002',
          matchTitle: 'DUO TOURNAMENT | PUBG',
          matchId: 'M002',
          screenshot: 'https://via.placeholder.com/400x800/4CAF50/ffffff?text=Match+Result+Proof',
          rank: 3,
          kills: 6,
          damage: 1800,
          prizeWon: 70,
          status: 'approved',
          submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          reviewedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          reviewedBy: 'Admin01',
          rejectionReason: ''
        },
        {
          id: '3',
          playerName: 'NoobMaster',
          playerId: 'USER003',
          matchTitle: 'SQUAD BATTLE | COD',
          matchId: 'M003',
          screenshot: 'https://via.placeholder.com/400x800/F44336/ffffff?text=Invalid+Screenshot',
          rank: 15,
          kills: 2,
          damage: 450,
          prizeWon: 0,
          status: 'rejected',
          submittedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          reviewedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          reviewedBy: 'Admin01',
          rejectionReason: 'Screenshot does not show complete result screen'
        },
        {
          id: '4',
          playerName: 'BattleLegend',
          playerId: 'USER004',
          matchTitle: 'SOLO MATCH | BGMI',
          matchId: 'M004',
          screenshot: 'https://via.placeholder.com/400x800/FF9800/ffffff?text=Result+Submission',
          rank: 2,
          kills: 7,
          damage: 2100,
          prizeWon: 100,
          status: 'pending',
          submittedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          reviewedAt: null,
          reviewedBy: null,
          rejectionReason: ''
        }
      ];
      setSubmissions(mockSubmissions);
    } catch (error) {
      Alert.alert('Error', 'Failed to load submissions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadSubmissions();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleApprove = async (submissionId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSubmissions(prev => prev.map(sub => 
        sub.id === submissionId 
          ? { 
              ...sub, 
              status: 'approved',
              reviewedAt: new Date().toISOString(),
              reviewedBy: 'Admin' // Current admin username
            }
          : sub
      ));
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Approved!', 'Result has been approved and prize distributed.');
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to approve result');
    }
  };

  const handleReject = async (submissionId, reason = '') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSubmissions(prev => prev.map(sub => 
        sub.id === submissionId 
          ? { 
              ...sub, 
              status: 'rejected',
              reviewedAt: new Date().toISOString(),
              reviewedBy: 'Admin', // Current admin username
              rejectionReason: reason
            }
          : sub
      ));
      
      setScreenshotModalVisible(false);
      setSelectedSubmission(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Rejected!', 'Result has been rejected.');
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to reject result');
    }
  };

  const handleViewDetails = (submission) => {
    setSelectedSubmission(submission);
    setScreenshotModalVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const filteredSubmissions = submissions.filter(submission => {
    if (activeFilter !== 'all' && submission.status !== activeFilter) return false;
    if (searchQuery && !submission.playerName.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !submission.matchTitle.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2962ff" />
          <Text style={styles.loadingText}>Loading Submissions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <LinearGradient colors={['#1a237e', '#303f9f']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Result Verification</Text>
            <Text style={styles.headerSubtitle}>Admin Panel</Text>
          </View>
          <TouchableOpacity style={styles.headerAction}>
            <Ionicons name="filter" size={22} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Statistics Overview */}
      <StatisticsOverview submissions={submissions} />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#b0b8ff" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by player or match..."
          placeholderTextColor="#b0b8ff"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close" size={20} color="#b0b8ff" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {['all', 'pending', 'approved', 'rejected'].map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterTab,
              activeFilter === filter && styles.filterTabActive
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveFilter(filter);
            }}
          >
            <Text style={[
              styles.filterText,
              activeFilter === filter && styles.filterTextActive
            ]}>
              {filter === 'all' ? 'All' :
               filter === 'pending' ? 'Pending' :
               filter === 'approved' ? 'Approved' : 'Rejected'}
            </Text>
            {filter !== 'all' && (
              <View style={[
                styles.filterBadge,
                { backgroundColor: 
                  filter === 'pending' ? '#FF9800' :
                  filter === 'approved' ? '#4CAF50' : '#F44336'
                }
              ]}>
                <Text style={styles.filterBadgeText}>
                  {submissions.filter(s => s.status === filter).length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Submissions List */}
      <FlatList
        data={filteredSubmissions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ResultSubmissionCard
            submission={item}
            onApprove={handleApprove}
            onReject={handleReject}
            onViewDetails={handleViewDetails}
          />
        )}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh}
            colors={['#2962ff']}
            tintColor="#2962ff"
          />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-text" size={64} color="#666" />
            <Text style={styles.emptyText}>No submissions found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Try a different search' : 
               activeFilter !== 'all' ? `No ${activeFilter} submissions` : 
               'No result submissions yet'}
            </Text>
          </View>
        }
      />

      {/* Screenshot Modal */}
      <ScreenshotModal
        visible={screenshotModalVisible}
        submission={selectedSubmission}
        onClose={() => {
          setScreenshotModalVisible(false);
          setSelectedSubmission(null);
        }}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0a0c23',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  backButton: {
    padding: 8,
  },
  headerTitleContainer: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  headerAction: {
    padding: 8,
  },
  statsContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  statsTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 120,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    color: 'white',
    fontSize: 14,
    marginLeft: 10,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 4,
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  filterTabActive: {
    backgroundColor: '#2962ff',
  },
  filterText: {
    color: '#b0b8ff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  filterTextActive: {
    color: 'white',
  },
  filterBadge: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 20,
  },
  filterBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  submissionCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  submissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  submissionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  playerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2962ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  playerInitial: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  submissionDetails: {
    flex: 1,
  },
  playerName: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  matchTitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginBottom: 2,
  },
  submissionTime: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  expandedContent: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  screenshotSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  screenshotContainer: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    height: 200,
  },
  screenshotImage: {
    width: '100%',
    height: '100%',
  },
  screenshotOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewText: {
    color: 'white',
    fontSize: 12,
    marginTop: 8,
  },
  resultDetails: {
    marginBottom: 16,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailItem: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 12,
    borderRadius: 8,
  },
  detailLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginBottom: 4,
  },
  detailValue: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
  detailsButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: '#2962ff',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusHistory: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  historyText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
  },
  screenshotModal: {
    backgroundColor: '#1a1f3d',
    margin: 20,
    borderRadius: 16,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalContent: {
    padding: 20,
  },
  playerInfoModal: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  playerAvatarModal: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2962ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  playerInitialModal: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  playerDetailsModal: {
    flex: 1,
  },
  playerNameModal: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  matchTitleModal: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  fullScreenshotContainer: {
    height: 400,
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  fullScreenshot: {
    width: '100%',
    height: '100%',
  },
  resultStatsModal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  statItemModal: {
    alignItems: 'center',
    flex: 1,
  },
  statLabelModal: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginBottom: 4,
  },
  statValueModal: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  rejectionSection: {
    marginBottom: 20,
  },
  rejectionLabel: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  rejectionInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    padding: 12,
    color: 'white',
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  modalApproveButton: {
    backgroundColor: '#4CAF50',
  },
  modalRejectButton: {
    backgroundColor: '#F44336',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
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
});

export default ResultVerificationScreen;
