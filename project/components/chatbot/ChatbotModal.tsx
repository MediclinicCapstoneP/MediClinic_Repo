import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { groqService, ChatMessage } from '../../services/groqService';
import { useAuth } from '../../contexts/AuthContext';

interface ChatbotModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ChatbotModal: React.FC<ChatbotModalProps> = ({ visible, onClose }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible) {
      // Initialize with welcome message
      const welcomeMessage: ChatMessage = {
        role: 'assistant',
        content: `Hello! I'm MediBot, your healthcare assistant powered by AI. I'm here to help with general health information, appointment questions, and wellness advice.

⚠️ **Important:** I'm not a substitute for professional medical advice. For emergencies, call emergency services immediately.

How can I help you today?`,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);

      // Set suggested topics based on user role
      const topics = getSuggestedTopics(user?.role as any);
      setSuggestedTopics(topics);
    }
  }, [visible, user?.role]);

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

    switch (userRole) {
      case 'patient':
        return [...commonTopics, ...patientTopics];
      case 'doctor':
        return [...commonTopics, ...doctorTopics];
      default:
        return commonTopics;
    }
  };

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Check for emergency keywords
      const emergencyKeywords = ['emergency', 'chest pain', 'difficulty breathing', 'severe bleeding', 'unconscious', 'heart attack', 'stroke'];
      const isEmergency = emergencyKeywords.some(keyword => 
        userMessage.content.toLowerCase().includes(keyword)
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
          role: 'assistant',
          content: emergencyResponse,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, emergencyMessage]);
        setIsLoading(false);
        return;
      }

      // Get previous messages for context (only user and assistant messages)
      const contextMessages = messages
        .slice(-10); // Keep last 10 messages for context

      const response = await groqService.chatWithGroq(userMessage.content, contextMessages);

      setMessages(prev => [...prev, response]);
    } catch (error) {
      console.error('Groq API Error:', error);
      
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'I apologize, but I\'m having trouble connecting right now. Please try again later or contact our support team for assistance.',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedTopic = (topic: string) => {
    setInputText(topic);
  };

  const renderMessage = (message: ChatMessage, index: number) => {
    const isUser = message.role === 'user';
    const isEmergency = message.content.includes('EMERGENCY NOTICE');

    return (
      <View
        key={index}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessage : styles.assistantMessage,
          isEmergency && styles.emergencyMessage,
        ]}
      >
        <View style={styles.messageHeader}>
          <Ionicons
            name={isUser ? 'person' : 'medical'}
            size={16}
            color={isUser ? '#2563EB' : (isEmergency ? '#DC2626' : '#10B981')}
          />
          <Text style={[
            styles.messageRole,
            isUser ? styles.userRole : styles.assistantRole,
            isEmergency && styles.emergencyRole,
          ]}>
            {isUser ? 'You' : 'MediBot'}
          </Text>
          <Text style={styles.messageTime}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <Text style={[
          styles.messageContent,
          isUser ? styles.userContent : styles.assistantContent,
          isEmergency && styles.emergencyContent,
        ]}>
          {message.content}
        </Text>
      </View>
    );
  };

  const renderSuggestedTopics = () => {
    if (suggestedTopics.length === 0) return null;

    return (
      <View style={styles.suggestedTopicsContainer}>
        <Text style={styles.suggestedTopicsTitle}>Quick Questions:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.suggestedTopicsList}>
            {suggestedTopics.map((topic, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestedTopicButton}
                onPress={() => handleSuggestedTopic(topic)}
              >
                <Text style={styles.suggestedTopicText}>{topic}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Ionicons name="medical" size={24} color="#2563EB" />
              <View style={styles.headerText}>
                <Text style={styles.headerTitle}>MediBot</Text>
                <Text style={styles.headerSubtitle}>Healthcare Assistant</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
        >
          {messages.map((message, index) => renderMessage(message, index))}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#2563EB" />
              <Text style={styles.loadingText}>MediBot is thinking...</Text>
            </View>
          )}
        </ScrollView>

        {renderSuggestedTopics()}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask about health, appointments, or wellness..."
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={500}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
            ]}
            onPress={handleSendMessage}
            disabled={!inputText.trim() || isLoading}
          >
            <Ionicons
              name="send"
              size={20}
              color={inputText.trim() && !isLoading ? 'white' : '#9CA3AF'}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    marginVertical: 4,
    maxWidth: '85%',
    padding: 12,
    borderRadius: 12,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#2563EB',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emergencyMessage: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  messageRole: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
    flex: 1,
  },
  userRole: {
    color: 'white',
  },
  assistantRole: {
    color: '#10B981',
  },
  emergencyRole: {
    color: '#DC2626',
  },
  messageTime: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  messageContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  userContent: {
    color: 'white',
  },
  assistantContent: {
    color: '#374151',
  },
  emergencyContent: {
    color: '#991B1B',
    fontWeight: '500',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginVertical: 8,
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  suggestedTopicsContainer: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  suggestedTopicsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  suggestedTopicsList: {
    flexDirection: 'row',
    gap: 8,
  },
  suggestedTopicButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  suggestedTopicText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
    backgroundColor: '#F9FAFB',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#F3F4F6',
  },
});
