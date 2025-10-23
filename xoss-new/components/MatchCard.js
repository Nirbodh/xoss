import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const MatchCard = ({ match, onJoin, onDetails }) => {
  return (
    <View style={styles.matchCard}>
      <View style={styles.matchHeader}>
        <Text style={styles.matchTitle}>{match.title}</Text>
        <Text style={styles.matchTime}>{match.date} {match.time}</Text>
      </View>
      
      <View style={styles.matchDetails}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Total Prize</Text>
          <Text style={styles.detailValue}>৳ {match.totalPrize}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Per Kill</Text>
          <Text style={styles.detailValue}>৳ {match.perKill}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Entry Fee</Text>
          <Text style={styles.detailValue}>৳ {match.entryFee}</Text>
        </View>
      </View>
      
      <View style={styles.matchDetails}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Type</Text>
          <Text style={styles.detailValue}>{match.type}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Version</Text>
          <Text style={styles.detailValue}>{match.version}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Map</Text>
          <Text style={styles.detailValue}>{match.map}</Text>
        </View>
      </View>
      
      <View style={styles.matchFooter}>
        <Text style={styles.participants}>
          {match.participants} / {match.maxParticipants}
        </Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={[styles.btn, styles.btnSmall]}>
            <Text style={styles.btnText}>Room Code</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.btn, styles.btnSmall, styles.btnSecondary]}
            onPress={onDetails}
          >
            <Text style={[styles.btnText, styles.btnSecondaryText]}>Details</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.btn, styles.btnSmall]}
            onPress={onJoin}
          >
            <Text style={styles.btnText}>Join</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  matchCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 5,
    borderLeftColor: '#ff8a00',
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  matchTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff8a00',
  },
  matchTime: {
    fontSize: 14,
    color: '#ccc',
  },
  matchDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  detailItem: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: '#ccc',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ff8a00',
  },
  matchFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  participants: {
    fontSize: 14,
    color: '#ccc',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  btn: {
    backgroundColor: '#ff8a00',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 10,
  },
  btnSmall: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  btnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#ff8a00',
  },
  btnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  btnSecondaryText: {
    color: '#ff8a00',
  },
});

export default MatchCard;
