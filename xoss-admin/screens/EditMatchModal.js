// screens/EditMatchModal.js - COMPLETE VERSION
import React, { useState, useEffect } from 'react';
import { 
  View, Text, Modal, TouchableOpacity, TextInput, 
  ScrollView, Alert, StyleSheet, Dimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const EditMatchModal = ({ visible, match, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    title: '',
    entryFee: '',
    prizePool: '',
    maxPlayers: '',
    perKill: '',
    roomId: '',
    password: '',
    description: '',
    rules: '',
    type: '',
    map: '',
    status: '',
    approval_status: ''
  });

  useEffect(() => {
    if (match) {
      setFormData({
        title: match.title || '',
        entryFee: match.entryFee?.toString() || match.entry_fee?.toString() || '',
        prizePool: match.prizePool?.toString() || match.total_prize?.toString() || '',
        maxPlayers: match.maxPlayers?.toString() || match.max_participants?.toString() || '',
        perKill: match.perKill?.toString() || match.per_kill?.toString() || '',
        roomId: match.roomId || match.room_id || '',
        password: match.password || match.room_password || '',
        description: match.description || '',
        rules: match.rules || '',
        type: match.type || '',
        map: match.map || '',
        status: match.status || '',
        approval_status: match.approval_status || ''
      });
    }
  }, [match]);

  const handleUpdate = () => {
    if (!formData.title || !formData.entryFee || !formData.prizePool || !formData.maxPlayers) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    const updateData = {
      title: formData.title,
      entryFee: Number(formData.entryFee),
      prizePool: Number(formData.prizePool),
      maxPlayers: Number(formData.maxPlayers),
      perKill: Number(formData.perKill) || 0,
      roomId: formData.roomId,
      password: formData.password,
      description: formData.description,
      rules: formData.rules,
      type: formData.type,
      map: formData.map,
      status: formData.status,
      approval_status: formData.approval_status
    };

    onUpdate(match._id || match.id, updateData);
  };

  const generateRoomId = () => {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    setFormData(prev => ({ ...prev, roomId }));
  };

  const generatePassword = () => {
    const password = Math.random().toString(36).substring(2, 6).toUpperCase();
    setFormData(prev => ({ ...prev, password }));
  };

  if (!match) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <LinearGradient colors={['#1a237e', '#283593']} style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Match</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView style={styles.modalBody}>
            <Text style={styles.sectionTitle}>🎮 Match Information</Text>

            <Text style={styles.label}>Match Title *</Text>
            <TextInput
              style={styles.input}
              value={formData.title}
              onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
              placeholder="Enter match title"
            />

            <View style={styles.row}>
              <View style={styles.column}>
                <Text style={styles.label}>Entry Fee (৳) *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.entryFee}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, entryFee: text.replace(/[^0-9]/g, '') }))}
                  keyboardType="numeric"
                  placeholder="50"
                />
              </View>
              <View style={styles.column}>
                <Text style={styles.label}>Prize Pool (৳) *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.prizePool}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, prizePool: text.replace(/[^0-9]/g, '') }))}
                  keyboardType="numeric"
                  placeholder="500"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.column}>
                <Text style={styles.label}>Max Players *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.maxPlayers}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, maxPlayers: text.replace(/[^0-9]/g, '') }))}
                  keyboardType="numeric"
                  placeholder="100"
                />
              </View>
              <View style={styles.column}>
                <Text style={styles.label}>Per Kill Prize (৳)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.perKill}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, perKill: text.replace(/[^0-9]/g, '') }))}
                  keyboardType="numeric"
                  placeholder="10"
                />
              </View>
            </View>

            <Text style={styles.label}>Room ID *</Text>
            <View style={styles.inputWithButton}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={formData.roomId}
                onChangeText={(text) => setFormData(prev => ({ ...prev, roomId: text }))}
                placeholder="Enter room ID"
              />
              <TouchableOpacity style={styles.generateButton} onPress={generateRoomId}>
                <Text style={styles.generateButtonText}>Generate</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Password *</Text>
            <View style={styles.inputWithButton}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={formData.password}
                onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
                placeholder="Enter password"
              />
              <TouchableOpacity style={styles.generateButton} onPress={generatePassword}>
                <Text style={styles.generateButtonText}>Generate</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              placeholder="Enter match description"
              multiline
              numberOfLines={3}
            />

            <Text style={styles.label}>Rules</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.rules}
              onChangeText={(text) => setFormData(prev => ({ ...prev, rules: text }))}
              placeholder="Enter match rules"
              multiline
              numberOfLines={3}
            />

            <View style={styles.row}>
              <View style={styles.column}>
                <Text style={styles.label}>Game Type</Text>
                <TextInput
                  style={styles.input}
                  value={formData.type}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, type: text }))}
                  placeholder="Solo, Duo, Squad"
                />
              </View>
              <View style={styles.column}>
                <Text style={styles.label}>Map</Text>
                <TextInput
                  style={styles.input}
                  value={formData.map}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, map: text }))}
                  placeholder="Bermuda, Erangel, etc"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.column}>
                <Text style={styles.label}>Status</Text>
                <View style={styles.statusContainer}>
                  {['pending', 'upcoming', 'live', 'completed', 'cancelled'].map(status => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.statusOption,
                        formData.status === status && styles.statusOptionSelected
                      ]}
                      onPress={() => setFormData(prev => ({ ...prev, status }))}
                    >
                      <Text style={[
                        styles.statusOptionText,
                        formData.status === status && styles.statusOptionTextSelected
                      ]}>
                        {status.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={styles.column}>
                <Text style={styles.label}>Approval Status</Text>
                <View style={styles.statusContainer}>
                  {['pending', 'approved', 'rejected'].map(status => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.statusOption,
                        formData.approval_status === status && styles.statusOptionSelected
                      ]}
                      onPress={() => setFormData(prev => ({ ...prev, approval_status: status }))}
                    >
                      <Text style={[
                        styles.statusOptionText,
                        formData.approval_status === status && styles.statusOptionTextSelected
                      ]}>
                        {status.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.updateButton} onPress={handleUpdate}>
                <Text style={styles.updateButtonText}>UPDATE MATCH</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  modalBody: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    color: '#333',
    fontSize: 14,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    marginHorizontal: -8,
    marginBottom: 16,
  },
  column: {
    flex: 1,
    paddingHorizontal: 8,
  },
  inputWithButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  generateButton: {
    backgroundColor: '#2962ff',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  generateButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  statusOptionSelected: {
    backgroundColor: '#2962ff',
    borderColor: '#2962ff',
  },
  statusOptionText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#666',
  },
  statusOptionTextSelected: {
    color: 'white',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#9E9E9E',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  updateButton: {
    flex: 1,
    backgroundColor: '#2962ff',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  updateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EditMatchModal;
