// screens/AdminLogin.js - COMPLETE ADMIN LOGIN
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
  KeyboardAvoidingView,
  Platform,
  Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';

const AdminLogin = ({ navigation }) => {
  const { login, isLoading } = useAuth();
  const [debugMode, setDebugMode] = useState(true);
  const [apiResponse, setApiResponse] = useState(null);
  
  const [formData, setFormData] = useState({
    email: 'admin@xoss.com',
    password: 'admin123'
  });

  const [errors, setErrors] = useState({});

  const handleAdminLogin = async () => {
    try {
      // Clear previous errors
      setErrors({});
      setApiResponse(null);

      // Basic validation
      const newErrors = {};
      if (!formData.email) newErrors.email = 'Admin Email is required';
      if (!formData.password) newErrors.password = 'Password is required';
      
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      console.log('🔐 Admin Login Attempt:', formData.email);
      
      const result = await login(formData);
      
      setApiResponse(result);
      
      if (result.success) {
        Alert.alert('✅ Admin Access Granted', 'Welcome to Admin Panel!');
        console.log('🎉 Admin Login successful:', result.user);
        
        // Navigate to Admin Dashboard
        navigation.replace('AdminDashboard');
      } else {
        Alert.alert('❌ Admin Login Failed', result.error || 'Invalid admin credentials');
        console.log('💥 Admin Login error:', result);
      }
    } catch (error) {
      console.log('🔥 Admin Login exception:', error);
      setApiResponse({ error: error.message });
      Alert.alert('🚨 Exception', error.message);
    }
  };

  const updateField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const fillTestCredentials = (type) => {
    const testAccounts = {
      admin: { email: 'admin@xoss.com', password: 'admin123' },
      superadmin: { email: 'super@xoss.com', password: 'super123' },
      test: { email: 'test@xoss.com', password: 'test123' }
    };
    
    setFormData(testAccounts[type]);
  };

  const generateCurlCommand = () => {
    const curlData = {
      email: formData.email,
      password: formData.password
    };

    return `curl -X POST http://192.168.0.100:5000/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(curlData, null, 2)}'`;
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
              <Text style={styles.sectionTitle}>🔧 Admin Debug Panel</Text>
              <Text style={styles.debugText}>
                Use this panel to test admin login functionality
              </Text>
              
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
                <Text style={styles.curlTitle}>📡 CURL Command for Testing:</Text>
                <TextInput
                  style={styles.curlInput}
                  value={generateCurlCommand()}
                  multiline
                  editable={false}
                  numberOfLines={6}
                />
                <TouchableOpacity 
                  style={styles.copyButton}
                  onPress={() => {
                    Alert.alert('Copied', 'CURL command copied to clipboard');
                  }}
                >
                  <Text style={styles.copyButtonText}>Copy CURL Command</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Login Form */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>👑 Admin Access</Text>
            
            {/* Test Account Buttons */}
            <View style={styles.testAccountSection}>
              <Text style={styles.testAccountTitle}>Quick Test Accounts:</Text>
              <View style={styles.testAccountButtons}>
                <TouchableOpacity 
                  style={styles.testAccountButton}
                  onPress={() => fillTestCredentials('admin')}
                >
                  <Text style={styles.testAccountButtonText}>👑 Admin</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.testAccountButton}
                  onPress={() => fillTestCredentials('superadmin')}
                >
                  <Text style={styles.testAccountButtonText}>⚡ Super Admin</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.testAccountButton}
                  onPress={() => fillTestCredentials('test')}
                >
                  <Text style={styles.testAccountButtonText}>🧪 Test Admin</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Email Field */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Admin Email *</Text>
              <TextInput
                style={[
                  styles.input,
                  errors.email && styles.inputError
                ]}
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
                style={[
                  styles.input,
                  errors.password && styles.inputError
                ]}
                value={formData.password}
                onChangeText={(text) => updateField('password', text)}
                placeholder="Enter admin password"
                secureTextEntry
                placeholderTextColor="rgba(255,255,255,0.5)"
              />
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                onPress={handleAdminLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.loginButtonText}>👑 Admin Login</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.userLoginButton}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.userLoginButtonText}>👤 User Login</Text>
              </TouchableOpacity>
            </View>

            {/* Token Status */}
            {debugMode && (
              <View style={styles.tokenSection}>
                <Text style={styles.tokenTitle}>🔑 Token Status:</Text>
                <Text style={styles.tokenText}>
                  {formData.email && formData.password ? 
                    '✅ Ready to authenticate as Admin' : 
                    '❌ Fill admin credentials'
                  }
                </Text>
                <Text style={styles.serverInfo}>
                  🌐 Server: http://192.168.0.100:5000
                </Text>
              </View>
            )}
          </View>

          {/* Admin Features Info */}
          <View style={styles.featuresSection}>
            <Text style={styles.featuresTitle}>🛠️ Admin Features:</Text>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.featureText}>Full Tournament Management</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.featureText}>User & Wallet Controls</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.featureText}>Match Approval System</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.featureText}>Analytics & Reports</Text>
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
  debugText: {
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 12,
    fontSize: 14,
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
  copyButton: {
    backgroundColor: '#ff4444',
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 8,
  },
  copyButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  formSection: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ff4444',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    color: 'white',
    marginBottom: 8,
    fontWeight: '500',
    fontSize: 16,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.3)',
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    color: 'white',
    fontSize: 16,
  },
  inputError: {
    borderColor: '#ff4444',
  },
  errorText: {
    color: '#ff4444',
    marginTop: 5,
    fontSize: 14,
  },
  testAccountSection: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    borderRadius: 8,
  },
  testAccountTitle: {
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  testAccountButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  testAccountButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  testAccountButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionButtons: {
    marginTop: 10,
  },
  loginButton: {
    backgroundColor: '#ff4444',
    padding: 18,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  loginButtonDisabled: {
    backgroundColor: '#666',
  },
  loginButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  userLoginButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderColor: '#2962ff',
    borderWidth: 1,
  },
  userLoginButtonText: {
    color: '#2962ff',
    fontWeight: 'bold',
  },
  tokenSection: {
    marginTop: 20,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
  },
  tokenTitle: {
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  tokenText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 5,
  },
  serverInfo: {
    color: '#4CAF50',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  featuresSection: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    margin: 16,
    padding: 20,
    borderRadius: 12,
  },
  featuresTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureText: {
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 10,
    fontSize: 14,
  },
});

export default AdminLogin;
