<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

// Import icons from lucide-vue-next (assuming it's installed)
// If not installed, you would need to install it: npm install lucide-vue-next
import { Heart, Shield, Users, ArrowRight, Stethoscope, Calendar, MessageCircle, Star, CheckCircle } from 'lucide-vue-next';

const router = useRouter();
const hoveredFeature = ref<number | null>(null);
const hoveredUserType = ref<number | null>(null);
const activeTestimonial = ref<number>(0);

interface Feature {
  icon: any;
  title: string;
  description: string;
  color: string;
}

interface UserType {
  title: string;
  description: string;
  icon: any;
  action: () => void;
  gradient: string;
  features: string[];
}

const features: Feature[] = [
  {
    icon: Calendar,
    title: "Smart Booking",
    description: "AI-powered appointment scheduling with real-time availability",
    color: "bg-gradient-primary"
  },
  {
    icon: Shield,
    title: "Secure & Verified",
    description: "ML-validated clinic registrations and secure patient data",
    color: "bg-gradient-medical"
  },
  {
    icon: MessageCircle,
    title: "AI Assistant",
    description: "24/7 chatbot support for booking guidance and inquiries",
    color: "bg-gradient-secondary"
  },
  {
    icon: Heart,
    title: "Complete Care",
    description: "Comprehensive healthcare management in one platform",
    color: "bg-gradient-accent"
  }
];

