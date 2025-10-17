import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@plateful/ui';
import type { ChatMessage, ChatConversation } from '@plateful/shared';

const API_BASE = 'http://localhost:3000';

// Mock user ID for development
const MOCK_USER_ID = 'user-dev-001';

export default function ChatScreen() {
  const [conversationID, setConversationID] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatingRecipe, setGeneratingRecipe] = useState(false);
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Initialize conversation
  useEffect(() => {
    startNewConversation();
  }, []);

  const startNewConversation = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/chat/conversation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userID: MOCK_USER_ID }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`❌ Conversation creation failed (${response.status}):`, errorData);
        
        if (response.status === 503) {
          throw new Error('Chat service unavailable - Cosmos DB not configured. Check your .env file.');
        }
        throw new Error(`Failed to create conversation: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('🎯 Conversation created:', data);
      
      const newConvID = data.conversation.conversationID;
      setConversationID(newConvID);
      setConversation(data.conversation);
      setMessages([]);
      
      // Send initial greeting
      await sendAssistantMessage(
        newConvID,
        "Hi! I'm here to help you discover delicious recipes. What kind of meal are you in the mood for today?"
      );
    } catch (error) {
      console.error('❌ Failed to start conversation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Error', `Failed to start chat: ${errorMessage}`);
    }
  };

  const sendAssistantMessage = async (convID: string, content: string) => {
    try {
      console.log(`📤 Sending assistant message to ${convID}`);
      
      const response = await fetch(`${API_BASE}/api/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationID: convID,
          role: 'assistant',
          content,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`❌ Assistant message failed (${response.status}):`, errorData);
        throw new Error(`Failed to send message: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Assistant message sent:', data);
      console.log('📨 Message object:', data.message);
      
      // Add the message to the UI
      if (data.message) {
        setMessages(prev => [...prev, data.message]);
      } else {
        console.error('❌ No message in assistant response:', data);
      }
    } catch (error) {
      console.error('❌ Failed to send assistant message:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !conversationID) return;

    const userMessage = inputText.trim();
    setInputText('');
    setLoading(true);

    try {
      console.log(`📤 Sending user message...`);
      
      // Send user message
      const userResponse = await fetch(`${API_BASE}/api/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationID,
          role: 'user',
          content: userMessage,
        }),
      });

      if (!userResponse.ok) {
        const errorData = await userResponse.json().catch(() => ({}));
        console.error('❌ User message response error:', errorData);
        throw new Error(`Failed to send message: ${userResponse.statusText}`);
      }

      const userData = await userResponse.json();
      console.log('✅ User message sent:', userData);
      console.log('📨 Message object:', userData.message);
      
      if (userData.message) {
        setMessages(prev => [...prev, userData.message]);
      } else {
        console.error('❌ No message in response:', userData);
      }

      // Get AI response
      const aiResponse = await getAIResponse([...messages, userData.message]);
      await sendAssistantMessage(conversationID, aiResponse);
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getAIResponse = async (messageHistory: ChatMessage[]): Promise<string> => {
    // This is a simplified AI response - in production, you'd call Claude API
    // For now, we'll provide contextual responses based on keywords
    const lastUserMessage = messageHistory
      .filter(m => m.role === 'user')
      .pop()?.content.toLowerCase() || '';

    // Simple keyword-based responses
    if (lastUserMessage.includes('spicy') || lastUserMessage.includes('hot')) {
      return "Great! I love spicy food. How about dishes like Chicken Tikka Masala, Pad Thai, or Szechuan Beef? Do any of these sound good to you?";
    } else if (lastUserMessage.includes('italian')) {
      return "Italian cuisine is wonderful! Would you prefer pasta (like Carbonara or Bolognese), pizza, or something like Chicken Parmesan?";
    } else if (lastUserMessage.includes('healthy') || lastUserMessage.includes('light')) {
      return "I can help you find healthy options! How about Grilled Salmon with Vegetables, Quinoa Buddha Bowl, or Greek Chicken Salad?";
    } else if (lastUserMessage.includes('yes') || lastUserMessage.includes('sounds good') || lastUserMessage.includes('that')) {
      return "Perfect! I've got your choice. Click 'Find Recipe' below and I'll search for an authentic recipe for you!";
    } else {
      return "That sounds interesting! Could you tell me more about what kind of flavors or ingredients you're interested in? Or would you like me to suggest some popular options?";
    }
  };

  const generateRecipe = async () => {
    if (!conversationID) return;

    setGeneratingRecipe(true);

    try {
      console.log(`🔄 Generating recipe for conversation ${conversationID}...`);
      
      const response = await fetch(`${API_BASE}/api/generate-recipe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationID,
          userID: MOCK_USER_ID,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate recipe: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Recipe generated:', data);
      
      Alert.alert(
        'Recipe Found!',
        `I found a recipe for ${data.intent.dish}! Check it out in the Recipes tab.`,
        [
          { text: 'Start New Chat', onPress: startNewConversation },
          { text: 'OK', style: 'cancel' },
        ]
      );
    } catch (error) {
      console.error('❌ Failed to generate recipe:', error);
      Alert.alert(
        'Error',
        'Failed to generate recipe. Make sure you\'ve discussed a specific dish in the conversation and that Cosmos DB is configured.'
      );
    } finally {
      setGeneratingRecipe(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons name="chatbubbles" size={24} color="#4CAF50" />
          <Text style={styles.title}>Recipe Chat</Text>
        </View>
        <TouchableOpacity onPress={startNewConversation} style={styles.newChatButton}>
          <Ionicons name="add-circle-outline" size={24} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((message, index) => (
          <View
            key={message.id || index}
            style={[
              styles.messageBubble,
              message.role === 'user' ? styles.userBubble : styles.assistantBubble,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                message.role === 'user' ? styles.userText : styles.assistantText,
              ]}
            >
              {message.content}
            </Text>
            <Text
              style={[
                styles.timestamp,
                message.role === 'user' ? styles.userTimestamp : styles.assistantTimestamp,
              ]}
            >
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        ))}
        {loading && (
          <View style={styles.loadingBubble}>
            <ActivityIndicator size="small" color="#757575" />
          </View>
        )}
      </ScrollView>

      {messages.length > 2 && (
        <View style={styles.recipeButtonContainer}>
          <Button
            title={generatingRecipe ? "Generating Recipe..." : "Find Recipe"}
            onPress={generateRecipe}
            loading={generatingRecipe}
            variant="primary"
            disabled={generatingRecipe}
          />
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type your message..."
          placeholderTextColor="#9E9E9E"
          multiline
          maxLength={500}
          editable={!loading}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || loading) && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!inputText.trim() || loading}
        >
          <Ionicons
            name="send"
            size={20}
            color={!inputText.trim() || loading ? '#9E9E9E' : '#FFFFFF'}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212121',
  },
  newChatButton: {
    padding: 4,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 12,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#4CAF50',
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userText: {
    color: '#FFFFFF',
  },
  assistantText: {
    color: '#212121',
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
  },
  userTimestamp: {
    color: '#E8F5E9',
    textAlign: 'right',
  },
  assistantTimestamp: {
    color: '#9E9E9E',
  },
  loadingBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  recipeButtonContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    color: '#212121',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
});

