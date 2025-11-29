import { groqService } from './groqService';

export interface ChatMessage {
  id: string;
  userId: string;
  message: string;
  isBot: boolean;
  timestamp: string;
  conversationId?: string;
}

export interface ChatbotResponse {
  message: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  suggestions?: string[];
  actions?: string[];
}

class EnhancedChatbotService {
  constructor() {
    // Groq service is now used directly instead of edge functions
    console.log('Enhanced Chatbot Service initialized with Groq integration');
  }

  async sendMessage(
    message: string,
    conversationHistory: ChatMessage[] = [],
    userRole?: 'patient' | 'doctor' | 'clinic'
  ): Promise<ChatbotResponse> {
    try {
      // Check for emergency keywords first
      if (this.isEmergencyMessage(message)) {
        return {
          message: this.getEmergencyResponse(),
          suggestions: ['Call 911', 'Find nearest emergency room']
        };
      }

      // Try Groq service first if configured
      if (groqService.isConfigured()) {
        try {
          // Convert conversation history to Groq format
          const groqHistory = conversationHistory.map(msg => ({
            role: msg.isBot ? 'assistant' as const : 'user' as const,
            content: msg.message,
            timestamp: new Date(msg.timestamp)
          }));

          // Add role context to the message
          const contextualMessage = userRole 
            ? `[User Role: ${userRole}] ${message}`
            : message;

          const groqResponse = await groqService.chatWithGroq(contextualMessage, groqHistory);
          
          return {
            message: groqResponse.content,
            suggestions: this.getSuggestions(message, userRole),
            actions: []
          };
        } catch (groqError) {
          console.log('Groq service failed, using local fallback:', groqError);
          // Fall back to local responses
          return this.getLocalResponse(message, userRole);
        }
      } else {
        console.log('Groq API key not configured, using local responses');
        // Use local responses if Groq is not configured
        return this.getLocalResponse(message, userRole);
      }
    } catch (error) {
      console.error('Chatbot service error:', error);
      // Always return a fallback response instead of throwing
      return this.getLocalResponse(message, userRole);
    }
  }

