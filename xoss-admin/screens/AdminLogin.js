// screens/AdminLogin.js - COMPLETE ADMIN LOGIN SCREEN
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_BASE_URL = 'https://xoss.onrender.com/api';

const AdminLogin = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [debugMode, setDebugMode] = useState(true);
  const [apiResponse, setApiResponse] = useState(null);
  const [existingToken, setExistingToken] = useState(null);
  
  const [formData, setFormData] = useState({
    email: 'admin@xoss.com',
    password: '123456'
  });

  const [errors, setErrors] = useState({});

  // ✅ Load existing token on mount
  useEffect(() => {
    checkExistingToken();
  }, []);

  const checkExistingToken = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const user = await AsyncStorage.getItem('user');
      
      if (token) {
        setExistingToken({
          token: token.substring(0, 30) + '...',
          length: token.length,
          user: user ? JSON.parse(user) : null
        });
      }
    } catch (error) {
      console.log('❌ Error checking token:', error);
    }
  };

  // ✅ VALIDATION FUNCTION
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ ADMIN LOGIN FUNCTION
  const handleAdminLogin = async () => {
    try {
      if (!validateForm()) {
        Alert.alert('Validation Error', 'Please fix the errors in the form');
        return;
      }

      setLoading(true);
      setApiResponse(null);

      console.log('🔐 Admin Login Attempt:', formData.email);

      // Prepare login data
      const loginData = {
        email: formData.email,
        password: formData.password
      };

      console.log('📤 Sending login request...');

      // Make API call
      const response = await axios.post(`${API_BASE_URL}/auth/login`, loginData, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      console.log('✅ Login response:', response.data);

      if (response.data && response.data.success) {
        const { user, token } = response.data;
        
        // ✅ Save token and user data
        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('user', JSON.stringify(user));
        
        setApiResponse({
          success: true,
          message: 'Admin login successful!',
          token: token.substring(0, 20) + '...',
          user: user
        });

        // Update existing token state
        setExistingToken({
          token: token.substring(0, 30) + '...',
          length: token.length,
          user: user
        });

        Alert.alert(
          '✅ Login Successful!',
          `Welcome ${user.name}!\n\nToken has been saved to storage.`,
          [
            {
              text: 'Go to Admin Dashboard',
              onPress: () => navigation.replace('AdminDashboard')
            },
            {
              text: 'Test Token',
              onPress: testToken
            }
          ]
        );

      } else {
        setApiResponse({
          success: false,
          message: response.data?.message || 'Login failed'
        });
        Alert.alert('❌ Login Failed', response.data?.message || 'Invalid credentials');
      }

    } catch (error) {
      console.error('🔥 Login error:', error.response?.data || error.message);
      
      let errorMessage = 'Login failed';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setApiResponse({
        success: false,
        error: errorMessage
      });

      Alert.alert('🚨 Login Error', errorMessage);

    } finally {
      setLoading(false);
    }
  };

  // ✅ TEST TOKEN FUNCTION
  const testToken = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        Alert.alert('❌ No Token', 'Please login first to get a token');
        return;
      }

      setLoading(true);

      // Test the token by making an authenticated request
      const response = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        timeout: 10000
      });

      if (response.data && response.data.success) {
        Alert.alert(
          '✅ Token is Valid!',
          `Token works perfectly!\n\nUser: ${response.data.user?.email}\nRole: ${response.data.user?.role || 'N/A'}`,
          [
            {
              text: 'Go to Dashboard',
              onPress: () => navigation.replace('AdminDashboard')
            }
          ]
        );
      } else {
        Alert.alert('❌ Token Invalid', 'The saved token is not valid');
      }

    } catch (error) {
      console.error('🔥 Token test error:', error.response?.data || error.message);
      Alert.alert('🚨 Token Error', error.response?.data?.message || 'Token validation failed');
    } finally {
      setLoading(false);
    }
  };

  // ✅ CLEAR TOKEN FUNCTION
  const clearToken = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      setExistingToken(null);
      Alert.alert('🗑️ Token Cleared', 'All tokens removed from storage');
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
    return `curl -X POST https://xoss.onrender.com/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify({
    email: formData.email,
    password: formData.password
  }, null, 2)}'`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Login</Text>
        <View style={styles.debugToggle}>
          <Text style={styles.debugText}>Debug</Text>
          <Switch
            value={debugMode}
            onValueChange={setDebugMode}
            trackColor={{ false: '#767577', true: '#ff4444' }}
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
              <Text style={styles.sectionTitle}>🔧 Token Status</Text>
              
              {/* Existing Token Info */}
              {existingToken ? (
                <View style={styles.tokenInfo}>
                  <Text style={styles.tokenTitle}>✅ Token Found:</Text>
                  <Text style={styles.tokenText}>Length: {existingToken.length} characters</Text>
                  <Text style={styles.tokenText}>Preview: {existingToken.token}</Text>
                  {existingToken.user && (
                    <Text style={styles.tokenText}>User: {existingToken.user.email}</Text>
                  )}
                  
                  <View style={styles.tokenButtons}>
                    <TouchableOpacity 
                      style={styles.tokenButton}
                      onPress={testToken}
                    >
                      <Text style={styles.tokenButtonText}>🔑 Test Token</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.tokenButton, styles.clearButton]}
                      onPress={clearToken}
                    >
                      <Text style={styles.tokenButtonText}>🗑️ Clear</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.tokenInfo}>
                  <Text style={styles.tokenTitle}>❌ No Token Found</Text>
                  <Text style={styles.tokenText}>Login to get a token</Text>
                </View>
              )}

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
                  numberOfLines={6}
                />
              </View>
            </View>
          )}

          {/* Login Form */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>👑 Admin Login</Text>
            
            {/* Test Credentials */}
            <View style={styles.testCredentials}>
              <Text style={styles.testTitle}>Test Credentials:</Text>
              <TouchableOpacity 
                style={styles.testButton}
                onPress={() => {
                  setFormData({
                    email: 'admin@xoss.com',
                    password: '123456'
                  });
                }}
              >
                <Text style={styles.testButtonText}>Use: admin@xoss.com / 123456</Text>
              </TouchableOpacity>
            </View>

            {/* Email Field */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Admin Email *</Text>
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
              <Text style={styles.label}>Admin Password *</Text>
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

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.loginButton, loading && styles.buttonDisabled]}
                onPress={handleAdminLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.loginButtonText}>🔐 Admin Login</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.registerButton}
                onPress={() => navigation.navigate('CreateAdmin')}
              >
                <Text style={styles.registerButtonText}>📝 Register New Admin</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.continueButton}
                onPress={() => navigation.replace('AdminDashboard')}
              >
                <Text style={styles.continueButtonText}>➡️ Continue with Existing Token</Text>
              </TouchableOpacity>
            </View>

            {/* Instructions */}
            <View style={styles.instructions}>
              <Text style={styles.instructionsTitle}>📋 How it works:</Text>
              <Text style={styles.instruction}>1. Login with admin credentials</Text>
              <Text style={styles.instruction}>2. Token will be saved automatically</Text>
              <Text style={styles.instruction}>3. Use "Test Token" to verify it works</Text>
              <Text style={styles.instruction}>4. Go to Dashboard to use the token</Text>
            </View>
          </View>

          {/* Server Info */}
          <View style={styles.serverInfo}>
            <Text style={styles.serverTitle}>🌐 Server Information:</Text>
            <Text style={styles.serverText}>URL: https://xoss.onrender.com</Text>
            <Text style={styles.serverText}>API: /api/auth/login</Text>
            <Text style={styles.serverText}>Method: POST</Text>
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
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ff4444',
  },
  sectionTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  tokenInfo: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  tokenTitle: {
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tokenText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 4,
  },
  tokenButtons: {
    flexDirection: 'row',
    marginTop: 8,
  },
  tokenButton: {
    backgroundColor: '#2962ff',
    padding: 8,
    borderRadius: 4,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: '#ff4444',
  },
  tokenButtonText: {
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
    minHeight: 100,
    textAlignVertical: 'top',
  },
  formSection: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ff4444',
  },
  testCredentials: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    borderRadius: 8,
  },
  testTitle: {
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  testButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
  },
  testButtonText: {
    color: 'white',
    fontSize: 12,
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
  loginButton: {
    backgroundColor: '#ff4444',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    backgroundColor: '#666',
  },
  loginButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  registerButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  registerButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  continueButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderColor: '#FF9800',
    borderWidth: 1,
  },
  continueButtonText: {
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
  serverInfo: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  serverTitle: {
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 8,
    fontSize: 16,
  },
  serverText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
});

export default AdminLogin;
