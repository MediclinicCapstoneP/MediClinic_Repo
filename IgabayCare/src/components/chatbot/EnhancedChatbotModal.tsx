import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, X, AlertTriangle, Clock } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { ChatMessage } from '../../types';
import { enhancedChatbotService } from '../../services/enhancedChatbotService';

interface EnhancedChatbotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EnhancedChatbotModal: React.FC<EnhancedChatbotModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history from localStorage on mount
  useEffect(() => {
    if (isOpen) {
      const savedHistory = localStorage.getItem(`chatbot_history_${user?.id || 'anonymous'}`);
      const history = savedHistory ? JSON.parse(savedHistory) : [];
      
      // Initialize with welcome message if no history
      if (history.length === 0) {
        const welcomeMessage: ChatMessage = {
          id: '1',
          userId: 'bot',
          message: `Hello! I'm MediBot, your AI healthcare assistant. I'm here to help with general health information, appointment questions, and wellness advice.

⚠️ **Important:** I'm not a substitute for professional medical advice. For emergencies, call emergency services immediately.

How can I help you today?`,
          isBot: true,
          timestamp: new Date().toISOString(),
        };
        setMessages([welcomeMessage]);
      } else {
        setMessages(history);
      }

      // Set suggested topics based on user role
      const topics = getSuggestedTopics(user?.role as any);
      setSuggestedTopics(topics);
    }
  }, [isOpen, user?.id, user?.role]);

  // Save chat history to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 1) { // Don't save if only welcome message
      localStorage.setItem(
        `chatbot_history_${user?.id || 'anonymous'}`,
        JSON.stringify(messages)
      );
    }
  }, [messages, user?.id]);

  const clearHistory = () => {
    localStorage.removeItem(`chatbot_history_${user?.id || 'anonymous'}`);
    const welcomeMessage: ChatMessage = {
      id: '1',
      userId: 'bot',
      message: `Hello! I'm MediBot, your AI healthcare assistant. I'm here to help with general health information, appointment questions, and wellness advice.

⚠️ **Important:** I'm not a substitute for professional medical advice. For emergencies, call emergency services immediately.

How can I help you today?`,
      isBot: true,
      timestamp: new Date().toISOString(),
    };
    setMessages([welcomeMessage]);
    setSuggestedTopics(getSuggestedTopics(user?.role as any));
  };

  const getSuggestedTopics = (userRole?: string): string[] => {
    const commonTopics = [
      'What are common symptoms of flu?',
      'How do I book an appointment?',
      'What preventive care should I get?',
      'How to manage stress?',
    ];

    const patientTopics = [
      'How to prepare for a doctor visit?',
      'What should I ask my doctor?',
      'Understanding lab results',
      'Medication safety tips',
    ];

    const doctorTopics = [
      'Best practices for patient communication',
      'Current medical guidelines',
      'Telemedicine tips',
      'Documentation best practices',
    ];

    const clinicTopics = [
      'Clinic management best practices',
      'Patient scheduling optimization',
      'Staff coordination tips',
      'Healthcare regulations',
    ];

    switch (userRole) {
      case 'patient':
        return [...commonTopics, ...patientTopics];
      case 'doctor':
        return [...commonTopics, ...doctorTopics];
      case 'clinic':
        return [...commonTopics, ...clinicTopics];
      default:
        return commonTopics;
    }
  };

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      userId: user?.id || 'anonymous',
      message: inputText.trim(),
      isBot: false,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Check for emergency keywords
      const emergencyKeywords = ['emergency', 'chest pain', 'difficulty breathing', 'severe bleeding', 'unconscious', 'heart attack', 'stroke'];
      const isEmergency = emergencyKeywords.some(keyword => 
        userMessage.message.toLowerCase().includes(keyword)
      );

      if (isEmergency) {
        const emergencyResponse = `🚨 **EMERGENCY NOTICE** 🚨

Based on your message, you may need immediate medical attention.

**Please call emergency services immediately:**
- Philippines: 911 or 166
- Or go to the nearest emergency room

**Don't wait:** When it comes to emergencies, every minute counts.

I'm not equipped to handle emergency situations. Please seek immediate medical care.`;

        const emergencyMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          userId: 'bot',
          message: emergencyResponse,
          isBot: true,
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, emergencyMessage]);
        setIsLoading(false);
        return;
      }

      // Get previous messages for context (only user and assistant messages)
      const contextMessages = messages
        .slice(-10); // Keep last 10 messages for context

      // Call the enhanced chatbot service
      const response = await enhancedChatbotService.sendMessage(
        userMessage.message,
        contextMessages,
        user?.role
      );

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        userId: 'bot',
        message: response.message,
        isBot: true,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chatbot Error:', error);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        userId: 'bot',
        message: 'I apologize, but I\'m having trouble connecting right now. Please try again later or contact our support team for assistance.',
        isBot: true,
        timestamp: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedTopic = (topic: string) => {
    setInputText(topic);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[600px] flex flex-col">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-full">
              <Bot size={20} />
            </div>
            <div>
              <h3 className="font-semibold">MediBot</h3>
              <p className="text-sm opacity-90">AI Healthcare Assistant</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {messages.length > 1 && (
              <button
                onClick={clearHistory}
                className="px-3 py-1 text-xs bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                title="Clear chat history"
              >
                Clear History
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-2xl ${
                  message.isBot
                    ? message.message.includes('EMERGENCY NOTICE')
                      ? 'bg-red-50 border border-red-200 text-red-900'
                      : 'bg-white border border-gray-200 text-gray-900'
                    : 'bg-blue-600 text-white'
                }`}
              >
                <div className="flex items-start space-x-2">
                  {message.isBot && (
                    <div className={`p-1 rounded-full flex-shrink-0 mt-1 ${
                      message.message.includes('EMERGENCY NOTICE')
                        ? 'bg-red-100'
                        : 'bg-blue-100'
                    }`}>
                      {message.message.includes('EMERGENCY NOTICE') ? (
                        <AlertTriangle size={12} className="text-red-600" />
                      ) : (
                        <Bot size={12} className="text-blue-600" />
                      )}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm whitespace-pre-line">{message.message}</p>
                    <p className="text-xs opacity-70 mt-1 flex items-center space-x-1">
                      <Clock size={10} />
                      <span>
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </p>
                  </div>
                  {!message.isBot && (
                    <div className="p-1 bg-white/20 rounded-full flex-shrink-0 mt-1">
                      <User size={12} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 p-3 rounded-2xl">
                <div className="flex items-center space-x-2">
                  <div className="p-1 bg-blue-100 rounded-full">
                    <Bot size={12} className="text-blue-600" />
                  </div>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Topics */}
        {suggestedTopics.length > 0 && (
          <div className="p-4 bg-white border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-2">Quick Questions:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedTopics.slice(0, 4).map((topic, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestedTopic(topic)}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full transition-colors"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 bg-white border-t border-gray-200">
          <div className="flex space-x-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about health, appointments, or wellness..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isLoading}
              size="sm"
              className="px-4"
            >
              <Send size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
