/**
 * Test Cases for Requirement 2.2.10 - Save Recipe After Editing
 * 
 * Tests API endpoint: PATCH /api/generate-recipe/:recipeID
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

import { getContainer } from '../lib/cosmos';
import generateRecipeRoutes from '../api/generate-recipe';

const app = new Hono<Env>();
app.route('/api/generate-recipe', generateRecipeRoutes);

describe('Requirement 2.2.10 - Save Recipe After Editing', () => {
  let mockRecipesContainer: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRecipesContainer = {
      items: {
        query: jest.fn(),
      },
      item: jest.fn(() => ({
        read: jest.fn().mockResolvedValue({ resource: {} }),
        replace: jest.fn().mockResolvedValue({ resource: {} }),
      })),
    };

    (getContainer as jest.Mock).mockImplementation((containerName: string) => {
      if (containerName === 'recipes') return mockRecipesContainer;
      return null;
    });
  });

  describe('TC-2.2.10.1: Successful Recipe Save', () => {
    it('should successfully save recipe', async () => {
      // Initialization
      const recipeID = 'recipe-789';
      const userID = 'user-123';
      const existingRecipe = {
        id: recipeID,
        userID,
        recipeID,
        recipeData: { title: 'Test Recipe' },
        isSaved: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Mock is already set up in beforeEach with default return value
      // Override for this specific test
      const mockItem = {
        read: jest.fn().mockResolvedValue({ resource: existingRecipe }),
        replace: jest.fn().mockResolvedValue({ resource: { ...existingRecipe, isSaved: true } }),
      };
      mockRecipesContainer.item.mockReturnValue(mockItem);

      // Test Steps
      const res = await app.request(`/api/generate-recipe/${recipeID}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userID, isSaved: true }),
      });

      // Expected Results
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.recipe.isSaved).toBe(true);
      expect(data.recipe.updatedAt).toBeDefined();
      expect(mockRecipesContainer.item().replace).toHaveBeenCalled();
    });
  });

  describe('TC-2.2.10.2: Save Recipe with Missing UserID', () => {
    it('should reject request with missing userID', async () => {
      // Test Steps
      const res = await app.request('/api/generate-recipe/recipe-789', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isSaved: true }),
      });

      // Expected Results
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('userID is required');
    });
  });

  describe('TC-2.2.10.3: Save Non-Existent Recipe', () => {
    it('should return 404 for non-existent recipe', async () => {
      // Initialization
      const mockItem = {
        read: jest.fn().mockResolvedValue({ resource: null }),
        replace: jest.fn(),
      };
      mockRecipesContainer.item.mockReturnValue(mockItem);

      // Test Steps
      const res = await app.request('/api/generate-recipe/recipe-nonexistent', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userID: 'user-123', isSaved: true }),
      });

      // Expected Results
      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toContain('not found');
    });
  });

  describe('TC-2.2.10.4: Unsave Recipe (Set isSaved to false)', () => {
    it('should successfully unsave recipe', async () => {
      // Initialization
      const recipeID = 'recipe-789';
      const userID = 'user-123';
      const existingRecipe = {
        id: recipeID,
        userID,
        recipeID,
        recipeData: { title: 'Test Recipe' },
        isSaved: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Mock is already set up in beforeEach with default return value
      // Override for this specific test
      const mockItem = {
        read: jest.fn().mockResolvedValue({ resource: existingRecipe }),
        replace: jest.fn().mockResolvedValue({ resource: { ...existingRecipe, isSaved: true } }),
      };
      mockRecipesContainer.item.mockReturnValue(mockItem);

      // Test Steps
      const res = await app.request(`/api/generate-recipe/${recipeID}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userID, isSaved: false }),
      });

      // Expected Results
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.recipe.isSaved).toBe(false);
      expect(data.recipe.updatedAt).toBeDefined();
    });
  });

  describe('TC-2.2.10.5: Database Unavailable During Save', () => {
    it('should handle database unavailability', async () => {
      // Initialization
      const recipeID = 'recipe-789';
      const userID = 'user-123';
      const existingRecipe = {
        id: recipeID,
        userID,
        recipeID,
        recipeData: { title: 'Test Recipe' },
        isSaved: false,
      };

      const mockItem = {
        read: jest.fn().mockResolvedValue({
          resource: existingRecipe,
        }),
        replace: jest.fn().mockRejectedValue(
          new Error('Database unavailable')
        ),
      };
      mockRecipesContainer.item.mockReturnValue(mockItem);

      // Test Steps
      const res = await app.request(`/api/generate-recipe/${recipeID}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userID, isSaved: true }),
      });

      // Expected Results
      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });
  });
});

