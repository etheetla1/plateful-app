// Mock helpers for tests
import { jest } from '@jest/globals';

export const mockCosmosContainer = {
  items: {
    create: jest.fn(),
    query: jest.fn(),
    upsert: jest.fn(),
  },
  item: jest.fn(() => ({
    read: jest.fn(),
    replace: jest.fn(),
    delete: jest.fn(),
  })),
};

export const mockCosmosClient = {
  database: jest.fn(() => ({
    container: jest.fn(() => mockCosmosContainer),
  })),
};

export const mockFirebaseAuth = {
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  currentUser: null,
};

export const mockAnthropicClient = {
  messages: {
    create: jest.fn(),
  },
};

export const resetMocks = () => {
  jest.clearAllMocks();
  mockCosmosContainer.items.create.mockReset();
  mockCosmosContainer.items.query.mockReset();
  mockCosmosContainer.items.upsert.mockReset();
  mockFirebaseAuth.signInWithEmailAndPassword.mockReset();
  mockAnthropicClient.messages.create.mockReset();
};

