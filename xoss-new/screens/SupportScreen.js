// screens/SupportScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  TextInput,
  Modal,
  Animated,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const SupportScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('contact');
  const [messageModal, setMessageModal] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');
  const [selectedIssue, setSelectedIssue] = useState('');

  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(30);

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const contactMethods = [
    {
      id: 'whatsapp',
      name: 'WhatsApp Support',
      description: 'Quick chat support',
      icon: 'logo-whatsapp',
      color: '#25D366',
      number: '+880123456789',
      available: '10:00 AM - 10:00 PM',
      action: () => openWhatsApp('+880123456789')
    },
    {
      id: 'messenger',
      name: 'Facebook Messenger',
      description: 'Instant messaging',
      icon: 'chatbubble-ellipses',
      color: '#0084FF',
      available: '24/7',
      action: () => openMessenger()
    },
    {
      id: 'email',
      name: 'Email Support',
      description: 'Detailed issue reporting',
      icon: 'mail',
      color: '#EA4335',
      email: 'support@xossgaming.com',
      available: '24/7',
      action: () => openEmail('support@xossgaming.com')
    },
    {
      id: 'phone',
      name: 'Phone Support',
      description: 'Direct call support',
      icon: 'call',
      color: '#34B7F1',
      number: '+880123456790',
      available: '12:00 PM - 8:00 PM',
      action: () => callSupport('+880123456790')
    }
  ];

  const faqCategories = [
    {
      id: 'account',
      name: 'Account & Registration',
      icon: 'person',
      questions: [
        {
          question: 'How do I create an account?',
          answer: 'Tap on "Register" from the login screen, fill in your details, and verify your email to get started.'
        },
        {
          question: 'I forgot my password. What should I do?',
          answer: 'Use the "Forgot Password" feature on the login screen. You will receive a reset link via email.'
        },
        {
          question: 'Can I change my username?',
          answer: 'Username cannot be changed once created. Choose carefully during registration.'
        }
      ]
    },
    {
      id: 'payment',
      name: 'Payment & Wallet',
      icon: 'wallet',
      questions: [
        {
          question: 'How do I add money to my wallet?',
          answer: 'Go to Wallet screen, tap "Add Money", choose payment method, and follow the instructions.'
        },
        {
          question: 'What is the minimum withdrawal amount?',
          answer: 'Minimum withdrawal amount is ৳100. Withdrawals are processed within 2-4 hours.'
        },
        {
          question: 'Why is my deposit pending?',
          answer: 'Deposits may take 15-30 minutes for verification. Contact support if pending for longer.'
        }
      ]
    },
    {
      id: 'tournament',
      name: 'Tournaments & Games',
      icon: 'trophy',
      questions: [
        {
          question: 'How do I join a tournament?',
          answer: 'Browse tournaments, select one, pay entry fee, and you will receive room details before match start.'
        },
        {
          question: 'What happens if I disconnect during a match?',
          answer: 'Rejoin immediately. If unable to rejoin, contact support with match details for assistance.'
        },
        {
          question: 'How are winners determined?',
          answer: 'Winners are based on final rankings and kills as per tournament rules shown before joining.'
        }
      ]
    },
    {
      id: 'technical',
      name: 'Technical Issues',
      icon: 'hardware-chip',
      questions: [
        {
          question: 'The app is crashing. What should I do?',
          answer: 'Try restarting the app, clear cache, or reinstall. Contact support if issue persists.'
        },
        {
          question: 'I am not receiving OTP. What to do?',
          answer: 'Check spam folder, ensure correct phone number, or try resending after 2 minutes.'
        },
        {
          question: 'Game room details not showing?',
          answer: 'Room details are available 15 minutes before match start. Refresh the page if not visible.'
        }
      ]
    }
  ];

  const commonIssues = [
    {
      id: 'deposit',
      title: 'Deposit Not Received',
      description: 'Money not added to wallet after payment',
      icon: 'cash',
      color: '#4CAF50'
    },
    {
      id: 'withdraw',
      title: 'Withdrawal Pending',
      description: 'Withdrawal taking longer than expected',
      icon: 'download',
      color: '#2962ff'
    },
    {
      id: 'tournament',
      title: 'Tournament Issue',
      description: 'Problem with joining or during tournament',
      icon: 'trophy',
      color: '#FF8A00'
    },
    {
      id: 'account',
      title: 'Account Problem',
      description: 'Login or verification issues',
      icon: 'person',
      color: '#9C27B0'
    },
    {
      id: 'technical',
      title: 'Technical Problem',
      description: 'App crashing or not working properly',
      icon: 'bug',
      color: '#F44336'
    },
    {
      id: 'other',
      title: 'Other Issue',
      description: 'Any other problem not listed here',
      icon: 'help-circle',
      color: '#607D8B'
    }
  ];

  const openWhatsApp = (number) => {
    const url = `whatsapp://send?phone=${number}&text=Hello XOSS Support, I need help with:`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'WhatsApp is not installed on your device');
    });
  };

  const openMessenger = () => {
    // This would typically open your Facebook Messenger page
    Alert.alert('Messenger Support', 'Please search for "XOSS Gaming" on Facebook Messenger');
  };

  const openEmail = (email) => {
    Linking.openURL(`mailto:${email}?subject=XOSS Support Request&body=Hello Support Team,\n\nI need help with:\n\n`);
  };

  const callSupport = (number) => {
    Linking.openURL(`tel:${number}`).catch(() => {
      Alert.alert('Error', 'Unable to make a call');
    });
  };

  const openFacebook = () => {
    Linking.openURL('https://facebook.com/xossgaming').catch(() => {
      Alert.alert('Error', 'Unable to open Facebook');
    });
  };

  const openWebsite = () => {
    Linking.openURL('https://xossgaming.com').catch(() => {
      Alert.alert('Error', 'Unable to open website');
    });
  };

  const submitSupportMessage = () => {
    if (!supportMessage.trim()) {
      Alert.alert('Error', 'Please describe your issue');
      return;
    }

    // Simulate sending message
    Alert.alert(
      'Message Sent!',
      'Our support team will contact you within 1 hour.',
      [
        {
          text: 'OK',
          onPress: () => {
            setMessageModal(false);
            setSupportMessage('');
            setSelectedIssue('');
          }
        }
      ]
    );
  };

  const ContactMethodCard = ({ method }) => (
    <TouchableOpacity style={styles.contactCard} onPress={method.action}>
      <View style={[styles.contactIcon, { backgroundColor: method.color }]}>
        <Ionicons name={method.icon} size={24} color="white" />
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{method.name}</Text>
        <Text style={styles.contactDescription}>{method.description}</Text>
        <Text style={styles.contactAvailable}>Available: {method.available}</Text>
        {(method.number || method.email) && (
          <Text style={styles.contactDetail}>
            {method.number || method.email}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#666" />
    </TouchableOpacity>
  );

  const FAQCategory = ({ category }) => {
    const [expanded, setExpanded] = useState(false);

    return (
      <View style={styles.faqCategory}>
        <TouchableOpacity 
          style={styles.faqHeader}
          onPress={() => setExpanded(!expanded)}
        >
          <View style={styles.faqHeaderLeft}>
            <Ionicons name={category.icon} size={20} color="#2962ff" />
            <Text style={styles.faqCategoryName}>{category.name}</Text>
          </View>
          <Ionicons 
            name={expanded ? "chevron-up" : "chevron-down"} 
            size={20} 
            color="#666" 
          />
        </TouchableOpacity>
        
        {expanded && (
          <View style={styles.faqQuestions}>
            {category.questions.map((item, index) => (
              <FAQItem key={index} question={item.question} answer={item.answer} />
            ))}
          </View>
        )}
      </View>
    );
  };

  const FAQItem = ({ question, answer }) => {
    const [expanded, setExpanded] = useState(false);

    return (
      <View style={styles.faqItem}>
        <TouchableOpacity 
          style={styles.faqQuestion}
          onPress={() => setExpanded(!expanded)}
        >
          <Text style={styles.faqQuestionText}>{question}</Text>
          <Ionicons 
            name={expanded ? "remove-circle" : "add-circle"} 
            size={20} 
            color="#2962ff" 
          />
        </TouchableOpacity>
        
        {expanded && (
          <View style={styles.faqAnswer}>
            <Text style={styles.faqAnswerText}>{answer}</Text>
          </View>
        )}
      </View>
    );
  };

  const IssueTypeCard = ({ issue }) => (
    <TouchableOpacity 
      style={styles.issueCard}
      onPress={() => {
        setSelectedIssue(issue.title);
        setMessageModal(true);
      }}
    >
      <View style={[styles.issueIcon, { backgroundColor: issue.color }]}>
        <Ionicons name={issue.icon} size={24} color="white" />
      </View>
      <View style={styles.issueInfo}>
        <Text style={styles.issueTitle}>{issue.title}</Text>
        <Text style={styles.issueDescription}>{issue.description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#666" />
    </TouchableOpacity>
  );

  const MessageModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={messageModal}
      onRequestClose={() => setMessageModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Describe Your Issue</Text>
            <TouchableOpacity onPress={() => setMessageModal(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.selectedIssue}>
            <Text style={styles.selectedIssueText}>Issue Type: {selectedIssue}</Text>
          </View>

          <TextInput
            style={styles.messageInput}
            placeholder="Please describe your issue in detail..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            value={supportMessage}
            onChangeText={setSupportMessage}
          />

          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setMessageModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.submitButton,
                !supportMessage.trim() && styles.submitButtonDisabled
              ]}
              onPress={submitSupportMessage}
              disabled={!supportMessage.trim()}
            >
              <Text style={styles.submitButtonText}>Send Message</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Support Center</Text>
          <Text style={styles.headerSubtitle}>We're here to help you 24/7</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'contact' && styles.activeTab]}
          onPress={() => setActiveTab('contact')}
        >
          <Text style={[styles.tabText, activeTab === 'contact' && styles.activeTabText]}>
            Contact
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'faq' && styles.activeTab]}
          onPress={() => setActiveTab('faq')}
        >
          <Text style={[styles.tabText, activeTab === 'faq' && styles.activeTabText]}>
            FAQ
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'issues' && styles.activeTab]}
          onPress={() => setActiveTab('issues')}
        >
          <Text style={[styles.tabText, activeTab === 'issues' && styles.activeTabText]}>
            Report Issue
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Contact Tab */}
        {activeTab === 'contact' && (
          <View 
            style={[
              styles.tabContent,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
            ]}
          >
            <Text style={styles.sectionTitle}>Get in Touch</Text>
            <Text style={styles.sectionSubtitle}>
              Choose your preferred way to contact our support team
            </Text>

            <View style={styles.contactMethods}>
              {contactMethods.map(method => (
                <ContactMethodCard key={method.id} method={method} />
              ))}
            </View>

            {/* Quick Support Info */}
            <View style={styles.supportInfo}>
              <View style={styles.infoItem}>
                <Ionicons name="time" size={20} color="#FF8A00" />
                <View style={styles.infoText}>
                  <Text style={styles.infoTitle}>Response Time</Text>
                  <Text style={styles.infoDescription}>
                    Typically within 15 minutes during business hours
                  </Text>
                </View>
              </View>
              
              <View style={styles.infoItem}>
                <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
                <View style={styles.infoText}>
                  <Text style={styles.infoTitle}>Secure & Private</Text>
                  <Text style={styles.infoDescription}>
                    Your data and conversations are protected
                  </Text>
                </View>
              </View>
            </View>

            {/* Social Links */}
            <View style={styles.socialSection}>
              <Text style={styles.socialTitle}>Follow Us</Text>
              <View style={styles.socialButtons}>
                <TouchableOpacity style={styles.socialButton} onPress={openFacebook}>
                  <Ionicons name="logo-facebook" size={24} color="#1877F2" />
                  <Text style={styles.socialButtonText}>Facebook</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.socialButton} onPress={openWebsite}>
                  <Ionicons name="globe" size={24} color="#2962ff" />
                  <Text style={styles.socialButtonText}>Website</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* FAQ Tab */}
        {activeTab === 'faq' && (
          <View 
            style={[
              styles.tabContent,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
            ]}
          >
            <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
            <Text style={styles.sectionSubtitle}>
              Find quick answers to common questions
            </Text>

            <View style={styles.faqContainer}>
              {faqCategories.map(category => (
                <FAQCategory key={category.id} category={category} />
              ))}
            </View>

            <View style={styles.faqFooter}>
              <Text style={styles.faqFooterText}>
                Still have questions? Contact our support team for personalized help.
              </Text>
            </View>
          </View>
        )}

        {/* Report Issue Tab */}
        {activeTab === 'issues' && (
          <View 
            style={[
              styles.tabContent,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
            ]}
          >
            <Text style={styles.sectionTitle}>Report an Issue</Text>
            <Text style={styles.sectionSubtitle}>
              Select the type of issue you're facing
            </Text>

            <View style={styles.issuesGrid}>
              {commonIssues.map(issue => (
                <IssueTypeCard key={issue.id} issue={issue} />
              ))}
            </View>

            <View style={styles.emergencySection}>
              <View style={styles.emergencyHeader}>
                <Ionicons name="warning" size={24} color="#FF4444" />
                <Text style={styles.emergencyTitle}>Urgent Tournament Issue?</Text>
              </View>
              <Text style={styles.emergencyText}>
                For urgent tournament-related issues during live matches, contact WhatsApp support immediately for fastest resolution.
              </Text>
              <TouchableOpacity style={styles.emergencyButton} onPress={() => openWhatsApp('+880123456789')}>
                <Ionicons name="logo-whatsapp" size={20} color="white" />
                <Text style={styles.emergencyButtonText}>Contact Urgent Support</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      <MessageModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0c23',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#1a237e',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#2962ff',
    textAlign: 'center',
    marginTop: 4,
  },
  headerRight: {
    width: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 15,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: '#2962ff',
  },
  tabText: {
    color: '#ccc',
    fontSize: 14,
    fontWeight: 'bold',
  },
  activeTabText: {
    color: 'white',
  },
  scrollView: {
    flex: 1,
  },
  tabContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 25,
    lineHeight: 20,
  },
  contactMethods: {
    gap: 12,
    marginBottom: 25,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  contactIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  contactDescription: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 4,
  },
  contactAvailable: {
    fontSize: 12,
    color: '#4CAF50',
    marginBottom: 2,
  },
  contactDetail: {
    fontSize: 12,
    color: '#2962ff',
    fontWeight: 'bold',
  },
  supportInfo: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#333',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
  socialSection: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  socialTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
    textAlign: 'center',
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  socialButton: {
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    minWidth: 120,
  },
  socialButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
  },
  faqContainer: {
    gap: 15,
    marginBottom: 25,
  },
  faqCategory: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  faqHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  faqCategoryName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 12,
  },
  faqQuestions: {
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  faqQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    paddingHorizontal: 20,
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
    marginRight: 10,
  },
  faqAnswer: {
    padding: 20,
    paddingTop: 0,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  faqAnswerText: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
  faqFooter: {
    backgroundColor: 'rgba(41, 98, 255, 0.1)',
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#2962ff',
  },
  faqFooterText: {
    color: '#2962ff',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  issuesGrid: {
    gap: 12,
    marginBottom: 25,
  },
  issueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  issueIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  issueInfo: {
    flex: 1,
  },
  issueTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  issueDescription: {
    fontSize: 14,
    color: '#ccc',
  },
  emergencySection: {
    backgroundColor: 'rgba(255,68,68,0.1)',
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#FF4444',
  },
  emergencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  emergencyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF4444',
    marginLeft: 8,
  },
  emergencyText: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 15,
    lineHeight: 20,
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    padding: 15,
    borderRadius: 12,
  },
  emergencyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  selectedIssue: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  selectedIssueText: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f9f9f9',
    minHeight: 150,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitButton: {
    flex: 2,
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#2962ff',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SupportScreen;
