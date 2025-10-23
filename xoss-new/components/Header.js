// components/Header.js
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const Header = ({ 
  title, 
  subtitle, 
  onBackPress,
  rightIcon,
  onRightPress,
  showNotificationBadge = false,
  notificationCount = 0,
  variant = 'default'
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Glow animation for premium variant
    if (variant === 'premium') {
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
    }
  }, []);

  const getVariantStyles = () => {
    switch (variant) {
      case 'premium':
        return {
          gradient: ['#FFD700', '#FFA000', '#FFD700'],
          iconColor: '#FF6B35',
          textColor: '#fff'
        };
      case 'success':
        return {
          gradient: ['#4CAF50', '#45a049', '#4CAF50'],
          iconColor: '#fff',
          textColor: '#fff'
        };
      case 'warning':
        return {
          gradient: ['#FF9800', '#F57C00', '#FF9800'],
          iconColor: '#fff',
          textColor: '#fff'
        };
      default:
        return {
          gradient: ['#2962ff', '#1a237e', '#2962ff'],
          iconColor: '#fff',
          textColor: '#fff'
        };
    }
  };

  const variantStyles = getVariantStyles();
  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  return (
    <Animated.View 
      style={[
        styles.headerContainer,
        { 
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }] 
        }
      ]}
    >
      <LinearGradient
        colors={variantStyles.gradient}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        {/* Glow Effect for Premium */}
        {variant === 'premium' && (
          <Animated.View 
            style={[
              styles.glowEffect,
              { opacity: glowOpacity }
            ]} 
          />
        )}

        <BlurView intensity={15} style={styles.blurOverlay} />

        <View style={styles.headerContent}>
          {/* Left Section - Back Button */}
          <View style={styles.leftSection}>
            {onBackPress && (
              <TouchableOpacity 
                onPress={onBackPress}
                style={styles.backButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="chevron-back" size={24} color={variantStyles.iconColor} />
              </TouchableOpacity>
            )}
          </View>

          {/* Center Section - Title */}
          <View style={styles.centerSection}>
            <Animated.Text 
              style={[
                styles.title,
                { color: variantStyles.textColor }
              ]}
              numberOfLines={1}
            >
              {title}
            </Animated.Text>
            {subtitle && (
              <Animated.Text 
                style={[
                  styles.subtitle,
                  { color: variantStyles.textColor }
                ]}
                numberOfLines={1}
              >
                {subtitle}
              </Animated.Text>
            )}
          </View>

          {/* Right Section - Action Button */}
          <View style={styles.rightSection}>
            {rightIcon && onRightPress && (
              <TouchableOpacity 
                onPress={onRightPress}
                style={styles.rightButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name={rightIcon} size={24} color={variantStyles.iconColor} />
                {showNotificationBadge && notificationCount > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationText}>
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Decorative Elements */}
        <View style={styles.decorativeElements}>
          <View style={[styles.decorativeCircle, { backgroundColor: variantStyles.iconColor }]} />
          <View style={[styles.decorativeSquare, { backgroundColor: variantStyles.iconColor }]} />
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  gradientBackground: {
    paddingVertical: 20,
    paddingHorizontal: 15,
    position: 'relative',
  },
  glowEffect: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFD700',
    borderRadius: 20,
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  leftSection: {
    flex: 1,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 3,
    alignItems: 'center',
  },
  rightSection: {
    flex: 1,
    alignItems: 'flex-end',
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  rightButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    position: 'relative',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    opacity: 0.9,
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  notificationText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  decorativeElements: {
    position: 'absolute',
    right: 15,
    top: 15,
    opacity: 0.2,
  },
  decorativeCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginBottom: 8,
  },
  decorativeSquare: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },
});

export default Header;
