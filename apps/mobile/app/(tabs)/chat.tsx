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
import { allColors as colors } from '@plateful/shared';
import type { ChatMessage, ChatConversation } from '@plateful/shared';

const API_BASE = 'http://10.0.2.2:3000'; // Android emulator host IP

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
    try {
      console.log('🤖 Calling real AI for response...');
      
      const response = await fetch(`${API_BASE}/api/chat/ai-response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationID: conversationID,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ AI response failed:', errorData);
        throw new Error(`AI response failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ AI response received:', data.response);
      
      return data.response || "I'm here to help you find delicious recipes! What are you in the mood for?";
      
    } catch (error) {
      console.error('❌ Failed to get AI response:', error);
      // Fallback to a simple response if AI fails
      return "I'm here to help you find delicious recipes! What are you in the mood for?";
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
        const errorData = await response.json().catch(() => ({}));
        
        // Handle the case where user hasn't decided on a specific dish yet
        if (response.status === 400 && errorData.error === 'User hasn\'t decided on a specific dish yet') {
          Alert.alert(
            'Keep Chatting!',
            'It looks like you\'re still exploring options. Continue the conversation to help decide on a specific dish, then try generating a recipe again.',
            [{ text: 'OK' }]
          );
          return;
        }
        
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
          <Ionicons name="chatbubbles" size={24} color={colors.primary} />
          <Text style={styles.title}>Recipe Chat</Text>
        </View>
        <TouchableOpacity onPress={startNewConversation} style={styles.newChatButton}>
          <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
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
            <ActivityIndicator size="small" color={colors.textSecondary} />
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
            color={!inputText.trim() || loading ? colors.disabled : colors.surface}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
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
    backgroundColor: colors.userBubble,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.botBubble,
    borderWidth: 1,
    borderColor: colors.border,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userText: {
    color: colors.textPrimary,
  },
  assistantText: {
    color: colors.textPrimary,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
  },
  userTimestamp: {
    color: colors.textSecondary,
    textAlign: 'right',
  },
  assistantTimestamp: {
    color: colors.textSecondary,
  },
  loadingBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.botBubble,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  recipeButtonContainer: {
    padding: 16,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    color: colors.textPrimary,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.border,
  },
});

