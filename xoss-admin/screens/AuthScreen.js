// screens/AuthScreen.js - FIXED VERSION
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

const AuthScreen = ({ navigation }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [apiResponse, setApiResponse] = useState(null);
  const [existingToken, setExistingToken] = useState(null);
  
  // Form states
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});

  // Load existing token on mount
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

  // ✅ VALIDATION FUNCTIONS
  const validateLogin = () => {
    const newErrors = {};
    
    if (!loginData.email.trim()) newErrors.loginEmail = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(loginData.email)) newErrors.loginEmail = 'Email is invalid';
    
    if (!loginData.password) newErrors.loginPassword = 'Password is required';
    else if (loginData.password.length < 6) newErrors.loginPassword = 'Password must be at least 6 characters';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateRegister = () => {
    const newErrors = {};
    
    if (!registerData.name.trim()) newErrors.registerName = 'Name is required';
    else if (registerData.name.trim().length < 3) newErrors.registerName = 'Name must be at least 3 characters';
    
    if (!registerData.email.trim()) newErrors.registerEmail = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(registerData.email)) newErrors.registerEmail = 'Email is invalid';
    
    if (!registerData.phone.trim()) newErrors.registerPhone = 'Phone is required';
    else if (!/^(?:\+88|01)?\d{11}$/.test(registerData.phone.replace(/\s/g, ''))) newErrors.registerPhone = 'Phone number is invalid';
    
    if (!registerData.password) newErrors.registerPassword = 'Password is required';
    else if (registerData.password.length < 6) newErrors.registerPassword = 'Password must be at least 6 characters';
    
    if (!registerData.confirmPassword) newErrors.registerConfirmPassword = 'Please confirm password';
    else if (registerData.password !== registerData.confirmPassword) newErrors.registerConfirmPassword = 'Passwords do not match';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ REGISTER FUNCTION - FIXED
  const handleRegister = async () => {
    try {
      if (!validateRegister()) {
        Alert.alert('Validation Error', 'Please fix the errors in the form');
        return;
      }

      setLoading(true);
      setApiResponse(null);

      console.log('📝 Register Attempt:', registerData.email);
      
      // ✅ ফোন নম্বর ফরম্যাট করুন
      let formattedPhone = registerData.phone.trim();
      if (!formattedPhone.startsWith('+')) {
        // যদি +88 না থাকে, তাহলে যোগ করুন
        if (formattedPhone.startsWith('01')) {
          formattedPhone = '+88' + formattedPhone;
        } else if (formattedPhone.startsWith('1')) {
          formattedPhone = '+880' + formattedPhone;
        }
      }

      // ✅ সার্ভারের জন্য প্রস্তুত ডেটা
      const registrationPayload = {
        name: registerData.name.trim(),
        email: registerData.email.trim().toLowerCase(),
        password: registerData.password,
        phone: formattedPhone,
        role: 'user', // স্ট্যান্ডার্ড role
        status: 'active'
      };

      console.log('📤 Sending registration data:', registrationPayload);

      // ✅ API কল করুন
      const response = await axios.post(
        `${API_BASE_URL}/auth/register`,
        registrationPayload,
        {
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 15000
        }
      );

      console.log('✅ Register response:', response.data);

      if (response.data && response.data.success) {
        const { user, token } = response.data;
        
        // টোকেন এবং ইউজার ডাটা সেভ করুন
        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('user', JSON.stringify(user));
        
        setApiResponse({
          success: true,
          message: 'Registration successful!',
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
          '🎉 Registration Successful!',
          `Account created for ${user.name}!\n\nEmail: ${user.email}\nToken has been saved.`,
          [
            {
              text: 'Go to Dashboard',
              onPress: () => navigation.replace('AdminDashboard')
            },
            {
              text: 'Stay on Login',
              style: 'cancel',
              onPress: () => setIsLoginMode(true)
            }
          ]
        );

      } else {
        const errorMsg = response.data?.message || 'Registration failed';
        setApiResponse({
          success: false,
          message: errorMsg
        });
        Alert.alert('❌ Registration Failed', errorMsg);
      }

    } catch (error) {
      console.error('🔥 Registration error:', error.response?.data || error.message);
      
      let errorMessage = 'Registration failed. Please try again.';
      if (error.response?.data) {
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Special handling for common errors
      if (errorMessage.includes('already exists') || errorMessage.includes('already registered')) {
        errorMessage = 'This email is already registered. Please try logging in or use a different email.';
      } else if (errorMessage.includes('required fields')) {
        errorMessage = 'Please fill all required fields correctly.';
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

  // ✅ LOGIN FUNCTION - FIXED
  const handleLogin = async () => {
    try {
      if (!validateLogin()) {
        Alert.alert('Validation Error', 'Please fix the errors in the form');
        return;
      }

      setLoading(true);
      setApiResponse(null);

      console.log('🔐 Login Attempt:', loginData.email);

      // ✅ লগইন ডেটা প্রস্তুত করুন
      const loginPayload = {
        email: loginData.email.trim().toLowerCase(),
        password: loginData.password
      };

      console.log('📤 Sending login data:', { email: loginPayload.email });

      // ✅ API কল করুন
      const response = await axios.post(
        `${API_BASE_URL}/auth/login`,
        loginPayload,
        {
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 15000
        }
      );

      console.log('✅ Login response:', response.data);

      if (response.data && response.data.success) {
        const { user, token } = response.data;
        
        // টোকেন এবং ইউজার ডাটা সেভ করুন
        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('user', JSON.stringify(user));
        
        setApiResponse({
          success: true,
          message: 'Login successful!',
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
          `Welcome ${user.name}!\n\nEmail: ${user.email}\nRole: ${user.role || 'user'}`,
          [
            {
              text: 'Go to Dashboard',
              onPress: () => navigation.replace('AdminDashboard')
            }
          ]
        );

      } else {
        const errorMsg = response.data?.message || 'Login failed';
        setApiResponse({
          success: false,
          message: errorMsg
        });
        Alert.alert('❌ Login Failed', errorMsg);
      }

    } catch (error) {
      console.error('🔥 Login error:', error.response?.data || error.message);
      
      let errorMessage = 'Login failed. Please try again.';
      if (error.response?.data) {
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Special handling for common errors
      if (errorMessage.includes('Invalid credentials') || errorMessage.includes('wrong password')) {
        errorMessage = 'Invalid email or password. Please try again.';
      } else if (errorMessage.includes('User not found')) {
        errorMessage = 'No account found with this email. Please register first.';
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
        Alert.alert('❌ No Token', 'Please login or register first');
        return;
      }

      setLoading(true);

      const response = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      if (response.data && response.data.success) {
        Alert.alert(
          '✅ Token is Valid!',
          `Token works perfectly!\n\nUser: ${response.data.user?.name}\nEmail: ${response.data.user?.email}\nRole: ${response.data.user?.role || 'N/A'}`,
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

  // ✅ TEST CREDENTIALS
  const fillTestCredentials = () => {
    if (isLoginMode) {
      setLoginData({
        email: 'test@example.com',
        password: 'password123'
      });
    } else {
      setRegisterData({
        name: 'Test User',
        email: 'test@example.com',
        phone: '01712345678',
        password: 'password123',
        confirmPassword: 'password123'
      });
    }
  };

  // Update form fields
  const updateLoginField = (field, value) => {
    setLoginData(prev => ({ ...prev, [field]: value }));
    if (errors[`login${field.charAt(0).toUpperCase() + field.slice(1)}`]) {
      setErrors(prev => ({ ...prev, [`login${field.charAt(0).toUpperCase() + field.slice(1)}`]: '' }));
    }
  };

  const updateRegisterField = (field, value) => {
    setRegisterData(prev => ({ ...prev, [field]: value }));
    if (errors[`register${field.charAt(0).toUpperCase() + field.slice(1)}`]) {
      setErrors(prev => ({ ...prev, [`register${field.charAt(0).toUpperCase() + field.slice(1)}`]: '' }));
    }
  };

  // ✅ DIRECT REGISTRATION FUNCTION (API দিয়ে সরাসরি)
  const directRegistration = async () => {
    try {
      setLoading(true);
      
      // সরাসরি API কল
      const response = await axios.post(`${API_BASE_URL}/auth/register`, {
        name: 'Direct Test User',
        email: 'direct@test.com',
        password: 'password123',
        phone: '+8801712345678',
        role: 'user'
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      console.log('Direct registration response:', response.data);
      Alert.alert('Direct Registration', JSON.stringify(response.data, null, 2));
      
    } catch (error) {
      console.error('Direct registration error:', error.response?.data || error.message);
      Alert.alert('Direct Registration Error', JSON.stringify(error.response?.data || error.message, null, 2));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isLoginMode ? 'User Login' : 'User Registration'}
        </Text>
        <View style={styles.debugToggle}>
          <Text style={styles.debugText}>Debug</Text>
          <Switch
            value={debugMode}
            onValueChange={setDebugMode}
            trackColor={{ false: '#767577', true: '#2962ff' }}
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
              <Text style={styles.sectionTitle}>🔧 Debug Panel</Text>
              
              {existingToken ? (
                <View style={styles.tokenInfo}>
                  <Text style={styles.tokenTitle}>✅ Token Found:</Text>
                  <Text style={styles.tokenText}>Length: {existingToken.length} characters</Text>
                  <Text style={styles.tokenText}>Preview: {existingToken.token}</Text>
                  
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
                  <Text style={styles.tokenText}>Login or Register to get a token</Text>
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

              {/* Direct Test Button */}
              <TouchableOpacity 
                style={styles.directButton}
                onPress={directRegistration}
                disabled={loading}
              >
                <Text style={styles.directButtonText}>🔬 Direct API Test</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Mode Toggle */}
          <View style={styles.modeToggle}>
            <TouchableOpacity 
              style={[styles.modeButton, isLoginMode && styles.modeButtonActive]}
              onPress={() => setIsLoginMode(true)}
            >
              <Text style={[styles.modeButtonText, isLoginMode && styles.modeButtonTextActive]}>
                Login
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modeButton, !isLoginMode && styles.modeButtonActive]}
              onPress={() => setIsLoginMode(false)}
            >
              <Text style={[styles.modeButtonText, !isLoginMode && styles.modeButtonTextActive]}>
                Register
              </Text>
            </TouchableOpacity>
          </View>

          {/* Login Form */}
          {isLoginMode ? (
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>🔐 User Login</Text>
              
              {/* Test Credentials Button */}
              <TouchableOpacity 
                style={styles.testButton}
                onPress={fillTestCredentials}
              >
                <Text style={styles.testButtonText}>🧪 Fill Test Credentials</Text>
              </TouchableOpacity>

              {/* Email Field */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Email *</Text>
                <TextInput
                  style={[styles.input, errors.loginEmail && styles.inputError]}
                  value={loginData.email}
                  onChangeText={(text) => updateLoginField('email', text)}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholderTextColor="rgba(255,255,255,0.5)"
                />
                {errors.loginEmail && <Text style={styles.errorText}>{errors.loginEmail}</Text>}
              </View>

              {/* Password Field */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Password *</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.input, styles.passwordInput, errors.loginPassword && styles.inputError]}
                    value={loginData.password}
                    onChangeText={(text) => updateLoginField('password', text)}
                    placeholder="Enter password"
                    secureTextEntry={!showPassword}
                    placeholderTextColor="rgba(255,255,255,0.5)"
                  />
                  <TouchableOpacity 
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons 
                      name={showPassword ? "eye-off" : "eye"} 
                      size={20} 
                      color="rgba(255,255,255,0.7)" 
                    />
                  </TouchableOpacity>
                </View>
                {errors.loginPassword && <Text style={styles.errorText}>{errors.loginPassword}</Text>}
              </View>

              {/* Login Button */}
              <TouchableOpacity 
                style={[styles.submitButton, loading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.submitButtonText}>Login</Text>
                )}
              </TouchableOpacity>

              {/* Register Link */}
              <TouchableOpacity 
                style={styles.switchLink}
                onPress={() => setIsLoginMode(false)}
              >
                <Text style={styles.switchLinkText}>
                  Don't have an account? <Text style={styles.switchLinkBold}>Register here</Text>
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Registration Form */
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>📝 User Registration</Text>

              {/* Name Field */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Full Name *</Text>
                <TextInput
                  style={[styles.input, errors.registerName && styles.inputError]}
                  value={registerData.name}
                  onChangeText={(text) => updateRegisterField('name', text)}
                  placeholder="Enter your full name"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                />
                {errors.registerName && <Text style={styles.errorText}>{errors.registerName}</Text>}
              </View>

              {/* Email Field */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Email *</Text>
                <TextInput
                  style={[styles.input, errors.registerEmail && styles.inputError]}
                  value={registerData.email}
                  onChangeText={(text) => updateRegisterField('email', text)}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholderTextColor="rgba(255,255,255,0.5)"
                />
                {errors.registerEmail && <Text style={styles.errorText}>{errors.registerEmail}</Text>}
              </View>

              {/* Phone Field */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Phone Number *</Text>
                <TextInput
                  style={[styles.input, errors.registerPhone && styles.inputError]}
                  value={registerData.phone}
                  onChangeText={(text) => updateRegisterField('phone', text)}
                  placeholder="017XXXXXXXX or +88017XXXXXXXX"
                  keyboardType="phone-pad"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                />
                {errors.registerPhone && <Text style={styles.errorText}>{errors.registerPhone}</Text>}
                <Text style={styles.hintText}>Format: 01712345678 or +8801712345678</Text>
              </View>

              {/* Password Field */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Password * (min 6 characters)</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.input, styles.passwordInput, errors.registerPassword && styles.inputError]}
                    value={registerData.password}
                    onChangeText={(text) => updateRegisterField('password', text)}
                    placeholder="Enter password"
                    secureTextEntry={!showPassword}
                    placeholderTextColor="rgba(255,255,255,0.5)"
                  />
                  <TouchableOpacity 
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons 
                      name={showPassword ? "eye-off" : "eye"} 
                      size={20} 
                      color="rgba(255,255,255,0.7)" 
                    />
                  </TouchableOpacity>
                </View>
                {errors.registerPassword && <Text style={styles.errorText}>{errors.registerPassword}</Text>}
              </View>

              {/* Confirm Password Field */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Confirm Password *</Text>
                <TextInput
                  style={[styles.input, errors.registerConfirmPassword && styles.inputError]}
                  value={registerData.confirmPassword}
                  onChangeText={(text) => updateRegisterField('confirmPassword', text)}
                  placeholder="Confirm password"
                  secureTextEntry={!showPassword}
                  placeholderTextColor="rgba(255,255,255,0.5)"
                />
                {errors.registerConfirmPassword && (
                  <Text style={styles.errorText}>{errors.registerConfirmPassword}</Text>
                )}
              </View>

              {/* Register Button */}
              <TouchableOpacity 
                style={[styles.submitButton, loading && styles.buttonDisabled]}
                onPress={handleRegister}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.submitButtonText}>Create Account</Text>
                )}
              </TouchableOpacity>

              {/* Login Link */}
              <TouchableOpacity 
                style={styles.switchLink}
                onPress={() => setIsLoginMode(true)}
              >
                <Text style={styles.switchLinkText}>
                  Already have an account? <Text style={styles.switchLinkBold}>Login here</Text>
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Guest Access */}
          <TouchableOpacity 
            style={styles.guestButton}
            onPress={() => navigation.replace('AdminDashboard')}
          >
            <Text style={styles.guestButtonText}>Continue as Guest (Limited Access)</Text>
          </TouchableOpacity>

          {/* Server Info */}
          <View style={styles.serverInfo}>
            <Text style={styles.serverTitle}>🌐 Server Information:</Text>
            <Text style={styles.serverText}>URL: {API_BASE_URL}</Text>
            <Text style={styles.serverText}>API: /auth/register & /auth/login</Text>
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
    backgroundColor: 'rgba(41, 98, 255, 0.1)',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2962ff',
  },
  sectionTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
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
    marginTop: 12,
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
  directButton: {
    backgroundColor: '#9C27B0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  directButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  modeToggle: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 4,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  modeButtonActive: {
    backgroundColor: '#2962ff',
  },
  modeButtonText: {
    color: 'rgba(255,255,255,0.7)',
    fontWeight: 'bold',
  },
  modeButtonTextActive: {
    color: 'white',
  },
  formSection: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2962ff',
  },
  testButton: {
    backgroundColor: 'rgba(156, 39, 176, 0.2)',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#9C27B0',
  },
  testButtonText: {
    color: '#E1BEE7',
    fontWeight: 'bold',
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
  hintText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 5,
    fontStyle: 'italic',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#666',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  switchLink: {
    padding: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  switchLinkText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  switchLinkBold: {
    color: '#2962ff',
    fontWeight: 'bold',
  },
  guestButton: {
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    borderColor: '#FF9800',
    borderWidth: 1,
    borderRadius: 8,
  },
  guestButtonText: {
    color: '#FF9800',
    fontWeight: 'bold',
  },
  serverInfo: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
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

export default AuthScreen;
