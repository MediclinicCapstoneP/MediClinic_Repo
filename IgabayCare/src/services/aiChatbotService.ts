import { supabase } from '../supabaseClient';

// OpenAI Configuration
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || 'your-openai-api-key';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Chatbot Types
export interface ChatMessage {
  id: string;
  conversationId: string;
  messageText: string;
  messageType: 'user' | 'bot' | 'system';
  userIntent?: string;
  entitiesExtracted?: any;
  actionsTriggered?: string[];
  bookingContext?: any;
  createdAt: string;
}

export interface ChatConversation {
  id: string;
  userId?: string;
  userType: 'patient' | 'clinic' | 'doctor' | 'anonymous';
  sessionId: string;
  conversationType: string;
  status: 'active' | 'completed' | 'abandoned' | 'escalated';
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatbotResponse {
  message: string;
  intent?: string;
  entities?: any;
  actions?: string[];
  bookingData?: any;
  suggestions?: string[];
  requiresHumanHandoff?: boolean;
}

export interface BookingAssistanceContext {
  step: 'greeting' | 'clinic_search' | 'date_selection' | 'payment' | 'confirmation';
  selectedClinic?: any;
  selectedDate?: string;
  selectedTime?: string;
  appointmentType?: string;
  patientId?: string;
}

export class AIChatbotService {
  private systemPrompt = `
You are an AI assistant for IgabayCare (formerly iGabayAtiCare), a comprehensive healthcare platform in the Philippines that connects patients with clinics. Your role is to help users with:

1. **Appointment Booking**: Guide patients through finding clinics, checking availability, and booking appointments using PayMongo checkout sessions
2. **Clinic Information**: Provide details about clinics, services, doctors, and specialties
3. **Medical History**: Help patients access and understand their medical records, prescriptions, lab results, and vaccination history
4. **Payment Assistance**: Explain the payment-first policy, PayMongo checkout process, and payment verification
5. **Account Help**: Assist with profile management, appointment history, and settings
6. **Technical Support**: Help with app navigation and troubleshooting
7. **General Healthcare Guidance**: Provide general health information (not medical advice)

**Key Platform Features:**
- **Medical Records System**: Comprehensive medical history with consultation records, lab results, prescriptions, vaccinations, and more
- **Payment System**: PayMongo checkout sessions with GCash integration (payment required upfront to secure booking)
- **Multiple User Roles**: Patients, Doctors, and Clinics with role-specific features
- **Real-time Features**: Live notifications, appointment status updates, payment confirmations

**Guidelines:**
- Be helpful, professional, and empathetic
- Always clarify if you're providing general information vs. requiring professional medical advice
- Use simple, clear language appropriate for Filipino users
- Offer specific next steps and actionable guidance
- When booking appointments, always mention the payment-first policy and explain PayMongo checkout process
- For medical history questions, explain how to access records through the Patient History section
- If you cannot help, escalate to human support

**Payment Context**: 
- All appointments require upfront payment (consultation fee + booking fee)
- Payment is processed via PayMongo checkout sessions
- After payment, the appointment is automatically confirmed
- Supports GCash (primary), PayMaya, and card payments

**Medical History Context**:
- Patients can view comprehensive medical history including appointments, medical records, prescriptions, lab results, vaccinations, allergies, insurance info, and emergency contacts
- Medical records include multiple types: consultation, lab_result, prescription, vaccination, surgery, imaging, and other
- History can be viewed as timeline, dashboard summary, or filtered by date/type/doctor/clinic

**Response Format**: Provide helpful responses and identify user intents when possible.
`;

  private conversationContexts: Map<string, BookingAssistanceContext> = new Map();

