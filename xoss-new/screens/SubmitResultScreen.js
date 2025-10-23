import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRoute } from '@react-navigation/native';

const SubmitResultScreen = () => {
  const [image, setImage] = useState(null);
  const [kills, setKills] = useState('');
  const [rank, setRank] = useState('');
  const route = useRoute();
  const { matchId } = route.params;

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const submitProof = async () => {
    if (!image) {
      Alert.alert('Error', 'Please select an image first');
      return;
    }

    const formData = new FormData();
    formData.append('proofImage', {
      uri: image,
      type: 'image/jpeg',
      name: 'proof.jpg',
    });
    
    if (kills) formData.append('kills', kills);
    if (rank) formData.append('rank', rank);

    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`http://your-backend-url/api/matches/${matchId}/proof`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok) {
        Alert.alert('Success', 'Proof submitted successfully!');
      } else {
        Alert.alert('Error', data.error || 'Submission failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Submit Match Proof</Text>
      
      <TouchableOpacity style={styles.button} onPress={pickImage}>
        <Text style={styles.buttonText}>Select Proof Image</Text>
      </TouchableOpacity>

      {image && <Text style={styles.imageText}>Image selected</Text>}

      <Text style={styles.label}>Kills (Optional)</Text>
      <TextInput
        style={styles.input}
        value={kills}
        onChangeText={setKills}
        keyboardType="numeric"
        placeholder="Enter number of kills"
      />

      <Text style={styles.label}>Rank (Optional)</Text>
      <TextInput
        style={styles.input}
        value={rank}
        onChangeText={setRank}
        keyboardType="numeric"
        placeholder="Enter your rank"
      />

      <TouchableOpacity style={styles.submitButton} onPress={submitProof}>
        <Text style={styles.submitButtonText}>Submit Proof</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#0a0c23',
  },
  title: {
    fontSize: 24,
    color: '#ff8a00',
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#ff8a00',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  imageText: {
    color: 'green',
    textAlign: 'center',
    marginBottom: 20,
  },
  label: {
    color: '#ccc',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: '#ff8a00',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    color: 'white',
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: '#ff8a00',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default SubmitResultScreen;