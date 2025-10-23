import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const GameSelection = ({ currentGame, onGameSelect }) => {
  const games = [
    { id: 'all', name: 'All Games', icon: 'apps' },
    { id: 'freefire', name: 'Free Fire', icon: 'game-controller' },
    { id: 'pubg', name: 'PUBG', icon: 'game-controller' },
    { id: 'cod', name: 'COD', icon: 'game-controller' },
    { id: 'ludo', name: 'Ludo', icon: 'dice' },
    { id: 'bgmi', name: 'BGMI', icon: 'game-controller' },
  ];

  return (
    <View style={styles.gameSelection}>
      {games.map(game => (
        <TouchableOpacity
          key={game.id}
          style={[
            styles.gameButton,
            currentGame === game.id && styles.gameButtonActive,
          ]}
          onPress={() => onGameSelect(game.id)}
        >
          <Ionicons
            name={game.icon}
            size={20}
            color={currentGame === game.id ? '#ff8a00' : '#ccc'}
          />
          <Text
            style={[
              styles.gameButtonText,
              currentGame === game.id && styles.gameButtonTextActive,
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
  gameButton: {
    width: '30%',
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  gameButtonActive: {
    backgroundColor: '#ff8a00',
  },
  gameButtonText: {
    color: '#ccc',
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 5,
  },
  gameButtonTextActive: {
    color: '#fff',
  },
});

export default GameSelection;