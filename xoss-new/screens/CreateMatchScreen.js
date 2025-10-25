// screens/CreateMatchScreen.js - COMPLETE FIXED VERSION
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Alert, Platform, Dimensions, Animated,
  ActivityIndicator, Switch, Modal, KeyboardAvoidingView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../context/AuthContext';
import { useWallet } from '../context/WalletContext';

const { width, height } = Dimensions.get('window');

// 🆕 Expo Compatible Features Only
const AISuggestionEngine = ({ game, matchType, onSuggestionApply }) => {
  const [suggestions, setSuggestions] = useState([]);
  
  const gamePresets = {
    freefire: {
      Solo: { 
        entryFee: 10, 
        maxPlayers: 48, 
        perKill: 5, 
        prizePool: 400,
        description: "Popular Solo match with quick joiners"
      },
      Duo: { 
        entryFee: 20, 
        maxPlayers: 50, 
        perKill: 10, 
        prizePool: 800,
        description: "Perfect for duo partners"
      },
      Squad: { 
        entryFee: 25, 
        maxPlayers: 48, 
        perKill: 8, 
        prizePool: 1000,
        description: "Squad battle with team coordination"
      }
    },
    pubg: {
      Solo: { 
        entryFee: 15, 
        maxPlayers: 100, 
        perKill: 8, 
        prizePool: 1200,
        description: "Classic PUBG solo experience"
      },
      Duo: { 
        entryFee: 30, 
        maxPlayers: 100, 
        perKill: 15, 
        prizePool: 2400,
        description: "Duo match with higher stakes"
      }
    },
    bgmi: {
      Solo: { 
        entryFee: 12, 
        maxPlayers: 80, 
        perKill: 6, 
        prizePool: 800,
        description: "BGMI solo with Indian players"
      },
      Squad: { 
        entryFee: 35, 
        maxPlayers: 80, 
        perKill: 10, 
        prizePool: 2400,
        description: "Squad match for pro teams"
      }
    }
  };

  useEffect(() => {
    if (game && matchType) {
      const preset = gamePresets[game]?.[matchType];
      if (preset) {
        setSuggestions([{
          type: 'AI Recommended',
          ...preset,
          confidence: '95%'
        }]);
      }
    }
  }, [game, matchType]);

  if (!suggestions.length) return null;

  return (
    <View style={styles.aiSuggestionContainer}>
      <Text style={styles.aiTitle}>🤖 Smart Suggestions</Text>
      {suggestions.map((suggestion, index) => (
        <TouchableOpacity
          key={index}
          style={styles.suggestionCard}
          onPress={() => onSuggestionApply(suggestion)}
        >
          <View style={styles.suggestionHeader}>
            <Ionicons name="sparkles" size={16} color="#FFD700" />
            <Text style={styles.suggestionType}>{suggestion.type}</Text>
            <Text style={styles.confidenceBadge}>{suggestion.confidence}</Text>
          </View>
          <Text style={styles.suggestionDesc}>{suggestion.description}</Text>
          <View style={styles.suggestionStats}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Entry</Text>
              <Text style={styles.statValue}>৳{suggestion.entryFee}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Players</Text>
              <Text style={styles.statValue}>{suggestion.maxPlayers}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Per Kill</Text>
              <Text style={styles.statValue}>৳{suggestion.perKill}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Prize</Text>
              <Text style={styles.statValue}>৳{suggestion.prizePool}</Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// 🆕 Real-time Profit Calculator (Expo Compatible)
const ProfitCalculator = ({ entryFee, maxPlayers, perKill }) => {
  const totalCollection = (parseFloat(entryFee) || 0) * (parseInt(maxPlayers) || 0);
  const platformFee = totalCollection * 0.10;
  const totalPrize = totalCollection - platformFee;
  const estimatedProfit = platformFee;

  if (totalCollection <= 0) return null;

  return (
    <View style={styles.profitCalculator}>
      <Text style={styles.calculatorTitle}>💰 Profit Breakdown</Text>
      <View style={styles.calculatorGrid}>
        <View style={styles.calcItem}>
          <Text style={styles.calcLabel}>Total Collection</Text>
          <Text style={styles.calcValue}>৳{totalCollection}</Text>
        </View>
        <View style={styles.calcItem}>
          <Text style={styles.calcLabel}>Platform Fee (10%)</Text>
          <Text style={styles.calcValue}>৳{Math.round(platformFee)}</Text>
        </View>
        <View style={styles.calcItem}>
          <Text style={styles.calcLabel}>Prize Pool</Text>
          <Text style={styles.calcValue}>৳{Math.round(totalPrize)}</Text>
        </View>
        <View style={styles.calcItem}>
          <Text style={styles.calcLabel}>Your Profit</Text>
          <Text style={[styles.calcValue, styles.profitText]}>৳{Math.round(estimatedProfit)}</Text>
        </View>
      </View>
    </View>
  );
};

// 🆕 Smart Rule Generator (Expo Compatible)
const SmartRuleGenerator = ({ game, matchType, onRulesGenerate }) => {
  const generateRules = () => {
    const baseRules = [
      'No cheating or hacking of any kind allowed',
      'Screenshots must be submitted within 10 minutes after match ends',
      'Top performers will receive cash prizes as announced',
      'Per kill bonus will be added to final prize money',
      'Match room will be created 15 minutes before start time',
      'Late entry will not be accepted once match begins',
      'All decisions by tournament admins will be final and binding',
      'Players must maintain sportsmanship throughout the tournament',
      'Any misconduct may lead to immediate disqualification',
      'Prize money will be distributed within 24 hours of match completion'
    ];

    const gameSpecificRules = {
      freefire: [
        'No use of emulators or external devices',
        'Character skills must be used fairly',
        'Team communication should be in designated channels only'
      ],
      pubg: [
        'No teaming in solo matches allowed',
        'Gameplay recording is recommended for verification',
        'Sanctioned devices only - no emulators'
      ],
      bgmi: [
        'Comply with BGMI tournament guidelines',
        'Indian server preferences apply',
        'Regional restrictions may be enforced'
      ]
    };

    const rules = [...baseRules, ...(gameSpecificRules[game] || [])];
    onRulesGenerate(rules.join('\n• '));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  return (
    <TouchableOpacity style={styles.ruleGenerator} onPress={generateRules}>
      <Ionicons name="bulb" size={18} color="#FFD700" />
      <Text style={styles.ruleGeneratorText}>Generate Smart Rules</Text>
    </TouchableOpacity>
  );
};

// 🆕 Match Template System
const MatchTemplates = ({ onTemplateSelect }) => {
  const templates = [
    {
      name: 'Quick Solo',
      game: 'freefire',
      type: 'Solo',
      entryFee: 10,
      players: 48,
      perKill: 5,
      description: 'Fast-paced solo match'
    },
    {
      name: 'Pro Squad',
      game: 'pubg',
      type: 'Squad', 
      entryFee: 40,
      players: 100,
      perKill: 12,
      description: 'Professional squad tournament'
    },
    {
      name: 'Beginner Friendly',
      game: 'freefire',
      type: 'Solo',
      entryFee: 5,
      players: 25,
      perKill: 3,
      description: 'Perfect for new players'
    }
  ];

  return (
    <View style={styles.templatesContainer}>
      <Text style={styles.templatesTitle}>🎯 Quick Templates</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.templatesList}>
          {templates.map((template, index) => (
            <TouchableOpacity
              key={index}
              style={styles.templateCard}
              onPress={() => onTemplateSelect(template)}
            >
              <Text style={styles.templateName}>{template.name}</Text>
              <Text style={template.game === 'freefire' ? styles.templateGameFF : styles.templateGamePUBG}>
                {template.game.toUpperCase()}
              </Text>
              <View style={styles.templateStats}>
                <Text style={styles.templateStat}>৳{template.entryFee} Entry</Text>
                <Text style={styles.templateStat}>{template.players} Players</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

// 🆕 Fixed DateTimePicker Component
const CustomDateTimePicker = ({ 
  value, 
  onChange, 
  mode = 'datetime',
  minimumDate = new Date(),
  isVisible,
  onClose 
}) => {
  const [currentDate, setCurrentDate] = useState(value);

  const handleChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      onClose();
    }
    
    if (selectedDate) {
      setCurrentDate(selectedDate);
      onChange(selectedDate);
    }
  };

  if (!isVisible) return null;

  return (
    <DateTimePicker
      value={currentDate}
      mode={mode}
      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
      onChange={handleChange}
      minimumDate={minimumDate}
      textColor="#ffffff"
      accentColor="#ff8a00"
      themeVariant="dark"
    />
  );
};

const CreateMatchScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { balance } = useWallet();
  
  const [formData, setFormData] = useState({
    game: '',
    matchType: '',
    title: '',
    description: '',
    entryFee: '',
    totalPrize: '',
    perKill: '',
    maxParticipants: '',
    map: '',
    version: 'Mobile',
    roomId: '',
    roomPassword: '',
    matchDate: new Date(Date.now() + 2 * 60 * 60 * 1000),
    rules: '',
    advancedSettings: {
      autoApprove: true,
      requireScreenshot: true,
      allowSpectators: false,
      minLevel: 1,
      maxLevel: 100
    }
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [manualRoomInput, setManualRoomInput] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  // 🆕 Expo Compatible Game Configuration
  const GAMES_CONFIG = {
    freefire: {
      name: 'Free Fire',
      icon: 'flame',
      color: '#FF6B00',
      modes: ['Solo', 'Duo', 'Squad', 'Clash Squad'],
      maps: ['Bermuda', 'Purgatory', 'Kalahari', 'Alpine'],
      versions: ['Mobile', 'MAX']
    },
    pubg: {
      name: 'PUBG Mobile', 
      icon: 'target',
      color: '#4CAF50',
      modes: ['Solo', 'Duo', 'Squad', 'TPP', 'FPP'],
      maps: ['Erangel', 'Miramar', 'Sanhok', 'Vikendi'],
      versions: ['Mobile', 'Lite']
    },
    cod: {
      name: 'Call of Duty',
      icon: 'sports-esports',
      color: '#2196F3',
      modes: ['Solo', 'Duo', 'Squad', 'Battle Royale', 'MP'],
      maps: ['Isolated', 'Blackout', 'Alcatraz'],
      versions: ['Mobile']
    },
    ludo: {
      name: 'Ludo King',
      icon: 'dice-five',
      color: '#9C27B0',
      modes: ['Single', 'Double', '4 Player'],
      maps: ['Classic', 'Quick', 'Master'],
      versions: ['Mobile']
    },
    bgmi: {
      name: 'BGMI',
      icon: 'mobile-alt',
      color: '#FF4444',
      modes: ['Solo', 'Duo', 'Squad'],
      maps: ['Erangel', 'Miramar', 'Livik', 'Sanhok'],
      versions: ['Mobile']
    }
  };

  // 🆕 Handle template selection
  const handleTemplateSelect = (template) => {
    setFormData(prev => ({
      ...prev,
      game: template.game,
      matchType: template.type,
      entryFee: template.entryFee.toString(),
      maxParticipants: template.players.toString(),
      perKill: template.perKill.toString()
    }));
    setCurrentStep(3);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowTemplates(false);
  };

  // ✅ FIXED: handleInputChange function
  const handleInputChange = (field, value) => {
    setFormData(prev => {
      // Create updated form data
      const updatedFormData = {
        ...prev,
        [field]: value
      };

      // Auto-calculate total prize when entryFee or maxParticipants changes
      if (field === 'entryFee' || field === 'maxParticipants') {
        const entryFee = parseFloat(updatedFormData.entryFee) || 0;
        const participants = parseInt(updatedFormData.maxParticipants) || 0;
        
        if (entryFee > 0 && participants > 0) {
          const totalPrize = (entryFee * participants) * 0.9; // 90% of total collection
          updatedFormData.totalPrize = Math.round(totalPrize).toString();
        } else {
          updatedFormData.totalPrize = '0';
        }
      }

      return updatedFormData;
    });
  };

  const handleAISuggestionApply = (suggestion) => {
    setFormData(prev => ({
      ...prev,
      entryFee: suggestion.entryFee.toString(),
      maxParticipants: suggestion.maxPlayers.toString(),
      perKill: suggestion.perKill.toString(),
      totalPrize: suggestion.prizePool.toString()
    }));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleGameSelect = (gameId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFormData(prev => ({
      ...prev,
      game: gameId,
      matchType: '',
      map: ''
    }));
    setCurrentStep(2);
  };

  const handleMatchTypeSelect = (type) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFormData(prev => ({
      ...prev,
      matchType: type
    }));
    setCurrentStep(3);
  };

  // 🆕 Manual Room ID Input (Removed Auto-generate)
  const handleManualRoomInput = () => {
    setManualRoomInput(true);
  };

  // 🆕 Fixed Date Picker Handler
  const handleDateChange = (selectedDate) => {
    if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        matchDate: selectedDate
      }));
    }
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
  };

  const handleDatePickerClose = () => {
    setShowDatePicker(false);
  };

  // 🆕 Enhanced Validation
  const validateForm = () => {
    if (!formData.game) return 'Please select a game';
    if (!formData.matchType) return 'Please select match type';
    if (!formData.title?.trim()) return 'Please enter match title';
    if (!formData.entryFee || parseFloat(formData.entryFee) < 5) return 'Minimum entry fee is ৳5';
    if (!formData.maxParticipants || parseInt(formData.maxParticipants) < 2) return 'Minimum 2 participants required';
    
    // 🆕 Manual Room ID Validation
    if (!formData.roomId?.trim()) return 'Please enter Room ID';
    if (formData.roomId.length < 4) return 'Room ID must be at least 4 characters';
    if (!formData.roomPassword?.trim()) return 'Please enter Room Password';
    if (formData.roomPassword.length < 4) return 'Password must be at least 4 characters';
    
    if (formData.matchDate <= new Date()) return 'Match time must be in future';
    
    if (parseInt(formData.maxParticipants) > 1000) return 'Maximum 1000 participants allowed';
    if (parseFloat(formData.entryFee) > 1000) return 'Maximum entry fee is ৳1000';
    
    return null;
  };

  const handleSubmit = async () => {
    const error = validateForm();
    if (error) {
      Alert.alert('Error', error);
      return;
    }

    // Check balance
    if (balance < 10) {
      Alert.alert(
        'Insufficient Balance', 
        'You need at least ৳10 in your wallet to create matches.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Add Money', onPress: () => navigation.navigate('Wallet') }
        ]
      );
      return;
    }

    setLoading(true);
    
    try {
      // Simulate API call (Expo compatible)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newMatch = {
        _id: Date.now().toString(),
        ...formData,
        status: 'pending',
        createdBy: user?.id || 'user123',
        creatorName: user?.username || 'Player',
        createdAt: new Date().toISOString(),
        currentParticipants: 0,
        spotsLeft: parseInt(formData.maxParticipants),
        registered: false,
        skillLevel: 3,
        prizeDetails: {
          first: Math.round(parseFloat(formData.totalPrize) * 0.4),
          second: Math.round(parseFloat(formData.totalPrize) * 0.3),
          third: Math.round(parseFloat(formData.totalPrize) * 0.2),
          fourth: Math.round(parseFloat(formData.totalPrize) * 0.1)
        }
      };

      console.log('Match created:', newMatch);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      Alert.alert(
        'Success! 🎉',
        `Match created successfully!\n\n📊 Match Details:\n• ${formData.title}\n• Prize: ৳${formData.totalPrize}\n• Players: ${formData.maxParticipants}\n\n✅ You earned 1 creator point!`,
        [
          {
            text: 'View Match',
            onPress: () => navigation.navigate('MatchDetails', { match: newMatch })
          },
          {
            text: 'Create Another',
            style: 'default',
            onPress: () => {
              setFormData({
                game: '',
                matchType: '',
                title: '',
                description: '',
                entryFee: '',
                totalPrize: '',
                perKill: '',
                maxParticipants: '',
                map: '',
                version: 'Mobile',
                roomId: '',
                roomPassword: '',
                matchDate: new Date(Date.now() + 2 * 60 * 60 * 1000),
                rules: '',
                advancedSettings: {
                  autoApprove: true,
                  requireScreenshot: true,
                  allowSpectators: false,
                  minLevel: 1,
                  maxLevel: 100
                }
              });
              setManualRoomInput(false);
              setCurrentStep(1);
            }
          }
        ]
      );

    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to create match. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Select Game</Text>
      <Text style={styles.stepSubtitle}>Choose the game for your match</Text>
      
      {/* Quick Templates Button */}
      <TouchableOpacity 
        style={styles.templatesButton}
        onPress={() => setShowTemplates(true)}
      >
        <Ionicons name="rocket" size={20} color="#2962ff" />
        <Text style={styles.templatesButtonText}>Use Quick Templates</Text>
      </TouchableOpacity>

      <View style={styles.gamesGrid}>
        {Object.entries(GAMES_CONFIG).map(([gameId, game]) => (
          <TouchableOpacity
            key={gameId}
            style={[
              styles.gameCard,
              formData.game === gameId && styles.gameCardSelected
            ]}
            onPress={() => handleGameSelect(gameId)}
          >
            <LinearGradient
              colors={formData.game === gameId ? 
                [game.color, `${game.color}DD`] : 
                ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
              style={styles.gameGradient}
            >
              <Ionicons name={game.icon} size={32} color="white" />
              <Text style={[
                styles.gameName,
                formData.game === gameId && styles.gameNameSelected
              ]}>
                {game.name}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Match Type</Text>
      <Text style={styles.stepSubtitle}>Select match format for {GAMES_CONFIG[formData.game]?.name}</Text>
      
      <View style={styles.matchTypesGrid}>
        {GAMES_CONFIG[formData.game]?.modes.map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.matchTypeCard,
              formData.matchType === type && styles.matchTypeCardSelected
            ]}
            onPress={() => handleMatchTypeSelect(type)}
          >
            <Text style={[
              styles.matchTypeText,
              formData.matchType === type && styles.matchTypeTextSelected
            ]}>
              {type}
            </Text>
            <Text style={styles.matchTypeSubtext}>
              {type === 'Solo' ? '1 Player' : 
               type === 'Duo' ? '2 Players' : 
               type === 'Squad' ? '4 Players' : 'Custom Format'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* AI Suggestions */}
      <AISuggestionEngine
        game={formData.game}
        matchType={formData.matchType}
        onSuggestionApply={handleAISuggestionApply}
      />
    </View>
  );

  const renderStep3 = () => (
    <KeyboardAvoidingView 
      style={styles.stepContainer}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.stepTitle}>Match Details</Text>
        <Text style={styles.stepSubtitle}>Configure your tournament settings</Text>

        {/* Profit Calculator */}
        {formData.entryFee && formData.maxParticipants && (
          <ProfitCalculator
            entryFee={formData.entryFee}
            maxPlayers={formData.maxParticipants}
            perKill={formData.perKill}
          />
        )}

        {/* Match Title */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Match Title *</Text>
          <TextInput
            style={styles.textInput}
            value={formData.title}
            onChangeText={(value) => handleInputChange('title', value)}
            placeholder="e.g., WEEKEND SHOWDOWN | SOLO MATCH"
            placeholderTextColor="#666"
          />
        </View>

        {/* Entry Fee & Participants */}
        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.inputLabel}>Entry Fee (৳) *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.entryFee}
              onChangeText={(value) => handleInputChange('entryFee', value)}
              placeholder="10"
              keyboardType="numeric"
              placeholderTextColor="#666"
            />
            <Text style={styles.inputHint}>Min: ৳5, Max: ৳1000</Text>
          </View>

          <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.inputLabel}>Max Players *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.maxParticipants}
              onChangeText={(value) => handleInputChange('maxParticipants', value)}
              placeholder="50"
              keyboardType="numeric"
              placeholderTextColor="#666"
            />
            <Text style={styles.inputHint}>Min: 2, Max: 1000</Text>
          </View>
        </View>

        {/* Prize Pool */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Total Prize Pool</Text>
          <View style={styles.prizeContainer}>
            <Text style={styles.prizeText}>৳ {formData.totalPrize || '0'}</Text>
            <Text style={styles.prizeSubtext}>Auto-calculated (90% of total entry fees)</Text>
          </View>
        </View>

        {/* Per Kill Prize */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Per Kill Prize (৳)</Text>
          <TextInput
            style={styles.textInput}
            value={formData.perKill}
            onChangeText={(value) => handleInputChange('perKill', value)}
            placeholder="5"
            keyboardType="numeric"
            placeholderTextColor="#666"
          />
        </View>

        {/* Map Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Map</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.mapsContainer}>
              {GAMES_CONFIG[formData.game]?.maps.map((map) => (
                <TouchableOpacity
                  key={map}
                  style={[
                    styles.mapButton,
                    formData.map === map && styles.mapButtonSelected
                  ]}
                  onPress={() => handleInputChange('map', map)}
                >
                  <Text style={[
                    styles.mapText,
                    formData.map === map && styles.mapTextSelected
                  ]}>
                    {map}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Match Date & Time - FIXED */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Match Date & Time *</Text>
          <TouchableOpacity 
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar" size={20} color="#ff8a00" />
            <Text style={styles.dateText}>
              {formData.matchDate.toLocaleString()}
            </Text>
          </TouchableOpacity>
          
          {/* Fixed DateTimePicker */}
          <CustomDateTimePicker
            value={formData.matchDate}
            onChange={handleDateChange}
            isVisible={showDatePicker}
            onClose={handleDatePickerClose}
          />
        </View>

        {/* 🆕 Manual Room Information Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Room Information *</Text>
          
          {!manualRoomInput ? (
            <TouchableOpacity 
              style={styles.manualInputButton}
              onPress={handleManualRoomInput}
            >
              <Ionicons name="create-outline" size={20} color="#ff8a00" />
              <Text style={styles.manualInputText}>Enter Room Details Manually</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.manualRoomContainer}>
              <View style={styles.roomInputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Room ID *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.roomId}
                    onChangeText={(value) => handleInputChange('roomId', value)}
                    placeholder="Enter Room ID"
                    placeholderTextColor="#666"
                    maxLength={20}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.inputLabel}>Password *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.roomPassword}
                    onChangeText={(value) => handleInputChange('roomPassword', value)}
                    placeholder="Enter Password"
                    placeholderTextColor="#666"
                    maxLength={20}
                    secureTextEntry
                  />
                </View>
              </View>
              <Text style={styles.roomInputHint}>
                💡 Enter the Room ID and Password you created in the game
              </Text>
            </View>
          )}
        </View>

        {/* Additional Rules */}
        <View style={styles.inputGroup}>
          <View style={styles.rulesHeader}>
            <Text style={styles.inputLabel}>Additional Rules</Text>
            <SmartRuleGenerator
              game={formData.game}
              matchType={formData.matchType}
              onRulesGenerate={(rules) => handleInputChange('rules', rules)}
            />
          </View>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={formData.rules}
            onChangeText={(value) => handleInputChange('rules', value)}
            placeholder="Any special rules or instructions..."
            placeholderTextColor="#666"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Advanced Settings */}
        <TouchableOpacity 
          style={styles.advancedToggle}
          onPress={() => setShowAdvanced(!showAdvanced)}
        >
          <Ionicons 
            name={showAdvanced ? "chevron-up" : "chevron-down"} 
            size={20} 
            color="#ff8a00" 
          />
          <Text style={styles.advancedToggleText}>
            Advanced Settings
          </Text>
        </TouchableOpacity>

        {showAdvanced && (
          <View style={styles.advancedSettings}>
            <Text style={styles.advancedTitle}>⚙️ Advanced Settings</Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Auto Approve Players</Text>
                <Text style={styles.settingDescription}>Automatically approve join requests</Text>
              </View>
              <Switch
                value={formData.advancedSettings.autoApprove}
                onValueChange={(value) => setFormData(prev => ({
                  ...prev,
                  advancedSettings: { ...prev.advancedSettings, autoApprove: value }
                }))}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={formData.advancedSettings.autoApprove ? '#ff8a00' : '#f4f3f4'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Require Screenshot Proof</Text>
                <Text style={styles.settingDescription}>Players must submit match results</Text>
              </View>
              <Switch
                value={formData.advancedSettings.requireScreenshot}
                onValueChange={(value) => setFormData(prev => ({
                  ...prev,
                  advancedSettings: { ...prev.advancedSettings, requireScreenshot: value }
                }))}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={formData.advancedSettings.requireScreenshot ? '#ff8a00' : '#f4f3f4'}
              />
            </View>
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <LinearGradient
            colors={['#ff8a00', '#ff5252']}
            style={styles.submitGradient}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="add-circle" size={24} color="white" />
                <Text style={styles.submitText}>Create Match & Earn 1 Point</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Creator Rewards */}
        <View style={styles.pointsInfo}>
          <Ionicons name="trophy" size={20} color="#FFD700" />
          <View style={styles.pointsTextContainer}>
            <Text style={styles.pointsTitle}>Creator Rewards</Text>
            <Text style={styles.pointsSubtitle}>
              • 1 point per match creation{'\n'}
              • 100 points = ৳10 withdrawal{'\n'}
              • Bonus points for popular matches
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <LinearGradient colors={['#1a237e', '#303f9f']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Match</Text>
          <View style={styles.stepsIndicator}>
            <Text style={styles.stepsText}>Step {currentStep} of 3</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressFill,
            { width: `${(currentStep / 3) * 100}%` }
          ]} 
        />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </View>

      {/* Navigation Buttons */}
      {currentStep > 1 && (
        <View style={styles.navigationButtons}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => setCurrentStep(prev => prev - 1)}
          >
            <Ionicons name="arrow-back" size={20} color="#ff8a00" />
            <Text style={styles.navButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Templates Modal */}
      <Modal
        visible={showTemplates}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTemplates(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Quick Templates</Text>
              <TouchableOpacity onPress={() => setShowTemplates(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <MatchTemplates onTemplateSelect={handleTemplateSelect} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0a0c23',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  stepsIndicator: {
    backgroundColor: 'rgba(255,138,0,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  stepsText: {
    color: '#ff8a00',
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ff8a00',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  stepSubtitle: {
    color: '#b0b8ff',
    fontSize: 16,
    marginBottom: 20,
  },
  // Templates
  templatesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(41,98,255,0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    gap: 8,
  },
  templatesButtonText: {
    color: '#2962ff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  templatesContainer: {
    marginBottom: 20,
  },
  templatesTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  templatesList: {
    flexDirection: 'row',
    gap: 12,
  },
  templateCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 12,
    width: 140,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  templateName: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  templateGameFF: {
    color: '#FF6B00',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  templateGamePUBG: {
    color: '#4CAF50',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  templateStats: {
    gap: 4,
  },
  templateStat: {
    color: '#b0b8ff',
    fontSize: 10,
  },
  // Games Grid
  gamesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gameCard: {
    width: '48%',
    height: 120,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gameGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  gameName: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
  },
  gameNameSelected: {
    color: 'white',
  },
  gameCardSelected: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  // Match Types
  matchTypesGrid: {
    gap: 12,
  },
  matchTypeCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  matchTypeCardSelected: {
    borderColor: '#ff8a00',
    backgroundColor: 'rgba(255,138,0,0.1)',
  },
  matchTypeText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  matchTypeTextSelected: {
    color: '#ff8a00',
  },
  matchTypeSubtext: {
    color: '#b0b8ff',
    fontSize: 14,
  },
  // AI Suggestions
  aiSuggestionContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
  },
  aiTitle: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  suggestionCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 12,
    borderRadius: 8,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  suggestionType: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
  },
  confidenceBadge: {
    color: '#4CAF50',
    fontSize: 10,
    fontWeight: 'bold',
    backgroundColor: 'rgba(76,175,80,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  suggestionDesc: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginBottom: 12,
  },
  suggestionStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    marginBottom: 2,
  },
  statValue: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Profit Calculator
  profitCalculator: {
    backgroundColor: 'rgba(76,175,80,0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  calculatorTitle: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  calculatorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  calcItem: {
    width: '48%',
    alignItems: 'center',
  },
  calcLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginBottom: 4,
  },
  calcValue: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  profitText: {
    color: '#4CAF50',
  },
  // Form Inputs
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 16,
    color: 'white',
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputHint: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
  },
  // Prize Container
  prizeContainer: {
    backgroundColor: 'rgba(255,215,0,0.1)',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
  },
  prizeText: {
    color: '#FFD700',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  prizeSubtext: {
    color: '#b0b8ff',
    fontSize: 12,
  },
  // Maps
  mapsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  mapButton: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  mapButtonSelected: {
    borderColor: '#ff8a00',
    backgroundColor: 'rgba(255,138,0,0.1)',
  },
  mapText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  mapTextSelected: {
    color: '#ff8a00',
  },
  // Date Picker
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  dateText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Manual Room Input
  manualInputButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,138,0,0.1)',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#ff8a00',
  },
  manualInputText: {
    color: '#ff8a00',
    fontSize: 16,
    fontWeight: '600',
  },
  manualRoomContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 12,
  },
  roomInputRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  roomInputHint: {
    color: '#b0b8ff',
    fontSize: 12,
    fontStyle: 'italic',
  },
  // Rules Generator
  rulesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ruleGenerator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,215,0,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  ruleGeneratorText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Advanced Settings
  advancedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(255,138,0,0.1)',
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  advancedToggleText: {
    color: '#ff8a00',
    fontSize: 14,
    fontWeight: 'bold',
  },
  advancedSettings: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  advancedTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  // Submit Button
  submitButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 20,
    marginBottom: 16,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitGradient: {
    padding: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  submitText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Points Info
  pointsInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,215,0,0.1)',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  pointsTextContainer: {
    flex: 1,
  },
  pointsTitle: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  pointsSubtitle: {
    color: '#b0b8ff',
    fontSize: 12,
    lineHeight: 16,
  },
  // Navigation Buttons
  navigationButtons: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
  },
  navButtonText: {
    color: '#ff8a00',
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1a1f3d',
    borderRadius: 20,
    padding: 20,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default CreateMatchScreen;
