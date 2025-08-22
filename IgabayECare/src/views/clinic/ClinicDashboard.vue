<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Home, Calendar, Users, Settings, UserCircle } from 'lucide-vue-next';
import DashboardLayout from '../../shared/components/layout/DashboardLayout/DashboardLayout.vue';
import ClinicHome from './ClinicHome.vue';
import ClinicDoctors from './ClinicDoctors.vue';
import ClinicPatients from './ClinicPatients.vue';
import ClinicSettings from './ClinicSettings.vue';
import Appointment from './Appointment.vue';
import ManageClinic from './ManageClinic.vue';
import { AuthService } from '../../modules/auth/services/AuthService';
import SkeletonDashboard from '../../shared/components/ui/Skeleton/Skeleton.vue';

const activeTab = ref('dashboard');
const user = ref<{ id?: string; name?: string; email?: string; role?: string; clinic_id?: string; avatar?: string } | null>(null);
const loading = ref(true);
const router = useRouter();
const authService = new AuthService();

onMounted(async () => {
  await checkAuth();
});

const checkAuth = async () => {
  try {
    const currentUser = await authService.getCurrentUser();
    if (!currentUser || currentUser.role !== 'clinic') {
      router.push('/clinic-signin');
      return;
    }
    user.value = currentUser;
  } catch (error) {
    console.error('Auth check error:', error);
    router.push('/clinic-signin');
  } finally {
    loading.value = false;
  }
};

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'appointments', label: 'Appointments', icon: Calendar },
  { id: 'doctors', label: 'Doctors', icon: Users },
  // { id: 'patients', label: 'Registered Patients', icon: UserCheck },
  { id: 'manage', label: 'Manage Clinic', icon: Settings },
  { id: 'settings', label: 'Profile', icon: UserCircle },
];

const handleSignOut = async () => {
  try {
    const result = await authService.signOut();
    if (result.success) {
      // Redirect to landing page after successful sign out
      router.push('/');
    } else {
      console.error('Sign out failed:', result.error);
      // Still redirect even if there's an error
      router.push('/');
    }
  } catch (error) {
    console.error('Error during sign out:', error);
    // Redirect to landing page even if there's an error
    router.push('/');
  }
};

const handleSearch = (query: string) => {
  // TODO: Implement search functionality for clinic dashboard
  console.log('Clinic search query:', query);
};

const setActiveTab = (tab: string) => {
  activeTab.value = tab;
};
</script>

<template>
  <SkeletonDashboard v-if="loading" />
  <DashboardLayout
    v-else
    :navigationItems="navigationItems"
    :activeTab="activeTab"
    @tabChange="setActiveTab"
    @signOut="handleSignOut"
    @search="handleSearch"
    :userName="user?.name || 'Clinic Admin'"
    :userRole="'Clinic Administrator'"
    :userAvatar="user?.avatar || ''"
  >
    <component
      :is="activeTab === 'dashboard' ? ClinicHome :
           activeTab === 'appointments' ? Appointment :
           activeTab === 'doctors' ? ClinicDoctors :
           activeTab === 'patients' ? ClinicPatients :
           activeTab === 'manage' ? ManageClinic :
           activeTab === 'settings' ? ClinicSettings : ClinicHome"
      :onNavigate="setActiveTab"
      :clinicId="user?.clinic_id || ''"
    />
  </DashboardLayout>
</template>
