import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
	
const ParticipantsTable = () => {
  const participants = [
    ['Player 1', 'Player 2', 'Player 3'],
    ['Player 4', 'Player 5', 'Player 6'],
    ['Player 7', 'Player 8', 'Player 9'],
  ];

  return (
    <View style={styles.table}>
      <View style={styles.tableHeader}>
        <Text style={styles.headerText}>Name</Text>
        <Text style={styles.headerText}>Name</Text>
        <Text style={styles.headerText}>Name</Text>
      </View>
      {participants.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.tableRow}>
          {row.map((participant, colIndex) => (
            <Text key={colIndex} style={styles.cellText}>
              {participant}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  table: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 70,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 138, 0, 0.3)',
    padding: 10,
  },
  headerText: {
    flex: 1,
    textAlign: 'center',
    color: '#ff8a00',
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  cellText: {
    flex: 1,
    textAlign: 'center',
    color: '#fff',
  },
});

export default ParticipantsTable;
