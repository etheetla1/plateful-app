/**
 * Test Cases for Requirement 2.2.5 - Generate Specific Recipe
 * 
 * Tests API endpoint: POST /api/generate-recipe
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

jest.mock('../services/intent-extraction', () => ({
  extractIntent: jest.fn(),
}));

jest.mock('../services/recipe-search', () => ({
  searchRecipe: jest.fn(),
}));

jest.mock('../services/recipe-scraper', () => ({
  scrapeRecipeContent: jest.fn(),
}));

jest.mock('../services/recipe-formatter', () => ({
  formatRecipe: jest.fn(),
}));

jest.mock('../services/ingredient-substitution', () => ({
  substituteIngredients: jest.fn(),
  detectDisallowedIngredients: jest.fn(),
}));

import { getContainer, generateId } from '../lib/cosmos';
import { extractIntent } from '../services/intent-extraction';
import { searchRecipe } from '../services/recipe-search';
import { scrapeRecipeContent } from '../services/recipe-scraper';
import { formatRecipe } from '../services/recipe-formatter';
import { substituteIngredients, detectDisallowedIngredients } from '../services/ingredient-substitution';
import generateRecipeRoutes from '../api/generate-recipe';

const app = new Hono<Env>();
app.route('/api/generate-recipe', generateRecipeRoutes);

describe('Requirement 2.2.5 - Generate Specific Recipe', () => {
  let mockMessagesContainer: any;
  let mockRecipesContainer: any;
  let mockConversationContainer: any;
  let mockProfileContainer: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a fresh query mock for each test
    const createQueryMock = () => ({
      fetchAll: jest.fn().mockResolvedValue({ resources: [] }),
    });

    mockMessagesContainer = {
      items: {
        query: jest.fn(createQueryMock),
      },
    };

    mockRecipesContainer = {
      items: {
        create: jest.fn(),
        query: jest.fn(),
      },
      item: jest.fn(() => ({
        read: jest.fn().mockResolvedValue({ resource: {} }),
        replace: jest.fn().mockResolvedValue({ resource: {} }),
      })),
    };

    mockConversationContainer = {
      item: jest.fn(() => ({
        read: jest.fn().mockResolvedValue({ resource: { id: 'conv-456', userID: 'user-123', status: 'exploring' } }),
        replace: jest.fn().mockResolvedValue({ resource: {} }),
      })),
    };

    mockProfileContainer = {
      item: jest.fn(() => ({
        read: jest.fn(),
      })),
    };

    (getContainer as jest.Mock).mockImplementation((containerName: string) => {
      if (containerName === 'chatMessages') return mockMessagesContainer;
      if (containerName === 'recipes') return mockRecipesContainer;
      if (containerName === 'chatConversations') return mockConversationContainer;
      if (containerName === 'userProfiles') return mockProfileContainer;
      return null;
    });
  });

  describe('TC-2.2.5.1: Successful Recipe Generation from Conversation', () => {
    it('should successfully generate recipe from conversation', async () => {
      // Initialization
      const conversationID = 'conv-456';
      const userID = 'user-123';

      // Override the default mock for this test
      const queryResult = {
        fetchAll: jest.fn().mockResolvedValue({
          resources: [
            {
              conversationID,
              messageIndex: 0,
              role: 'user',
              content: 'I want to make Chicken Tikka Masala',
              timestamp: new Date().toISOString(),
            },
          ],
        }),
      };
      mockMessagesContainer.items.query.mockReturnValue(queryResult);

      (extractIntent as jest.Mock).mockResolvedValue({
        dish: 'Chicken Tikka Masala',
        status: 'specific_dish',
        searchQuery: 'Chicken Tikka Masala recipe',
      });

      (searchRecipe as jest.Mock).mockResolvedValue([
        { url: 'https://example.com/recipe', title: 'Chicken Tikka Masala' },
      ]);

      (scrapeRecipeContent as jest.Mock).mockResolvedValue({
        content: 'Recipe content here with enough characters to pass the validation check. This is a detailed recipe for Chicken Tikka Masala that includes all the necessary ingredients and step-by-step instructions. The recipe requires marinating chicken pieces in yogurt and spices, then cooking them in a rich tomato-based sauce with cream and aromatic spices like garam masala, cumin, and coriander. Serve with basmati rice or naan bread for a complete meal.',
        imageUrl: 'https://example.com/image.jpg',
      });

      (formatRecipe as jest.Mock).mockResolvedValue({
        title: 'Chicken Tikka Masala',
        description: 'A delicious Indian dish',
        ingredients: ['chicken', 'spices'],
        instructions: ['Step 1', 'Step 2'],
        portions: '4 servings',
      });

      (detectDisallowedIngredients as jest.Mock).mockReturnValue([]);

      mockRecipesContainer.items.query.mockReturnValue({
        fetchAll: jest.fn().mockResolvedValue({ resources: [] }),
      });
      mockRecipesContainer.items.create.mockResolvedValue({ resource: {} });
      mockConversationContainer.item().read.mockResolvedValue({
        resource: { id: conversationID, userID, status: 'exploring' },
      });

      // Test Steps
      const res = await app.request('/api/generate-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationID, userID }),
      });

      // Expected Results
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.recipe).toBeDefined();
      expect(data.recipe.recipeData.title).toBe('Chicken Tikka Masala');
      expect(extractIntent).toHaveBeenCalled();
      expect(searchRecipe).toHaveBeenCalled();
      expect(scrapeRecipeContent).toHaveBeenCalled();
      expect(formatRecipe).toHaveBeenCalled();
      expect(mockRecipesContainer.items.create).toHaveBeenCalled();
    });
  });

  describe('TC-2.2.5.2: Missing ConversationID', () => {
    it('should reject request with missing conversationID', async () => {
      // Test Steps
      const res = await app.request('/api/generate-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userID: 'user-123' }),
      });

      // Expected Results
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('required');
      expect(extractIntent).not.toHaveBeenCalled();
    });
  });

  describe('TC-2.2.5.3: Off-Topic Conversation Rejection', () => {
    it('should reject off-topic conversations', async () => {
      // Initialization
      const conversationID = 'conv-456';
      const userID = 'user-123';

      const queryResult = {
        fetchAll: jest.fn().mockResolvedValue({
          resources: [
          {
            conversationID,
            messageIndex: 0,
            role: 'user',
            content: 'Tell me about cement mixing',
            timestamp: new Date().toISOString(),
          },
        ],
        }),
      };
      mockMessagesContainer.items.query.mockReturnValue(queryResult);

      (extractIntent as jest.Mock).mockResolvedValue({
        dish: '',
        status: 'off_topic',
        searchQuery: '',
      });

      // Test Steps
      const res = await app.request('/api/generate-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationID, userID }),
      });

      // Expected Results
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Off-topic');
      expect(searchRecipe).not.toHaveBeenCalled();
    });
  });

  describe('TC-2.2.5.4: Recipe Search Failure', () => {
    it('should handle recipe search failure gracefully', async () => {
      // Initialization
      const conversationID = 'conv-456';
      const userID = 'user-123';

      const queryResult = {
        fetchAll: jest.fn().mockResolvedValue({
          resources: [
          {
            conversationID,
            messageIndex: 0,
            role: 'user',
            content: 'I want to make Very Obscure Dish Name',
            timestamp: new Date().toISOString(),
          },
        ],
        }),
      };
      mockMessagesContainer.items.query.mockReturnValue(queryResult);

      (extractIntent as jest.Mock).mockResolvedValue({
        dish: 'Very Obscure Dish Name',
        status: 'specific_dish',
        searchQuery: 'Very Obscure Dish Name recipe',
      });

      (searchRecipe as jest.Mock).mockResolvedValue([]);

      // Test Steps
      const res = await app.request('/api/generate-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationID, userID }),
      });

      // Expected Results
      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.error).toBeDefined();
      expect(scrapeRecipeContent).not.toHaveBeenCalled();
    });
  });

  describe('TC-2.2.5.5: Database Unavailable During Recipe Storage', () => {
    it('should handle database unavailability during storage', async () => {
      // Initialization
      const conversationID = 'conv-456';
      const userID = 'user-123';

      const queryResult = {
        fetchAll: jest.fn().mockResolvedValue({
          resources: [
          {
            conversationID,
            messageIndex: 0,
            role: 'user',
            content: 'I want to make Chicken Tikka Masala',
            timestamp: new Date().toISOString(),
          },
        ],
        }),
      };
      mockMessagesContainer.items.query.mockReturnValue(queryResult);

      (extractIntent as jest.Mock).mockResolvedValue({
        dish: 'Chicken Tikka Masala',
        status: 'specific_dish',
        searchQuery: 'Chicken Tikka Masala recipe',
      });

      (searchRecipe as jest.Mock).mockResolvedValue([
        { url: 'https://example.com/recipe', title: 'Chicken Tikka Masala' },
      ]);

      (scrapeRecipeContent as jest.Mock).mockResolvedValue({
        content: 'Recipe content here with enough characters to pass the validation check. This is a detailed recipe for Chicken Tikka Masala that includes all the necessary ingredients and step-by-step instructions. The recipe requires marinating chicken pieces in yogurt and spices, then cooking them in a rich tomato-based sauce with cream and aromatic spices like garam masala, cumin, and coriander. Serve with basmati rice or naan bread for a complete meal.',
      });

      (formatRecipe as jest.Mock).mockResolvedValue({
        title: 'Chicken Tikka Masala',
        ingredients: [],
        instructions: [],
      });

      (detectDisallowedIngredients as jest.Mock).mockReturnValue([]);
      mockRecipesContainer.items.query.mockReturnValue({
        fetchAll: jest.fn().mockResolvedValue({ resources: [] }),
      });
      mockRecipesContainer.items.create.mockRejectedValue(
        new Error('Database unavailable')
      );

      // Test Steps
      const res = await app.request('/api/generate-recipe', {
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
});

