import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PaymentMethodsScreen = ({ navigation }) => {
  const [paymentMethods, setPaymentMethods] = useState([
    {
      id: '1',
      type: 'bkash',
      name: 'bKash',
      number: '01751332386',
      isDefault: true,
      icon: '📱',
      color: '#e2136e'
    },
    {
      id: '2',
      type: 'nagad',
      name: 'Nagad',
      number: '01751332386',
      isDefault: false,
      icon: '💳',
      color: '#f60'
    },
    {
      id: '3',
      type: 'rocket',
      name: 'Rocket',
      number: '01751332386',
      isDefault: false,
      icon: '🚀',
      color: '#784bd1'
    }
  ]);

  const setDefaultMethod = (id) => {
    setPaymentMethods(methods =>
      methods.map(method => ({
        ...method,
        isDefault: method.id === id
      }))
    );
    Alert.alert('Success', 'Default payment method updated!');
  };

  const addPaymentMethod = () => {
    Alert.alert('Coming Soon', 'Add new payment method feature coming soon!');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Your Payment Methods</Text>
        
        {paymentMethods.map((method) => (
          <TouchableOpacity
            key={method.id}
            style={[
              styles.paymentMethod,
              method.isDefault && styles.paymentMethodDefault
            ]}
            onPress={() => setDefaultMethod(method.id)}
          >
            <View style={styles.methodLeft}>
              <View style={[styles.methodIcon, { backgroundColor: method.color }]}>
                <Text style={styles.methodIconText}>{method.icon}</Text>
              </View>
              <View style={styles.methodInfo}>
                <Text style={styles.methodName}>{method.name}</Text>
                <Text style={styles.methodNumber}>{method.number}</Text>
              </View>
            </View>
            
            <View style={styles.methodRight}>
              {method.isDefault && (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultText}>Default</Text>
                </View>
              )}
              <Ionicons 
                name={method.isDefault ? "checkmark-circle" : "radio-button-off"} 
                size={24} 
                color={method.isDefault ? method.color : '#666'} 
              />
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.addButton} onPress={addPaymentMethod}>
          <Ionicons name="add-circle" size={24} color="#00D4FF" />
          <Text style={styles.addButtonText}>Add New Payment Method</Text>
        </TouchableOpacity>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#2962ff" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Secure Payments</Text>
            <Text style={styles.infoText}>
              All your payment methods are encrypted and secure. We never store your sensitive financial information.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
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
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  paymentMethod: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 20,
    borderRadius: 15,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  paymentMethodDefault: {
    borderColor: '#00D4FF',
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
  },
  methodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  methodIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  methodIconText: {
    fontSize: 20,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  methodNumber: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  methodRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  defaultBadge: {
    backgroundColor: '#00D4FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  defaultText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 20,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#00D4FF',
    borderStyle: 'dashed',
    marginTop: 10,
    gap: 10,
  },
  addButtonText: {
    color: '#00D4FF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(41,98,255,0.1)',
    marginTop: 30,
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2962ff',
  },
  infoContent: {
    flex: 1,
    marginLeft: 10,
  },
  infoTitle: {
    color: '#2962ff',
    fontWeight: 'bold',
    marginBottom: 5,
    fontSize: 16,
  },
  infoText: {
    color: '#ccc',
    fontSize: 12,
    lineHeight: 16,
  },
});

export default PaymentMethodsScreen;