  // Local fallback responses
  private getLocalResponse(message: string, userRole?: 'patient' | 'doctor' | 'clinic'): ChatbotResponse {
    const lowerMessage = message.toLowerCase();
    
    // Appointment related
    if (lowerMessage.includes('appointment') || lowerMessage.includes('book') || lowerMessage.includes('schedule')) {
      return {
        message: `I can help you with appointments! 

**To book an appointment:**
1. Go to the "Find Clinics" section
2. Search for your preferred clinic or doctor
3. Select a date and time
4. Complete the booking process with payment

**Payment Policy:**
- All appointments require upfront payment (₱500 consultation fee + ₱50 booking fee)
- Payment secures your booking and reduces no-shows
- GCash and other payment methods are available

If you need to reschedule or cancel an existing appointment, visit the "My Appointments" section.

Need help with a specific step?`,
        suggestions: ['Find clinics', 'Check appointment status', 'Reschedule appointment', 'Payment help']
      };
    }
    
    // Emergency related
    if (this.isEmergencyMessage(message)) {
      return {
        message: this.getEmergencyResponse(),
        suggestions: ['Call 911', 'Find nearest emergency room']
      };
    }
    
    // Medical information
    if (lowerMessage.includes('symptom') || lowerMessage.includes('pain') || lowerMessage.includes('feeling')) {
      return {
        message: `I understand you're experiencing symptoms. While I can't provide medical diagnoses, here's some general guidance:

📋 **Track Your Symptoms:**
- Note when symptoms started
- Rate severity (1-10)
- List any triggers or patterns
- Mention any medications you're taking

🏥 **When to See a Doctor:**
- Symptoms are severe or worsening
- Symptoms last more than a few days
- You have concerning symptoms like fever, chest pain, or difficulty breathing
- You're unsure about the cause

📱 **For Medical Care:**
- Book an appointment through the platform for non-urgent concerns
- Call emergency services for severe symptoms

⚠️ This is general guidance only. Always consult a healthcare provider for medical advice.

Would you like help booking an appointment?`,
        suggestions: ['Book appointment', 'Find clinics', 'Emergency symptoms', 'When to see doctor']
      };
    }
    
    // Medication related
    if (lowerMessage.includes('medicine') || lowerMessage.includes('medication') || lowerMessage.includes('drug')) {
      return {
        message: `Regarding medications, here's some general information:

💊 **General Medication Guidelines:**
- Take medications exactly as prescribed
- Don't share medications with others
- Store medications properly (cool, dry place)
- Keep track of side effects
- Ask your pharmacist about interactions

📅 **Medication Reminders:**
- Use phone alarms or reminder apps
- Keep a medication schedule
- Refill prescriptions before they run out
- Bring medication lists to appointments

⚠️ **Important:**
- Never change dosages without consulting your doctor
- Report side effects to your healthcare provider
- Ask about food/drug interactions

For specific medication questions, please consult your pharmacist or healthcare provider.

Need help booking an appointment to discuss your medications?`,
        suggestions: ['Book appointment', 'Medication safety', 'Side effects', 'Pharmacy locator']
      };
    }
    
    // Clinic search
    if (lowerMessage.includes('clinic') || lowerMessage.includes('find') || lowerMessage.includes('nearby') || lowerMessage.includes('location')) {
      return {
        message: `I can help you find clinics! Here's how:

🔍 **Search Clinics:**
- Browse by name, specialty, or location
- Filter by services offered
- Check ratings and reviews
- View operating hours

📍 **Location-Based Search:**
- Use your current location
- Search by city or area
- Find clinics near specific addresses

⭐ **Top Features:**
- Real-time availability
- Online booking
- Patient reviews
- Service pricing

Would you like me to help you find a specific type of clinic or healthcare provider?`,
        suggestions: ['Search by specialty', 'Find nearby clinics', 'View top-rated', 'Check availability']
      };
    }
    
    // Role-specific responses
    if (userRole === 'patient') {
      return {
        message: `Hello! I'm MediBot, your healthcare assistant. I can help you with:

🏥 **Appointments:** Booking, rescheduling, and cancellations
💊 **Medications:** General information and reminders
🔍 **Symptoms:** General guidance (not diagnoses)
📋 **Health Tips:** Wellness and preventive care
🏥 **Clinic Info:** Finding the right healthcare provider

Type your question or choose from the suggested topics. For emergencies, call emergency services immediately!

What would you like to know?`,
        suggestions: ['Book appointment', 'Find clinics', 'Medication help', 'Health tips', 'Emergency info']
      };
    } else if (userRole === 'doctor') {
      return {
        message: `Hello! I'm MediBot, here to assist healthcare professionals. I can help with:

👥 **Patient Communication:** Tips and strategies
📚 **Medical References:** General clinical information
📅 **Scheduling:** Appointment management guidance
🔬 **Guidelines:** General clinical practice information
📊 **Analytics:** Patient care insights

How can I assist you today?`,
        suggestions: ['Patient communication', 'Medical guidelines', 'Scheduling tips', 'Clinical references']
      };
    } else if (userRole === 'clinic') {
      return {
        message: `Hello! I'm MediBot, here to assist clinic administrators. I can help with:

🏢 **Clinic Management:** Operations and workflows
📅 **Scheduling:** Patient appointment optimization
👥 **Staff Coordination:** Team management tips
📊 **Analytics:** Clinic performance insights
🌟 **Patient Experience:** Service improvement

What would you like help with today?`,
        suggestions: ['Clinic management', 'Scheduling optimization', 'Staff tips', 'Patient experience']
      };
    }
    
    // Default response
    return {
      message: `Hello! I'm MediBot, your healthcare assistant. I'm here to help with general health information, appointment questions, and wellness advice.

🏥 **How I Can Help:**
- Appointment booking and scheduling
- General health information
- Medication guidance (general)
- Wellness and preventive care tips
- Clinic navigation assistance

⚠️ **Important:** I'm not a substitute for professional medical advice. Always consult healthcare providers for medical concerns.

What would you like to know?`,
      suggestions: ['Book appointment', 'Find clinics', 'Medication info', 'Health tips', 'Emergency guidance']
    };
  }

