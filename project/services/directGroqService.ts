// Alternative service for direct Groq API calls (without edge functions)
// Use this if you want to test without deploying edge functions

interface DirectGroqMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface DirectGroqResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

class DirectGroqService {
  private apiKey: string;
  private baseUrl = 'https://api.groq.com/openai/v1/chat/completions';

  constructor() {
    this.apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
    if (!this.apiKey) {
      console.warn('Groq API key not found in environment variables');
    }
  }

  async sendMessage(
    messages: DirectGroqMessage[],
    userRole?: 'patient' | 'doctor' | 'clinic'
  ): Promise<{ message: string; usage?: any }> {
    if (!this.apiKey) {
      throw new Error('Groq API key not configured');
    }

    // Create system prompt based on user role
    const systemPrompt = this.getSystemPrompt(userRole);
    const groqMessages: DirectGroqMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'mixtral-8x7b-32768',
          messages: groqMessages,
          max_tokens: 1000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Groq API error: ${errorData}`);
      }

      const data: DirectGroqResponse = await response.json();
      return {
        message: data.choices[0]?.message?.content || 'Sorry, I could not generate a response.',
        usage: data.usage,
      };
    } catch (error) {
      console.error('Direct Groq API error:', error);
      throw error;
    }
  }

  private getSystemPrompt(userRole?: 'patient' | 'doctor' | 'clinic'): string {
    const basePrompt = `You are MediBot, an AI-powered healthcare assistant for the MediClinic platform. You provide helpful health information and guidance while maintaining professional medical ethics.

CORE RESPONSIBILITIES:
- Provide general health information and wellness tips
- Help users understand common medical terminology
- Assist with appointment booking and clinic navigation
- Offer medication reminders and general health advice
- Guide users on when to seek professional medical attention

CRITICAL SAFETY GUIDELINES:
⚠️ NEVER provide specific medical diagnoses or treatment plans
⚠️ ALWAYS include: "I'm not a substitute for professional medical advice"
⚠️ For emergencies, IMMEDIATELY advise calling emergency services
⚠️ If users mention severe symptoms, direct them to emergency care
⚠️ Maintain confidentiality and professional boundaries

RESPONSE STYLE:
- Empathetic, professional, and clear
- Use simple language (avoid complex medical jargon)
- Keep responses concise but informative
- Include actionable next steps when appropriate
- Format with clear paragraphs and bullet points when helpful

EMERGENCY PROTOCOL:
If user mentions any of these, provide emergency response immediately:
- Chest pain/pressure
- Difficulty breathing
- Severe bleeding
- Loss of consciousness
- Suicidal thoughts
- Stroke symptoms`;

    const roleSpecific = userRole === 'patient' 
      ? '\n\nYou\'re assisting a PATIENT. Focus on appointment booking, understanding symptoms, general health education, medication reminders, and preparing for doctor visits.'
      : userRole === 'doctor'
      ? '\n\nYou\'re assisting a DOCTOR. Focus on patient communication strategies, medical reference information, diagnostic considerations, treatment options, and clinical workflow.'
      : userRole === 'clinic'
      ? '\n\nYou\'re assisting a CLINIC administrator. Focus on clinic management, patient scheduling, staff coordination, healthcare regulations, and patient experience.'
      : '\n\nYou\'re assisting a general healthcare user. Provide balanced support for various healthcare needs.';

    return basePrompt + roleSpecific;
  }
}

export const directGroqService = new DirectGroqService();
