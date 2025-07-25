import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { ChatMessage } from '../../types';

export const ChatBot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      userId: 'bot',
      message: 'Hello! I\'m iGabay, your AI healthcare assistant. How can I help you today?',
      isBot: true,
      timestamp: new Date().toISOString(),
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const quickSuggestions = [
    'Find nearby clinics',
    'Book an appointment',
    'Check my appointments',
    'What are the symptoms of flu?',
    'How to reschedule appointment?',
    'Clinic operating hours',
  ];

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      userId: 'user',
      message: inputMessage,
      isBot: false,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate bot response
    setTimeout(() => {
      const botResponse = generateBotResponse(inputMessage.toLowerCase());
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        userId: 'bot',
        message: botResponse,
        isBot: true,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 2000);
  };

  const generateBotResponse = (userInput: string): string => {
    // Simple response logic - in production, this would connect to your PythonAnywhere ML service
    if (userInput.includes('appointment') || userInput.includes('book')) {
      return "I can help you book an appointment! To get started, please tell me:\n\n1. What type of medical service do you need?\n2. Do you have a preferred clinic or location?\n3. When would you like to schedule your appointment?\n\nYou can also use the 'Search Clinics' feature to browse available healthcare providers.";
    }
    
    if (userInput.includes('clinic') || userInput.includes('nearby') || userInput.includes('find')) {
      return "I can help you find clinics! Here are your options:\n\n🔍 **Search Clinics**: Browse by name, specialty, or location\n📍 **Nearby Clinics**: Find healthcare providers close to you\n⭐ **Top Rated**: View highly-rated clinics in your area\n\nWould you like me to help you with any specific type of medical service?";
    }

    if (userInput.includes('symptom') || userInput.includes('flu') || userInput.includes('fever')) {
      return "I understand you're asking about symptoms. While I can provide general health information, it's important to consult with a healthcare professional for proper diagnosis and treatment.\n\nFor flu symptoms, common signs include:\n• Fever or chills\n• Cough\n• Sore throat\n• Body aches\n• Fatigue\n\nIf you're experiencing concerning symptoms, I recommend booking an appointment with a healthcare provider. Would you like help finding a clinic near you?";
    }

    if (userInput.includes('reschedule') || userInput.includes('cancel')) {
      return "To reschedule or cancel an appointment:\n\n1. Go to 'My Appointments' in the menu\n2. Find the appointment you want to modify\n3. Click 'Reschedule' or 'Cancel'\n4. Follow the prompts to select a new date/time\n\nNote: Please reschedule at least 24 hours in advance when possible. Some clinics may have specific cancellation policies.\n\nNeed help with a specific appointment?";
    }

    if (userInput.includes('hours') || userInput.includes('open') || userInput.includes('closed')) {
      return "Clinic operating hours vary by location. Here's how to check:\n\n📋 **Clinic Details**: Each clinic page shows operating hours\n🔍 **Search Results**: Hours are displayed with each clinic\n📍 **Nearby Clinics**: Shows if clinics are currently open\n\nMost clinics operate:\n• Weekdays: 8:00 AM - 6:00 PM\n• Saturdays: 9:00 AM - 4:00 PM\n• Sundays: Limited hours or closed\n\nWould you like help finding a specific clinic's hours?";
    }

    // Default response
    return "I'm here to help you with your healthcare needs! I can assist you with:\n\n🏥 Finding and booking appointments\n📍 Locating nearby clinics\n📅 Managing your appointments\n🔍 General health information\n⚙️ Using the iGabayAtiCare platform\n\nWhat would you like help with today?";
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">iGabay AI Assistant</h1>
        <p className="text-gray-600">Get instant help with appointments, clinic information, and health guidance</p>
      </div>

      <div className="flex-1 flex flex-col">
        <Card className="flex-1 flex flex-col">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Bot className="text-white" size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">iGabay AI</h3>
                <p className="text-sm text-gray-600">Always here to help</p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col pt-0">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                      message.isBot
                        ? 'bg-gray-100 text-gray-900'
                        : 'bg-blue-600 text-white'
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      {message.isBot && (
                        <Bot size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm whitespace-pre-line">{message.message}</p>
                        <p className={`text-xs mt-1 ${
                          message.isBot ? 'text-gray-500' : 'text-blue-200'
                        }`}>
                          {new Date(message.timestamp).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                      {!message.isBot && (
                        <User size={16} className="text-blue-200 mt-0.5 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-2xl">
                    <div className="flex items-center space-x-2">
                      <Bot size={16} className="text-blue-600" />
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

            {/* Quick Suggestions */}
            {messages.length === 1 && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Quick suggestions:</p>
                <div className="flex flex-wrap gap-2">
                  {quickSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full hover:bg-blue-100 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isTyping}
                className="rounded-full px-4"
              >
                <Send size={16} />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};