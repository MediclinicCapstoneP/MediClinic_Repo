<script setup lang="ts">
import { ref } from 'vue';
import {
  Users,
  Calendar,
  TrendingUp,
  Activity,
  Clock,
  Star,
  Building,
  Phone,
  Mail,
  MapPin,
  Settings,
  Bell,
  Award,
  Shield,
  DollarSign,
  UserCheck,
  Eye,
  MoreHorizontal,
} from 'lucide-vue-next';

import Card from '../../components/ui/Card.vue';
import Button from '../../components/ui/Button.vue';
import LatestReviews from '../../components/dashboard/LatestReviews.vue';
import { Pie } from 'vue-chartjs';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from 'chart.js';
ChartJS.register(ArcElement, Tooltip, Legend, Title);

const props = defineProps<{
  onNavigate: (tab: string) => void;
}>();

const hoveredCard = ref<string | null>(null);

const quickActions = [
  {
    id: 'appointments',
    title: 'Manage Appointments',
    description: 'View and schedule patient appointments',
    icon: Calendar,
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50',
    iconColor: 'text-blue-600',
    action: () => props.onNavigate('appointments'),
  },
  {
    id: 'doctors',
    title: 'Manage Doctors',
    description: "Manage your clinic's doctors and medical staff",
    icon: Users,
    color: 'from-green-500 to-green-600',
    bgColor: 'bg-green-50',
    iconColor: 'text-green-600',
    action: () => props.onNavigate('doctors'),
  },
  {
    id: 'patients',
    title: 'Registered Patients',
    description: 'View and manage registered patient records',
    icon: Users,
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-50',
    iconColor: 'text-purple-600',
    action: () => props.onNavigate('patients'),
  },
];

const recentActivity = [
  {
    id: 1,
    type: 'appointment',
    title: 'New Appointment',
    description: 'John Doe - General Checkup',
    time: '30 minutes ago',
    icon: Calendar,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    id: 2,
    type: 'patient',
    title: 'Patient Registered',
    description: 'Jane Smith - New patient profile created',
    time: '2 hours ago',
    icon: UserCheck,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  {
    id: 3,
    type: 'review',
    title: 'New Review',
    description: '5-star rating from patient visit',
    time: '1 day ago',
    icon: Star,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
  },
];

const appointmentData = {
  labels: ['Completed', 'Scheduled', 'Cancelled'],
  datasets: [
    {
      data: [65, 25, 10],
      backgroundColor: ['#10b981', '#3b82f6', '#ef4444'],
      borderWidth: 0,
    },
  ],
};

const patientData = {
  labels: ['New', 'Returning', 'Referred'],
  datasets: [
    {
      data: [30, 55, 15],
      backgroundColor: ['#3b82f6', '#10b981', '#8b5cf6'],
      borderWidth: 0,
    },
  ],
};

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        boxWidth: 12,
        padding: 15,
        font: {
          size: 12,
        },
      },
    },
  },
};

