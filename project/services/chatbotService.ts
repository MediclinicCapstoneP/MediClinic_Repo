import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface ChatbotResponse {
  message: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

class ChatbotService {
  private edgeFunctionUrl: string;

  constructor() {
    // Get Supabase edge function URL
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    this.edgeFunctionUrl = `${supabaseUrl}/functions/v1/chatbot`;
  }

  async sendMessage(
    messages: Omit<ChatMessage, 'id' | 'timestamp'>[],
    userId?: string,
    userRole?: 'patient' | 'doctor' | 'clinic'
  ): Promise<ChatbotResponse> {
    try {
      // Check for emergency keywords first
      const lastMessage = messages[messages.length - 1]?.content || '';
      if (this.isEmergencyMessage(lastMessage)) {
        return {
          message: this.getEmergencyResponse(),
        };
      }

      // Try edge function first
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        // Get current user info if not provided
        if (!userId && session?.user) {
          userId = session.user.id;
          
          // Try to get user role from user metadata or fetch from profiles
          const userMetadata = session.user.user_metadata;
          if (userMetadata?.role) {
            userRole = userMetadata.role;
          } else {
            // Fetch from profiles
            const { data: profile } = await supabase
              .from('patients')
              .select('id')
              .eq('user_id', userId)
              .single();
            
            if (profile) {
              userRole = 'patient';
            } else {
              const { data: doctorProfile } = await supabase
                .from('doctors')
                .select('id')
                .eq('user_id', userId)
                .single();
              
              if (doctorProfile) {
                userRole = 'doctor';
              } else {
                const { data: clinicProfile } = await supabase
                  .from('clinics')
                  .select('id')
                  .eq('user_id', userId)
                  .single();
                
                if (clinicProfile) {
                  userRole = 'clinic';
                }
              }
            }
          }
        }

        const response = await fetch(this.edgeFunctionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            messages: messages.map(({ role, content }) => ({ role, content })),
            userId,
            userRole,
          }),
        });

        if (!response.ok) {
          throw new Error('Edge function not available');
        }

        const data = await response.json();
        return {
          message: data.message,
          usage: data.usage,
        };
      } catch (edgeFunctionError) {
        console.log('Edge function not available, using local fallback');
        // Fall back to local responses
        return this.getLocalResponse(lastMessage, userRole);
      }
    } catch (error) {
      console.error('Chatbot service error:', error);
      throw error;
    }
  }

  // Local fallback responses
  private getLocalResponse(message: string, userRole?: 'patient' | 'doctor' | 'clinic'): ChatbotResponse {
    const lowerMessage = message.toLowerCase();
    
    // Appointment related
    if (lowerMessage.includes('appointment') || lowerMessage.includes('book') || lowerMessage.includes('schedule')) {
      return {
        message: `I can help you with appointments! 

To book an appointment:
1. Go to the "Find Clinics" tab
2. Search for your preferred clinic or doctor
3. Select a date and time
4. Complete the booking process

If you need to reschedule or cancel an existing appointment, visit the "My Appointments" section.

⚠️ Note: I'm currently in basic mode. For more detailed assistance, the full MediBot AI will be available soon.`,
      };
    }
    
    // Emergency related
    if (this.isEmergencyMessage(message)) {
      return {
        message: this.getEmergencyResponse(),
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
- Book an appointment through the app for non-urgent concerns
- Call emergency services for severe symptoms
- Visit urgent care for immediate but non-emergency needs

⚠️ This is general guidance only. Always consult a healthcare provider for medical advice.`,
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
- Keep emergency contact information available

For specific medication questions, please consult your pharmacist or healthcare provider.`,
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

Type your question or choose from these topics. For emergencies, call emergency services immediately!

⚠️ I'm currently in basic mode. The full AI-powered MediBot with advanced features will be available soon.`,
      };
    } else if (userRole === 'doctor') {
      return {
        message: `Hello! I'm MediBot, here to assist healthcare professionals. I can help with:

👥 **Patient Communication:** Tips and strategies
📚 **Medical References:** General clinical information
📅 **Scheduling:** Appointment management guidance
🔬 **Guidelines:** General clinical practice information
📊 **Analytics:** Patient care insights

⚠️ I'm currently in basic mode. The full AI-powered MediBot with clinical decision support will be available soon.`,
      };
    } else if (userRole === 'clinic') {
      return {
        message: `Hello! I'm MediBot, here to assist clinic administrators. I can help with:

🏢 **Clinic Management:** Operations and workflows
📅 **Scheduling:** Patient appointment optimization
👥 **Staff Coordination:** Team management tips
📊 **Analytics:** Clinic performance insights
🌟 **Patient Experience:** Service improvement

⚠️ I'm currently in basic mode. The full AI-powered MediBot with clinic management features will be available soon.`,
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

⚠️ I'm currently in basic mode. The full AI-powered MediBot will be available soon. For now, I can provide basic guidance and help you navigate the app features.

What would you like to know?`,
    };
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
      ];
    } else if (userRole === 'doctor') {
      return [
        'Patient management tips',
        'Latest medical guidelines',
        'Prescription information',
        'Diagnostic recommendations',
        'Patient communication tips',
        'Medical reference queries',
      ];
    } else if (userRole === 'clinic') {
      return [
        'Clinic management advice',
        'Patient scheduling optimization',
        'Healthcare regulations',
        'Staff management tips',
        'Patient experience improvement',
        'Clinic workflow optimization',
      ];
    } else {
      return [
        'General health information',
        'Appointment booking',
        'Medication information',
        'Symptom guidance',
        'Wellness tips',
        'Emergency guidance',
      ];
    }
  }

  // Format messages for display
  formatMessage(content: string, role: 'user' | 'assistant'): string {
    if (role === 'assistant') {
      // Add formatting for AI responses
      return content
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
        .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
        .replace(/\n/g, '\n'); // Preserve line breaks
    }
    return content;
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
    ];

    const lowerMessage = message.toLowerCase();
    return emergencyKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  // Get emergency response
  getEmergencyResponse(): string {
    return `⚠️ **EMERGENCY NOTICE**

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
}

export const chatbotService = new ChatbotService();
