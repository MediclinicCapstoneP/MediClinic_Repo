import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';

export default function SplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const loadingProgressAnim = useRef(new Animated.Value(0)).current;
  const { user, loading } = useAuth();

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();

    // Start loading progress animation
    Animated.timing(loadingProgressAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: false,
    }).start();

    // Navigate based on auth state after shorter delay
    const timer = setTimeout(() => {
      if (!loading) {
        if (user) {
          // User is authenticated, redirect to appropriate dashboard
          const roleRoutes = {
            patient: '/(tabs)/patient',
            clinic: '/(tabs)/doctor', // Clinics use doctor interface
            doctor: '/(tabs)/doctor',
          };
          const targetRoute = roleRoutes[user.role] as any || '/(auth)/login';
          router.replace(targetRoute);
        } else {
          // User not authenticated, go to login
          router.replace('/(auth)/login');
        }
      }
    }, 1500); // Reduced from 3000ms to 1500ms for faster navigation

    return () => {
      clearTimeout(timer);
    };
  }, [user, loading]);

  return (
    <LinearGradient
      colors={['#1E40AF', '#2563EB', '#3B82F6']}
      style={styles.container}
    >
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.logoContainer}>
          <Heart size={64} color="#FFFFFF" fill="#FFFFFF" />
        </View>
        
        <Text style={styles.appName}>MediClinic</Text>
        <Text style={styles.tagline}>Your Health, Our Priority</Text>
        
        <View style={styles.loadingContainer}>
          <View style={styles.loadingBar}>
            <Animated.View
              style={[
                styles.loadingProgress,
                {
                  width: loadingProgressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                    extrapolate: 'clamp',
                  }),
                },
              ]}
            />
          </View>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 48,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingBar: {
    width: 200,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 16,
  },
  loadingProgress: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  loadingText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
});