const stats = [
  {
    title: 'Total Appointments',
    value: '128',
    change: '+12%',
    trend: 'up',
    icon: Calendar,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    title: 'Active Doctors',
    value: '24',
    change: '+2',
    trend: 'up',
    icon: Users,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  {
    title: 'Patient Satisfaction',
    value: '4.8',
    change: '+0.2',
    trend: 'up',
    icon: Star,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
  },
  {
    title: 'Avg. Wait Time',
    value: '12m',
    change: '-2m',
    trend: 'down',
    icon: Clock,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
];

const clinicInfo = {
  name: 'MediClinic Central',
  address: '123 Healthcare Ave, Medical District',
  phone: '+1 (555) 123-4567',
  email: 'info@mediclinic.com',
  hours: 'Mon-Fri: 8am-6pm, Sat: 9am-2pm',
  specialties: ['General Medicine', 'Pediatrics', 'Cardiology', 'Orthopedics'],
};
</script>

<template>
  <div class="p-6 space-y-6">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Clinic Dashboard</h1>
        <p class="text-gray-600">Welcome back to your clinic management portal</p>
      </div>
      <div class="mt-4 md:mt-0 flex space-x-2">
        <Button variant="outline" class="flex items-center gap-2">
          <Bell class="h-4 w-4" />
          Notifications
        </Button>
        <Button variant="default" class="flex items-center gap-2" @click="props.onNavigate('settings')">
          <Settings class="h-4 w-4" />
          Settings
        </Button>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div
        v-for="action in quickActions"
        :key="action.id"
        class="relative overflow-hidden rounded-lg shadow-sm transition-all duration-300 hover:shadow-md"
        :class="{ 'ring-2 ring-offset-2 ring-blue-500': hoveredCard === action.id }"
        @mouseenter="hoveredCard = action.id"
        @mouseleave="hoveredCard = null"
        @click="action.action"
      >
        <div
          class="absolute inset-0 opacity-0 transition-opacity duration-300"
          :class="{ 'opacity-100': hoveredCard === action.id }"
        >
          <div class="absolute inset-0 bg-gradient-to-r" :class="action.color"></div>
        </div>

        <Card class="h-full border-0 bg-white relative z-10 transition-colors duration-300" :class="{
          'bg-opacity-90 text-white': hoveredCard === action.id,
        }">
          <CardContent class="p-6">
            <div class="flex items-start space-x-4">
              <div
                class="p-3 rounded-full"
                :class="hoveredCard === action.id ? 'bg-white bg-opacity-20' : action.bgColor"
              >
                <component
                  :is="action.icon"
                  class="h-6 w-6"
                  :class="hoveredCard === action.id ? 'text-white' : action.iconColor"
                />
              </div>
              <div class="flex-1">
                <h3 class="text-lg font-semibold mb-1" :class="{
                  'text-white': hoveredCard === action.id,
                  'text-gray-900': hoveredCard !== action.id,
                }">
                  {{ action.title }}
                </h3>
                <p
                  class="text-sm"
                  :class="{
                    'text-white text-opacity-90': hoveredCard === action.id,
                    'text-gray-600': hoveredCard !== action.id,
                  }"
                >
                  {{ action.description }}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- Stats Row -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card v-for="stat in stats" :key="stat.title" class="border-0 shadow-sm">
        <CardContent class="p-4">
          <div class="flex justify-between items-start">
            <div>
              <p class="text-sm font-medium text-gray-500">{{ stat.title }}</p>
              <div class="flex items-baseline mt-1">
                <h3 class="text-2xl font-bold text-gray-900">{{ stat.value }}</h3>
                <span
                  class="ml-2 text-sm font-medium"
                  :class="{
                    'text-green-600': stat.trend === 'up',
                    'text-red-600': stat.trend === 'down',
                  }"
                >
                  {{ stat.change }}
                </span>
              </div>
            </div>
            <div :class="`p-2 rounded-full ${stat.bgColor}`">
              <component :is="stat.icon" class="h-5 w-5" :class="stat.color" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Charts and Activity -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Appointment Distribution -->
      <Card class="border-0 shadow-sm col-span-1">
        <CardContent class="p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold text-gray-900">Appointment Status</h3>
            <Button variant="ghost" size="sm" class="text-gray-500 hover:text-gray-700">
              <MoreHorizontal class="h-4 w-4" />
            </Button>
          </div>
          <div class="h-64">
            <Pie :data="appointmentData" :options="chartOptions" />
          </div>
        </CardContent>
      </Card>

      <!-- Patient Distribution -->
      <Card class="border-0 shadow-sm col-span-1">
        <CardContent class="p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold text-gray-900">Patient Distribution</h3>
            <Button variant="ghost" size="sm" class="text-gray-500 hover:text-gray-700">
              <MoreHorizontal class="h-4 w-4" />
            </Button>
          </div>
          <div class="h-64">
            <Pie :data="patientData" :options="chartOptions" />
          </div>
        </CardContent>
      </Card>

      <!-- Recent Activity -->
      <Card class="border-0 shadow-sm col-span-1">
        <CardContent class="p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <Button variant="ghost" size="sm" class="text-gray-500 hover:text-gray-700">
              <Eye class="h-4 w-4" />
              View All
            </Button>
          </div>
          <div class="space-y-4">
            <div v-for="activity in recentActivity" :key="activity.id" class="flex items-start space-x-3">
              <div :class="`p-2 rounded-full ${activity.bgColor}`">
                <component :is="activity.icon" class="h-4 w-4" :class="activity.color" />
              </div>
              <div class="flex-1">
                <div class="flex justify-between items-start">
                  <h4 class="text-sm font-medium text-gray-900">{{ activity.title }}</h4>
                  <span class="text-xs text-gray-500">{{ activity.time }}</span>
                </div>
                <p class="text-sm text-gray-600">{{ activity.description }}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Clinic Info -->
    <Card class="border-0 shadow-sm">
      <CardContent class="p-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-gray-900">Clinic Information</h3>
          <Button
            variant="outline"
            size="sm"
            class="text-blue-600 border-blue-200 hover:bg-blue-50"
            @click="props.onNavigate('manage')"
          >
            <Settings class="h-4 w-4 mr-1" />
            Manage
          </Button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-4">
            <div class="flex items-start space-x-3">
              <div class="p-2 rounded-full bg-blue-100 text-blue-600">
                <Building class="h-5 w-5" />
              </div>
              <div>
                <p class="text-sm font-medium text-gray-500">Clinic Name</p>
                <p class="text-base text-gray-900">{{ clinicInfo.name }}</p>
              </div>
            </div>

            <div class="flex items-start space-x-3">
              <div class="p-2 rounded-full bg-blue-100 text-blue-600">
                <MapPin class="h-5 w-5" />
              </div>
              <div>
                <p class="text-sm font-medium text-gray-500">Address</p>
                <p class="text-base text-gray-900">{{ clinicInfo.address }}</p>
              </div>
            </div>

            <div class="flex items-start space-x-3">
              <div class="p-2 rounded-full bg-blue-100 text-blue-600">
                <Phone class="h-5 w-5" />
              </div>
              <div>
                <p class="text-sm font-medium text-gray-500">Phone</p>
                <p class="text-base text-gray-900">{{ clinicInfo.phone }}</p>
              </div>
            </div>
          </div>

          <div class="space-y-4">
            <div class="flex items-start space-x-3">
              <div class="p-2 rounded-full bg-blue-100 text-blue-600">
                <Mail class="h-5 w-5" />
              </div>
              <div>
                <p class="text-sm font-medium text-gray-500">Email</p>
                <p class="text-base text-gray-900">{{ clinicInfo.email }}</p>
              </div>
            </div>

            <div class="flex items-start space-x-3">
              <div class="p-2 rounded-full bg-blue-100 text-blue-600">
                <Clock class="h-5 w-5" />
              </div>
              <div>
                <p class="text-sm font-medium text-gray-500">Operating Hours</p>
                <p class="text-base text-gray-900">{{ clinicInfo.hours }}</p>
              </div>
            </div>

            <div class="flex items-start space-x-3">
              <div class="p-2 rounded-full bg-blue-100 text-blue-600">
                <Award class="h-5 w-5" />
              </div>
              <div>
                <p class="text-sm font-medium text-gray-500">Specialties</p>
                <div class="flex flex-wrap gap-2 mt-1">
                  <span
                    v-for="specialty in clinicInfo.specialties"
                    :key="specialty"
                    class="px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full"
                  >
                    {{ specialty }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>