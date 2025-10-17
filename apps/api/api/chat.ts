import { Hono } from 'hono';
import { getContainer, generateId, isCosmosAvailable } from '../lib/cosmos';
import type { ChatMessage, ChatConversation, ChatMessageCreateRequest, ConversationCreateRequest } from '@plateful/shared';

const app = new Hono();

/**
 * Create a new conversation
 * POST /chat/conversation
 */
app.post('/conversation', async (c) => {
  if (!isCosmosAvailable()) {
    return c.json({ error: 'Chat service not available' }, 503);
  }

  try {
    const body = await c.req.json<ConversationCreateRequest>();
    const { userID } = body;

    if (!userID) {
      return c.json({ error: 'userID is required' }, 400);
    }

    const conversationID = generateId('conv');
    const now = new Date().toISOString();

    const conversation: ChatConversation = {
      id: conversationID,
      conversationID,
      userID,
      status: 'exploring',
      createdAt: now,
      updatedAt: now,
    };

    const container = getContainer('chatConversations');
    if (!container) {
      return c.json({ error: 'Database not available' }, 503);
    }

    await container.items.create(conversation);

    return c.json({ conversation }, 201);
  } catch (error) {
    console.error('Error creating conversation:', error);
    return c.json({ error: 'Failed to create conversation' }, 500);
  }
});

/**
 * Get conversation by ID
 * GET /chat/conversation/:id
 */
app.get('/conversation/:id', async (c) => {
  if (!isCosmosAvailable()) {
    return c.json({ error: 'Chat service not available' }, 503);
  }

  try {
    const conversationID = c.req.param('id');
    const container = getContainer('chatConversations');
    
    if (!container) {
      return c.json({ error: 'Database not available' }, 503);
    }

    const { resource: conversation } = await container
      .item(conversationID, conversationID)
      .read<ChatConversation>();

    if (!conversation) {
      return c.json({ error: 'Conversation not found' }, 404);
    }

    return c.json({ conversation });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return c.json({ error: 'Failed to fetch conversation' }, 500);
  }
});

/**
 * Update conversation status
 * PATCH /chat/conversation/:id
 */
app.patch('/conversation/:id', async (c) => {
  if (!isCosmosAvailable()) {
    return c.json({ error: 'Chat service not available' }, 503);
  }

  try {
    const conversationID = c.req.param('id');
    const updates = await c.req.json();
    const container = getContainer('chatConversations');
    
    if (!container) {
      return c.json({ error: 'Database not available' }, 503);
    }

    const { resource: existing } = await container
      .item(conversationID, conversationID)
      .read<ChatConversation>();

    if (!existing) {
      return c.json({ error: 'Conversation not found' }, 404);
    }

    const updated: ChatConversation = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await container.item(conversationID, conversationID).replace(updated);

    return c.json({ conversation: updated });
  } catch (error) {
    console.error('Error updating conversation:', error);
    return c.json({ error: 'Failed to update conversation' }, 500);
  }
});

/**
 * Send a chat message
 * POST /chat/message
 */
app.post('/message', async (c) => {
  if (!isCosmosAvailable()) {
    return c.json({ error: 'Chat service not available' }, 503);
  }

  try {
    const body = await c.req.json<ChatMessageCreateRequest>();
    const { conversationID, role, content } = body;

    if (!conversationID || !role || !content) {
      return c.json({ error: 'conversationID, role, and content are required' }, 400);
    }

    const messageContainer = getContainer('chatMessages');
    const conversationContainer = getContainer('chatConversations');
    
    if (!messageContainer || !conversationContainer) {
      return c.json({ error: 'Database not available' }, 503);
    }

    // Get current message count for this conversation
    const { resources: existingMessages } = await messageContainer.items
      .query<ChatMessage>({
        query: 'SELECT * FROM c WHERE c.conversationID = @conversationID ORDER BY c.messageIndex DESC OFFSET 0 LIMIT 1',
        parameters: [{ name: '@conversationID', value: conversationID }],
      })
      .fetchAll();

    const messageIndex = existingMessages.length > 0 ? existingMessages[0].messageIndex + 1 : 0;
    const messageId = generateId('msg');

    const message: ChatMessage = {
      id: messageId,
      conversationID,
      messageIndex,
      role,
      content,
      timestamp: new Date().toISOString(),
    };

    await messageContainer.items.create(message);

    // Update conversation's updatedAt timestamp
    const { resource: conversation } = await conversationContainer
      .item(conversationID, conversationID)
      .read<ChatConversation>();

    if (conversation) {
      conversation.updatedAt = new Date().toISOString();
      await conversationContainer.item(conversationID, conversationID).replace(conversation);
    }

    return c.json({ message }, 201);
  } catch (error) {
    console.error('Error creating message:', error);
    return c.json({ error: 'Failed to create message' }, 500);
  }
});

/**
 * Get all messages for a conversation
 * GET /chat/messages/:conversationID
 */
app.get('/messages/:conversationID', async (c) => {
  if (!isCosmosAvailable()) {
    return c.json({ error: 'Chat service not available' }, 503);
  }

  try {
    const conversationID = c.req.param('conversationID');
    const container = getContainer('chatMessages');
    
    if (!container) {
      return c.json({ error: 'Database not available' }, 503);
    }

    const { resources: messages } = await container.items
      .query<ChatMessage>({
        query: 'SELECT * FROM c WHERE c.conversationID = @conversationID ORDER BY c.messageIndex ASC',
        parameters: [{ name: '@conversationID', value: conversationID }],
      })
      .fetchAll();

    return c.json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return c.json({ error: 'Failed to fetch messages' }, 500);
  }
});

/**
 * Get all conversations for a user
 * GET /chat/conversations/user/:userID
 */
app.get('/conversations/user/:userID', async (c) => {
  if (!isCosmosAvailable()) {
    return c.json({ error: 'Chat service not available' }, 503);
  }

  try {
    const userID = c.req.param('userID');
    const container = getContainer('chatConversations');
    
    if (!container) {
      return c.json({ error: 'Database not available' }, 503);
    }

    const { resources: conversations } = await container.items
      .query<ChatConversation>({
        query: 'SELECT * FROM c WHERE c.userID = @userID ORDER BY c.updatedAt DESC',
        parameters: [{ name: '@userID', value: userID }],
      })
      .fetchAll();

    return c.json({ conversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return c.json({ error: 'Failed to fetch conversations' }, 500);
  }
});

export default app;