  /**
   * Initialize a new chat conversation
   */
  async initializeConversation(
    userId?: string,
    userType: 'patient' | 'clinic' | 'doctor' | 'anonymous' = 'anonymous',
    conversationType: string = 'general_inquiry'
  ): Promise<ChatConversation> {
    try {
      const sessionId = this.generateSessionId();
      
      // Create conversation in database
      const { data: conversation, error } = await supabase
        .from('chatbot_conversations')
        .insert({
          user_id: userId,
          user_type: userType,
          session_id: sessionId,
          conversation_type: conversationType,
          status: 'active'
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create conversation: ${error.message}`);
      }

      // Initialize context for booking assistance
      if (conversationType === 'booking_assistance') {
        this.conversationContexts.set(conversation.id, {
          step: 'greeting',
          patientId: userId
        });
      }

      // Send welcome message
      const welcomeMessage = await this.sendMessage(
        conversation.id,
        this.getWelcomeMessage(userType, conversationType),
        'bot'
      );

      return {
        id: conversation.id,
        userId,
        userType,
        sessionId,
        conversationType,
        status: 'active',
        messages: [welcomeMessage],
        createdAt: conversation.created_at,
        updatedAt: conversation.updated_at
      };

    } catch (error) {
      console.error('Error initializing conversation:', error);
      throw error;
    }
  }

  /**
   * Process user message and generate AI response
   */
  async processMessage(
    conversationId: string,
    userMessage: string,
    userId?: string
  ): Promise<ChatbotResponse> {
    try {
      // Store user message
      await this.sendMessage(conversationId, userMessage, 'user');

      // Get conversation context
      const conversation = await this.getConversation(conversationId);
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Get recent message history for context
      const recentMessages = await this.getRecentMessages(conversationId, 10);
      
      // Analyze user intent and extract entities
      const intent = await this.analyzeUserIntent(userMessage, recentMessages);
      
      // Generate AI response based on intent
      const aiResponse = await this.generateAIResponse(
        conversationId,
        userMessage,
        intent,
        recentMessages,
        conversation
      );

      // Store AI response
      const botMessage = await this.sendMessage(
        conversationId,
        aiResponse.message,
        'bot',
        {
          userIntent: intent.intent,
          entitiesExtracted: intent.entities,
          actionsTriggered: aiResponse.actions,
          bookingContext: aiResponse.bookingData
        }
      );

      // Handle specific actions
      if (aiResponse.actions) {
        await this.handleActions(conversationId, aiResponse.actions, aiResponse.bookingData);
      }

      // Check if human handoff is needed
      if (aiResponse.requiresHumanHandoff) {
        await this.escalateToHuman(conversationId);
      }

      return aiResponse;

    } catch (error) {
      console.error('Error processing message:', error);
      
      // Return error response
      const errorMessage = "I'm sorry, I encountered an issue processing your request. Please try again or contact support if the problem persists.";
      await this.sendMessage(conversationId, errorMessage, 'bot');
      
      return {
        message: errorMessage,
        requiresHumanHandoff: true
      };
    }
  }

  /**
   * Generate AI response using OpenAI
   */
  private async generateAIResponse(
    conversationId: string,
    userMessage: string,
    intent: any,
    messageHistory: ChatMessage[],
    conversation: ChatConversation
  ): Promise<ChatbotResponse> {
    try {
      // Build context from message history
      const contextMessages = messageHistory.map(msg => ({
        role: msg.messageType === 'user' ? 'user' : 'assistant',
        content: msg.messageText
      }));

      // Add system prompt and current context
      const messages = [
        { role: 'system', content: this.buildContextualSystemPrompt(conversation, intent) },
        ...contextMessages.slice(-6), // Last 6 messages for context
        { role: 'user', content: userMessage }
      ];

      // Call OpenAI API
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages,
          max_tokens: 500,
          temperature: 0.7,
          presence_penalty: 0.1,
          frequency_penalty: 0.1
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const aiMessage = data.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";

      // Parse response for actions and booking data
      const actions = this.extractActionsFromResponse(aiMessage, intent);
      const bookingData = this.extractBookingDataFromIntent(intent);
      const suggestions = this.generateSuggestions(intent, conversation.conversationType);

      return {
        message: aiMessage,
        intent: intent.intent,
        entities: intent.entities,
        actions,
        bookingData,
        suggestions,
        requiresHumanHandoff: this.shouldEscalateToHuman(intent, aiMessage)
      };

    } catch (error) {
      console.error('Error generating AI response:', error);
      return {
        message: "I'm experiencing technical difficulties. Let me connect you with a human assistant.",
        requiresHumanHandoff: true
      };
    }
  }

  /**
   * Analyze user intent using simple keyword matching and patterns
   */
  private async analyzeUserIntent(userMessage: string, messageHistory: ChatMessage[]): Promise<any> {
    const message = userMessage.toLowerCase();
    
    // Define intent patterns
    const intentPatterns = {
      'book_appointment': [
        'book', 'appointment', 'schedule', 'magpa-schedule', 'magbook',
        'available', 'slot', 'doctor', 'clinic', 'consultation'
      ],
      'find_clinic': [
        'clinic', 'hospital', 'medical center', 'find', 'search',
        'near', 'location', 'address', 'specialty', 'doctor'
      ],
      'check_availability': [
        'available', 'availability', 'schedule', 'time slot', 'open',
        'free', 'pwede', 'may slot'
      ],
      'payment_inquiry': [
        'payment', 'pay', 'gcash', 'paymaya', 'card', 'fee',
        'cost', 'price', 'bayad', 'magkano'
      ],
      'account_help': [
        'profile', 'account', 'password', 'login', 'register',
        'update', 'change', 'reset'
      ],
      'appointment_status': [
        'status', 'confirmation', 'confirm', 'booked', 'appointment',
        'scheduled', 'nakaschedule'
      ],
      'cancel_reschedule': [
        'cancel', 'reschedule', 'change', 'move', 'lipat',
        'cancel na', 'ibang araw'
      ],
      'technical_support': [
        'error', 'problem', 'issue', 'bug', 'not working',
        'di gumagana', 'ayaw', 'hindi'
      ]
    };

    // Find matching intent
    let matchedIntent = 'general_inquiry';
    let maxScore = 0;

    for (const [intent, keywords] of Object.entries(intentPatterns)) {
      const score = keywords.reduce((acc, keyword) => {
        return acc + (message.includes(keyword) ? 1 : 0);
      }, 0);

      if (score > maxScore) {
        maxScore = score;
        matchedIntent = intent;
      }
    }

    // Extract entities based on intent
    const entities = this.extractEntities(message, matchedIntent);

    return {
      intent: matchedIntent,
      confidence: maxScore / (intentPatterns[matchedIntent as keyof typeof intentPatterns]?.length || 1),
      entities
    };
  }

  /**
   * Extract entities from user message
   */
  private extractEntities(message: string, intent: string): any {
    const entities: any = {};

    // Extract date patterns
    const datePatterns = [
      /\b(today|tomorrow|bukas|ngayon)\b/gi,
      /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi,
      /\b(\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}-\d{1,2}-\d{4})\b/gi,
      /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}\b/gi
    ];

    datePatterns.forEach(pattern => {
      const matches = message.match(pattern);
      if (matches) {
        entities.date = matches[0];
      }
    });

    // Extract time patterns
    const timePatterns = /\b(\d{1,2}:\d{2}|\d{1,2}\s*(am|pm|AM|PM))\b/gi;
    const timeMatches = message.match(timePatterns);
    if (timeMatches) {
      entities.time = timeMatches[0];
    }

    // Extract location/address
    const locationKeywords = ['near', 'sa', 'malapit', 'around', 'in'];
    locationKeywords.forEach(keyword => {
      const regex = new RegExp(`${keyword}\\s+([\\w\\s,]+?)(?:\\s|$|[.!?])`, 'i');
      const match = message.match(regex);
      if (match) {
        entities.location = match[1].trim();
      }
    });

    // Extract specialty
    const specialties = [
      'cardiology', 'dermatology', 'pediatrics', 'gynecology',
      'orthopedics', 'neurology', 'psychiatry', 'ophthalmology'
    ];
    
    specialties.forEach(specialty => {
      if (message.includes(specialty)) {
        entities.specialty = specialty;
      }
    });

    return entities;
  }

  /**
   * Handle specific actions based on AI response
   */
  private async handleActions(conversationId: string, actions: string[], bookingData?: any) {
    for (const action of actions) {
      switch (action) {
        case 'search_clinics':
          await this.handleClinicSearch(conversationId, bookingData);
          break;
        case 'check_availability':
          await this.handleAvailabilityCheck(conversationId, bookingData);
          break;
        case 'initiate_booking':
          await this.handleBookingInitiation(conversationId, bookingData);
          break;
        case 'escalate_to_human':
          await this.escalateToHuman(conversationId);
          break;
      }
    }
  }

  /**
   * Handle clinic search action
   */
  private async handleClinicSearch(conversationId: string, searchCriteria: any) {
    try {
      // Build search query
      let query = supabase
        .from('clinics')
        .select('id, clinic_name, address, city, specialties, rating')
        .eq('status', 'approved')
        .limit(5);

      // Apply filters
      if (searchCriteria?.location) {
        query = query.or(`city.ilike.%${searchCriteria.location}%,address.ilike.%${searchCriteria.location}%`);
      }

      if (searchCriteria?.specialty) {
        query = query.contains('specialties', [searchCriteria.specialty]);
      }

      const { data: clinics, error } = await query;

      if (error) {
        throw error;
      }

      if (clinics && clinics.length > 0) {
        const clinicList = clinics.map(clinic => 
          `• **${clinic.clinic_name}** - ${clinic.address}, ${clinic.city} (Rating: ${clinic.rating}/5)`
        ).join('\n');

        const searchResultMessage = `Here are some clinics that match your criteria:\n\n${clinicList}\n\nWould you like to book an appointment with any of these clinics?`;
        
        await this.sendMessage(conversationId, searchResultMessage, 'bot');
      } else {
        await this.sendMessage(conversationId, "I couldn't find any clinics matching your criteria. Would you like to try a different search or browse all available clinics?", 'bot');
      }

    } catch (error) {
      console.error('Error searching clinics:', error);
      await this.sendMessage(conversationId, "I'm having trouble searching for clinics right now. Please try again later.", 'bot');
    }
  }

  /**
   * Store message in database
   */
  private async sendMessage(
    conversationId: string,
    messageText: string,
    messageType: 'user' | 'bot' | 'system',
    metadata?: {
      userIntent?: string;
      entitiesExtracted?: any;
      actionsTriggered?: string[];
      bookingContext?: any;
    }
  ): Promise<ChatMessage> {
    const { data: message, error } = await supabase
      .from('chatbot_messages')
      .insert({
        conversation_id: conversationId,
        message_text: messageText,
        message_type: messageType,
        user_intent: metadata?.userIntent,
        entities_extracted: metadata?.entitiesExtracted,
        actions_triggered: metadata?.actionsTriggered,
        booking_context: metadata?.bookingContext
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      id: message.id,
      conversationId: message.conversation_id,
      messageText: message.message_text,
      messageType: message.message_type,
      userIntent: message.user_intent,
      entitiesExtracted: message.entities_extracted,
      actionsTriggered: message.actions_triggered,
      bookingContext: message.booking_context,
      createdAt: message.created_at
    };
  }

  /**
   * Get conversation details
   */
  private async getConversation(conversationId: string): Promise<ChatConversation | null> {
    const { data: conversation, error } = await supabase
      .from('chatbot_conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (error) {
      console.error('Error fetching conversation:', error);
      return null;
    }

    return {
      id: conversation.id,
      userId: conversation.user_id,
      userType: conversation.user_type,
      sessionId: conversation.session_id,
      conversationType: conversation.conversation_type,
      status: conversation.status,
      messages: [],
      createdAt: conversation.created_at,
      updatedAt: conversation.updated_at
    };
  }

  /**
   * Get recent messages for context
   */
  private async getRecentMessages(conversationId: string, limit: number = 10): Promise<ChatMessage[]> {
    const { data: messages, error } = await supabase
      .from('chatbot_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }

    return messages.reverse().map(msg => ({
      id: msg.id,
      conversationId: msg.conversation_id,
      messageText: msg.message_text,
      messageType: msg.message_type,
      userIntent: msg.user_intent,
      entitiesExtracted: msg.entities_extracted,
      actionsTriggered: msg.actions_triggered,
      bookingContext: msg.booking_context,
      createdAt: msg.created_at
    }));
  }

  /**
   * Helper methods
   */
  private generateSessionId(): string {
    return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getWelcomeMessage(userType: string, conversationType: string): string {
    const welcomeMessages = {
      'booking_assistance': "Hi! I'm here to help you book an appointment. I can help you find clinics, check availability, and guide you through the booking process. What kind of medical service are you looking for?",
      'clinic_search': "Hello! I can help you find clinics and healthcare providers. What type of medical service or specialty are you looking for?",
      'account_help': "Hi! I'm here to help you with your account. Whether you need help with your profile, password, or navigating the app, I'm here to assist you.",
      'technical_support': "Hello! I'm here to help you with any technical issues you might be experiencing. What seems to be the problem?",
      'general_inquiry': "Hi! I'm your iGabayAtiCare assistant. I can help you book appointments, find clinics, manage your account, or answer questions about our services. How can I help you today?"
    };

    return welcomeMessages[conversationType as keyof typeof welcomeMessages] || welcomeMessages.general_inquiry;
  }

  private buildContextualSystemPrompt(conversation: ChatConversation, intent: any): string {
    let contextPrompt = this.systemPrompt;

    // Add conversation-specific context
    if (conversation.conversationType === 'booking_assistance') {
      contextPrompt += `\n\nCurrent Context: User is seeking appointment booking assistance. Guide them through the process step by step.`;
    }

    // Add user type context
    if (conversation.userType === 'patient') {
      contextPrompt += `\n\nUser Type: Patient - Focus on booking appointments and finding healthcare services.`;
    }

    return contextPrompt;
  }

  private extractActionsFromResponse(response: string, intent: any): string[] {
    const actions: string[] = [];

    // Based on intent, determine what actions to trigger
    switch (intent.intent) {
      case 'find_clinic':
      case 'book_appointment':
        actions.push('search_clinics');
        break;
      case 'check_availability':
        actions.push('check_availability');
        break;
      case 'technical_support':
        if (response.includes('human') || response.includes('support')) {
          actions.push('escalate_to_human');
        }
        break;
    }

    return actions;
  }

  private extractBookingDataFromIntent(intent: any): any {
    return {
      location: intent.entities?.location,
      specialty: intent.entities?.specialty,
      preferredDate: intent.entities?.date,
      preferredTime: intent.entities?.time
    };
  }

  private generateSuggestions(intent: any, conversationType: string): string[] {
    const suggestions: string[] = [];

    switch (intent.intent) {
      case 'book_appointment':
        suggestions.push("Find clinics near me", "Check availability", "View specialties");
        break;
      case 'find_clinic':
        suggestions.push("Search by specialty", "Find nearby clinics", "View ratings");
        break;
      case 'general_inquiry':
        suggestions.push("Book appointment", "Find clinic", "Account help", "Technical support");
        break;
      default:
        suggestions.push("How can I help you?", "Book appointment", "Find clinic");
    }

    return suggestions;
  }

  private shouldEscalateToHuman(intent: any, response: string): boolean {
    // Escalate to human for complex medical questions or technical issues
    const escalationTriggers = [
      'complex medical',
      'emergency',
      'urgent',
      'serious',
      'technical issue',
      'bug',
      'payment problem',
      'refund'
    ];

    const messageText = response.toLowerCase();
    return escalationTriggers.some(trigger => messageText.includes(trigger));
  }

  private async escalateToHuman(conversationId: string) {
    await supabase
      .from('chatbot_conversations')
      .update({ status: 'escalated' })
      .eq('id', conversationId);

    await this.sendMessage(
      conversationId,
      "I'm connecting you with a human support representative who can better assist you. Please wait a moment.",
      'system'
    );
  }

  private async handleAvailabilityCheck(conversationId: string, criteria: any) {
    // Placeholder for availability checking logic
    await this.sendMessage(
      conversationId,
      "Let me check the availability for you. Could you please specify which clinic and what date you prefer?",
      'bot'
    );
  }

  private async handleBookingInitiation(conversationId: string, bookingData: any) {
    // Placeholder for booking initiation logic
    await this.sendMessage(
      conversationId,
      "Great! I'll help you book an appointment. Please note that payment is required upfront to secure your booking. Let's start by confirming your details.",
      'bot'
    );
  }
}

// Export singleton instance
export const aiChatbotService = new AIChatbotService();
