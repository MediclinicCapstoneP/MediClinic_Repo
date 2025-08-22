<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

// Import icons from lucide-vue-next
import { ArrowRight, CheckCircle, Star, Users, Shield, Clock, Heart, Zap, Award, Globe, Play, Download, Mail, Phone, MapPin, TrendingUp, Activity, Building, UserCheck } from 'lucide-vue-next';

const router = useRouter();
const hoveredCard = ref<number | null>(null);
const activeTestimonial = ref<number>(0);
const activeFeature = ref<number>(0);

interface Feature {
  icon: any;
  title: string;
  description: string;
  color: string;
  bgColor: string;
}

interface Testimonial {
  name: string;
  role: string;
  clinic: string;
  content: string;
  avatar: string;
}

interface Stat {
  value: string;
  label: string;
  icon: any;
}

const features: Feature[] = [
  {
    icon: Shield,
    title: "Secure & HIPAA Compliant",
    description: "Your health data is protected with enterprise-grade security and full HIPAA compliance",
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-50"
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "AI-powered booking and instant notifications for seamless healthcare access",
    color: "from-yellow-500 to-orange-500",
    bgColor: "bg-yellow-50"
  },
  {
    icon: Users,
    title: "Community Driven",
    description: "Built by healthcare professionals for better patient care and clinic management",
    color: "from-green-500 to-green-600",
    bgColor: "bg-green-50"
  },
  {
    icon: Globe,
    title: "Accessible Everywhere",
    description: "Available on web and mobile devices for healthcare on-the-go",
    color: "from-purple-500 to-purple-600",
    bgColor: "bg-purple-50"
  }
];

const testimonials: Testimonial[] = [
  {
    name: "Dr. Sarah Johnson",
    role: "Family Physician",
    clinic: "HealthFirst Medical Center",
    content: "iGabayAtiCare has transformed how we manage our practice. The AI assistant helps patients 24/7, and the booking system is incredibly efficient.",
    rating: 5,
    avatar: "https://images.pexels.com/photos/4167541/pexels-photo-4167541.jpeg?auto=compress&cs=tinysrgb&w=100"
  },
  {
    name: "Maria Rodriguez",
    role: "Patient",
    clinic: "Regular User",
    content: "Finding and booking appointments has never been easier. The platform is intuitive and the AI assistant is incredibly helpful.",
    rating: 5,
    avatar: "https://images.pexels.com/photos/4386466/pexels-photo-4386466.jpeg?auto=compress&cs=tinysrgb&w=100"
  },
  {
    name: "Dr. Michael Chen",
    role: "Clinic Director",
    clinic: "Metro Wellness Center",
    content: "The analytics and patient management tools have helped us improve our efficiency and patient satisfaction significantly.",
    rating: 5,
    avatar: "https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg?auto=compress&cs=tinysrgb&w=100"
  }
];

