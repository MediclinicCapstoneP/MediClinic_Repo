<template>
  <SkeletonDashboard v-if="loading" />
  <DashboardLayout
    v-else
    :navigationItems="navigationItems"
    :activeTab="activeTab"
    :onTabChange="setActiveTab"
    :user="user"
    :onSignOut="handleSignOut"
    :onSearch="handleSearch"
    variant="patient"
    :showNavbar="true"
  >
    <component :is="currentTabComponent" @navigate="setActiveTab" :patientId="patientId" />
  </DashboardLayout>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  User,
  Calendar,
  MapPin,
  History,
  Home
} from 'lucide-vue-next';
import { AuthService } from '../../modules/auth/services/AuthService';
import PatientHome from './PatientHome.vue';
import NearbyClinic from './NearbyClinic.vue';
import PatientProfileComponent from './PatientProfile.vue';
import PatientAppointments from './PatientAppointments.vue';
import PatientHistory from './PatientHistory.vue';
import { DashboardLayout } from '../../shared/components/layout/DashboardLayout/DashboardLayout.vue';
import { SkeletonDashboard } from '../../shared/components/ui/Skeleton/Skeleton.vue';

export default defineComponent({
  name: 'PatientDashboard',
  components: {
    DashboardLayout,
    SkeletonDashboard,
    PatientHome,
    NearbyClinic,
    PatientAppointments,
    PatientHistory,
    PatientProfileComponent
  },
  setup() {
    const router = useRouter();
    const user = ref<{ id?: string; name?: string; email?: string; role?: string; user?: object } | null>(null);
    const loading = ref(true);
    const activeTab = ref('home');
    const authService = new AuthService();

    const navigationItems = [
      {
        id: 'home',
        label: 'Home',
        icon: Home,
        href: '#'
      },
      {
        id: 'nearby',
        label: 'Nearby',
        icon: MapPin,
        href: '#'
      },
      {
        id: 'appointments',
        label: 'Appointments',
        icon: Calendar,
        href: '#'
      },
      {
        id: 'history',
        label: 'History',
        icon: History,
        href: '#'
      },
      {
        id: 'profile',
        label: 'Profile',
        icon: User,
        href: '#'
      }
    ];

    const patientId = computed(() => user.value?.id || user.value?.user?.id || '');

    const currentTabComponent = computed(() => {
      switch (activeTab.value) {
        case 'home':
          return PatientHome;
        case 'nearby':
          return NearbyClinic;
        case 'appointments':
          return PatientAppointments;
        case 'history':
          return PatientHistory;
        case 'profile':
          return PatientProfileComponent;
        default:
          return PatientHome;
      }
    });

    onMounted(async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        if (!currentUser) {
          router.push('/signin');
          return;
        }
        user.value = currentUser;
      } catch {
        router.push('/signin');
      } finally {
        loading.value = false;
      }
    });

    const handleSignOut = async () => {
      try {
        await authService.signOut();
        router.push('/');
      } catch (error) {
        console.error('Sign out error:', error);
      }
    };

    const handleSearch = (query: string) => {
      console.log('Patient search query:', query);
    };

    const setActiveTab = (tab: string) => {
      activeTab.value = tab;
    };

    return {
      user,
      loading,
      activeTab,
      navigationItems,
      patientId,
      currentTabComponent,
      handleSignOut,
      handleSearch,
      setActiveTab
    };
  }
});
</script>