  // Get suggestions based on message and user role
  private getSuggestions(message: string, userRole?: 'patient' | 'doctor' | 'clinic'): string[] {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('appointment')) {
      return ['Book new appointment', 'Check existing appointments', 'Reschedule', 'Cancel appointment'];
    }
    
    if (lowerMessage.includes('clinic') || lowerMessage.includes('find')) {
      return ['Search by location', 'Search by specialty', 'Top-rated clinics', 'Available now'];
    }
    
    if (lowerMessage.includes('symptom') || lowerMessage.includes('pain')) {
      return ['Book appointment', 'Emergency symptoms', 'When to see doctor', 'Self-care tips'];
    }
    
    if (lowerMessage.includes('medicine') || lowerMessage.includes('medication')) {
      return ['Medication safety', 'Side effects', 'Drug interactions', 'Pharmacy locator'];
    }

    // Default suggestions based on role
    if (userRole === 'patient') {
      return ['Book appointment', 'Find clinics', 'Medication help', 'Health tips'];
    } else if (userRole === 'doctor') {
      return ['Patient communication', 'Medical guidelines', 'Scheduling', 'Clinical references'];
    } else if (userRole === 'clinic') {
      return ['Clinic management', 'Scheduling', 'Staff coordination', 'Patient experience'];
    }
    
    return ['Book appointment', 'Find clinics', 'General health info', 'Emergency help'];
  }

  // Check if message contains emergency keywords
  isEmergencyMessage(message: string): boolean {
    const emergencyKeywords = [
      'emergency',
      'chest pain',
      'difficulty breathing',
      'severe bleeding',
      'loss of consciousness',
      'suicide',
      'heart attack',
      'stroke',
      'call 911',
      'call emergency',
      'urgent care',
      'unconscious',
      'severe pain',
      'overdose'
    ];

    const lowerMessage = message.toLowerCase();
    return emergencyKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  // Get emergency response
  getEmergencyResponse(): string {
    return `🚨 **EMERGENCY NOTICE** 🚨

If you're experiencing a medical emergency, please:

1. **Call emergency services immediately** (911 or your local emergency number)
2. **Go to the nearest emergency room**
3. **Do not wait for a response from this chat**

This chatbot is NOT a substitute for emergency medical care. If you have severe symptoms like:
- Chest pain or pressure
- Difficulty breathing
- Severe bleeding
- Loss of consciousness
- Sudden severe headache

**Call emergency services right now.**

After you've addressed the emergency, I can help you with general health questions or appointment scheduling.`;
  }

  // Get suggested health topics for quick responses
  getSuggestedTopics(userRole?: 'patient' | 'doctor' | 'clinic'): string[] {
    if (userRole === 'patient') {
      return [
        'How do I book an appointment?',
        'What are common flu symptoms?',
        'When should I see a doctor?',
        'Medication reminders',
        'Health tips for daily wellness',
        'Understanding lab results',
        'How to prepare for doctor visit',
      ];
    } else if (userRole === 'doctor') {
      return [
        'Patient management tips',
        'Latest medical guidelines',
        'Prescription information',
        'Diagnostic recommendations',
        'Patient communication tips',
        'Medical reference queries',
        'Telemedicine best practices',
      ];
    } else if (userRole === 'clinic') {
      return [
        'Clinic management advice',
        'Patient scheduling optimization',
        'Healthcare regulations',
        'Staff management tips',
        'Patient experience improvement',
        'Clinic workflow optimization',
        'Revenue cycle management',
      ];
    } else {
      return [
        'General health information',
        'Appointment booking',
        'Medication information',
        'Symptom guidance',
        'Wellness tips',
        'Emergency guidance',
        'Find nearby clinics',
      ];
    }
  }
}

export const enhancedChatbotService = new EnhancedChatbotService();
