// screens/PrizeManagementScreen.js - COMPLETE PRIZE MANAGEMENT SYSTEM
import React, { useState, useRef, useEffect } from 'react';
import { 
  View, Text, ScrollView, TouchableOpacity, StyleSheet, 
  TextInput, Alert, Animated, Dimensions, Modal, 
  RefreshControl, FlatList, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';

const { width, height } = Dimensions.get('window');

// Simple Button Component
const SimpleButton = ({ 
  title, 
  onPress, 
  icon, 
  type = 'primary',
  size = 'medium',
  disabled = false,
  style 
}) => {
  const getButtonStyle = () => {
    switch (type) {
      case 'primary': return styles.primaryButton;
      case 'success': return styles.successButton;
      case 'warning': return styles.warningButton;
      case 'danger': return styles.dangerButton;
      case 'secondary': return styles.secondaryButton;
      default: return styles.primaryButton;
    }
  };

  const getTextStyle = () => {
    switch (type) {
      case 'primary': return styles.primaryButtonText;
      case 'success': return styles.successButtonText;
      case 'warning': return styles.warningButtonText;
      case 'danger': return styles.dangerButtonText;
      case 'secondary': return styles.secondaryButtonText;
      default: return styles.primaryButtonText;
    }
  };

  return (
    <TouchableOpacity
      style={[
        getButtonStyle(),
        size === 'large' && styles.buttonLarge,
        size === 'small' && styles.buttonSmall,
        disabled && styles.buttonDisabled,
        style
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View style={styles.buttonContent}>
        {icon && (
          <Ionicons 
            name={icon} 
            size={size === 'large' ? 18 : size === 'small' ? 14 : 16} 
            color="white" 
            style={styles.buttonIcon}
          />
        )}
        <Text style={[
          getTextStyle(),
          size === 'large' && styles.buttonTextLarge,
          size === 'small' && styles.buttonTextSmall
        ]}>
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// Prize Distribution Card Component
const PrizeDistributionCard = ({ event, index, onDistribute, onViewDetails, onRefund }) => {
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const getStatusColor = (status) => {
    switch(status) {
      case 'distributed': return '#4CAF50';
      case 'pending': return '#FF9800';
      case 'processing': return '#2196F3';
      case 'failed': return '#F44336';
      case 'refunded': return '#9C27B0';
      default: return '#666';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'distributed': return 'checkmark-done';
      case 'pending': return 'time';
      case 'processing': return 'sync';
      case 'failed': return 'close-circle';
      case 'refunded': return 'refresh';
      default: return 'help-circle';
    }
  };

  const getEventTypeColor = (type) => {
    return type === 'tournament' ? '#FF6B00' : '#2962ff';
  };

  const getEventTypeIcon = (type) => {
    return type === 'tournament' ? 'trophy' : 'game-controller';
  };

  const calculateDistributionAmount = () => {
    if (!event.prizeDistribution) return 0;
    return event.prizeDistribution.reduce((total, dist) => total + (dist.amount || 0), 0);
  };

  const getRemainingAmount = () => {
    return (event.prizePool || 0) - calculateDistributionAmount();
  };

  return (
    <Animated.View style={[
      styles.prizeCard,
      {
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }]
      }
    ]}>
      <LinearGradient 
        colors={['#1a237e', '#283593']} 
        style={styles.cardGradient}
      >
        {/* Header Section */}
        <View style={styles.cardHeader}>
          <View style={styles.eventInfo}>
            <View style={[
              styles.eventTypeIcon, 
              { backgroundColor: getEventTypeColor(event.matchType) }
            ]}>
              <Ionicons 
                name={getEventTypeIcon(event.matchType)} 
                size={20} 
                color="white" 
              />
            </View>
            <View style={styles.eventTitleContainer}>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <Text style={styles.eventSubtitle}>
                {event.game} • {event.type} • {event.matchType === 'tournament' ? 'Tournament' : 'Match'}
              </Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(event.prizeStatus) }]}>
            <Ionicons name={getStatusIcon(event.prizeStatus)} size={12} color="white" />
            <Text style={styles.statusText}>{event.prizeStatus.toUpperCase()}</Text>
          </View>
        </View>

        {/* Prize Information */}
        <View style={styles.prizeInfo}>
          <View style={styles.prizeRow}>
            <View style={styles.prizeItem}>
              <Ionicons name="trophy-outline" size={16} color="#FFD700" />
              <Text style={styles.prizeLabel}>Total Prize</Text>
              <Text style={styles.prizeValue}>৳{event.prizePool || 0}</Text>
            </View>
            <View style={styles.prizeItem}>
              <Ionicons name="cash-outline" size={16} color="#4CAF50" />
              <Text style={styles.prizeLabel}>Distributed</Text>
              <Text style={styles.prizeValue}>৳{calculateDistributionAmount()}</Text>
            </View>
            <View style={styles.prizeItem}>
              <Ionicons name="hourglass-outline" size={16} color="#FF9800" />
              <Text style={styles.prizeLabel}>Remaining</Text>
              <Text style={styles.prizeValue}>৳{getRemainingAmount()}</Text>
            </View>
          </View>
        </View>

        {/* Winners List Preview */}
        {event.prizeDistribution && event.prizeDistribution.length > 0 && (
          <View style={styles.winnersPreview}>
            <Text style={styles.winnersTitle}>Winners</Text>
            <View style={styles.winnersList}>
              {event.prizeDistribution.slice(0, 3).map((winner, idx) => (
                <View key={idx} style={styles.winnerPreview}>
                  <Text style={styles.winnerRank}>#{winner.rank}</Text>
                  <Text style={styles.winnerName} numberOfLines={1}>
                    {winner.playerName || `Player ${winner.rank}`}
                  </Text>
                  <Text style={styles.winnerPrize}>৳{winner.amount}</Text>
                </View>
              ))}
              {event.prizeDistribution.length > 3 && (
                <Text style={styles.moreWinnersText}>
                  +{event.prizeDistribution.length - 3} more winners
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {event.prizeStatus === 'pending' && (
            <>
              <SimpleButton
                title="DISTRIBUTE"
                onPress={() => onDistribute(event)}
                type="success"
                size="small"
                icon="gift"
                style={styles.actionButton}
              />
              <SimpleButton
                title="REFUND"
                onPress={() => onRefund(event)}
                type="warning"
                size="small"
                icon="refresh"
                style={styles.actionButton}
              />
            </>
          )}
          
          {event.prizeStatus === 'processing' && (
            <SimpleButton
              title="PROCESSING..."
              onPress={() => {}}
              type="secondary"
              size="small"
              icon="sync"
              disabled={true}
              style={styles.actionButton}
            />
          )}
          
          {event.prizeStatus === 'distributed' && (
            <SimpleButton
              title="VIEW DETAILS"
              onPress={() => onViewDetails(event)}
              type="primary"
              size="small"
              icon="eye"
              style={styles.actionButton}
            />
          )}
          
          {event.prizeStatus === 'failed' && (
            <>
              <SimpleButton
                title="RETRY"
                onPress={() => onDistribute(event)}
                type="danger"
                size="small"
                icon="refresh"
                style={styles.actionButton}
              />
              <SimpleButton
                title="REFUND"
                onPress={() => onRefund(event)}
                type="warning"
                size="small"
                icon="refresh"
                style={styles.actionButton}
              />
            </>
          )}

          <SimpleButton
            title="DETAILS"
            onPress={() => onViewDetails(event)}
            type="secondary"
            size="small"
            icon="information-circle"
            style={styles.actionButton}
          />
        </View>

        {/* Distribution Date */}
        {event.distributionDate && (
          <View style={styles.distributionDate}>
            <Ionicons name="calendar" size={12} color="rgba(255,255,255,0.7)" />
            <Text style={styles.distributionDateText}>
              Distributed on {new Date(event.distributionDate).toLocaleDateString()}
            </Text>
          </View>
        )}
      </LinearGradient>
    </Animated.View>
  );
};

// Prize Distribution Modal
const PrizeDistributionModal = ({ visible, event, onClose, onDistribute }) => {
  const slideAnim = useRef(new Animated.Value(height)).current;
  const [winners, setWinners] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [distributionMethod, setDistributionMethod] = useState('auto');

  useEffect(() => {
    if (visible && event) {
      // Generate sample winners based on event type
      const generatedWinners = generateSampleWinners(event);
      setWinners(generatedWinners);
      
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(slideAnim, {
        toValue: height,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, event]);

  const generateSampleWinners = (eventData) => {
    const prizePool = eventData.prizePool || 0;
    const isTournament = eventData.matchType === 'tournament';
    
    if (isTournament) {
      // Tournament prize distribution (more winners)
      return [
        {
          id: '1',
          playerName: 'Champion Team',
          playerId: 'TEAM001',
          rank: 1,
          kills: 45,
          damage: 12500,
          prize: Math.round(prizePool * 0.4),
          walletAddress: '0x742d35Cc6634C0532925a3b8D',
          teamName: 'Alpha Squad'
        },
        {
          id: '2', 
          playerName: 'Runner Up',
          playerId: 'TEAM002',
          rank: 2,
          kills: 38,
          damage: 11000,
          prize: Math.round(prizePool * 0.3),
          walletAddress: '0x842d35Cc6634C0532925a3b8E',
          teamName: 'Beta Warriors'
        },
        {
          id: '3',
          playerName: 'Third Place',
          playerId: 'TEAM003',
          rank: 3,
          kills: 32,
          damage: 9800,
          prize: Math.round(prizePool * 0.2),
          walletAddress: '0x942d35Cc6634C0532925a3b8F',
          teamName: 'Gamma Elite'
        },
        {
          id: '4',
          playerName: 'Fourth Place',
          playerId: 'TEAM004',
          rank: 4,
          kills: 28,
          damage: 8500,
          prize: Math.round(prizePool * 0.1),
          walletAddress: '0xa42d35Cc6634C0532925a3b8G',
          teamName: 'Delta Force'
        }
      ];
    } else {
      // Regular match prize distribution (fewer winners)
      return [
        {
          id: '1',
          playerName: 'Top Fragger',
          playerId: 'PLAYER001',
          rank: 1,
          kills: 15,
          damage: 3500,
          prize: Math.round(prizePool * 0.5),
          walletAddress: '0x742d35Cc6634C0532925a3b8D'
        },
        {
          id: '2',
          playerName: 'Second Best',
          playerId: 'PLAYER002', 
          rank: 2,
          kills: 12,
          damage: 2800,
          prize: Math.round(prizePool * 0.3),
          walletAddress: '0x842d35Cc6634C0532925a3b8E'
        },
        {
          id: '3',
          playerName: 'Third Player',
          playerId: 'PLAYER003',
          rank: 3,
          kills: 10,
          damage: 2400,
          prize: Math.round(prizePool * 0.2),
          walletAddress: '0x942d35Cc6634C0532925a3b8F'
        }
      ];
    }
  };

  const handlePrizeChange = (winnerId, newPrize) => {
    setWinners(prev => 
      prev.map(winner => 
        winner.id === winnerId 
          ? { ...winner, prize: parseInt(newPrize) || 0 }
          : winner
      )
    );
  };

  const handleDistribute = async () => {
    if (winners.length === 0) {
      Alert.alert('No Winners', 'Please add winners before distributing prizes.');
      return;
    }

    if (!event) {
      Alert.alert('Error', 'Event data not found.');
      return;
    }

    const prizePool = event.prizePool || 0;
    const totalDistributed = winners.reduce((sum, winner) => sum + (winner.prize || 0), 0);
    
    if (totalDistributed > prizePool) {
      Alert.alert('Insufficient Funds', `Total distribution (৳${totalDistributed}) exceeds prize pool (৳${prizePool})`);
      return;
    }

    setIsProcessing(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onDistribute(event.id, winners, distributionMethod);
      Alert.alert(
        'Success! 🎉', 
        `Prizes distributed to ${winners.length} winners!\n\nTotal Distributed: ৳${totalDistributed}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Distribution Failed', 'Please try again later.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!event) return null;

  const prizePool = event.prizePool || 0;
  const totalDistributed = winners.reduce((sum, winner) => sum + (winner.prize || 0), 0);
  const remainingAmount = prizePool - totalDistributed;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose}/>
        <Animated.View style={[styles.prizeModal, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>💰 Distribute Prizes</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Event Information */}
            <View style={styles.eventSummary}>
              <Text style={styles.eventName}>{event.title}</Text>
              <Text style={styles.eventDetails}>
                {event.game} • {event.type} • {event.matchType === 'tournament' ? 'Tournament' : 'Match'}
              </Text>
              
              <View style={styles.prizeSummary}>
                <View style={styles.prizeSummaryItem}>
                  <Text style={styles.prizeSummaryLabel}>Total Prize Pool</Text>
                  <Text style={styles.prizeSummaryValue}>৳{prizePool}</Text>
                </View>
                <View style={styles.prizeSummaryItem}>
                  <Text style={styles.prizeSummaryLabel}>To Distribute</Text>
                  <Text style={styles.prizeSummaryValue}>৳{totalDistributed}</Text>
                </View>
                <View style={styles.prizeSummaryItem}>
                  <Text style={styles.prizeSummaryLabel}>Remaining</Text>
                  <Text style={[
                    styles.prizeSummaryValue,
                    remainingAmount < 0 && styles.negativeAmount
                  ]}>
                    ৳{remainingAmount}
                  </Text>
                </View>
              </View>
            </View>

            {/* Distribution Method */}
            <View style={styles.methodSection}>
              <Text style={styles.sectionTitle}>Distribution Method</Text>
              <View style={styles.methodButtons}>
                <TouchableOpacity 
                  style={[
                    styles.methodButton,
                    distributionMethod === 'auto' && styles.methodButtonActive
                  ]}
                  onPress={() => setDistributionMethod('auto')}
                >
                  <Ionicons 
                    name="flash" 
                    size={20} 
                    color={distributionMethod === 'auto' ? 'white' : '#2962ff'} 
                  />
                  <Text style={[
                    styles.methodButtonText,
                    distributionMethod === 'auto' && styles.methodButtonTextActive
                  ]}>
                    Auto Distribution
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.methodButton,
                    distributionMethod === 'manual' && styles.methodButtonActive
                  ]}
                  onPress={() => setDistributionMethod('manual')}
                >
                  <Ionicons 
                    name="create" 
                    size={20} 
                    color={distributionMethod === 'manual' ? 'white' : '#2962ff'} 
                  />
                  <Text style={[
                    styles.methodButtonText,
                    distributionMethod === 'manual' && styles.methodButtonTextActive
                  ]}>
                    Manual Distribution
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Winners List */}
            <View style={styles.winnersSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Winner Distribution</Text>
                <Text style={styles.winnersCount}>{winners.length} winners</Text>
              </View>
              
              {winners.map((winner) => (
                <View key={winner.id} style={styles.winnerRow}>
                  <View style={styles.winnerPosition}>
                    <Text style={styles.positionText}>#{winner.rank}</Text>
                    <Ionicons name="trophy" size={20} color="#FFD700" />
                  </View>
                  
                  <View style={styles.winnerInfo}>
                    <Text style={styles.winnerName}>
                      {winner.playerName}
                      {winner.teamName && ` (${winner.teamName})`}
                    </Text>
                    <Text style={styles.winnerStats}>
                      {winner.kills} Kills • {winner.damage} Damage
                    </Text>
                    <Text style={styles.winnerId}>ID: {winner.playerId}</Text>
                  </View>
                  
                  <View style={styles.prizeInputContainer}>
                    <Text style={styles.prizeLabel}>Prize (৳)</Text>
                    <TextInput
                      style={styles.prizeInput}
                      value={winner.prize?.toString()}
                      onChangeText={(text) => handlePrizeChange(winner.id, text)}
                      keyboardType="numeric"
                      editable={distributionMethod === 'manual'}
                    />
                  </View>
                </View>
              ))}
            </View>

            {/* Distribution Summary */}
            <View style={styles.distributionSummary}>
              <Text style={styles.summaryTitle}>Distribution Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Prize Pool:</Text>
                <Text style={styles.summaryValue}>৳{prizePool}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Distributed:</Text>
                <Text style={styles.summaryValue}>৳{totalDistributed}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Remaining Balance:</Text>
                <Text style={[
                  styles.summaryValue,
                  remainingAmount < 0 && styles.negativeAmount
                ]}>
                  ৳{remainingAmount}
                </Text>
              </View>
            </View>

            {/* Action Button */}
            <SimpleButton
              title={
                isProcessing 
                  ? "DISTRIBUTING PRIZES..." 
                  : `CONFIRM DISTRIBUTION (৳${totalDistributed})`
              }
              onPress={handleDistribute}
              type={remainingAmount < 0 ? "danger" : "success"}
              size="large"
              icon="gift"
              disabled={isProcessing || remainingAmount < 0}
              style={styles.distributeButton}
            />
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

// Prize Details Modal
const PrizeDetailsModal = ({ visible, event, onClose }) => {
  const slideAnim = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(slideAnim, {
        toValue: height,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!event) return null;

  const totalDistributed = event.prizeDistribution?.reduce((sum, winner) => sum + (winner.amount || 0), 0) || 0;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose}/>
        <Animated.View style={[styles.detailsModal, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>🎯 Prize Distribution Details</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {/* Event Overview */}
            <View style={styles.detailsSection}>
              <Text style={styles.detailEventName}>{event.title}</Text>
              <Text style={styles.detailEventSubtitle}>
                {event.game} • {event.type} • {event.matchType === 'tournament' ? 'Tournament' : 'Match'}
              </Text>
              
              <View style={styles.detailStats}>
                <View style={styles.detailStat}>
                  <Text style={styles.detailStatLabel}>Total Prize Pool</Text>
                  <Text style={styles.detailStatValue}>৳{event.prizePool || 0}</Text>
                </View>
                <View style={styles.detailStat}>
                  <Text style={styles.detailStatLabel}>Distributed</Text>
                  <Text style={styles.detailStatValue}>৳{totalDistributed}</Text>
                </View>
                <View style={styles.detailStat}>
                  <Text style={styles.detailStatLabel}>Status</Text>
                  <View style={[
                    styles.statusBadgeSmall,
                    { backgroundColor: 
                      event.prizeStatus === 'distributed' ? '#4CAF50' :
                      event.prizeStatus === 'pending' ? '#FF9800' :
                      event.prizeStatus === 'failed' ? '#F44336' : '#2196F3'
                    }
                  ]}>
                    <Text style={styles.statusTextSmall}>{event.prizeStatus.toUpperCase()}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Distribution History */}
            {event.distributionDate && (
              <View style={styles.detailsSection}>
                <Text style={styles.sectionTitle}>Distribution Info</Text>
                <View style={styles.distributionInfo}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Distributed On:</Text>
                    <Text style={styles.infoValue}>
                      {new Date(event.distributionDate).toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Distributed By:</Text>
                    <Text style={styles.infoValue}>Admin</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Transaction ID:</Text>
                    <Text style={styles.infoValue}>TX_{event.id}_PRIZE</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Winners List */}
            {event.prizeDistribution && event.prizeDistribution.length > 0 && (
              <View style={styles.detailsSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Winners List</Text>
                  <Text style={styles.winnersCount}>
                    {event.prizeDistribution.length} winners
                  </Text>
                </View>
                
                {event.prizeDistribution.map((winner, index) => (
                  <View key={index} style={styles.detailWinnerRow}>
                    <View style={styles.winnerRankLarge}>
                      <Text style={styles.rankTextLarge}>#{winner.rank}</Text>
                    </View>
                    
                    <View style={styles.winnerInfoLarge}>
                      <Text style={styles.winnerNameLarge}>
                        {winner.playerName || `Player ${winner.rank}`}
                        {winner.teamName && ` • ${winner.teamName}`}
                      </Text>
                      <Text style={styles.winnerIdLarge}>ID: {winner.playerId}</Text>
                      {winner.kills && (
                        <Text style={styles.winnerStatsLarge}>
                          {winner.kills} Kills • {winner.damage} Damage
                        </Text>
                      )}
                    </View>
                    
                    <View style={styles.prizeAmountLarge}>
                      <Text style={styles.prizeAmountText}>৳{winner.amount}</Text>
                      <Text style={styles.prizePercentage}>
                        {((winner.amount / event.prizePool) * 100).toFixed(1)}%
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Refund Information */}
            {event.prizeStatus === 'refunded' && event.refundDate && (
              <View style={styles.detailsSection}>
                <Text style={styles.sectionTitle}>Refund Information</Text>
                <View style={styles.refundInfo}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Refunded On:</Text>
                    <Text style={styles.infoValue}>
                      {new Date(event.refundDate).toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Refund Amount:</Text>
                    <Text style={styles.infoValue}>৳{event.refundAmount || totalDistributed}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Refund Reason:</Text>
                    <Text style={styles.infoValue}>{event.refundReason || 'Tournament cancellation'}</Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

// Main Prize Management Screen
const PrizeManagementScreen = ({ navigation }) => {
  const [events, setEvents] = useState([
    {
      id: '1',
      title: 'Free Fire Championship',
      game: 'Free Fire',
      type: 'Squad',
      matchType: 'tournament',
      prizePool: 2000,
      prizeStatus: 'distributed',
      prizeDistribution: [
        { rank: 1, playerName: 'Alpha Squad', playerId: 'TEAM001', amount: 800, kills: 45, damage: 12500 },
        { rank: 2, playerName: 'Beta Warriors', playerId: 'TEAM002', amount: 600, kills: 38, damage: 11000 },
        { rank: 3, playerName: 'Gamma Elite', playerId: 'TEAM003', amount: 400, kills: 32, damage: 9800 },
        { rank: 4, playerName: 'Delta Force', playerId: 'TEAM004', amount: 200, kills: 28, damage: 8500 }
      ],
      distributionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'completed'
    },
    {
      id: '2',
      title: 'PUBG Mobile Tournament',
      game: 'PUBG Mobile', 
      type: 'Squad',
      matchType: 'tournament',
      prizePool: 5000,
      prizeStatus: 'pending',
      status: 'completed',
      currentTeams: 24,
      maxTeams: 32
    },
    {
      id: '3',
      title: 'SOLO MATCH | 2:00 PM',
      game: 'Free Fire',
      type: 'Solo',
      matchType: 'match',
      prizePool: 400,
      prizeStatus: 'processing',
      status: 'completed',
      currentPlayers: 42,
      maxPlayers: 48
    },
    {
      id: '4',
      title: 'COD Mobile MP Tournament',
      game: 'Call of Duty',
      type: 'MP',
      matchType: 'tournament',
      prizePool: 1500,
      prizeStatus: 'failed',
      status: 'completed',
      currentTeams: 8,
      maxTeams: 16
    },
    {
      id: '5',
      title: 'Ludo King Championship',
      game: 'Ludo King',
      type: 'Classic',
      matchType: 'tournament', 
      prizePool: 800,
      prizeStatus: 'refunded',
      status: 'cancelled',
      refundDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      refundAmount: 640,
      refundReason: 'Tournament cancelled due to low participation'
    }
  ]);

  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showDistributionModal, setShowDistributionModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [stats, setStats] = useState({
    totalPrizePool: 0,
    totalDistributed: 0,
    pendingDistributions: 0,
    successfulDistributions: 0
  });

  useEffect(() => {
    calculateStats();
  }, [events]);

  const calculateStats = () => {
    const totalPrizePool = events.reduce((sum, event) => sum + (event.prizePool || 0), 0);
    
    const totalDistributed = events.reduce((sum, event) => {
      if (event.prizeDistribution) {
        return sum + event.prizeDistribution.reduce((distSum, winner) => distSum + (winner.amount || 0), 0);
      }
      return sum;
    }, 0);
    
    const pendingDistributions = events.filter(event => event.prizeStatus === 'pending').length;
    const successfulDistributions = events.filter(event => event.prizeStatus === 'distributed').length;

    setStats({
      totalPrizePool,
      totalDistributed,
      pendingDistributions,
      successfulDistributions
    });
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.game.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    return matchesSearch && event.prizeStatus === activeTab;
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Simulate API call to refresh data
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setRefreshing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleDistributePrize = (event) => {
    setSelectedEvent(event);
    setShowDistributionModal(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleConfirmDistribution = (eventId, winners, method) => {
    setEvents(prev => prev.map(event => 
      event.id === eventId 
        ? { 
            ...event, 
            prizeStatus: 'distributed',
            prizeDistribution: winners,
            distributionDate: new Date().toISOString()
          }
        : event
    ));
    
    setShowDistributionModal(false);
    setSelectedEvent(null);
    
    // Sync with other screens - in real app, this would update the backend
    syncWithOtherScreens(eventId, 'distributed', winners);
  };

  const handleViewDetails = (event) => {
    setSelectedEvent(event);
    setShowDetailsModal(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleRefund = (event) => {
    Alert.alert(
      'Refund Prizes',
      `Are you sure you want to refund prizes for "${event.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm Refund', 
          style: 'destructive',
          onPress: () => processRefund(event.id)
        }
      ]
    );
  };

  const processRefund = (eventId) => {
    setEvents(prev => prev.map(event => 
      event.id === eventId 
        ? { 
            ...event, 
            prizeStatus: 'refunded',
            refundDate: new Date().toISOString(),
            refundAmount: event.prizePool
          }
        : event
    ));
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    
    // Sync with other screens
    syncWithOtherScreens(eventId, 'refunded');
  };

  const syncWithOtherScreens = (eventId, status, winners = null) => {
    // In a real app, this would update the backend which would then sync with:
    // - Tournament Management Screen
    // - Match Control Screen  
    // - User Match List Screen
    // - User Tournament Screen
    // - Admin Dashboard
    
    console.log(`Syncing prize status for event ${eventId}: ${status}`);
    if (winners) {
      console.log('Winners data:', winners);
    }
    
    // Simulate API call to sync data
    // This ensures all screens show consistent prize distribution status
  };

  const getStatusCount = (status) => {
    return events.filter(event => event.prizeStatus === status).length;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>🎯 Prize Management</Text>
          <Text style={styles.headerSubtitle}>Manage prize distributions</Text>
        </View>
        <TouchableOpacity style={styles.syncButton}>
          <Ionicons name="sync" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Statistics Cards */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.statsContainer}
      >
        <View style={styles.statCard}>
          <Text style={styles.statValue}>৳{stats.totalPrizePool}</Text>
          <Text style={styles.statLabel}>Total Prize Pool</Text>
          <Ionicons name="trophy" size={20} color="#FFD700" style={styles.statIcon} />
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statValue}>৳{stats.totalDistributed}</Text>
          <Text style={styles.statLabel}>Total Distributed</Text>
          <Ionicons name="cash" size={20} color="#4CAF50" style={styles.statIcon} />
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.pendingDistributions}</Text>
          <Text style={styles.statLabel}>Pending</Text>
          <Ionicons name="time" size={20} color="#FF9800" style={styles.statIcon} />
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.successfulDistributions}</Text>
          <Text style={styles.statLabel}>Successful</Text>
          <Ionicons name="checkmark-done" size={20} color="#4CAF50" style={styles.statIcon} />
        </View>
      </ScrollView>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search tournaments or matches..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabContainer}>
        {[
          { key: 'all', label: 'All Events', count: events.length },
          { key: 'pending', label: 'Pending', count: getStatusCount('pending') },
          { key: 'processing', label: 'Processing', count: getStatusCount('processing') },
          { key: 'distributed', label: 'Distributed', count: getStatusCount('distributed') },
          { key: 'failed', label: 'Failed', count: getStatusCount('failed') },
          { key: 'refunded', label: 'Refunded', count: getStatusCount('refunded') }
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && styles.activeTab
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[
              styles.tabText,
              activeTab === tab.key && styles.activeTabText
            ]}>
              {tab.label}
            </Text>
            <View style={[
              styles.tabCount,
              activeTab === tab.key && styles.activeTabCount
            ]}>
              <Text style={styles.tabCountText}>{tab.count}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Events List */}
      <FlatList
        data={filteredEvents}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <PrizeDistributionCard
            event={item}
            index={index}
            onDistribute={handleDistributePrize}
            onViewDetails={handleViewDetails}
            onRefund={handleRefund}
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
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.eventsList}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="trophy-outline" size={64} color="#ccc" />
            <Text style={styles.emptyStateTitle}>No events found</Text>
            <Text style={styles.emptyStateText}>
              {searchQuery ? 'Try adjusting your search' : 'No prize distributions to manage'}
            </Text>
          </View>
        }
      />

      {/* Distribution Modal */}
      <PrizeDistributionModal
        visible={showDistributionModal}
        event={selectedEvent}
        onClose={() => {
          setShowDistributionModal(false);
          setSelectedEvent(null);
        }}
        onDistribute={handleConfirmDistribution}
      />

      {/* Details Modal */}
      <PrizeDetailsModal
        visible={showDetailsModal}
        event={selectedEvent}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedEvent(null);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#1a237e',
  },
  backButton: {
    padding: 8,
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  syncButton: {
    padding: 8,
  },
  statsContainer: {
    paddingHorizontal: 15,
    marginTop: 10,
  },
  statCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginRight: 12,
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  statIcon: {
    position: 'absolute',
    top: 15,
    right: 15,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 15,
    paddingHorizontal: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  tabContainer: {
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  activeTab: {
    backgroundColor: '#1a237e',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginRight: 6,
  },
  activeTabText: {
    color: 'white',
  },
  tabCount: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  activeTabCount: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  tabCountText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
  },
  eventsList: {
    padding: 15,
    paddingBottom: 30,
  },
  prizeCard: {
    marginBottom: 15,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  cardGradient: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  eventInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  eventTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  eventTitleContainer: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },
  eventSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 4,
  },
  prizeInfo: {
    marginBottom: 15,
  },
  prizeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  prizeItem: {
    alignItems: 'center',
    flex: 1,
  },
  prizeLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
    marginBottom: 2,
  },
  prizeValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  winnersPreview: {
    marginBottom: 15,
  },
  winnersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  winnersList: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 8,
  },
  winnerPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  winnerRank: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFD700',
    width: 24,
  },
  winnerName: {
    fontSize: 12,
    color: 'white',
    flex: 1,
    marginLeft: 8,
  },
  winnerPrize: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  moreWinnersText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    minWidth: 100,
  },
  distributionDate: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  distributionDateText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
  },
  prizeModal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  detailsModal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  modalBody: {
    padding: 20,
  },
  // Button Styles
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  primaryButton: {
    backgroundColor: '#2962ff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  successButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  warningButton: {
    backgroundColor: '#FF9800',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: '#F44336',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#666',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonLarge: {
    paddingVertical: 16,
  },
  buttonSmall: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  buttonTextLarge: {
    fontSize: 16,
  },
  buttonTextSmall: {
    fontSize: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  // Additional styles for modal content
  eventSummary: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  eventName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 4,
  },
  eventDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  prizeSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  prizeSummaryItem: {
    alignItems: 'center',
  },
  prizeSummaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  prizeSummaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  negativeAmount: {
    color: '#F44336',
  },
  methodSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  methodButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  methodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#2962ff',
    backgroundColor: 'white',
  },
  methodButtonActive: {
    backgroundColor: '#2962ff',
  },
  methodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2962ff',
    marginLeft: 8,
  },
  methodButtonTextActive: {
    color: 'white',
  },
  winnersSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  winnersCount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  winnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  winnerPosition: {
    alignItems: 'center',
    marginRight: 12,
  },
  positionText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
  },
  winnerInfo: {
    flex: 1,
  },
  winnerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  winnerStats: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  winnerId: {
    fontSize: 11,
    color: '#999',
  },
  prizeInputContainer: {
    alignItems: 'center',
  },
  prizeLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  prizeInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    width: 80,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  distributionSummary: {
    backgroundColor: '#f0f7ff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a237e',
  },
  distributeButton: {
    marginBottom: 10,
  },
  // Details Modal Styles
  detailsSection: {
    marginBottom: 20,
  },
  detailEventName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 4,
  },
  detailEventSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  detailStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailStat: {
    alignItems: 'center',
    flex: 1,
  },
  detailStatLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  detailStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  statusBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusTextSmall: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  distributionInfo: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  detailWinnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  winnerRankLarge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a237e',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankTextLarge: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  winnerInfoLarge: {
    flex: 1,
  },
  winnerNameLarge: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  winnerIdLarge: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  winnerStatsLarge: {
    fontSize: 12,
    color: '#999',
  },
  prizeAmountLarge: {
    alignItems: 'flex-end',
  },
  prizeAmountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 2,
  },
  prizePercentage: {
    fontSize: 12,
    color: '#666',
  },
  refundInfo: {
    backgroundColor: '#fff3e0',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
});

export default PrizeManagementScreen;
