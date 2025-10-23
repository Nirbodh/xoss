// components/GamingBackground.js
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

const GamingBackground = ({ children, intensity = 'medium' }) => {
  const anim1 = useRef(new Animated.Value(0)).current;
  const anim2 = useRef(new Animated.Value(0)).current;
  const anim3 = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  const getIntensity = () => {
    switch (intensity) {
      case 'low': return { opacity: 0.05, blur: 5 };
      case 'medium': return { opacity: 0.08, blur: 10 };
      case 'high': return { opacity: 0.12, blur: 15 };
      default: return { opacity: 0.08, blur: 10 };
    }
  };

  const { opacity, blur } = getIntensity();

  useEffect(() => {
    // Floating animations
    const createAnimation = (anim, duration, startDelay = 0) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(startDelay),
          Animated.timing(anim, {
            toValue: 1,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );
    };

    // Pulse animation for background
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
      ])
    );

    const anim1Loop = createAnimation(anim1, 15000);
    const anim2Loop = createAnimation(anim2, 12000, 2000);
    const anim3Loop = createAnimation(anim3, 18000, 4000);

    anim1Loop.start();
    anim2Loop.start();
    anim3Loop.start();
    pulseAnimation.start();

    return () => {
      anim1Loop.stop();
      anim2Loop.stop();
      anim3Loop.stop();
      pulseAnimation.stop();
    };
  }, []);

  const translateY1 = anim1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -30],
  });

  const translateY2 = anim2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 40],
  });

  const translateY3 = anim3.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });

  const rotate1 = anim1.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const rotate2 = anim2.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-360deg'],
  });

  const backgroundColor = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(10, 12, 35, 0.3)', 'rgba(26, 35, 126, 0.2)'],
  });

  return (
    <View style={styles.container}>
      {/* Animated Background Color */}
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor }]} />

      {/* Main Gradient Background */}
      <LinearGradient
        colors={['#0a0c23', '#1a1a2e', '#16213e']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Animated Background Elements */}
      <Animated.View 
        style={[
          styles.backgroundElement1, 
          { 
            transform: [{ translateY: translateY1 }, { rotate: rotate1 }],
            opacity 
          }
        ]} 
      />
      
      <Animated.View 
        style={[
          styles.backgroundElement2, 
          { 
            transform: [{ translateY: translateY2 }, { rotate: rotate2 }],
            opacity: opacity * 1.2
          }
        ]} 
      />
      
      <Animated.View 
        style={[
          styles.backgroundElement3, 
          { 
            transform: [{ translateY: translateY3 }],
            opacity: opacity * 0.8
          }
        ]} 
      />

      {/* Additional Floating Elements */}
      <Animated.View style={[styles.floatingElement1, { transform: [{ translateY: translateY1 }] }]} />
      <Animated.View style={[styles.floatingElement2, { transform: [{ translateY: translateY2 }] }]} />
      <Animated.View style={[styles.floatingElement3, { transform: [{ translateY: translateY3 }] }]} />

      {/* Grid Pattern Overlay */}
      <View style={styles.gridOverlay}>
        {[...Array(15)].map((_, i) => (
          <View key={`h-${i}`} style={styles.gridLineHorizontal} />
        ))}
        {[...Array(10)].map((_, i) => (
          <View key={`v-${i}`} style={styles.gridLineVertical} />
        ))}
      </View>

      {/* Blur Overlay */}
      <BlurView intensity={blur} style={styles.blurOverlay} />

      {/* Content */}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0c23',
    position: 'relative',
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    zIndex: 10,
  },
  backgroundElement1: {
    position: 'absolute',
    top: '10%',
    left: '5%',
    width: 120,
    height: 120,
    backgroundColor: 'rgba(41, 98, 255, 0.15)',
    borderRadius: 60,
    shadowColor: '#2962ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  backgroundElement2: {
    position: 'absolute',
    bottom: '15%',
    right: '8%',
    width: 180,
    height: 180,
    backgroundColor: 'rgba(255, 138, 0, 0.1)',
    borderRadius: 90,
    shadowColor: '#FF8A00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
  },
  backgroundElement3: {
    position: 'absolute',
    top: '40%',
    left: '60%',
    width: 100,
    height: 100,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 50,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  floatingElement1: {
    position: 'absolute',
    top: '70%',
    left: '20%',
    width: 60,
    height: 60,
    backgroundColor: 'rgba(156, 39, 176, 0.08)',
    borderRadius: 30,
  },
  floatingElement2: {
    position: 'absolute',
    top: '20%',
    right: '20%',
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255, 193, 7, 0.06)',
    borderRadius: 40,
  },
  floatingElement3: {
    position: 'absolute',
    bottom: '30%',
    left: '15%',
    width: 40,
    height: 40,
    backgroundColor: 'rgba(33, 150, 243, 0.07)',
    borderRadius: 20,
  },
  gridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.03,
  },
  gridLineHorizontal: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: height / 30,
  },
  gridLineVertical: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: width / 20,
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.05,
  },
});

export default GamingBackground;
