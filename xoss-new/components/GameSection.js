import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
	
const games = [
  { id: 'pubg', name: 'PUBG', icon: 'flame' },
  { id: 'freefire', name: 'Free Fire', icon: 'flash' },
  { id: 'cod', name: 'Call of Duty', icon: 'navigate' },
  { id: 'ludo', name: 'Ludo King', icon: 'dice' },
];

const GameSelection = ({ currentGame, onGameSelect }) => {
  return (
    <View style={styles.gameSelection}>
      {games.map((game) => (
        <TouchableOpacity
          key={game.id}
          style={[
            styles.gameCard,
            currentGame === game.id && styles.gameCardActive,
          ]}
          onPress={() => onGameSelect(game.id)}
        >
          <Ionicons
            name={game.icon}
            size={40}
            color={currentGame === game.id ? '#ff8a00' : '#ccc'}
          />
          <Text
            style={[
              styles.gameTitle,
              currentGame === game.id && styles.gameTitleActive,
            ]}
          >
            {game.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  gameSelection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  gameCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 10,
  },
  gameCardActive: {
    borderColor: '#ff8a00',
    backgroundColor: 'rgba(255, 138, 0, 0.2)',
  },
  gameTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ccc',
    marginTop: 10,
  },
  gameTitleActive: {
    color: '#ff8a00',
  },
});

export default GameSelection;
