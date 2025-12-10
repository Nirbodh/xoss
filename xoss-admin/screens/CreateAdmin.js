// screens/CreateAdmin.js - ADMIN REGISTRATION SCREEN
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_BASE_URL = 'https://xoss.onrender.com/api';

const CreateAdmin = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [debugMode, setDebugMode] = useState(true);
  const [apiResponse, setApiResponse] = useState(null);
  
  const [formData, setFormData] = useState({
    name: 'System Admin',
    email: 'admin@xoss.com',
    password: '123456',
    confirmPassword: '123456',
    phone: '017XXXXXXXX',
    role: 'admin'
  });

  const [errors, setErrors] = useState({});

  // ✅ VALIDATION FUNCTION
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ ADMIN REGISTRATION FUNCTION
  const handleAdminRegister = async () => {
    try {
      if (!validateForm()) {
        Alert.alert('Validation Error', 'Please fix the errors in the form');
        return;
      }

      setLoading(true);
      setApiResponse(null);

      console.log('📝 Registering new admin...', formData.email);

      // Prepare data for API
      const registerData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        role: 'admin' // Set role as admin
      };

      console.log('📤 Sending registration request:', registerData);

      // Make API call
      const response = await axios.post(`${API_BASE_URL}/auth/register`, registerData, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      console.log('✅ Registration response:', response.data);

      if (response.data && response.data.success) {
        const { user, token } = response.data;
        
        // ✅ Save token and user data
        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('user', JSON.stringify(user));
        
        setApiResponse({
          success: true,
          message: 'Admin registered successfully!',
          token: token.substring(0, 20) + '...', // Show partial token
          user: user
        });

        Alert.alert(
          '🎉 Admin Registered!',
          `Admin account created successfully!\n\nEmail: ${user.email}\nToken saved to storage.`,
          [
            {
              text: 'Go to Admin Panel',
              onPress: () => navigation.replace('AdminDashboard')
            },
            {
              text: 'Test Login',
              onPress: () => navigation.navigate('AdminLogin')
            }
          ]
        );

      } else {
        setApiResponse({
          success: false,
          message: response.data?.message || 'Registration failed'
        });
        Alert.alert('❌ Registration Failed', response.data?.message || 'Unknown error');
      }

    } catch (error) {
      console.error('🔥 Registration error:', error.response?.data || error.message);
      
      let errorMessage = 'Registration failed';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setApiResponse({
        success: false,
        error: errorMessage
      });

      Alert.alert('🚨 Registration Error', errorMessage);

    } finally {
      setLoading(false);
    }
  };

  // ✅ TEST LOGIN AFTER REGISTRATION
  const testAdminLogin = async () => {
    try {
      setLoading(true);
      
      const loginData = {
        email: formData.email,
        password: formData.password
      };

      console.log('🔐 Testing login with:', loginData.email);

      const response = await axios.post(`${API_BASE_URL}/auth/login`, loginData, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      if (response.data && response.data.success) {
        const { token } = response.data;
        
        // Save the token
        await AsyncStorage.setItem('token', token);
        
        Alert.alert(
          '✅ Login Test Successful!',
          `Token received and saved!\n\nToken: ${token.substring(0, 30)}...`,
          [
            {
              text: 'Use This Token',
              onPress: () => {
                // Navigate with token
                navigation.replace('AdminDashboard');
              }
            }
          ]
        );

        setApiResponse(prev => ({
          ...prev,
          loginTest: 'SUCCESS',
          token: token
        }));

      } else {
        Alert.alert('❌ Login Test Failed', response.data?.message || 'Login failed');
      }

    } catch (error) {
      console.error('🔥 Login test error:', error.response?.data || error.message);
      Alert.alert('🚨 Login Test Error', error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ CHECK EXISTING TOKEN
  const checkExistingToken = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const user = await AsyncStorage.getItem('user');
      
      Alert.alert(
        '🔍 Current Token Status',
        `Token: ${token ? '✅ Found' : '❌ Not found'}\nLength: ${token?.length || 0} chars\n\nUser: ${user ? '✅ Found' : '❌ Not found'}`,
        [
          {
            text: 'Clear Token',
            onPress: async () => {
              await AsyncStorage.removeItem('token');
              await AsyncStorage.removeItem('user');
              Alert.alert('🗑️ Token Cleared', 'Token removed from storage');
            }
          },
          { text: 'OK' }
        ]
      );

    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const generateCurlCommand = () => {
    return `curl -X POST https://xoss.onrender.com/api/auth/register \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify({
    name: formData.name,
    email: formData.email,
    password: formData.password,
    phone: formData.phone,
    role: 'admin'
  }, null, 2)}'`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Registration</Text>
        <View style={styles.debugToggle}>
          <Text style={styles.debugText}>Debug</Text>
          <Switch
            value={debugMode}
            onValueChange={setDebugMode}
            trackColor={{ false: '#767577', true: '#4CAF50' }}
          />
        </View>
      </View>

      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView>
          {/* Debug Info */}
          {debugMode && (
            <View style={styles.debugSection}>
              <Text style={styles.sectionTitle}>🔧 Admin Registration Panel</Text>
              
              {/* Token Check Button */}
              <TouchableOpacity 
                style={styles.tokenCheckButton}
                onPress={checkExistingToken}
              >
                <Text style={styles.tokenCheckText}>🔍 Check Existing Token</Text>
              </TouchableOpacity>

              {/* API Response */}
              {apiResponse && (
                <View style={styles.responseSection}>
                  <Text style={styles.responseTitle}>
                    {apiResponse.success ? '✅ API Response' : '❌ API Error'}
                  </Text>
                  <Text style={styles.responseText}>
                    {JSON.stringify(apiResponse, null, 2)}
                  </Text>
                </View>
              )}

              {/* Curl Command */}
              <View style={styles.curlSection}>
                <Text style={styles.curlTitle}>📡 CURL Command:</Text>
                <TextInput
                  style={styles.curlInput}
                  value={generateCurlCommand()}
                  multiline
                  editable={false}
                  numberOfLines={8}
                />
              </View>
            </View>
          )}

          {/* Registration Form */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>👑 Create Admin Account</Text>
            
            {/* Name Field */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                value={formData.name}
                onChangeText={(text) => updateField('name', text)}
                placeholder="Enter full name"
                placeholderTextColor="rgba(255,255,255,0.5)"
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            {/* Email Field */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                value={formData.email}
                onChangeText={(text) => updateField('email', text)}
                placeholder="admin@xoss.com"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="rgba(255,255,255,0.5)"
              />
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            {/* Password Field */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Password * (min 6 characters)</Text>
              <TextInput
                style={[styles.input, errors.password && styles.inputError]}
                value={formData.password}
                onChangeText={(text) => updateField('password', text)}
                placeholder="Enter password"
                secureTextEntry
                placeholderTextColor="rgba(255,255,255,0.5)"
              />
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            {/* Confirm Password */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Confirm Password *</Text>
              <TextInput
                style={[styles.input, errors.confirmPassword && styles.inputError]}
                value={formData.confirmPassword}
                onChangeText={(text) => updateField('confirmPassword', text)}
                placeholder="Confirm password"
                secureTextEntry
                placeholderTextColor="rgba(255,255,255,0.5)"
              />
              {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
            </View>

            {/* Phone Field */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Phone Number *</Text>
              <TextInput
                style={[styles.input, errors.phone && styles.inputError]}
                value={formData.phone}
                onChangeText={(text) => updateField('phone', text)}
                placeholder="017XXXXXXXX"
                keyboardType="phone-pad"
                placeholderTextColor="rgba(255,255,255,0.5)"
              />
              {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.registerButton, loading && styles.buttonDisabled]}
                onPress={handleAdminRegister}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.registerButtonText}>📝 Register Admin</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.testButton}
                onPress={testAdminLogin}
                disabled={loading}
              >
                <Text style={styles.testButtonText}>🔐 Test Login</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.loginButton}
                onPress={() => navigation.navigate('AdminLogin')}
              >
                <Text style={styles.loginButtonText}>➡️ Go to Login</Text>
              </TouchableOpacity>
            </View>

            {/* Instructions */}
            <View style={styles.instructions}>
              <Text style={styles.instructionsTitle}>📋 Instructions:</Text>
              <Text style={styles.instruction}>1. Fill the form and click "Register Admin"</Text>
              <Text style={styles.instruction}>2. After registration, token will be saved automatically</Text>
              <Text style={styles.instruction}>3. Click "Test Login" to verify the credentials</Text>
              <Text style={styles.instruction}>4. Use "Go to Login" to login with the new account</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0c23',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#1a237e',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  debugToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  debugText: {
    color: 'white',
    marginRight: 8,
    fontSize: 12,
  },
  content: {
    flex: 1,
  },
  debugSection: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  sectionTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  tokenCheckButton: {
    backgroundColor: '#2962ff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  tokenCheckText: {
    color: 'white',
    fontWeight: 'bold',
  },
  responseSection: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  responseTitle: {
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  responseText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  curlSection: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 12,
    borderRadius: 8,
  },
  curlTitle: {
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 8,
    fontSize: 14,
  },
  curlInput: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    color: '#4CAF50',
    padding: 8,
    borderRadius: 4,
    fontSize: 10,
    fontFamily: 'monospace',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  formSection: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    color: 'white',
    marginBottom: 8,
    fontWeight: '500',
    fontSize: 14,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.3)',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    color: 'white',
    fontSize: 16,
  },
  inputError: {
    borderColor: '#ff4444',
  },
  errorText: {
    color: '#ff4444',
    marginTop: 5,
    fontSize: 12,
  },
  actionButtons: {
    marginTop: 20,
  },
  registerButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    backgroundColor: '#666',
  },
  registerButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  testButton: {
    backgroundColor: '#2962ff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  testButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loginButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderColor: '#FF9800',
    borderWidth: 1,
  },
  loginButtonText: {
    color: '#FF9800',
    fontWeight: 'bold',
    fontSize: 16,
  },
  instructions: {
    marginTop: 20,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
  },
  instructionsTitle: {
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 8,
    fontSize: 16,
  },
  instruction: {
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 6,
    fontSize: 14,
  },
});

export default CreateAdmin;
