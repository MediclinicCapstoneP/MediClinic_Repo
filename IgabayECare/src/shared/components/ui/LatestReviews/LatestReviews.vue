<template>
  <AppCard class="h-full">
    <template #header>
      <div class="pb-4">
        <h3 class="text-lg font-semibold text-gray-900">Latest Reviews</h3>
      </div>
    </template>

    <template #content>
      <div class="space-y-6">
        <div
          v-for="review in reviews"
          :key="review.id"
          class="border-b border-gray-100 last:border-b-0 pb-4 last:pb-0"
        >
          <div class="flex items-start space-x-3">
            <!-- Profile Picture with Source Badge -->
            <div class="relative flex-shrink-0">
              <div class="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <div class="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                  <span class="text-white text-sm font-medium">
                    {{ review.patientName.charAt(0) }}
                  </span>
                </div>
              </div>
              <!-- Source Badge -->
              <div class="absolute -bottom-1 -right-1">
                <component :is="getSourceIcon(review.source)" />
              </div>
            </div>

            <!-- Review Content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between mb-2">
                <h4 class="text-sm font-semibold text-gray-900 truncate">
                  {{ review.patientName }}
                </h4>
                <div class="flex items-center space-x-2 text-xs text-gray-500">
                  <Clock class="h-3 w-3" />
                  <span>{{ review.timestamp }}</span>
                </div>
              </div>

              <!-- Rating and Source -->
              <div class="flex items-center space-x-2 mb-3">
                <StarRating :rating="review.rating" />
                <span class="text-xs text-gray-500">
                  from {{ review.source }}
                </span>
              </div>

              <!-- Review Text -->
              <p class="text-sm text-gray-700 leading-relaxed mb-3">
                {{ review.reviewText }}
              </p>

              <!-- Review Images (if any) -->
              <div v-if="review.images && review.images.length > 0" class="flex space-x-2 mb-3">
                <div
                  v-for="(image, index) in review.images.slice(0, 4)"
                  :key="index"
                  class="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center"
                >
                  <div class="w-12 h-12 bg-gradient-to-br from-gray-300 to-gray-400 rounded-lg flex items-center justify-center">
                    <span class="text-gray-500 text-xs">IMG</span>
                  </div>
                </div>
              </div>

              <!-- Source Link -->
              <div class="flex items-center justify-between">
                <span :class="['text-xs font-medium', getSourceColor(review.source)]">
                  {{ review.source }} Review
                </span>
                <button class="text-xs text-blue-600 hover:text-blue-700 font-medium">
                  View Full Review
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- View All Reviews Button -->
        <div class="pt-4 border-t border-gray-100">
          <button class="w-full text-sm text-blue-600 hover:text-blue-700 font-medium py-2 rounded-lg hover:bg-blue-50 transition-colors">
            View All Reviews
          </button>
        </div>
      </div>
    </template>
  </AppCard>
</template>

<script setup lang="ts">
import { computed, h } from 'vue';
import { Star, Clock } from 'lucide-vue-next';
import { AppCard } from '../Card/Card.vue';
import StarRating from './StarRating.vue';

interface Review {
  id: string;
  patientName: string;
  patientImage: string;
  rating: number;
  reviewText: string;
  source: 'Yelp' | 'PatientPop' | 'Facebook' | 'Google';
  timestamp: string;
  images?: string[];
}

interface Props {
  reviews?: Review[];
}

const props = withDefaults(defineProps<Props>(), {
  reviews: () => [
    {
      id: '1',
      patientName: 'Deena Timmons',
      patientImage: '/api/placeholder/40/40',
      rating: 5,
      reviewText: 'I must once again praise Dr. Coleman for her outstanding advise and medical care. Her skills as a physician are stellar, and she will only recommend procedures that can enhance your physical beauty. The office is immaculate, colorful and inviting.',
      source: 'Yelp' as const,
      timestamp: '5 hours ago',
      images: [
        '/api/placeholder/80/80',
        '/api/placeholder/80/80',
        '/api/placeholder/80/80',
        '/api/placeholder/80/80'
      ]
    },
    {
      id: '2',
      patientName: 'Sheila Lee',
      patientImage: '/api/placeholder/40/40',
      rating: 5,
      reviewText: 'Dr. Coleman is the consumate professional. I have seen dermatologists in NYC and Beverly Hills, and she is by far the most knowledeable. As a physician, her primary concern is health, skin care, and screening.',
      source: 'PatientPop' as const,
      timestamp: '2 days ago'
    },
    {
      id: '3',
      patientName: 'Sarah Doyle',
      patientImage: '/api/placeholder/40/40',
      rating: 5,
      reviewText: 'Dr. Coleman clearly cares about her patients and spent time walking me through my skin\'s health and things I can do to stay looking my best.',
      source: 'Facebook' as const,
      timestamp: '5 days ago'
    }
  ]
});

const getSourceIcon = (source: string) => {
  const iconClass = "w-5 h-5 rounded-full flex items-center justify-center";
  const textClass = "text-white text-xs font-bold";

  switch (source) {
    case 'Yelp':
      return h('div', { class: `${iconClass} bg-red-500` }, [
        h('span', { class: textClass }, 'Y')
      ]);
    case 'PatientPop':
      return h('div', { class: `${iconClass} bg-green-500` }, [
        h('span', { class: textClass }, 'P')
      ]);
    case 'Facebook':
      return h('div', { class: `${iconClass} bg-blue-500` }, [
        h('span', { class: textClass }, 'f')
      ]);
    case 'Google':
      return h('div', { class: `${iconClass} bg-blue-600` }, [
        h('span', { class: textClass }, 'G')
      ]);
    default:
      return null;
  }
};

const getSourceColor = (source: string) => {
  switch (source) {
    case 'Yelp':
      return 'text-red-600';
    case 'PatientPop':
      return 'text-green-600';
    case 'Facebook':
      return 'text-blue-600';
    case 'Google':
      return 'text-blue-600';
    default:
      return 'text-gray-600';
  }
};
</script>

<style scoped>
/* Component-specific styles if needed */
</style>
