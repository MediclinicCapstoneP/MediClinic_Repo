import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  Modal,
  Dimensions,
  ActivityIndicator,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doctorProfileService, DoctorProfile, DoctorProfileUpdate } from '../../services/doctorProfileService';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');

export const DoctorProfileManager: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalAppointments: 0,
    completedAppointments: 0,
    totalPatients: 0,
    averageRating: 0,
    yearsOfExperience: 0,
    totalRevenue: 0,
    upcomingAppointments: 0
  });
  const [reviews, setReviews] = useState<any[]>([]);

  // Form state
  const [form, setForm] = useState<DoctorProfileUpdate>({
    first_name: '',
    last_name: '',
    phone: '',
    specialization: '',
    license_number: '',
    experience_years: 0,
    education: '',
    bio: '',
    consultation_fee: 0
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (user) {
      fetchDoctorId();
    }
  }, [user]);

  useEffect(() => {
    if (doctorId) {
      fetchProfile();
      fetchStats();
      fetchReviews();
    }
  }, [doctorId]);

  const fetchDoctorId = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setDoctorId(data.id);
    } catch (error) {
      console.error('Error fetching doctor ID:', error);
    }
  };

  const fetchProfile = async () => {
    if (!doctorId) return;

    try {
      const { data, error } = await doctorProfileService.getDoctorProfile(doctorId);

      if (error) {
        Alert.alert('Error', error);
        return;
      }

      setProfile(data);
      setForm({
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
        specialization: data.specialization,
        license_number: data.license_number,
        experience_years: data.experience_years,
        education: data.education,
        bio: data.bio || '',
        consultation_fee: data.consultation_fee
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!doctorId) return;

    try {
      const { data, error } = await doctorProfileService.getDoctorStats(doctorId);

      if (error) {
        console.error('Error fetching stats:', error);
        return;
      }

      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchReviews = async () => {
    if (!doctorId) return;

    try {
      const { data, error } = await doctorProfileService.getDoctorReviews(doctorId, 5);

      if (error) {
        console.error('Error fetching reviews:', error);
        return;
      }

      setReviews(data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleUpdateProfile = async () => {
    if (!doctorId) return;

    // Validate form
    const validation = await doctorProfileService.validateProfileData(form);
    if (!validation.valid) {
      Alert.alert('Validation Error', validation.errors?.join('\n') || 'Please check your input');
      return;
    }

    if (validation.warnings && validation.warnings.length > 0) {
      Alert.alert(
        'Profile Warnings',
        validation.warnings.join('\n\n') + '\n\nDo you want to continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Continue',
            onPress: () => updateProfile()
          }
        ]
      );
    } else {
      updateProfile();
    }
  };

  const updateProfile = async () => {
    setSaving(true);
    try {
      const { success, data, error } = await doctorProfileService.updateDoctorProfile(doctorId, form);

      if (!success) {
        Alert.alert('Error', error || 'Failed to update profile');
        return;
      }

      Alert.alert('Success', 'Profile updated successfully');
      setShowEditModal(false);
      setProfile(data);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!doctorId) return;

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    try {
      const { success, error } = await doctorProfileService.changePassword(
        doctorId,
        passwordForm.currentPassword,
        passwordForm.newPassword
      );

      if (!success) {
        Alert.alert('Error', error || 'Failed to change password');
        return;
      }

      Alert.alert('Success', 'Password changed successfully');
      setShowPasswordModal(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error changing password:', error);
      Alert.alert('Error', 'Failed to change password');
    }
  };

  const handleImagePicker = async (option: 'camera' | 'gallery') => {
    if (!doctorId) return;

    try {
      let result;
      if (option === 'camera') {
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
        });
      }

      if (!result.canceled && result.assets[0]) {
        const imageFile = {
          uri: result.assets[0].uri,
          type: result.assets[0].mimeType || 'image/jpeg',
          name: result.assets[0].fileName || 'profile.jpg'
        };

        const { success, error, imageUrl } = await doctorProfileService.uploadProfileImage(doctorId, imageFile);

        if (!success) {
          Alert.alert('Error', error || 'Failed to upload profile image');
          return;
        }

        Alert.alert('Success', 'Profile image updated');
        setShowImagePicker(false);
        fetchProfile(); // Refresh profile data
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleRemoveImage = () => {
    if (!doctorId || !profile) return;

    Alert.alert(
      'Remove Profile Image',
      'Are you sure you want to remove your profile image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const { success, error } = await doctorProfileService.removeProfileImage(doctorId);

              if (!success) {
                Alert.alert('Error', error || 'Failed to remove profile image');
                return;
              }

              Alert.alert('Success', 'Profile image removed');
              fetchProfile(); // Refresh profile data
            } catch (error) {
              console.error('Error removing image:', error);
              Alert.alert('Error', 'Failed to remove profile image');
            }
          }
        }
      ]
    );
  };

  const handleToggleAvailability = async () => {
    if (!doctorId || !profile) return;

    try {
      const { success, error } = await doctorProfileService.updateAvailabilityStatus(
        doctorId,
        !profile.is_active
      );

      if (!success) {
        Alert.alert('Error', error || 'Failed to update availability');
        return;
      }

      Alert.alert('Success', `Availability ${!profile.is_active ? 'enabled' : 'disabled'}`);
      fetchProfile(); // Refresh profile data
    } catch (error) {
      console.error('Error updating availability:', error);
      Alert.alert('Error', 'Failed to update availability');
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={16}
          color={i <= rating ? '#F59E0B' : '#D1D5DB'}
        />
      );
    }
    return stars;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
            {profile?.profile_image_url ? (
              <Image source={{ uri: profile.profile_image_url }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Ionicons name="person" size={48} color="#9CA3AF" />
              </View>
            )}
            <TouchableOpacity
              style={styles.imageEditButton}
              onPress={() => setShowImagePicker(true)}
            >
              <Ionicons name="camera" size={20} color="white" />
            </TouchableOpacity>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {profile?.first_name} {profile?.last_name}
            </Text>
            <Text style={styles.profileSpecialization}>{profile?.specialization}</Text>
            <View style={styles.profileStatus}>
              <View style={[
                styles.statusIndicator,
                { backgroundColor: profile?.is_active ? '#10B981' : '#EF4444' }
              ]} />
              <Text style={styles.statusText}>
                {profile?.is_active ? 'Available' : 'Unavailable'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.availabilityButton}
            onPress={handleToggleAvailability}
          >
            <Ionicons
              name={profile?.is_active ? 'pause-circle' : 'play-circle'}
              size={24}
              color={profile?.is_active ? '#EF4444' : '#10B981'}
            />
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="calendar" size={24} color="#2563EB" />
            <Text style={styles.statValue}>{stats.totalAppointments}</Text>
            <Text style={styles.statLabel}>Total Appointments</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="people" size={24} color="#10B981" />
            <Text style={styles.statValue}>{stats.totalPatients}</Text>
            <Text style={styles.statLabel}>Total Patients</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="star" size={24} color="#F59E0B" />
            <Text style={styles.statValue}>{stats.averageRating.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Average Rating</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="cash" size={24} color="#8B5CF6" />
            <Text style={styles.statValue}>₱{stats.totalRevenue.toFixed(0)}</Text>
            <Text style={styles.statLabel}>Total Revenue</Text>
          </View>
        </View>

        {/* Profile Details */}
        <View style={styles.detailsContainer}>
          <View style={styles.detailsHeader}>
            <Text style={styles.detailsTitle}>Profile Details</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setShowEditModal(true)}
            >
              <Ionicons name="create" size={20} color="#2563EB" />
            </TouchableOpacity>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Email</Text>
            <Text style={styles.detailValue}>{profile?.email}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Phone</Text>
            <Text style={styles.detailValue}>{profile?.phone}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>License Number</Text>
            <Text style={styles.detailValue}>{profile?.license_number}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Experience</Text>
            <Text style={styles.detailValue}>{profile?.experience_years} years</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Education</Text>
            <Text style={styles.detailValue}>{profile?.education}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Consultation Fee</Text>
            <Text style={styles.detailValue}>₱{profile?.consultation_fee}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Clinic</Text>
            <Text style={styles.detailValue}>{profile?.clinic?.clinic_name}</Text>
          </View>

          {profile?.bio && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Bio</Text>
              <Text style={styles.detailValue}>{profile.bio}</Text>
            </View>
          )}
        </View>

        {/* Recent Reviews */}
        <View style={styles.reviewsContainer}>
          <Text style={styles.reviewsTitle}>Recent Reviews</Text>
          {reviews.length === 0 ? (
            <Text style={styles.noReviewsText}>No reviews yet</Text>
          ) : (
            reviews.map((review, index) => (
              <View key={index} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewPatientName}>
                    {review.patient.first_name} {review.patient.last_name}
                  </Text>
                  <View style={styles.reviewRating}>
                    {renderStars(review.rating)}
                  </View>
                </View>
                <Text style={styles.reviewComment}>{review.comment}</Text>
                <Text style={styles.reviewDate}>
                  {new Date(review.created_at).toLocaleDateString()}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowPasswordModal(true)}
          >
            <Ionicons name="lock-closed" size={20} color="#2563EB" />
            <Text style={styles.actionButtonText}>Change Password</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent} nestedScrollEnabled={false}>
            <Text style={styles.modalTitle}>Edit Profile</Text>

            <Text style={styles.inputLabel}>First Name *</Text>
            <TextInput
              style={styles.input}
              value={form.first_name}
              onChangeText={(text) => setForm({ ...form, first_name: text })}
            />

            <Text style={styles.inputLabel}>Last Name *</Text>
            <TextInput
              style={styles.input}
              value={form.last_name}
              onChangeText={(text) => setForm({ ...form, last_name: text })}
            />

            <Text style={styles.inputLabel}>Phone *</Text>
            <TextInput
              style={styles.input}
              value={form.phone}
              onChangeText={(text) => setForm({ ...form, phone: text })}
              keyboardType="phone-pad"
            />

            <Text style={styles.inputLabel}>Specialization *</Text>
            <TextInput
              style={styles.input}
              value={form.specialization}
              onChangeText={(text) => setForm({ ...form, specialization: text })}
            />

            <Text style={styles.inputLabel}>License Number *</Text>
            <TextInput
              style={styles.input}
              value={form.license_number}
              onChangeText={(text) => setForm({ ...form, license_number: text })}
            />

            <Text style={styles.inputLabel}>Years of Experience *</Text>
            <TextInput
              style={styles.input}
              value={form.experience_years.toString()}
              onChangeText={(text) => setForm({ ...form, experience_years: parseInt(text) || 0 })}
              keyboardType="numeric"
            />

            <Text style={styles.inputLabel}>Education *</Text>
            <TextInput
              style={styles.input}
              value={form.education}
              onChangeText={(text) => setForm({ ...form, education: text })}
            />

            <Text style={styles.inputLabel}>Consultation Fee *</Text>
            <TextInput
              style={styles.input}
              value={form.consultation_fee.toString()}
              onChangeText={(text) => setForm({ ...form, consultation_fee: parseFloat(text) || 0 })}
              keyboardType="numeric"
            />

            <Text style={styles.inputLabel}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={form.bio}
              onChangeText={(text) => setForm({ ...form, bio: text })}
              multiline
              numberOfLines={4}
              placeholder="Tell patients about yourself..."
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleUpdateProfile}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        visible={showPasswordModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Password</Text>

            <Text style={styles.inputLabel}>Current Password</Text>
            <TextInput
              style={styles.input}
              value={passwordForm.currentPassword}
              onChangeText={(text) => setPasswordForm({ ...passwordForm, currentPassword: text })}
              secureTextEntry
            />

            <Text style={styles.inputLabel}>New Password</Text>
            <TextInput
              style={styles.input}
              value={passwordForm.newPassword}
              onChangeText={(text) => setPasswordForm({ ...passwordForm, newPassword: text })}
              secureTextEntry
            />

            <Text style={styles.inputLabel}>Confirm New Password</Text>
            <TextInput
              style={styles.input}
              value={passwordForm.confirmPassword}
              onChangeText={(text) => setPasswordForm({ ...passwordForm, confirmPassword: text })}
              secureTextEntry
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowPasswordModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleChangePassword}
              >
                <Text style={styles.saveButtonText}>Change Password</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Image Picker Modal */}
      <Modal
        visible={showImagePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowImagePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Profile Image</Text>

            <TouchableOpacity
              style={styles.imageOptionButton}
              onPress={() => handleImagePicker('camera')}
            >
              <Ionicons name="camera" size={24} color="#2563EB" />
              <Text style={styles.imageOptionText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.imageOptionButton}
              onPress={() => handleImagePicker('gallery')}
            >
              <Ionicons name="images" size={24} color="#2563EB" />
              <Text style={styles.imageOptionText}>Choose from Gallery</Text>
            </TouchableOpacity>

            {profile?.profile_image_url && (
              <TouchableOpacity
                style={[styles.imageOptionButton, styles.removeImageButton]}
                onPress={handleRemoveImage}
              >
                <Ionicons name="trash" size={24} color="#EF4444" />
                <Text style={[styles.imageOptionText, { color: '#EF4444' }]}>
                  Remove Current Image
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowImagePicker(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  profileHeader: {
    backgroundColor: 'white',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profileImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageEditButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#2563EB',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  profileSpecialization: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  profileStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#6B7280',
  },
  availabilityButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  detailsContainer: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  editButton: {
    padding: 8,
  },
  detailRow: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: '#374151',
  },
  reviewsContainer: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  reviewsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  noReviewsText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  reviewCard: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewPatientName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  reviewRating: {
    flexDirection: 'row',
  },
  reviewComment: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  reviewDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  actionButtonsContainer: {
    padding: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2563EB',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: width - 32,
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  saveButton: {
    backgroundColor: '#2563EB',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
  },
  imageOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 12,
  },
  imageOptionText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
  },
  removeImageButton: {
    backgroundColor: '#FEF2F2',
  },
});
