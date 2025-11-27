import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { User, Edit, LogOut, ChevronDown } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { router } from 'expo-router';

const { width: screenWidth } = Dimensions.get('window');

interface UserProfileDropdownProps {
  onEditProfile?: () => void;
  onSignOut?: () => void;
}

export default function UserProfileDropdown({ 
  onEditProfile, 
  onSignOut 
}: UserProfileDropdownProps) {
  const [isVisible, setIsVisible] = useState(false);
  const { user, signOut } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  const userName = (user?.profile as any)?.data?.first_name && (user?.profile as any)?.data?.last_name
    ? `${(user?.profile as any)?.data?.first_name} ${(user?.profile as any)?.data?.last_name}`
    : (user?.profile as any)?.data?.first_name || 'Patient';

  const userInitials = userName
    .split(' ')
    .map((name: string) => name[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const toggleDropdown = () => {
    if (isVisible) {
      // Hide animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => setIsVisible(false));
    } else {
      // Show animation
      setIsVisible(true);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const handleEditProfile = () => {
    setIsVisible(false);
    if (onEditProfile) {
      onEditProfile();
    } else {
      // Navigate to appropriate home screen based on user role
      if (user?.role === 'patient') {
        router.push('/(tabs)/patient');
      } else if (user?.role === 'doctor' || user?.role === 'clinic') {
        router.push('/(tabs)/doctor');
      } else {
        // Fallback to patient home for unknown roles
        router.push('/(tabs)/patient');
      }
    }
  };

  const handleSignOut = () => {
    setIsVisible(false);
    
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of your account?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              if (onSignOut) {
                onSignOut();
              } else {
                await signOut();
                router.replace('/(auth)/login');
              }
            } catch (error) {
              console.error('Sign out error:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <>
      <TouchableOpacity style={styles.profileButton} onPress={toggleDropdown}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{userInitials}</Text>
        </View>
        <ChevronDown 
          size={16} 
          color="#6B7280" 
          style={[
            styles.chevron,
            { transform: [{ rotate: isVisible ? '180deg' : '0deg' }] }
          ]} 
        />
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        transparent
        animationType="none"
        onRequestClose={() => setIsVisible(false)}
      >
        <TouchableOpacity 
          style={styles.overlay} 
          activeOpacity={1} 
          onPress={() => setIsVisible(false)}
        >
          <Animated.View
            style={[
              styles.dropdown,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <View style={styles.dropdownHeader}>
              <View style={styles.dropdownAvatar}>
                <Text style={styles.dropdownAvatarText}>{userInitials}</Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.signedInText}>Signed in as</Text>
                <Text style={styles.userName}>{userName}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.menuItem} onPress={handleEditProfile}>
              <User size={18} color="#6B7280" />
              <Text style={styles.menuItemText}>Edit Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handleSignOut}>
              <LogOut size={18} color="#DC2626" />
              <Text style={[styles.menuItemText, styles.signOutText]}>Sign Out</Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  chevron: {
    marginLeft: 2,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 100,
    paddingRight: 20,
  },
  dropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    minWidth: 200,
    maxWidth: screenWidth - 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    overflow: 'hidden',
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
  },
  dropdownAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  dropdownAvatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  signedInText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  menuItemText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  signOutText: {
    color: '#DC2626',
  },
});