const userTypes: UserType[] = [
  {
    title: "For Patients",
    description: "Book appointments, manage health records, and connect with verified clinics",
    icon: Users,
    action: () => router.push("/signup?role=patient"),
    gradient: "bg-gradient-primary",
    features: ["Easy Appointment Booking", "Health Records Management", "24/7 AI Support"]
  },
  {
    title: "For Clinics",
    description: "Register your clinic, manage appointments, and grow your practice",
    icon: Stethoscope,
    action: () => router.push("/clinic-signup"),
    gradient: "bg-gradient-medical",
    features: ["Patient Management", "Appointment Scheduling", "Practice Analytics"]
  },
  {
    title: "For Doctors",
    description: "Access patient records, manage consultations, and streamline practice",
    icon: Heart,
    action: () => router.push("/doctor-signup?role=doctor"),
    gradient: "bg-gradient-secondary",
    features: ["Patient Records Access", "Consultation Management", "Practice Tools"]
  }
];
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300 text-foreground">

    <!-- Header -->
    <header class="border-b border-theme-light bg-white/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
      <div class="container mx-auto px-4 py-4 flex justify-between items-center">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-gradient-primary rounded-xl shadow-lg">
            <Heart class="h-6 w-6 text-white" />
          </div>
          <span class="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">iGabayAtiCare</span>
        </div>
        <nav class="hidden md:flex items-center gap-6">
          <a href="#features" class="text-muted-foreground hover:text-theme transition-colors font-medium">Features</a>
          <a href="#about" class="text-muted-foreground hover:text-theme transition-colors font-medium">About</a>
          <button @click="router.push('/signin')" class="border-theme text-theme hover:bg-theme-light px-3 py-1 text-sm rounded border">Patient Sign In</button>
          <button @click="router.push('/clinic-signin')" class="border-secondary-200 text-secondary-600 hover:bg-secondary-50 px-3 py-1 text-sm rounded border">Clinic Sign In</button>
        </nav>
      </div>
    </header>

    <!-- Hero Section -->
    <section class="container mx-auto px-4 py-20 text-center relative overflow-hidden bg-white/80 backdrop-blur-sm rounded-xl shadow-md">
      <div class="absolute inset-0 bg-blue-100/30 rounded-xl"></div>

      <div class="relative max-w-4xl mx-auto">
        <div class="animate-bounce-gentle mb-8">
          <div class="inline-flex items-center gap-2 bg-theme-light text-theme-dark px-4 py-2 rounded-full text-sm font-medium">
            <Star class="h-4 w-4 fill-theme" />
            Trusted by 10,000+ healthcare professionals
          </div>
        </div>
        <h1 class="text-5xl md:text-7xl font-bold text-foreground mb-6 animate-slide-up leading-tight">
          Your Healthcare,{" "}
          <span class="bg-gradient-hero bg-clip-text text-transparent">
            Simplified
          </span>
        </h1>
        <p class="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-slide-up leading-relaxed">
          Connect with verified clinics, book appointments seamlessly, and manage your health journey with AI-powered assistance.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
          <button @click="router.push('/signup')" class="text-lg px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg flex items-center justify-center">
            Get Started <ArrowRight class="ml-2 h-5 w-5" />
          </button>
          <router-link to="/learn-more" class="text-lg px-8 py-4 border-primary-200 text-primary-600 hover:bg-primary-50 border rounded-lg flex items-center justify-center">
            Learn More
          </router-link>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="py-20 bg-gradient-to-br from-blue-50 via-white to-cyan-50 relative">
      <div class="absolute inset-0 bg-gradient-to-r from-primary-50/20 to-secondary-50/20"></div>
      <div class="container mx-auto px-4 relative">
        <div class="text-center mb-16">
          <h2 class="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Healthcare Innovation
          </h2>
          <p class="text-xl text-muted-foreground max-w-2xl mx-auto">
            Advanced technology meets compassionate care
          </p>
        </div>
        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div
            v-for="(feature, index) in features"
            :key="index"
            class="transform transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer"
            :class="{ 'ring-2 ring-primary-200': hoveredFeature === index }"
            :style="{ animationDelay: `${index * 0.1}s` }"
            @mouseenter="hoveredFeature = index"
            @mouseleave="hoveredFeature = null"
          >
            <div class="text-center transition-all duration-300 bg-white/80 border border-blue-100 shadow-md group animate-fade-in backdrop-blur-sm rounded-lg overflow-hidden">
              <div class="p-6">
                <div :class="`mx-auto p-4 ${feature.color} rounded-2xl w-fit shadow-lg group-hover:scale-110 transition-transform duration-300`">
                  <component :is="feature.icon" class="h-8 w-8 text-white" />
                </div>
                <h3 class="text-xl text-foreground group-hover:text-primary-600 transition-colors mt-4">{{ feature.title }}</h3>
                <p class="text-sm text-muted-foreground leading-relaxed mt-2">
                  {{ feature.description }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- User Types Section -->
    <section class="py-20 bg-blue-50/50 backdrop-blur-sm">
      <div class="container mx-auto px-4">
        <div class="text-center mb-16">
          <h2 class="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Choose Your Journey
          </h2>
          <p class="text-xl text-muted-foreground">
            Tailored experiences for every healthcare need
          </p>
        </div>
        <div class="grid md:grid-cols-3 gap-8">
          <div
            v-for="(type, index) in userTypes"
            :key="index"
            class="transform transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer"
            :class="{ 'ring-2 ring-primary-200': hoveredUserType === index }"
            :style="{ animationDelay: `${index * 0.2}s` }"
            @mouseenter="hoveredUserType = index"
            @mouseleave="hoveredUserType = null"
            @click="type.action"
          >
            <div class="hover:shadow-hover transition-all duration-300 bg-white/80 border border-blue-100 shadow-md group animate-scale-in backdrop-blur-sm rounded-lg overflow-hidden">
              <div class="text-center p-6">
                <div :class="`mx-auto p-4 ${type.gradient} rounded-2xl w-fit shadow-lg group-hover:scale-110 transition-transform duration-300`">
                  <component :is="type.icon" class="h-8 w-8 text-white" />
                </div>
                <h3 class="text-2xl text-foreground mt-4">{{ type.title }}</h3>
                <p class="mb-6 text-muted-foreground leading-relaxed mt-2">
                  {{ type.description }}
                </p>
                <ul class="space-y-2">
                  <li v-for="(feature, featureIndex) in type.features" :key="featureIndex" class="flex items-center gap-2">
                    <CheckCircle class="h-5 w-5 text-primary-500" />
                    <span>{{ feature }}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="bg-white border-t border-gray-200 py-12">
      <div class="container mx-auto px-4">
        <div class="flex flex-col md:flex-row justify-between items-center">
          <div class="flex items-center gap-3 mb-6 md:mb-0">
            <div class="p-2 bg-gradient-primary rounded-xl shadow-lg">
              <Heart class="h-6 w-6 text-white" />
            </div>
            <span class="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">iGabayAtiCare</span>
          </div>
          <div class="flex flex-wrap gap-8 justify-center">
            <a href="#" class="text-muted-foreground hover:text-theme transition-colors">About</a>
            <a href="#" class="text-muted-foreground hover:text-theme transition-colors">Features</a>
            <a href="#" class="text-muted-foreground hover:text-theme transition-colors">Privacy</a>
            <a href="#" class="text-muted-foreground hover:text-theme transition-colors">Terms</a>
            <a href="#" class="text-muted-foreground hover:text-theme transition-colors">Contact</a>
          </div>
        </div>
        <div class="mt-8 text-center text-muted-foreground text-sm">
          © 2023 iGabayAtiCare. All rights reserved.
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.animate-bounce-gentle {
  animation: bounce 3s infinite;
}

.animate-slide-up {
  animation: slideUp 0.5s ease-out forwards;
}

.animate-fade-in {
  animation: fadeIn 0.5s ease-out forwards;
}

.animate-scale-in {
  animation: scaleIn 0.5s ease-out forwards;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.bg-gradient-primary {
  background: linear-gradient(to right, var(--primary-500, #3b82f6), var(--primary-600, #2563eb));
}

.bg-gradient-medical {
  background: linear-gradient(to right, var(--secondary-500, #06b6d4), var(--secondary-600, #0891b2));
}

.bg-gradient-secondary {
  background: linear-gradient(to right, var(--accent-500, #8b5cf6), var(--accent-600, #7c3aed));
}

.bg-gradient-accent {
  background: linear-gradient(to right, var(--success-500, #10b981), var(--success-600, #059669));
}

.bg-gradient-hero {
  background: linear-gradient(to right, var(--primary-600, #2563eb), var(--secondary-600, #0891b2));
}
</style>