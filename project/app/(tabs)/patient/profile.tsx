import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Settings, Bell, Shield, CircleHelp as HelpCircle, LogOut, ChevronRight, CreditCard as Edit } from 'lucide-react-native';
import { useAuth } from '../../../contexts/AuthContext';

const menuItems = [
  { id: '1', title: 'Edit Profile', icon: Edit, color: '#2563EB' },
  { id: '2', title: 'Notifications', icon: Bell, color: '#059669' },
  { id: '3', title: 'Privacy & Security', icon: Shield, color: '#DC2626' },
  { id: '4', title: 'Help & Support', icon: HelpCircle, color: '#F59E0B' },
  { id: '5', title: 'Settings', icon: Settings, color: '#6B7280' },
];

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.profile?.data?.first_name ? `${user.profile.data.first_name} ${user.profile.data.last_name || ''}` : 'John Doe',
    email: user?.email || 'john.doe@example.com',
    phone: user?.profile?.data?.phone || '+63 912 345 6789',
    address: 'Makati City, Metro Manila',
    memberSince: 'January 2024',
  });

  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
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
              await signOut();
              router.replace('/(auth)/login');
            } catch (error) {
              console.error('Sign out error:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleSaveProfile = () => {
    setIsEditing(false);
    Alert.alert('Success', 'Profile updated successfully!');
  };

  const handleInputChange = (field: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleMenuPress = (itemId: string, title: string) => {
    switch (itemId) {
      case '1': // Edit Profile
        setIsEditing(true);
        break;
      case '2': // Notifications
        Alert.alert('Notifications', 'Notification settings coming soon!');
        break;
      case '3': // Privacy & Security
        Alert.alert('Privacy & Security', 'Privacy settings coming soon!');
        break;
      case '4': // Help & Support
        Alert.alert('Help & Support', 'Help center coming soon!');
        break;
      case '5': // Settings
        Alert.alert('Settings', 'App settings coming soon!');
        break;
      default:
        Alert.alert('Coming Soon', `${title} feature is under development.`);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Simulate API calls to refresh profile data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // You can add actual data refresh logic here:
      // - Refresh user profile information
      // - Update appointment statistics
      // - Refresh user preferences
      // - Update notification settings
      
      console.log('Profile data refreshed successfully');
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  return (
    <LinearGradient
      colors={['#eff6ff', '#ecfdf5', '#ecfeff']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#2563EB']} // Android
              tintColor={'#2563EB'} // iOS
              title="Pull to refresh" // iOS
              titleColor={'#6B7280'} // iOS
            />
          }
        >
          {/* Profile Header */}
          <View style={styles.header}>
            <View style={styles.avatar}>
              <User size={40} color="#FFFFFF" />
            </View>
            {isEditing ? (
              <View style={styles.editForm}>
                <TextInput
                  style={styles.editInput}
                  value={profileData.name}
                  onChangeText={(value) => handleInputChange('name', value)}
                  placeholder="Full Name"
                />
                <TextInput
                  style={styles.editInput}
                  value={profileData.email}
                  onChangeText={(value) => handleInputChange('email', value)}
                  placeholder="Email"
                  keyboardType="email-address"
                />
                <TextInput
                  style={styles.editInput}
                  value={profileData.phone}
                  onChangeText={(value) => handleInputChange('phone', value)}
                  placeholder="Phone"
                  keyboardType="phone-pad"
                />
                <TextInput
                  style={styles.editInput}
                  value={profileData.address}
                  onChangeText={(value) => handleInputChange('address', value)}
                  placeholder="Address"
                />
                <View style={styles.editButtons}>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => setIsEditing(false)}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                <Text style={styles.name}>{profileData.name}</Text>
                <Text style={styles.email}>{profileData.email}</Text>
                <Text style={styles.memberSince}>Member since {profileData.memberSince}</Text>
              </>
            )}
          </View>

          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>Appointments</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>8</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>4.9</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </View>

          {/* Menu Items */}
          <View style={styles.menuSection}>
            {menuItems.map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={styles.menuItem}
                onPress={() => handleMenuPress(item.id, item.title)}
              >
                <View style={[styles.menuIcon, { backgroundColor: `${item.color}15` }]}>
                  <item.icon size={20} color={item.color} />
                </View>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <ChevronRight size={20} color="#6B7280" />
              </TouchableOpacity>
            ))}
          </View>

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={20} color="#DC2626" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  menuSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuTitle: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 32,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutText: {
    fontSize: 16,
    color: '#DC2626',
    fontWeight: '600',
  },
  editForm: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  editInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    width: '80%',
    textAlign: 'center',
  },
  editButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#6B7280',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
});
