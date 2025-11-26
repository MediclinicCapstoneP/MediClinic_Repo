import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Send, Bot, User } from 'lucide-react-native';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export default function ChatBot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I\'m your MediClinic assistant. How can I help you today?',
      role: 'assistant',
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSend = async () => {
    if (inputText.trim() === '' || isLoading) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputText,
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Call the Edge function
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      // Add assistant message
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        role: 'assistant',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error. Please check your internet connection and try again.',
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: any) => {
    if (e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Bot size={24} color="#fff" />
        <Text style={styles.headerText}>MediClinic Assistant</Text>
      </View>
      
      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.map((message) => (
          <View 
            key={message.id} 
            style={[
              styles.messageContainer, 
              message.role === 'user' ? styles.userMessageContainer : styles.assistantMessageContainer
            ]}
          >
            <View style={[
              styles.messageBubble,
              message.role === 'user' ? styles.userMessageBubble : styles.assistantMessageBubble
            ]}>
              {message.role === 'assistant' ? (
                <Bot size={16} color="#3B82F6" style={styles.messageIcon} />
              ) : (
                <User size={16} color="#1E40AF" style={styles.messageIcon} />
              )}
              <Text style={[
                styles.messageText,
                message.role === 'user' ? styles.userMessageText : styles.assistantMessageText
              ]}>
                {message.content}
              </Text>
            </View>
          </View>
        ))}
        {isLoading && (
          <View style={[styles.messageContainer, styles.assistantMessageContainer]}>
            <View style={[styles.messageBubble, styles.assistantMessageBubble]}>
              <Bot size={16} color="#3B82F6" style={styles.messageIcon} />
              <Text style={[styles.messageText, styles.assistantMessageText]}>
                Thinking...
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type your message here..."
          multiline
          numberOfLines={1}
          maxLength={500}
          onKeyPress={handleKeyPress}
          editable={!isLoading}
        />
        <TouchableOpacity 
          style={[styles.sendButton, isLoading && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={isLoading || inputText.trim() === ''}
        >
          <Send size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    padding: 16,
  },
  headerText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messagesContent: {
    paddingBottom: 16,
  },
  messageContainer: {
    marginBottom: 16,
    flexDirection: 'row',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  assistantMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  userMessageBubble: {
    backgroundColor: '#3B82F6',
    borderBottomRightRadius: 4,
  },
  assistantMessageBubble: {
    backgroundColor: '#e2e8f0',
    borderBottomLeftRadius: 4,
  },
  messageIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#fff',
  },
  assistantMessageText: {
    color: '#1e293b',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
});