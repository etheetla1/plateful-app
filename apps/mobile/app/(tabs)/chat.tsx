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
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@plateful/ui';
import { allColors as colors } from '@plateful/shared';
import type { ChatMessage, ChatConversation } from '@plateful/shared';
import type { IntentExtractionResult } from '@plateful/shared';
import { auth } from '../../src/config/firebase';
import Header from '../../src/components/Header';

// API endpoint - platform aware
const API_BASE = Platform.select({
  web: 'http://localhost:3001',      // Web browser
  android: 'http://10.0.2.2:3001',   // Android emulator
  ios: 'http://localhost:3001',      // iOS simulator
  default: 'http://localhost:3001',
});

export default function ChatScreen() {
  const [conversationID, setConversationID] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatingRecipe, setGeneratingRecipe] = useState(false);
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [currentIntent, setCurrentIntent] = useState<IntentExtractionResult | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const sparkleAnim1 = useRef(new Animated.Value(0)).current;
  const sparkleAnim2 = useRef(new Animated.Value(0)).current;
  const sparkleAnim3 = useRef(new Animated.Value(0)).current;

  // Initialize conversation
  useEffect(() => {
    if (auth.currentUser) {
      startNewConversation();
    }
  }, []);

  // Sparkle animation effect
  useEffect(() => {
    if (currentIntent && currentIntent.certaintyLevel !== 'low') {
      const createSparkleAnimation = (animValue: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(animValue, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(animValue, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.delay(1000),
          ])
        );
      };

      createSparkleAnimation(sparkleAnim1, 0).start();
      createSparkleAnimation(sparkleAnim2, 200).start();
      createSparkleAnimation(sparkleAnim3, 400).start();
    }
  }, [currentIntent?.certaintyLevel]);

  const startNewConversation = async () => {
    if (!auth.currentUser) {
      Alert.alert('Error', 'Please sign in to use chat');
      return;
    }

    try {
      // Clear current intent when starting new conversation
      setCurrentIntent(null);
      
      const response = await fetch(`${API_BASE}/api/chat/conversation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userID: auth.currentUser.uid }),
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
      
      // Extract current intent after conversation update
      setTimeout(() => extractCurrentIntent(), 500);
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
          userID: auth.currentUser?.uid,
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

  const extractCurrentIntent = async () => {
    if (!conversationID || messages.length === 0 || !auth.currentUser) return;

    try {
      const response = await fetch(`${API_BASE}/api/extract-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationID,
          userID: auth.currentUser.uid,
        }),
      });

      if (response.ok) {
        const intent = await response.json();
        setCurrentIntent(intent);
        console.log('🧠 Current intent updated:', intent);
      }
    } catch (error) {
      console.error('❌ Failed to extract intent:', error);
    }
  };

  const generateRecipe = async () => {
    if (!conversationID || !auth.currentUser) return;

    setGeneratingRecipe(true);

    try {
      console.log(`🔄 Generating recipe for conversation ${conversationID}...`);
      
      const response = await fetch(`${API_BASE}/api/generate-recipe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationID,
          userID: auth.currentUser.uid,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle off-topic conversations
        if (response.status === 400 && errorData.error === 'Off-topic conversation') {
          Alert.alert(
            'Not About Cooking',
            'Let\'s talk about food! Ask me about a dish or cuisine you\'d like to cook.',
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

  const getButtonText = () => {
    if (generatingRecipe) return "Generating Recipe...";
    if (!currentIntent) return "✨ Find Recipe";
    
    // Low confidence = broad category = random/surprise
    if (currentIntent.certaintyLevel === 'low') return "🎲 Surprise Me";
    
    // Medium/High confidence = specific dish = precise search
    return "✨ Find Recipe";
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <Header title="Recipe Chat" />
      <View style={styles.newChatContainer}>
        <TouchableOpacity onPress={startNewConversation} style={styles.newChatButton}>
          <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
          <Text style={styles.newChatText}>New Chat</Text>
        </TouchableOpacity>
      </View>

      {/* Sticky Intent Banner */}
      {currentIntent && currentIntent.status !== 'off_topic' && currentIntent.status !== 'kitchen_utility' && (
        <View style={styles.intentBanner}>
          <Text style={styles.intentText}>
            💭 {currentIntent.explanation || `I'm thinking you want ${currentIntent.dish}`}
          </Text>
        </View>
      )}

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyStateTitle}>Start a conversation</Text>
            <Text style={styles.emptyStateText}>Ask me about any dish or cuisine you'd like to try!</Text>
          </View>
        ) : (
          messages.map((message, index) => (
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
              {message.content.split('\n').map((line, i) => {
                // Parse markdown bold (**text**)
                const parts = line.split(/(\*\*[^*]+\*\*)/g);
                return (
                  <Text key={i}>
                    {parts.map((part, j) => {
                      if (part.startsWith('**') && part.endsWith('**')) {
                        return (
                          <Text key={j} style={{ fontWeight: 'bold' }}>
                            {part.slice(2, -2)}
                          </Text>
                        );
                      }
                      return <Text key={j}>{part}</Text>;
                    })}
                    {i < message.content.split('\n').length - 1 && '\n'}
                  </Text>
                );
              })}
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
        ))
        )}
        {loading && (
          <View style={styles.loadingBubble}>
            <ActivityIndicator size="small" color={colors.textSecondary} />
            <Text style={styles.loadingText}>Thinking...</Text>
          </View>
        )}
      </ScrollView>

      {messages.length > 2 && currentIntent && 
       currentIntent.status !== 'kitchen_utility' && 
       currentIntent.status !== 'off_topic' && (
        <View style={styles.recipeButtonContainer}>
          <Button
            title={getButtonText()}
            onPress={generateRecipe}
            loading={generatingRecipe}
            variant={currentIntent?.certaintyLevel !== 'low' ? 'gold' : 'primary'}
            disabled={generatingRecipe}
          />
          {currentIntent.certaintyLevel !== 'low' && (
            <View style={styles.sparkleContainer}>
              <Animated.View
                style={[
                  styles.sparkleDot,
                  styles.sparkle1,
                  {
                    opacity: sparkleAnim1,
                    transform: [{
                      scale: sparkleAnim1.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.5, 1.2],
                      }),
                    }],
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.sparkleDot,
                  styles.sparkle2,
                  {
                    opacity: sparkleAnim2,
                    transform: [{
                      scale: sparkleAnim2.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.5, 1.2],
                      }),
                    }],
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.sparkleDot,
                  styles.sparkle3,
                  {
                    opacity: sparkleAnim3,
                    transform: [{
                      scale: sparkleAnim3.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.5, 1.2],
                      }),
                    }],
                  },
                ]}
              />
            </View>
          )}
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
  newChatContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    gap: 8,
  },
  newChatText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  intentBanner: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  intentText: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  sparkleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sparkleDot: {
    position: 'absolute',
    width: 4,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 2,
  },
  sparkle1: {
    top: '30%',
    left: '25%',
  },
  sparkle2: {
    top: '60%',
    right: '30%',
  },
  sparkle3: {
    top: '20%',
    right: '20%',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 20,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
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

