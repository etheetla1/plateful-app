/**
 * Test Cases for Requirement 2.2.4 - Generate meal ideas
 * 
 * Tests API endpoints: POST /api/chat/conversation, POST /api/chat/message, POST /api/chat/ai-response
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Hono } from 'hono';
import type { Env } from 'hono';

// Mock dependencies
jest.mock('../lib/cosmos', () => ({
  getContainer: jest.fn(),
  generateId: jest.fn((prefix) => `${prefix}-${Date.now()}`),
  isCosmosAvailable: jest.fn(() => true),
}));

const mockAnthropicMessagesCreate = jest.fn();
jest.mock('@anthropic-ai/sdk', () => {
  return {
    __esModule: true,
    default: class Anthropic {
      messages: { create: jest.Mock };
      constructor() {
        this.messages = {
          create: mockAnthropicMessagesCreate,
        };
      }
    },
  };
});

import { getContainer, generateId } from '../lib/cosmos';
import Anthropic from '@anthropic-ai/sdk';
import chatRoutes from '../api/chat';

const app = new Hono<Env>();
app.route('/api/chat', chatRoutes);

describe('Requirement 2.2.4 - Generate meal ideas', () => {
  let mockConversationContainer: any;
  let mockMessageContainer: any;
  let mockProfileContainer: any;
  let mockAnthropicClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockConversationContainer = {
      items: {
        create: jest.fn().mockResolvedValue({ resource: { id: 'conv-456', userID: 'user-123', status: 'exploring' } } as any),
        query: jest.fn(),
      },
      item: jest.fn(() => ({
        read: jest.fn().mockResolvedValue({ resource: { id: 'conv-456', userID: 'user-123', status: 'exploring' } } as any),
        replace: jest.fn().mockResolvedValue({ resource: {} } as any),
      })),
    };

    mockMessageContainer = {
      items: {
        create: jest.fn().mockResolvedValue({ resource: {} } as any),
        query: jest.fn(() => ({
          fetchAll: jest.fn().mockResolvedValue({ resources: [] } as any),
        })),
      },
    };

    mockProfileContainer = {
      item: jest.fn(() => ({
        read: jest.fn(),
      })),
    };

    (getContainer as jest.Mock).mockImplementation((containerName: string) => {
      if (containerName === 'chatConversations') return mockConversationContainer;
      if (containerName === 'chatMessages') return mockMessageContainer;
      if (containerName === 'userProfiles') return mockProfileContainer;
      return null;
    });

    // Reset the mock function
    mockAnthropicMessagesCreate.mockReset();
  });

  describe('TC-2.2.4.1: Successful Meal Idea Generation', () => {
    it('should successfully generate meal ideas', async () => {
      // Initialization
      const userID = 'user-123';
      const createdConvID = 'conv-456';
      mockConversationContainer.items.create.mockResolvedValue({ resource: { id: createdConvID, userID } } as any);
      mockMessageContainer.items.create.mockResolvedValue({ resource: { id: 'msg-1', conversationID: createdConvID, role: 'user', content: 'I want to make something Italian for dinner' } } as any);
      mockMessageContainer.items.query.mockReturnValue({
        fetchAll: jest.fn().mockResolvedValue({
          resources: [
            {
              conversationID: createdConvID,
              messageIndex: 0,
              role: 'user',
              content: 'I want to make something Italian for dinner',
              timestamp: new Date().toISOString(),
            },
          ],
        } as any),
      });
      mockAnthropicMessagesCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'Here are some great Italian meal ideas...' }],
      } as any);

      // Test Steps
      const createConvRes = await app.request('/api/chat/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userID }),
      });
      expect(createConvRes.status).toBe(201);
      const convData = await createConvRes.json();
      const actualConvID = convData.conversation.id;

      const sendMsgRes = await app.request('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationID: actualConvID,
          role: 'user',
          content: 'I want to make something Italian for dinner',
        }),
      });
      expect(sendMsgRes.status).toBe(201);

      const aiResponseRes = await app.request('/api/chat/ai-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationID: actualConvID, userID }),
      });

      // Expected Results
      expect(aiResponseRes.status).toBe(200);
      const responseData = await aiResponseRes.json();
      expect(responseData.response).toContain('Italian');
      expect(mockConversationContainer.items.create).toHaveBeenCalled();
      expect(mockMessageContainer.items.create).toHaveBeenCalled();
      expect(mockAnthropicMessagesCreate).toHaveBeenCalled();
    });
  });

  describe('TC-2.2.4.2: Empty Prompt Handling', () => {
    it('should reject empty message content', async () => {
      // Initialization
      const conversationID = 'conv-456';

      // Test Steps
      const res = await app.request('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationID,
          role: 'user',
          content: '',
        }),
      });

      // Expected Results
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('required');
      expect(mockMessageContainer.items.create).not.toHaveBeenCalled();
    });
  });

  describe('TC-2.2.4.3: Off-Topic Conversation Detection', () => {
    it('should handle off-topic conversations', async () => {
      // Initialization
      const conversationID = 'conv-456';
      const userID = 'user-123';

      mockMessageContainer.items.query.mockReturnValue({
        fetchAll: jest.fn().mockResolvedValue({
          resources: [
            {
              conversationID,
              messageIndex: 0,
              role: 'user',
              content: 'Tell me about the weather today',
              timestamp: new Date().toISOString(),
            },
          ],
        } as any),
      });
      mockAnthropicMessagesCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'I can help with recipes and cooking...' }],
      } as any);

      // Test Steps
      const res = await app.request('/api/chat/ai-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationID, userID }),
      });

      // Expected Results
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.response).toBeDefined();
      // AI may acknowledge off-topic but still respond
    });
  });

  describe('TC-2.2.4.4: AI Service Unavailable', () => {
    it('should handle AI service unavailability', async () => {
      // Initialization
      const conversationID = 'conv-456';
      const userID = 'user-123';

      mockMessageContainer.items.query.mockReturnValue({
        fetchAll: jest.fn().mockResolvedValue({
          resources: [
            {
              conversationID,
              messageIndex: 0,
              role: 'user',
              content: 'I want Italian food',
              timestamp: new Date().toISOString(),
            },
          ],
        }),
      });
      mockAnthropicMessagesCreate.mockRejectedValue(
        new Error('API key invalid') as any
      );

      // Test Steps
      const res = await app.request('/api/chat/ai-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationID, userID }),
      });

      // Expected Results
      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });
  });

  describe('TC-2.2.4.5: Multiple Message Conversation Flow', () => {
    it('should maintain conversation history across multiple messages', async () => {
      // Initialization
      const conversationID = 'conv-456';
      const userID = 'user-123';

      const messages = [
        {
          conversationID,
          messageIndex: 0,
          role: 'user',
          content: 'I want something spicy',
          timestamp: new Date().toISOString(),
        },
        {
          conversationID,
          messageIndex: 1,
          role: 'assistant',
          content: 'How about Thai food?',
          timestamp: new Date().toISOString(),
        },
        {
          conversationID,
          messageIndex: 2,
          role: 'user',
          content: 'Maybe Thai food',
          timestamp: new Date().toISOString(),
        },
      ];
      mockMessageContainer.items.query.mockReturnValue({
        fetchAll: jest.fn().mockResolvedValue({ resources: messages } as any),
      });

      mockAnthropicMessagesCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'Pad Thai sounds great!' }],
      } as any);

      // Test Steps
      const res = await app.request('/api/chat/ai-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationID, userID }),
      });

      // Expected Results
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.response).toBeDefined();
      // Verify conversation history is passed to AI
      const callArgs = mockAnthropicMessagesCreate.mock.calls[0][0] as any;
      expect(callArgs.messages.length).toBeGreaterThan(1);
    });
  });
});

