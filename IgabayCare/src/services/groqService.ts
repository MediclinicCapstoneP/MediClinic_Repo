interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface GroqResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

class GroqService {
  private apiKey: string;
  private baseUrl: string = 'https://api.groq.com/openai/v1';

  constructor() {
    this.apiKey = import.meta.env.VITE_GROQ_API_KEY || '';
    console.log('Groq API Key found:', !!this.apiKey);
    if (!this.apiKey) {
      console.warn('Groq API key not found in environment variables');
    }
  }

  async sendMessage(messages: any[]): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Groq API key not configured');
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: messages,
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Groq API error:', response.status, errorData);
        throw new Error(`Groq API error: ${response.status}`);
      }

      const data: GroqResponse = await response.json();
      return data.choices[0]?.message?.content || 'I apologize, but I couldn\'t generate a response.';
    } catch (error) {
      console.error('Error calling Groq API:', error);
      throw error;
    }
  }

  getSystemPrompt(): string {
    return `You are a helpful healthcare assistant for MediClinic, a medical appointment booking platform. Your role is to help users with:

1. General health information and wellness advice
2. Appointment booking and scheduling questions
3. Clinic and doctor information
4. Medicication reminders and safety information
5. Preventive care guidance

IMPORTANT GUIDELINES:
- Always provide clear, helpful information
- Include appropriate disclaimers that you're not a substitute for professional medical advice
- For emergencies, always direct users to call emergency services immediately
- Be empathetic and professional in your tone
- Keep responses concise but comprehensive
- When appropriate, suggest booking appointments for medical concerns

If users mention symptoms, provide general guidance but always recommend consulting a healthcare provider for proper diagnosis and treatment.

For emergency situations (chest pain, difficulty breathing, severe bleeding, etc.), immediately direct them to emergency services.`;
  }

  async chatWithGroq(userMessage: string, conversationHistory: ChatMessage[] = []): Promise<ChatMessage> {
    const messagesForGroq = [
      { role: 'system', content: this.getSystemPrompt() },
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: userMessage }
    ];

    try {
      const response = await this.sendMessage(messagesForGroq);
      return {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Groq service error:', error);
      return {
        role: 'assistant',
        content: 'I apologize, but I\'m having trouble connecting right now. Please try again later or contact our support team for assistance.',
        timestamp: new Date()
      };
    }
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }
}

export const groqService = new GroqService();
export type { ChatMessage, GroqResponse };
