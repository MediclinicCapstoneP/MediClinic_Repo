import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, X, MessageCircle, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from './Button';
import { Card, CardContent } from './Card';
import { ChatMessage } from '../../types';

export const FloatingChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-gradient-primary text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col">
          {/* Header */}
          <div className="bg-gradient-primary text-white p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-full">
                <Bot size={20} />
              </div>
              <div>
                <h3 className="font-semibold">iGabay AI Assistant</h3>
                <p className="text-sm opacity-90">Your healthcare companion</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 hover:bg-white/20 rounded transition-colors"
              >
                {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/20 rounded transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Chat Content */}
          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-2xl ${
                        message.isBot
                          ? 'bg-gray-100 text-gray-900'
                          : 'bg-primary-600 text-white'
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        {message.isBot && (
                          <div className="p-1 bg-primary-100 rounded-full flex-shrink-0 mt-1">
                            <Bot size={12} className="text-primary-600" />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="text-sm whitespace-pre-line">{message.message}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(message.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
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
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 p-3 rounded-2xl">
                      <div className="flex items-center space-x-2">
                        <div className="p-1 bg-primary-100 rounded-full">
                          <Bot size={12} className="text-primary-600" />
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

              {/* Quick Suggestions */}
              {messages.length === 1 && (
                <div className="px-4 pb-2">
                  <p className="text-xs text-gray-500 mb-2">Quick suggestions:</p>
                  <div className="flex flex-wrap gap-2">
                    {quickSuggestions.slice(0, 3).map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded-full transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isTyping}
                    size="sm"
                    className="px-4"
                  >
                    <Send size={16} />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}; 