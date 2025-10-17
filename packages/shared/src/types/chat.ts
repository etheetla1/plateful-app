export interface ChatMessage {
  id: string;
  conversationID: string;
  messageIndex: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatConversation {
  id: string;
  conversationID: string;
  userID: string;
  status: 'exploring' | 'decided' | 'recipe_found';
  decidedDish?: string;
  searchQuery?: string;
  recipeID?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessageCreateRequest {
  conversationID: string;
  role: 'user' | 'assistant';
  content: string;
}

export interface ConversationCreateRequest {
  userID: string;
}

