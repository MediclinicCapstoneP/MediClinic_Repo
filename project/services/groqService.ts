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
}

class GroqService {
  private apiKey: string;
  private baseUrl: string = 'https://api.groq.com/openai/v1';

  constructor() {
    this.apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
    console.log('Groq API Key found:', !!this.apiKey);
    if (!this.apiKey) {
      console.warn('Groq API key not found in environment variables');
    }
  }

  async sendMessage(messages: any[]): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Groq API key not configured');
    }

    console.log('Sending messages to Groq:', messages);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant', // Updated model name
          messages: messages,
          temperature: 0.7,
          max_tokens: 1024,
        }),
      });

      console.log('Groq API Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Groq API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data: GroqResponse = await response.json();
      console.log('Groq API Response data:', data);
      return data.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
    } catch (error) {
      console.error('Groq API Error:', error);
      throw error;
    }
  }

  // Healthcare-specific system prompt
  getSystemPrompt(): string {
    return `You are a helpful healthcare assistant for MediClinic, a medical appointment booking platform. 

Your role is to:
1. Help users with general health questions and information
2. Assist with appointment booking and clinic information
3. Provide basic medical guidance (always with disclaimer)
4. Be empathetic and professional

Important guidelines:
- Never provide specific medical diagnoses
- Always include disclaimer: "I'm not a medical professional. Please consult a doctor for medical advice."
- Help users understand symptoms but recommend professional consultation
- Assist with navigating the MediClinic app features
- Provide general wellness and preventive care information

Keep responses concise, helpful, and appropriate for a healthcare context.`;
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
      return {
        role: 'assistant',
        content: 'I apologize, but I\'m having trouble connecting right now. Please try again later or contact our support team for assistance.',
        timestamp: new Date()
      };
    }
  }
}

export const groqService = new GroqService();
export type { ChatMessage };
