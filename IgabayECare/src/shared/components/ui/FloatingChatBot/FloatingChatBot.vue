<template>
  <!-- Floating Chat Button -->
  <button
    v-if="!isOpen"
    @click="isOpen = true"
    class="fixed bottom-6 right-6 z-50 bg-gradient-primary text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
  >
    <MessageCircle :size="24" />
  </button>

  <!-- Chat Window -->
  <div
    v-if="isOpen"
    class="fixed bottom-6 right-6 z-50 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col"
  >
    <!-- Header -->
    <div class="bg-gradient-primary text-white p-4 rounded-t-2xl flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <div class="p-2 bg-white/20 rounded-full">
          <Bot :size="20" />
        </div>
        <div>
          <h3 class="font-semibold">iGabay AI Assistant</h3>
          <p class="text-sm opacity-90">Your healthcare companion</p>
        </div>
      </div>
      <div class="flex items-center space-x-2">
        <button
          @click="isMinimized = !isMinimized"
          class="p-1 hover:bg-white/20 rounded transition-colors"
        >
          <Maximize2 v-if="isMinimized" :size="16" />
          <Minimize2 v-else :size="16" />
        </button>
        <button
          @click="isOpen = false"
          class="p-1 hover:bg-white/20 rounded transition-colors"
        >
          <X :size="16" />
        </button>
      </div>
    </div>

    <!-- Chat Content -->
    <template v-if="!isMinimized">
      <!-- Messages -->
      <div class="flex-1 overflow-y-auto p-4 space-y-4" ref="messagesContainer">
        <div
          v-for="message in messages"
          :key="message.id"
          :class="['flex', message.isBot ? 'justify-start' : 'justify-end']"
        >
          <div
            :class="[
              'max-w-[80%] p-3 rounded-2xl',
              message.isBot
                ? 'bg-gray-100 text-gray-900'
                : 'bg-primary-600 text-white'
            ]"
          >
            <div class="flex items-start space-x-2">
              <div
                v-if="message.isBot"
                class="p-1 bg-primary-100 rounded-full flex-shrink-0 mt-1"
              >
                <Bot :size="12" class="text-primary-600" />
              </div>
              <div class="flex-1">
                <p class="text-sm whitespace-pre-line">{{ message.message }}</p>
                <p class="text-xs opacity-70 mt-1">
                  {{ formatTime(message.timestamp) }}
                </p>
              </div>
              <div
                v-if="!message.isBot"
                class="p-1 bg-white/20 rounded-full flex-shrink-0 mt-1"
              >
                <User :size="12" />
              </div>
            </div>
          </div>
        </div>

        <!-- Typing Indicator -->
        <div v-if="isTyping" class="flex justify-start">
          <div class="bg-gray-100 p-3 rounded-2xl">
            <div class="flex items-center space-x-2">
              <div class="p-1 bg-primary-100 rounded-full">
                <Bot :size="12" class="text-primary-600" />
              </div>
              <div class="flex space-x-1">
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Suggestions -->
      <div v-if="messages.length === 1" class="px-4 pb-2">
        <p class="text-xs text-gray-500 mb-2">Quick suggestions:</p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="(suggestion, index) in quickSuggestions.slice(0, 3)"
            :key="index"
            @click="handleSuggestionClick(suggestion)"
            class="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded-full transition-colors"
          >
            {{ suggestion }}
          </button>
        </div>
      </div>

      <!-- Input -->
      <div class="p-4 border-t border-gray-200">
        <div class="flex space-x-2">
          <input
            v-model="inputMessage"
            type="text"
            @keydown.enter.prevent="handleSendMessage"
            placeholder="Type your message..."
            class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <Button
            @click="handleSendMessage"
            :disabled="!inputMessage.trim() || isTyping"
            size="sm"
            class="px-4"
          >
            <Send :size="16" />
          </Button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch } from 'vue';
import { Send, Bot, User, X, MessageCircle, Minimize2, Maximize2 } from 'lucide-vue-next';
import Button from '../Button/Button.vue';
import type { ChatMessage, FloatingChatBotEmits } from './FloatingChatBot.types';

const emit = defineEmits<FloatingChatBotEmits>();

const isOpen = ref(false);
const isMinimized = ref(false);
const isTyping = ref(false);
const inputMessage = ref('');
const messagesContainer = ref<HTMLDivElement | null>(null);