const stats: Stat[] = [
  {
    value: "500+",
    label: "Verified Clinics",
    icon: Building,
    color: "text-blue-600",
    bgColor: "bg-blue-50"
  },
  {
    value: "10K+",
    label: "Happy Patients",
    icon: Users,
    color: "text-green-600",
    bgColor: "bg-green-50"
  },
  {
    value: "24/7",
    label: "AI Support",
    icon: Activity,
    color: "text-purple-600",
    bgColor: "bg-purple-50"
  },
  {
    value: "99.9%",
    label: "Uptime",
    icon: Shield,
    color: "text-orange-600",
    bgColor: "bg-orange-50"
  }
];
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
    <!-- Header -->
    <header class="border-b border-blue-100 bg-white/90 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
      <div class="container mx-auto px-4 py-4 flex justify-between items-center">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg">
            <Heart class="h-6 w-6 text-white" />
          </div>
          <span class="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">iGabayAtiCare</span>
        </div>
        <nav class="hidden md:flex items-center gap-6">
          <router-link to="/" class="text-gray-600 hover:text-blue-600 transition-colors font-medium">Home</router-link>
          <a href="#features" class="text-gray-600 hover:text-blue-600 transition-colors font-medium">Features</a>
          <a href="#testimonials" class="text-gray-600 hover:text-blue-600 transition-colors font-medium">Testimonials</a>
          <button @click="router.push('/signin')" class="border-blue-600 text-blue-600 hover:bg-blue-50 px-3 py-1 text-sm rounded border">Sign In</button>
          <button @click="router.push('/signup')" class="bg-blue-600 text-white hover:bg-blue-700 px-3 py-1 text-sm rounded">Sign Up</button>
        </nav>
      </div>
    </header>

    <!-- Hero Section -->
    <section class="py-20 bg-white">
      <div class="container mx-auto px-4">
        <div class="flex flex-col lg:flex-row items-center gap-12">
          <div class="lg:w-1/2">
            <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Revolutionizing <span class="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Healthcare Access</span> for Everyone
            </h1>
            <p class="text-xl text-gray-600 mb-8 leading-relaxed">
              iGabayAtiCare is a comprehensive healthcare platform that connects patients with verified clinics and doctors, streamlines appointment booking, and enhances the healthcare experience through AI-powered assistance.
            </p>
            <div class="flex flex-col sm:flex-row gap-4">
              <button @click="router.push('/signup')" class="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg flex items-center justify-center font-medium">
                Get Started <ArrowRight class="ml-2 h-5 w-5" />
              </button>
              <button @click="router.push('/')" class="px-6 py-3 border border-blue-200 text-blue-600 hover:bg-blue-50 rounded-lg flex items-center justify-center font-medium">
                Back to Home
              </button>
            </div>
          </div>
          <div class="lg:w-1/2 relative">
            <div class="absolute -top-6 -left-6 w-24 h-24 bg-blue-100 rounded-full opacity-70"></div>
            <div class="absolute -bottom-6 -right-6 w-32 h-32 bg-cyan-100 rounded-full opacity-70"></div>
            <div class="relative bg-white p-6 rounded-2xl shadow-xl border border-blue-100">
              <img src="https://images.pexels.com/photos/7089401/pexels-photo-7089401.jpeg" alt="Healthcare Platform" class="w-full h-auto rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="py-20 bg-blue-50">
      <div class="container mx-auto px-4">
        <div class="text-center mb-16">
          <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Powerful Features for Modern Healthcare
          </h2>
          <p class="text-xl text-gray-600 max-w-3xl mx-auto">
            Our platform combines cutting-edge technology with user-friendly design to transform healthcare management
          </p>
        </div>

        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div 
            v-for="(feature, index) in features" 
            :key="index"
            class="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 transition-all duration-300 hover:shadow-xl hover:scale-105"
            :class="{ 'ring-2 ring-blue-300': hoveredCard === index }"
            @mouseenter="hoveredCard = index"
            @mouseleave="hoveredCard = null"
          >
            <div class="p-6">
              <div :class="`p-3 rounded-full w-14 h-14 flex items-center justify-center mb-4 bg-gradient-to-r ${feature.color} text-white`">
                <component :is="feature.icon" class="h-7 w-7" />
              </div>
              <h3 class="text-xl font-semibold text-gray-900 mb-2">{{ feature.title }}</h3>
              <p class="text-gray-600">{{ feature.description }}</p>
            </div>
          </div>
        </div>

        <div class="mt-16 grid md:grid-cols-2 gap-8">
          <div class="bg-white p-8 rounded-xl shadow-md border border-gray-100">
            <h3 class="text-2xl font-bold text-gray-900 mb-4">For Patients</h3>
            <ul class="space-y-3">
              <li v-for="(item, index) in ['Easy appointment booking with AI assistance', 'Secure health record management', 'Verified clinic and doctor profiles', 'Medication reminders and tracking', 'Telehealth consultation options']" :key="index" class="flex items-start gap-3">
                <CheckCircle class="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
                <span class="text-gray-700">{{ item }}</span>
              </li>
            </ul>
          </div>
          <div class="bg-white p-8 rounded-xl shadow-md border border-gray-100">
            <h3 class="text-2xl font-bold text-gray-900 mb-4">For Healthcare Providers</h3>
            <ul class="space-y-3">
              <li v-for="(item, index) in ['Streamlined patient management', 'Automated appointment scheduling', 'Analytics and reporting dashboard', 'Digital prescription system', 'Integrated billing and payment processing']" :key="index" class="flex items-start gap-3">
                <CheckCircle class="h-5 w-5 text-blue-500 flex-shrink-0 mt-1" />
                <span class="text-gray-700">{{ item }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- Testimonials Section -->
    <section id="testimonials" class="py-20 bg-white">
      <div class="container mx-auto px-4">
        <div class="text-center mb-16">
          <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            What Our Users Say
          </h2>
          <p class="text-xl text-gray-600 max-w-3xl mx-auto">
            Hear from healthcare professionals and patients who use our platform
          </p>
        </div>

        <div class="max-w-4xl mx-auto">
          <div class="relative bg-blue-50 p-8 rounded-2xl shadow-md">
            <div class="absolute -top-5 left-1/2 transform -translate-x-1/2 bg-white p-2 rounded-full shadow-md">
              <img :src="testimonials[activeTestimonial].avatar" :alt="testimonials[activeTestimonial].name" class="w-16 h-16 rounded-full object-cover" />
            </div>
            <div class="pt-12 text-center">
              <div class="flex justify-center mb-4">
                <Star v-for="i in testimonials[activeTestimonial].rating" :key="i" class="h-5 w-5 text-yellow-500 fill-current" />
              </div>
              <p class="text-gray-700 text-lg italic mb-6">"{{ testimonials[activeTestimonial].content }}"</p>
              <div>
                <h4 class="text-lg font-semibold text-gray-900">{{ testimonials[activeTestimonial].name }}</h4>
                <p class="text-gray-600">{{ testimonials[activeTestimonial].role }}, {{ testimonials[activeTestimonial].clinic }}</p>
              </div>
            </div>
            <div class="flex justify-center mt-8 space-x-2">
              <button 
                v-for="(_, index) in testimonials" 
                :key="index"
                @click="activeTestimonial = index"
                class="w-3 h-3 rounded-full transition-all duration-300"
                :class="activeTestimonial === index ? 'bg-blue-600 scale-125' : 'bg-gray-300'"
              ></button>
            </div>
          </div>
        </div>

        <div class="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div v-for="(stat, index) in stats" :key="index" class="text-center">
            <div :class="`mx-auto ${stat.bgColor} p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4`">
              <component :is="stat.icon" :class="`h-8 w-8 ${stat.color}`" />
            </div>
            <div :class="`text-3xl font-bold ${stat.color} mb-2`">{{ stat.value }}</div>
            <div class="text-gray-600">{{ stat.label }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-20 bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
      <div class="container mx-auto px-4 text-center">
        <h2 class="text-3xl md:text-4xl font-bold mb-6">Ready to Transform Your Healthcare Experience?</h2>
        <p class="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">Join thousands of patients and healthcare providers who are already benefiting from our platform.</p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <button @click="router.push('/signup')" class="px-8 py-4 bg-white text-blue-600 rounded-lg font-medium text-lg hover:bg-blue-50 transition-colors">
            Create Account
          </button>
          <button @click="router.push('/signin')" class="px-8 py-4 bg-transparent border border-white text-white rounded-lg font-medium text-lg hover:bg-white/10 transition-colors">
            Sign In
          </button>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="bg-gray-900 text-white py-12">
      <div class="container mx-auto px-4">
        <div class="grid md:grid-cols-4 gap-8">
          <div>
            <div class="flex items-center gap-3 mb-6">
              <div class="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl">
                <Heart class="h-6 w-6 text-white" />
              </div>
              <span class="text-xl font-bold">iGabayAtiCare</span>
            </div>
            <p class="text-gray-400 mb-6">Transforming healthcare access and management with technology.</p>
            <div class="flex space-x-4">
              <a href="#" class="text-gray-400 hover:text-white transition-colors">
                <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill-rule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clip-rule="evenodd" />
                </svg>
              </a>
              <a href="#" class="text-gray-400 hover:text-white transition-colors">
                <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" class="text-gray-400 hover:text-white transition-colors">
                <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill-rule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clip-rule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
          <div>
            <h3 class="text-lg font-semibold mb-4">Platform</h3>
            <ul class="space-y-2">
              <li><a href="#" class="text-gray-400 hover:text-white transition-colors">Features</a></li>
              <li><a href="#" class="text-gray-400 hover:text-white transition-colors">Security</a></li>
              <li><a href="#" class="text-gray-400 hover:text-white transition-colors">Pricing</a></li>
              <li><a href="#" class="text-gray-400 hover:text-white transition-colors">FAQ</a></li>
            </ul>
          </div>
          <div>
            <h3 class="text-lg font-semibold mb-4">Company</h3>
            <ul class="space-y-2">
              <li><a href="#" class="text-gray-400 hover:text-white transition-colors">About</a></li>
              <li><a href="#" class="text-gray-400 hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" class="text-gray-400 hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" class="text-gray-400 hover:text-white transition-colors">Press</a></li>
            </ul>
          </div>
          <div>
            <h3 class="text-lg font-semibold mb-4">Contact</h3>
            <ul class="space-y-2">
              <li class="flex items-center gap-2">
                <Mail class="h-5 w-5 text-gray-400" />
                <a href="mailto:contact@igabayaticare.com" class="text-gray-400 hover:text-white transition-colors">contact@igabayaticare.com</a>
              </li>
              <li class="flex items-center gap-2">
                <Phone class="h-5 w-5 text-gray-400" />
                <a href="tel:+1234567890" class="text-gray-400 hover:text-white transition-colors">+1 (234) 567-890</a>
              </li>
              <li class="flex items-center gap-2">
                <MapPin class="h-5 w-5 text-gray-400" />
                <span class="text-gray-400">123 Healthcare Ave, Medical District</span>
              </li>
            </ul>
          </div>
        </div>
        <div class="mt-12 pt-8 border-t border-gray-800 text-center text-gray-400">
          <p>© 2023 iGabayAtiCare. All rights reserved.</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* Add any component-specific styles here */
</style>