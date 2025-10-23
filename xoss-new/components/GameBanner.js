// components/GameBanner.js
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const GameBanner = ({ 
  game, 
  title, 
  subtitle, 
  size = 'large',
  onPress,
  isLive = false,
  participants = 0,
  maxParticipants = 100,
  timeLeft = "2:30:00"
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const getGameConfig = (gameName) => {
    const configs = {
      'free fire': {
        gradient: ['#FF6B00', '#FF8A00', '#FF6B00'],
        icon: '🔥',
        accentColor: '#FF8A00'
      },
      'pubg mobile': {
        gradient: ['#4CAF50', '#45a049', '#4CAF50'],
        icon: '🎯',
        accentColor: '#4CAF50'
      },
      'ludo king': {
        gradient: ['#9C27B0', '#8E24AA', '#9C27B0'],
        icon: '🎲',
        accentColor: '#9C27B0'
      },
      'cod mobile': {
        gradient: ['#2196F3', '#1976D2', '#2196F3'],
        icon: '🔫',
        accentColor: '#2196F3'
      },
      'bgmi': {
        gradient: ['#FF9800', '#F57C00', '#FF9800'],
        icon: '📱',
        accentColor: '#FF9800'
      },
      'default': {
        gradient: ['#2962ff', '#1a237e', '#2962ff'],
        icon: '🎮',
        accentColor: '#2962ff'
      }
    };
    
    return configs[gameName?.toLowerCase()] || configs.default;
  };

  useEffect(() => {
    // Glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
      ])
    ).start();

    // Progress animation
    Animated.timing(progressAnim, {
      toValue: participants / maxParticipants,
      duration: 1000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [participants]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const config = getGameConfig(game);
  const isLarge = size === 'large';
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const BannerContent = () => (
    <LinearGradient 
      colors={config.gradient} 
      style={[styles.banner, isLarge ? styles.largeBanner : styles.smallBanner]}
    >
      {/* Animated Glow Effect */}
      <Animated.View style={[styles.glowEffect, { opacity: glowOpacity }]} />

      {/* Blur Overlay */}
      <BlurView intensity={15} style={styles.blurOverlay} />

      {/* Pattern Background */}
      <View style={styles.patternBackground}>
        <Text style={styles.patternText}>{config.icon.repeat(8)}</Text>
      </View>

      {/* Content Container */}
      <View style={styles.bannerContent}>
        {/* Game Icon */}
        <View style={styles.iconContainer}>
          <View style={[styles.gameIcon, { borderColor: config.accentColor }]}>
            <Text style={styles.gameIconText}>{config.icon}</Text>
          </View>
          {isLive && (
            <View style={styles.liveBadge}>
              <View style={styles.livePulse} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          )}
        </View>

        {/* Text Content */}
        <View style={styles.textContainer}>
          <Text style={isLarge ? styles.titleLarge : styles.titleSmall} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={isLarge ? styles.subtitleLarge : styles.subtitleSmall} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
          
          {/* Progress Bar */}
          {isLarge && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBackground}>
                <Animated.View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: progressWidth,
                      backgroundColor: config.accentColor 
                    }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {participants}/{maxParticipants} • {timeLeft}
              </Text>
            </View>
          )}
        </View>

        {/* Action Indicator */}
        <View style={styles.actionIndicator}>
          <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
        </View>
      </View>

      {/* Decorative Elements */}
      <View style={styles.decorativeElements}>
        <View style={[styles.decorativeCircle, { backgroundColor: config.accentColor }]} />
        <View style={[styles.decorativeSquare, { backgroundColor: config.accentColor }]} />
      </View>
    </LinearGradient>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <BannerContent />
        </Animated.View>
      </TouchableOpacity>
    );
  }

  return <BannerContent />;
};

const styles = StyleSheet.create({
  banner: {
    borderRadius: 20,
    overflow: 'hidden',
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    position: 'relative',
  },
  largeBanner: {
    height: 140,
    padding: 20,
  },
  smallBanner: {
    height: 90,
    padding: 15,
  },
  glowEffect: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'white',
    borderRadius: 20,
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.1,
  },
  patternBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  patternText: {
    fontSize: 32,
    color: 'white',
    transform: [{ rotate: '-15deg' }],
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    zIndex: 2,
  },
  iconContainer: {
    position: 'relative',
    marginRight: 15,
  },
  gameIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  gameIconText: {
    fontSize: 28,
    color: 'white',
  },
  liveBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    shadowColor: '#FF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  livePulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'white',
    marginRight: 2,
  },
  liveText: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  titleLarge: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  titleSmall: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subtitleLarge: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 10,
  },
  subtitleSmall: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBackground: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  actionIndicator: {
    marginLeft: 10,
  },
  decorativeElements: {
    position: 'absolute',
    right: 20,
    top: 15,
    opacity: 0.3,
  },
  decorativeCircle: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    marginBottom: 8,
    opacity: 0.4,
  },
  decorativeSquare: {
    width: 25,
    height: 25,
    borderRadius: 5,
    opacity: 0.4,
  },
});

export default GameBanner;
