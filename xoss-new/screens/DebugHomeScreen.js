// screens/DebugHomeScreen.js - DEBUG VERSION
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';

const DebugHomeScreen = ({ navigation }) => {
  const { user, token } = useAuth();
  
  console.log('DEBUG - User:', user);
  console.log('DEBUG - Token:', token);

  return (
    <View style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>DEBUG MODE</Text>
        
        <View style={styles.debugSection}>
          <Text style={styles.debugText}>User Data: {JSON.stringify(user)}</Text>
          <Text style={styles.debugText}>Token: {token ? 'Exists' : 'Missing'}</Text>
        </View>

        <Text style={styles.sectionTitle}>Navigation Tests:</Text>
        
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Tournament')}>
          <Text style={styles.buttonText}>Test Tournament Tab</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('MyGame')}>
          <Text style={styles.buttonText}>Test MyGame Tab</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Wallet')}>
          <Text style={styles.buttonText}>Test Wallet Tab</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('TopUp')}>
          <Text style={styles.buttonText}>Test TopUp Tab</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.buttonText}>Test Profile Tab</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Notifications')}>
          <Text style={styles.buttonText}>Test Notifications</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Leaderboard')}>
          <Text style={styles.buttonText}>Test Leaderboard</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0c23',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    color: '#ff8a00',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  debugSection: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  debugText: {
    color: '#fff',
    fontSize: 12,
    marginBottom: 5,
  },
  sectionTitle: {
    color: '#2962ff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#2962ff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default DebugHomeScreen;