const messages = ref<ChatMessage[]>([
  {
    id: '1',
    userId: 'bot',
    message: 'Hello! I\'m iGabay, your AI healthcare assistant. How can I help you today?',
    isBot: true,
    timestamp: new Date().toISOString(),
  }
]);

const quickSuggestions = [
  'Find nearby clinics',
  'Book an appointment',
  'Check my appointments',
  'What are the symptoms of flu?',
  'How to reschedule appointment?',
  'Clinic operating hours',
];

const scrollToBottom = async () => {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

const formatTime = (timestamp: string): string => {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const generateBotResponse = (userInput: string): string => {
  const input = userInput.toLowerCase();

  if (input.includes('appointment') || input.includes('book')) {
    return "I can help you book an appointment! To get started, please tell me:\n\n1. What type of medical service do you need?\n2. Do you have a preferred clinic or location?\n3. When would you like to schedule your appointment?\n\nYou can also use the 'Search Clinics' feature to browse available healthcare providers.";
  }

  if (input.includes('clinic') || input.includes('nearby') || input.includes('find')) {
    return "I can help you find clinics! Here are your options:\n\n🔍 **Search Clinics**: Browse by name, specialty, or location\n📍 **Nearby Clinics**: Find healthcare providers close to you\n⭐ **Top Rated**: View highly-rated clinics in your area\n\nWould you like me to help you with any specific type of medical service?";
  }

  if (input.includes('symptom') || input.includes('flu') || input.includes('fever')) {
    return "I understand you're asking about symptoms. While I can provide general health information, it's important to consult with a healthcare professional for proper diagnosis and treatment.\n\nFor flu symptoms, common signs include:\n• Fever or chills\n• Cough\n• Sore throat\n• Body aches\n• Fatigue\n\nIf you're experiencing concerning symptoms, I recommend booking an appointment with a healthcare provider. Would you like help finding a clinic near you?";
  }

  if (input.includes('reschedule') || input.includes('cancel')) {
    return "To reschedule or cancel an appointment:\n\n1. Go to 'My Appointments' in the menu\n2. Find the appointment you want to modify\n3. Click 'Reschedule' or 'Cancel'\n4. Follow the prompts to select a new date/time\n\nNote: Please reschedule at least 24 hours in advance when possible. Some clinics may have specific cancellation policies.\n\nNeed help with a specific appointment?";
  }

  if (input.includes('hours') || input.includes('open') || input.includes('closed')) {
    return "Clinic operating hours vary by location. Here's how to check:\n\n📋 **Clinic Details**: Each clinic page shows operating hours\n🔍 **Search Results**: Hours are displayed with each clinic\n📍 **Nearby Clinics**: Shows if clinics are currently open\n\nMost clinics operate:\n• Weekdays: 8:00 AM - 6:00 PM\n• Saturdays: 9:00 AM - 4:00 PM\n• Sundays: Limited hours or closed\n\nWould you like help finding a specific clinic's hours?";
  }

  return "I'm here to help you with your healthcare needs! I can assist you with:\n\n🏥 Finding and booking appointments\n📍 Locating nearby clinics\n📅 Managing your appointments\n🔍 General health information\n⚙️ Using the iGabayAtiCare platform\n\nWhat would you like help with today?";
};

const handleSendMessage = async () => {
  if (!inputMessage.value.trim()) return;

  const userMessage: ChatMessage = {
    id: Date.now().toString(),
    userId: 'user',
    message: inputMessage.value,
    isBot: false,
    timestamp: new Date().toISOString(),
  };

  messages.value.push(userMessage);
  const currentInput = inputMessage.value;
  inputMessage.value = '';
  isTyping.value = true;

  await scrollToBottom();

  // Simulate bot response
  setTimeout(() => {
    const botResponse = generateBotResponse(currentInput);
    const botMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      userId: 'bot',
      message: botResponse,
      isBot: true,
      timestamp: new Date().toISOString(),
    };

    messages.value.push(botMessage);
    isTyping.value = false;
    scrollToBottom();
  }, 1000 + Math.random() * 2000);
};

const handleSuggestionClick = (suggestion: string) => {
  inputMessage.value = suggestion;
  emit('messageSelect', suggestion);
};

// Watch for new messages to auto-scroll
watch(() => messages.value.length, scrollToBottom);
</script>

<style scoped>
.bg-gradient-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
</style>
