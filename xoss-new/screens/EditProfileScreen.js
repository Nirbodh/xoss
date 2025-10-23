// screens/EditProfileScreen.js - COMPLETELY UPDATED WITH IMAGE PICKER
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  Modal,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

const EditProfileScreen = ({ navigation }) => {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.bio || 'প্রফেশনাল গেমার • স্ট্রিমার • কন্টেন্ট ক্রিয়েটর',
    location: user?.location || 'ঢাকা, বাংলাদেশ'
  });
  const [profileImage, setProfileImage] = useState('https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face');
  const [loading, setLoading] = useState(false);
  const [imagePickerModal, setImagePickerModal] = useState(false);

  // Load profile image on component mount
  useEffect(() => {
    loadProfileImage();
  }, []);

  const loadProfileImage = async () => {
    try {
      const savedImage = await AsyncStorage.getItem('profileImage');
      if (savedImage) {
        setProfileImage(savedImage);
      }
    } catch (error) {
      console.log('Error loading profile image:', error);
    }
  };

  // Profile Image Picker Functions
  const pickImageFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('অনুমতি প্রয়োজন', 'প্রোফাইল ছবি পরিবর্তন করতে ক্যামেরা রোল এক্সেস প্রয়োজন।');
        return;
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        const selectedImage = result.assets[0].uri;
        setProfileImage(selectedImage);
        await AsyncStorage.setItem('profileImage', selectedImage);
        setImagePickerModal(false);
        Alert.alert('সফল', 'প্রোফাইল ছবি সফলভাবে আপডেট হয়েছে!');
      }
    } catch (error) {
      console.log('Image picker error:', error);
      Alert.alert('ত্রুটি', 'প্রোফাইল ছবি আপডেট করতে ব্যর্থ হয়েছে।');
    }
  };

  const takePhotoWithCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('অনুমতি প্রয়োজন', 'ক্যামেরা ব্যবহারের অনুমতি প্রয়োজন।');
        return;
      }

      let result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        const capturedImage = result.assets[0].uri;
        setProfileImage(capturedImage);
        await AsyncStorage.setItem('profileImage', capturedImage);
        setImagePickerModal(false);
        Alert.alert('সফল', 'প্রোফাইল ছবি সফলভাবে আপডেট হয়েছে!');
      }
    } catch (error) {
      console.log('Camera error:', error);
      Alert.alert('ত্রুটি', 'ক্যামেরা ব্যবহার করতে ব্যর্থ হয়েছে।');
    }
  };

  const showImagePickerOptions = () => {
    setImagePickerModal(true);
  };

  const handleSave = async () => {
    if (!formData.username.trim()) {
      Alert.alert('ত্রুটি', 'দয়া করে আপনার ইউজারনেম লিখুন');
      return;
    }

    if (!formData.email.trim()) {
      Alert.alert('ত্রুটি', 'দয়া করে আপনার ইমেইল ঠিকানা লিখুন');
      return;
    }

    setLoading(true);
    try {
      await updateUser(formData);
      Alert.alert('সফল', 'প্রোফাইল সফলভাবে আপডেট হয়েছে!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('ত্রুটি', 'প্রোফাইল আপডেট করতে ব্যর্থ হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0F24" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>প্রোফাইল এডিট করুন</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          <Text style={[styles.saveButton, loading && styles.saveButtonDisabled]}>
            {loading ? 'সেভ হচ্ছে...' : 'সেভ করুন'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Profile Image Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={showImagePickerOptions}>
            <Image 
              source={{ uri: profileImage }}
              style={styles.avatar}
            />
            <View style={styles.cameraIcon}>
              <Ionicons name="camera" size={20} color="white" />
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>ছবি পরিবর্তন করতে ট্যাপ করুন</Text>
        </View>

        {/* Form Section */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>ইউজারনেম *</Text>
            <TextInput
              style={styles.input}
              value={formData.username}
              onChangeText={(text) => setFormData({...formData, username: text})}
              placeholder="আপনার ইউজারনেম লিখুন"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>ইমেইল ঠিকানা *</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(text) => setFormData({...formData, email: text})}
              placeholder="আপনার ইমেইল ঠিকানা লিখুন"
              placeholderTextColor="#666"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>ফোন নম্বর</Text>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(text) => setFormData({...formData, phone: text})}
              placeholder="আপনার ফোন নম্বর লিখুন"
              placeholderTextColor="#666"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>লোকেশন</Text>
            <TextInput
              style={styles.input}
              value={formData.location}
              onChangeText={(text) => setFormData({...formData, location: text})}
              placeholder="আপনার লোকেশন লিখুন"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>বায়ো</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={formData.bio}
              onChangeText={(text) => setFormData({...formData, bio: text})}
              placeholder="নিজের সম্পর্কে কিছু লিখুন..."
              placeholderTextColor="#666"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{formData.bio.length}/120</Text>
          </View>

          {/* Additional Info Section */}
          <View style={styles.additionalInfo}>
            <Text style={styles.sectionTitle}>অতিরিক্ত তথ্য</Text>
            
            <View style={styles.infoItem}>
              <Ionicons name="calendar" size={18} color="#00D4FF" />
              <Text style={styles.infoLabel}>অ্যাকাউন্ট তৈরি:</Text>
              <Text style={styles.infoValue}>১৫ জানুয়ারি ২০২৪</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Ionicons name="shield-checkmark" size={18} color="#00FF88" />
              <Text style={styles.infoLabel}>অ্যাকাউন্ট স্ট্যাটাস:</Text>
              <Text style={styles.infoValue}>ভেরিফাইড</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Ionicons name="trophy" size={18} color="#FFD700" />
              <Text style={styles.infoLabel}>র‍্যাংক:</Text>
              <Text style={styles.infoValue}>গোল্ড টিয়ার</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.saveButtonFull, loading && styles.saveButtonFullDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            <Ionicons name="checkmark-circle" size={20} color="white" />
            <Text style={styles.saveButtonFullText}>
              {loading ? 'আপডেট হচ্ছে...' : 'প্রোফাইল আপডেট করুন'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>বাতিল করুন</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Image Picker Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={imagePickerModal}
        onRequestClose={() => setImagePickerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>প্রোফাইল ছবি নির্বাচন করুন</Text>
            
            <TouchableOpacity 
              style={styles.modalOption}
              onPress={takePhotoWithCamera}
            >
              <Ionicons name="camera" size={24} color="#00D4FF" />
              <Text style={styles.modalOptionText}>ক্যামেরা দিয়ে ছবি তুলুন</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.modalOption}
              onPress={pickImageFromGallery}
            >
              <Ionicons name="images" size={24} color="#00D4FF" />
              <Text style={styles.modalOptionText}>গ্যালারী থেকে নির্বাচন করুন</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.modalCancel}
              onPress={() => setImagePickerModal(false)}
            >
              <Text style={styles.modalCancelText}>বাতিল করুন</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F24',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#1A1F3C',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  saveButton: {
    color: '#00D4FF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButtonDisabled: {
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#00D4FF',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#00D4FF',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0A0F24',
  },
  avatarHint: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginTop: 10,
  },
  form: {
    gap: 20,
    marginBottom: 30,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 15,
    color: 'white',
    fontSize: 16,
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 5,
  },
  additionalInfo: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 20,
    marginTop: 10,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginLeft: 10,
    marginRight: 8,
    flex: 1,
  },
  infoValue: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtons: {
    gap: 12,
    marginBottom: 30,
  },
  saveButtonFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00D4FF',
    padding: 18,
    borderRadius: 12,
    gap: 10,
  },
  saveButtonFullDisabled: {
    backgroundColor: '#666',
  },
  saveButtonFullText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  cancelButtonText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1A1F3C',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 300,
  },
  modalTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: 10,
    gap: 15,
  },
  modalOptionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalCancel: {
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginTop: 10,
  },
  modalCancelText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EditProfileScreen;
