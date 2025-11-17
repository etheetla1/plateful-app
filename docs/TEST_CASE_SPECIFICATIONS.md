# Test Case Specifications - Section 10.1

## Overview
This document contains requirements-based test cases for 5 major use cases in the Plateful application. Each requirement has approximately 5 test cases covering different equivalence classes and scenarios.

---

## Requirement 2.2.2 - Log in Existing User (Use Case 1)

**Note:** Authentication is handled client-side using Firebase Auth. The requirement specifies Email/Password authentication (Google authentication is not required). Tests will validate the `signInWithEmail` service function in `apps/mobile/src/services/auth.ts` using **real Firebase Auth** (not mocks). The function handles various Firebase Auth error codes and provides user-friendly error messages. Upon successful validation, Firebase automatically creates a secure session and issues tokens. Profile completion checks and MFA are conditional features (only if enabled/required).

**Test Credentials:**
- Email: `test@jesttest.com`
- Password: `JestTestPassword`

The test user is automatically created in `beforeAll` if it doesn't exist.

### Test Case 2.2.2.1: Valid Email/Password Login

**Test Case ID:** TC-2.2.2.1

**Use Case:** 1 - Log in Existing User

**Test Inputs:**
- Email: test@jesttest.com
- Password: JestTestPassword

**Expected Results:**
- `signInWithEmail` function is called with correct parameters
- Firebase `signInWithEmailAndPassword` is invoked with auth object, email, and password
- User credential is returned successfully
- User object contains uid, email, and displayName
- Secure session is created (handled automatically by Firebase)
- Access and refresh tokens are issued (handled automatically by Firebase)
- User's stored profile and preferences are loaded (if available)
- User is redirected to dashboard/homepage
- No error is thrown

**Dependencies:**
- User account exists in Firebase with email: test@jesttest.com, password: JestTestPassword (auto-created in `beforeAll` if missing)
- Firebase Authentication service is available and configured
- Firebase Auth SDK is properly initialized via `getTestAuth()`
- Real Firebase Auth is used (not mocks)

**Initialization:**
- Initialize Firebase Auth for testing via `getTestAuth()` in `beforeAll`
- Ensure test user account exists in Firebase (auto-create if missing)
- Test user is created automatically if sign-in fails with `auth/user-not-found` or `auth/invalid-credential`

**Test Steps:**
1. Call `signInWithEmail('test@jesttest.com', 'JestTestPassword')`
2. Verify that real Firebase `signInWithEmailAndPassword` is invoked
3. Verify that function returns user object with uid
4. Verify that user object contains email: test@jesttest.com
5. Verify that no error is thrown
6. Verify that user.uid is a non-empty string

**Tear Down:**
- Clean up Firebase Auth test instance via `cleanupTestFirebase()` in `afterAll`

---

### Test Case 2.2.2.2: Invalid Email Format

**Test Case ID:** TC-2.2.2.2

**Use Case:** 1 - Log in Existing User

**Test Inputs:**
- Email: invalid-email-format
- Password: JestTestPassword

**Expected Results:**
- Login attempt is rejected
- Error message is displayed: "Invalid email address" or "Please enter a valid email"
- No session is created
- User remains on login page
- Email field is highlighted with error

**Dependencies:**
- Login page/form is accessible
- Email validation is enabled
- Error handling system is functional

**Initialization:**
- Navigate to the login page
- Clear any cached sessions or cookies

**Test Steps:**
1. Call `signInWithEmail('invalid-email-format', 'JestTestPassword')`
2. Verify that real Firebase `signInWithEmailAndPassword` is invoked
3. Verify that Firebase throws error with code 'auth/invalid-email'
4. Verify that function throws Error with message 'Invalid email address'
5. Verify that no user object is returned

**Tear Down:**
- No cleanup needed (error handling test)

---

### Test Case 2.2.2.3: Invalid Password

**Test Case ID:** TC-2.2.2.3

**Use Case:** 1 - Log in Existing User

**Test Inputs:**
- Email: test@jesttest.com
- Password: wrongpassword

**Expected Results:**
- Login attempt is rejected
- Error message is displayed: "Incorrect password" or "Invalid email or password"
- No session is created
- User remains on login page
- Password field may be cleared or highlighted

**Dependencies:**
- User account exists with email: test@jesttest.com (auto-created in `beforeAll`)
- Firebase Authentication service is available
- Error handling system is functional

**Initialization:**
- Test user exists from `beforeAll` setup
- Real Firebase Auth is initialized

**Test Steps:**
1. Call `signInWithEmail('test@jesttest.com', 'wrongpassword')`
2. Verify that real Firebase `signInWithEmailAndPassword` is invoked
3. Verify that Firebase throws error with code 'auth/wrong-password' or 'auth/invalid-credential'
4. Verify that function throws Error with message 'Incorrect password' or 'Invalid email or password'
5. Verify that no user object is returned

**Tear Down:**
- No cleanup needed (error handling test)

---

### Test Case 2.2.2.4: Empty Required Fields

**Test Case ID:** TC-2.2.2.4

**Use Case:** 1 - Log in Existing User

**Test Inputs:**
- Email: (empty)
- Password: (empty)

**Expected Results:**
- Login attempt is prevented
- Error messages are displayed for both empty fields: "Email is required" and "Password is required"
- Required fields are highlighted
- No authentication occurs
- User remains on login page

**Dependencies:**
- Login page/form is accessible
- Form validation is enabled
- Error handling system is functional

**Initialization:**
- Navigate to the login page
- Clear any cached sessions or cookies
- Ensure form fields are empty

**Test Steps:**
1. Call `signInWithEmail('', 'JestTestPassword')` with empty email
2. Verify that Firebase throws error (auth/invalid-email or similar)
3. Verify that function throws Error
4. Call `signInWithEmail('test@jesttest.com', '')` with empty password
5. Verify that Firebase throws error (auth/missing-password or similar)
6. Verify that function throws Error

**Tear Down:**
- No cleanup needed (error handling test)

---

### Test Case 2.2.2.5: Database Unavailable

**Test Case ID:** TC-2.2.2.5

**Use Case:** 1 - Log in Existing User

**Test Inputs:**
- Email: test@jesttest.com
- Password: JestTestPassword

**Expected Results:**
- Login attempt fails or is handled gracefully
- Error message is displayed if network/database error occurs
- No session is created on failure
- System handles error gracefully without crashing

**Dependencies:**
- User account exists with valid credentials (test@jesttest.com)
- Firebase Authentication service is available
- Error handling system is functional

**Initialization:**
- Test user exists from `beforeAll` setup
- Real Firebase Auth is initialized

**Test Steps:**
1. Note: Real Firebase handles network/database errors automatically
2. This test case is primarily for documentation purposes
3. Real Firebase will throw appropriate errors (auth/network-request-failed or auth/internal-error) if services are unavailable
4. Verify that error handling logic exists in the function

**Tear Down:**
- No cleanup needed (placeholder test for real Firebase)

---

## Requirement 2.2.4 - Generate meal ideas (Use Case 4)

### Test Case 2.2.4.1: Successful Meal Idea Generation

**Test Case ID:** TC-2.2.4.1

**Use Case:** 4 - Generate meal ideas

**Test Inputs:**
- User login state: Authenticated user with userID: user-123
- User prompt: "I want to make something Italian for dinner"
- ConversationID: conv-456 (new conversation)

**Expected Results:**
- Conversation is created successfully
- User message is stored in database
- AI generates meal ideas related to Italian cuisine
- AI response is displayed in chat interface
- Conversation status is updated
- Response time is reasonable (< 5 seconds)

**Dependencies:**
- User is logged in and authenticated
- API endpoints are available: POST /api/chat/conversation, POST /api/chat/message, POST /api/chat/ai-response
- Anthropic AI service is available
- Cosmos DB is available and initialized
- User profile may be fetched if userID is provided (for dietary restrictions/preferences)

**Initialization:**
- User is logged in with valid session
- Navigate to chat interface
- Clear any existing test conversations

**Test Steps:**
1. Create a new conversation via POST /api/chat/conversation with { userID: 'user-123' }
2. Send user message via POST /api/chat/message with { conversationID, role: 'user', content: 'I want to make something Italian for dinner' }
3. Request AI response via POST /api/chat/ai-response with { conversationID }
4. Verify that conversation is created with status "exploring"
5. Verify that user message is stored with correct content
6. Verify that AI response contains Italian meal suggestions
7. Verify that response is displayed in chat interface
8. Verify response time is within acceptable limits

**Tear Down:**
- Delete test conversation from Cosmos DB
- Delete test messages from Cosmos DB
- Clear chat interface state
- Reset mocks

---

### Test Case 2.2.4.2: Empty Prompt Handling

**Test Case ID:** TC-2.2.4.2

**Use Case:** 4 - Generate meal ideas

**Test Inputs:**
- User login state: Authenticated user with userID: user-123
- User prompt: "" (empty string)
- ConversationID: conv-456

**Expected Results:**
- Error message is displayed: "content is required" or similar validation error
- Message is not stored in database
- AI response is not generated
- User is prompted to enter a valid prompt
- No conversation update occurs

**Dependencies:**
- User is logged in and authenticated
- API endpoint POST /api/chat/message is available
- Validation system is functional

**Initialization:**
- User is logged in with valid session
- Navigate to chat interface
- Create a test conversation

**Test Steps:**
1. Create a new conversation via POST /api/chat/conversation with { userID: 'user-123' }
2. Attempt to send empty message via POST /api/chat/message with { conversationID, role: 'user', content: '' }
3. Verify that API returns 400 error with validation message
4. Verify that message is not stored in Cosmos DB
5. Verify that error message is displayed to user
6. Verify that conversation status remains unchanged

**Tear Down:**
- Delete test conversation from Cosmos DB
- Clear chat interface state
- Reset mocks

---

### Test Case 2.2.4.3: Off-Topic Conversation Detection

**Test Case ID:** TC-2.2.4.3

**Use Case:** 4 - Generate meal ideas

**Test Inputs:**
- User login state: Authenticated user with userID: user-123
- User prompt: "Tell me about the weather today"
- ConversationID: conv-456

**Expected Results:**
- Conversation is created
- User message is stored
- AI may respond but recognizes off-topic nature
- System may display warning or redirect conversation to food topics
- No recipe generation is triggered
- Conversation remains in "exploring" status

**Dependencies:**
- User is logged in and authenticated
- API endpoints are available: POST /api/chat/conversation, POST /api/chat/message, POST /api/chat/ai-response
- Anthropic AI service is available

**Initialization:**
- User is logged in with valid session
- Navigate to chat interface
- Clear any existing test conversations

**Test Steps:**
1. Create a new conversation via POST /api/chat/conversation with { userID: 'user-123' }
2. Send user message via POST /api/chat/message with { conversationID, role: 'user', content: 'Tell me about the weather today' }
3. Request AI response via POST /api/chat/ai-response with { conversationID }
4. Verify that conversation is created
5. Verify that user message is stored
6. Verify that AI response is generated (may acknowledge off-topic)
7. Verify that no recipe generation is triggered
8. Verify that conversation status remains "exploring"

**Tear Down:**
- Delete test conversation from Cosmos DB
- Clear chat interface state
- Reset mocks

---

### Test Case 2.2.4.4: AI Service Unavailable

**Test Case ID:** TC-2.2.4.4

**Use Case:** 4 - Generate meal ideas

**Test Inputs:**
- User login state: Authenticated user with userID: user-123
- User prompt: "I want Italian food"
- ConversationID: conv-456

**Expected Results:**
- Conversation is created successfully
- User message is stored
- Error message is displayed: "AI service unavailable" or "Failed to generate AI response"
- User is informed to try again later
- System handles error gracefully
- Conversation remains accessible for retry

**Dependencies:**
- User is logged in and authenticated
- API endpoints are available: POST /api/chat/conversation, POST /api/chat/message, POST /api/chat/ai-response
- Anthropic AI service is intentionally unavailable (simulated/mocked)
- Cosmos DB is available
- Error handling system is functional

**Initialization:**
- User is logged in with valid session
- Navigate to chat interface
- Simulate AI service unavailability (mock or disable Anthropic API)

**Test Steps:**
1. Create a new conversation via POST /api/chat/conversation with { userID: 'user-123' }
2. Send user message via POST /api/chat/message with { conversationID, role: 'user', content: 'I want Italian food' }
3. Request AI response via POST /api/chat/ai-response with { conversationID }
4. Verify that conversation is created
5. Verify that user message is stored
6. Verify that API returns 500 error or service unavailable message
7. Verify that error message is displayed to user
8. Verify that system does not crash
9. Verify that conversation can be retried later

**Tear Down:**
- Restore AI service connection
- Delete test conversation from database
- Clear chat interface state

---

### Test Case 2.2.4.5: Multiple Message Conversation Flow

**Test Case ID:** TC-2.2.4.5

**Use Case:** 4 - Generate meal ideas

**Test Inputs:**
- User login state: Authenticated user with userID: user-123
- User prompts: 
  - Message 1: "I want something spicy"
  - Message 2: "Maybe Thai food"
  - Message 3: "Pad Thai sounds good"
- ConversationID: conv-456

**Expected Results:**
- Conversation is created
- All user messages are stored in correct order
- AI responses are generated for each message
- Conversation history is maintained
- AI uses context from previous messages
- Final response suggests Pad Thai recipes
- Message indices are sequential (0, 1, 2, etc.)

**Dependencies:**
- User is logged in and authenticated
- API endpoints are available: POST /api/chat/conversation, POST /api/chat/message, POST /api/chat/ai-response, GET /api/chat/messages/:conversationID
- Anthropic AI service is available
- Cosmos DB is available
- Message ordering system is functional

**Initialization:**
- User is logged in with valid session
- Navigate to chat interface
- Clear any existing test conversations

**Test Steps:**
1. Create a new conversation via POST /api/chat/conversation with { userID: 'user-123' }
2. Send first message via POST /api/chat/message with { conversationID, role: 'user', content: 'I want something spicy' }
3. Request AI response via POST /api/chat/ai-response with { conversationID }
4. Send second message via POST /api/chat/message with { conversationID, role: 'user', content: 'Maybe Thai food' }
5. Request AI response via POST /api/chat/ai-response with { conversationID }
6. Send third message via POST /api/chat/message with { conversationID, role: 'user', content: 'Pad Thai sounds good' }
7. Request AI response via POST /api/chat/ai-response with { conversationID }
8. Retrieve messages via GET /api/chat/messages/:conversationID
9. Verify that all messages are stored with correct messageIndex (0, 1, 2)
10. Verify that messages are retrieved in correct order
11. Verify that AI responses reference previous conversation context
12. Verify that final response mentions Pad Thai

**Tear Down:**
- Delete test conversation and all messages from Cosmos DB
- Clear chat interface state

---

## Requirement 2.2.5 - Generate Specific Recipe (Use Case 5)

**Note:** The recipe generation endpoint (`POST /api/generate-recipe`) implements a full flow: intent extraction, recipe search (tries multiple URLs until one succeeds), web scraping, formatting, and storage. It also supports user profiles for dietary restrictions/preferences and ingredient substitutions. Recipes are stored in Cosmos DB with duplicate detection (by sourceUrl).

### Test Case 2.2.5.1: Successful Recipe Generation from Conversation

**Test Case ID:** TC-2.2.5.1

**Use Case:** 5 - Generate Specific Recipe

**Test Inputs:**
- User login state: Authenticated user with userID: user-123
- ConversationID: conv-456 (with messages about "Chicken Tikka Masala")
- User profile: Contains dietary preferences and restrictions

**Expected Results:**
- Recipe is successfully generated from conversation
- Intent is extracted correctly (status: "specific_dish" or "fully_refined")
- Recipe search finds a valid recipe URL from online sources
- Recipe is adjusted for household size, user preferences, and profile data
- Recipe content is scraped and formatted
- Recipe is stored in database with correct userID
- Recipe data includes: title, description, ingredients, instructions, nutrition
- Any ingredients that conflict with user profile are highlighted
- Dietary conflicts are displayed with suggested substitutions
- Recipe is linked to conversation
- Response time is reasonable (< 30 seconds)

**Dependencies:**
- User is logged in and authenticated
- Conversation exists in Cosmos DB with food-related messages
- API endpoint POST /api/generate-recipe is available
- Anthropic AI service is available
- Recipe search service is available (returns multiple results, tries each until one succeeds)
- Web scraping service is available
- Cosmos DB is available
- User profile may be fetched for dietary restrictions/preferences

**Initialization:**
- User is logged in with valid session
- Create conversation with messages about "Chicken Tikka Masala"
- Ensure user profile exists with dietary information

**Test Steps:**
1. Create conversation via POST /api/chat/conversation with { userID: 'user-123' }
2. Add messages via POST /api/chat/message with { conversationID, role: 'user', content: 'I want to make Chicken Tikka Masala' }
3. Call POST /api/generate-recipe with { conversationID, userID }
4. Verify that intent is extracted with status "specific_dish" or "fully_refined"
5. Verify that recipe search returns a valid URL
6. Verify that recipe content is scraped successfully
7. Verify that recipe is formatted with all required fields
8. Verify that recipe is stored in Cosmos DB with correct userID
9. Verify that recipe is linked to conversation via conversationID
10. Verify that response includes recipe data

**Tear Down:**
- Delete test recipe from Cosmos DB
- Delete test conversation and messages from Cosmos DB
- Clear any cached data
- Reset mocks

---

### Test Case 2.2.5.2: Missing ConversationID

**Test Case ID:** TC-2.2.5.2

**Use Case:** 5 - Generate Specific Recipe

**Test Inputs:**
- User login state: Authenticated user with userID: user-123
- ConversationID: (missing/null)
- Request body: { userID: "user-123" }

**Expected Results:**
- API returns 400 error
- Error message: "conversationID and userID are required"
- No recipe is generated
- No database operations occur
- User receives clear error message

**Dependencies:**
- API endpoint POST /api/generate-recipe is available
- Validation system is functional

**Initialization:**
- User is logged in with valid session

**Test Steps:**
1. Call POST /api/generate-recipe with { userID: 'user-123' } (missing conversationID)
2. Verify that API returns 400 status code
3. Verify that error message indicates missing conversationID
4. Verify that no recipe is created in Cosmos DB
5. Verify that no intent extraction occurs
6. Verify that error message is clear and actionable

**Tear Down:**
- Clear any error states
- Reset mocks

---

### Test Case 2.2.5.3: Off-Topic Conversation Rejection

**Test Case ID:** TC-2.2.5.3

**Use Case:** 5 - Generate Specific Recipe

**Test Inputs:**
- User login state: Authenticated user with userID: user-123
- ConversationID: conv-456 (with off-topic messages about "cement mixing")
- Request body: { conversationID: "conv-456", userID: "user-123" }

**Expected Results:**
- Intent extraction identifies conversation as off-topic
- API returns 400 error with status "off_topic"
- Error message: "This conversation isn't about cooking or recipes"
- No recipe is generated
- No recipe search occurs
- Conversation status may be updated to reflect off-topic nature

**Dependencies:**
- User is logged in and authenticated
- Conversation exists in Cosmos DB with off-topic messages
- API endpoint POST /api/generate-recipe is available
- Intent extraction service is functional
- Anthropic AI service is available

**Initialization:**
- User is logged in with valid session
- Create conversation with off-topic messages about "cement mixing"

**Test Steps:**
1. Create conversation via POST /api/chat/conversation with { userID: 'user-123' }
2. Add off-topic messages via POST /api/chat/message with { conversationID, role: 'user', content: 'Tell me about cement mixing' }
3. Call POST /api/generate-recipe with { conversationID, userID }
4. Verify that intent extraction returns status "off_topic"
5. Verify that API returns 400 status code
6. Verify that error message indicates off-topic conversation
7. Verify that no recipe search occurs
8. Verify that no recipe is created in Cosmos DB
9. Verify that conversation status reflects off-topic detection

**Tear Down:**
- Delete test conversation and messages
- Clear any error states

---

### Test Case 2.2.5.4: Recipe Search Failure

**Test Case ID:** TC-2.2.5.4

**Use Case:** 5 - Generate Specific Recipe

**Test Inputs:**
- User login state: Authenticated user with userID: user-123
- ConversationID: conv-456 (with messages about "Very Obscure Dish Name")
- Request body: { conversationID: "conv-456", userID: "user-123" }

**Expected Results:**
- Intent is extracted successfully
- Recipe search fails or returns no results
- System handles failure gracefully
- Error message is displayed: "Failed to find recipe" or similar
- Fallback recipe may be created if supported
- User is informed of the issue

**Dependencies:**
- User is logged in and authenticated
- Conversation exists in Cosmos DB with valid food-related messages
- API endpoint POST /api/generate-recipe is available
- Intent extraction service is functional
- Recipe search service fails (simulated/mocked) or returns no results

**Initialization:**
- User is logged in with valid session
- Create conversation with messages about obscure dish
- Simulate recipe search failure (mock or use obscure dish name)

**Test Steps:**
1. Create conversation via POST /api/chat/conversation with { userID: 'user-123' }
2. Add messages via POST /api/chat/message with { conversationID, role: 'user', content: 'I want to make Very Obscure Dish Name' }
3. Call POST /api/generate-recipe with { conversationID, userID }
4. Verify that intent is extracted successfully
5. Verify that recipe search is attempted
6. Verify that search fails or returns no results
7. Verify that system handles failure gracefully
8. Verify that appropriate error message is returned
9. Verify that no invalid recipe is created in database

**Tear Down:**
- Delete test conversation and messages
- Clear any error states
- Restore recipe search service if mocked

---

### Test Case 2.2.5.5: Database Unavailable During Recipe Storage

**Test Case ID:** TC-2.2.5.5

**Use Case:** 5 - Generate Specific Recipe

**Test Inputs:**
- User login state: Authenticated user with userID: user-123
- ConversationID: conv-456 (with messages about "Chicken Tikka Masala")
- Request body: { conversationID: "conv-456", userID: "user-123" }

**Expected Results:**
- Intent is extracted successfully
- Recipe search finds valid URL
- Recipe content is scraped and formatted
- Database storage fails
- API returns 503 error: "Database not available"
- Error message is displayed to user
- Recipe data is not lost (may be returned in error response for retry)

**Dependencies:**
- User is logged in and authenticated
- Conversation exists in Cosmos DB with valid food-related messages
- API endpoint POST /api/generate-recipe is available
- All services (intent, search, scraping) are available
- Cosmos DB is intentionally unavailable (simulated/mocked)

**Initialization:**
- User is logged in with valid session
- Create conversation with messages about "Chicken Tikka Masala"
- Simulate database unavailability (mock or disable Cosmos DB connection)

**Test Steps:**
1. Create conversation via POST /api/chat/conversation with { userID: 'user-123' }
2. Add messages via POST /api/chat/message with { conversationID, role: 'user', content: 'I want to make Chicken Tikka Masala' }
3. Call POST /api/generate-recipe with { conversationID, userID }
4. Verify that intent is extracted successfully
5. Verify that recipe search finds valid URL
6. Verify that recipe content is scraped and formatted
7. Verify that database storage fails
8. Verify that API returns 503 status code
9. Verify that error message indicates database unavailability
10. Verify that system handles error gracefully

**Tear Down:**
- Restore database connection
- Delete test conversation and messages from Cosmos DB
- Clear any error states
- Reset mocks

---

## Requirement 2.2.10 - Save Recipe After Editing (Use Case 10)

**Note:** The requirement specifies a simple save workflow: display "Save Recipe" button, save the recipe to database, and confirm success. The recipe update endpoint (`PATCH /api/generate-recipe/:recipeID`) supports updating `isSaved` status and `userPortionSize`. The GET endpoint (`GET /api/generate-recipe/user/:userID`) supports filtering by saved status using the `?saved=true` query parameter.

### Test Case 2.2.10.1: Successful Recipe Save

**Test Case ID:** TC-2.2.10.1

**Use Case:** 10 - Save Recipe After Editing

**Test Inputs:**
- User login state: Authenticated user with userID: user-123
- RecipeID: recipe-789 (existing recipe from conversation/chat interface)
- Action: User selects "Save Recipe" button
- Request body: { userID: "user-123", isSaved: true }

**Expected Results:**
- "Save Recipe" button is displayed when recipe is shown in chat interface
- Recipe is successfully saved to database
- Recipe isSaved field is updated to true
- Recipe updatedAt timestamp is updated
- Success confirmation message is displayed to user
- Recipe appears in user's saved recipes list (accessible on recipe page)
- Recipe remains linked to conversation

**Dependencies:**
- User is logged in and authenticated
- Recipe exists in Cosmos DB with recipeID: recipe-789
- Recipe belongs to user (userID matches)
- API endpoint PATCH /api/generate-recipe/:recipeID is available (also supports userPortionSize parameter)
- Cosmos DB is available

**Initialization:**
- User is logged in with valid session
- Recipe exists in Cosmos DB with isSaved: false
- Recipe is displayed in chat interface

**Test Steps:**
1. Call PATCH /api/generate-recipe/recipe-789 with { userID: 'user-123', isSaved: true }
2. Verify that API returns 200 status code
3. Verify that recipe isSaved field is updated to true
4. Verify that recipe updatedAt timestamp is updated
5. Verify that recipe data is returned in response
6. Verify that recipe can be retrieved via GET /api/generate-recipe/user/user-123?saved=true
7. Verify that saved recipe appears in user's recipe list when filtered by saved status

**Tear Down:**
- Reset recipe isSaved field to false if needed
- Clear any cached data
- Reset mocks

---

### Test Case 2.2.10.2: Save Recipe with Missing UserID

**Test Case ID:** TC-2.2.10.2

**Use Case:** 10 - Save Recipe After Editing

**Test Inputs:**
- User login state: Authenticated user with userID: user-123
- RecipeID: recipe-789
- Request body: { isSaved: true } (missing userID)

**Expected Results:**
- API returns 400 error
- Error message: "userID is required"
- Recipe is not updated
- Recipe isSaved field remains unchanged
- User receives clear error message

**Dependencies:**
- API endpoint PATCH /api/generate-recipe/:recipeID is available
- Validation system is functional
- Recipe exists in Cosmos DB

**Initialization:**
- User is logged in with valid session
- Recipe exists in Cosmos DB

**Test Steps:**
1. Call PATCH /api/generate-recipe/recipe-789 with { isSaved: true } (missing userID)
2. Verify that API returns 400 status code
3. Verify that error message indicates missing userID
4. Verify that recipe is not updated in Cosmos DB
5. Verify that recipe isSaved field remains unchanged
6. Verify that error message is clear and actionable

**Tear Down:**
- Clear any error states
- Reset mocks

---

### Test Case 2.2.10.3: Save Non-Existent Recipe

**Test Case ID:** TC-2.2.10.3

**Use Case:** 10 - Save Recipe After Editing

**Test Inputs:**
- User login state: Authenticated user with userID: user-123
- RecipeID: recipe-nonexistent (does not exist)
- Request body: { userID: "user-123", isSaved: true }

**Expected Results:**
- API returns 404 error
- Error message: "Recipe not found"
- No recipe is created
- No database updates occur
- User receives clear error message

**Dependencies:**
- API endpoint PATCH /api/generate-recipe/:recipeID is available
- Cosmos DB is available
- Error handling system is functional

**Initialization:**
- User is logged in with valid session
- Ensure recipe with ID recipe-nonexistent does not exist

**Test Steps:**
1. Call PATCH /api/generate-recipe/recipe-nonexistent with { userID: 'user-123', isSaved: true }
2. Verify that API returns 404 status code
3. Verify that error message indicates recipe not found
4. Verify that no recipe is created in Cosmos DB
5. Verify that no database updates occur
6. Verify that error message is clear and actionable

**Tear Down:**
- Clear any error states
- Reset mocks

---

### Test Case 2.2.10.4: Unsave Recipe (Set isSaved to false)

**Test Case ID:** TC-2.2.10.4

**Use Case:** 10 - Save Recipe After Editing

**Test Inputs:**
- User login state: Authenticated user with userID: user-123
- RecipeID: recipe-789 (existing saved recipe)
- Action: Unsave recipe (isSaved: false)
- Request body: { userID: "user-123", isSaved: false }

**Expected Results:**
- Recipe is successfully unsaved
- Recipe isSaved field is updated to false
- Recipe updatedAt timestamp is updated
- Success confirmation is returned
- Recipe no longer appears in user's saved recipes list (if filtered)
- Recipe remains in database and accessible

**Dependencies:**
- User is logged in and authenticated
- Recipe exists in Cosmos DB with recipeID: recipe-789
- Recipe belongs to user (userID matches)
- Recipe isSaved field is currently true
- API endpoint PATCH /api/generate-recipe/:recipeID is available
- Cosmos DB is available

**Initialization:**
- User is logged in with valid session
- Recipe exists in Cosmos DB with isSaved: true

**Test Steps:**
1. Call PATCH /api/generate-recipe/recipe-789 with { userID: 'user-123', isSaved: false }
2. Verify that API returns 200 status code
3. Verify that recipe isSaved field is updated to false
4. Verify that recipe updatedAt timestamp is updated
5. Verify that recipe data is returned in response
6. Verify that recipe can still be retrieved via GET /api/generate-recipe/recipe-789?userID=user-123
7. Verify that recipe no longer appears in saved recipes list when querying with ?saved=true filter

**Tear Down:**
- Reset recipe isSaved field to true if needed
- Clear any cached data

---

### Test Case 2.2.10.5: Database Unavailable During Save

**Test Case ID:** TC-2.2.10.5

**Use Case:** 10 - Save Recipe After Editing

**Test Inputs:**
- User login state: Authenticated user with userID: user-123
- RecipeID: recipe-789 (existing recipe)
- Request body: { userID: "user-123", isSaved: true }

**Expected Results:**
- Recipe retrieval succeeds
- Recipe save operation fails
- API returns 503 error: "Database not available" or "Recipe service not available"
- Error message is displayed to user
- Recipe isSaved field is not updated
- System handles error gracefully

**Dependencies:**
- User is logged in and authenticated
- Recipe exists in Cosmos DB
- API endpoint PATCH /api/generate-recipe/:recipeID is available
- Cosmos DB is intentionally unavailable (simulated/mocked)

**Initialization:**
- User is logged in with valid session
- Recipe exists in Cosmos DB
- Simulate database unavailability (mock or disable Cosmos DB connection)

**Test Steps:**
1. Call PATCH /api/generate-recipe/recipe-789 with { userID: 'user-123', isSaved: true }
2. Verify that recipe retrieval succeeds (if done before save)
3. Verify that save operation fails
4. Verify that API returns 503 status code
5. Verify that error message indicates database unavailability
6. Verify that recipe isSaved field is not updated in Cosmos DB
7. Verify that system handles error gracefully without crashing

**Tear Down:**
- Restore database connection
- Clear any error states

---

## Requirement 2.2.12 - Generate Grocery List from Recipes (Use Case 12)

**Note:** Grocery list generation from recipes is implemented **client-side** in the mobile app. The workflow uses:
- ✅ **Client-side component**: `AddToGroceryModal` in `apps/mobile/app/(tabs)/recipes-new.tsx`
- ✅ **Ingredient parsing**: `parseIngredients()` from `packages/shared/src/utils/ingredient-parser.ts` - parses ingredient strings into structured data with quantity, unit, name, category
- ✅ **Quantity scaling**: `scaleIngredient()` from `packages/shared/src/utils/portion-scaling.ts` - scales quantities based on portion size differences
- ✅ **Pantry reconciliation**: `findPantryMatch()` from `packages/shared/src/utils/pantry-matcher.ts` - matches ingredients against pantry items (exact/fuzzy)
- ✅ **Unit normalization**: Handled during parsing (converts fractions, normalizes units like tsp/tbsp, oz/g, ml/cup)
- ✅ **Review screen**: Modal displays parsed ingredients with pantry matches highlighted, user can select which to add
- ✅ **API endpoint**: `POST /api/grocery/:userID/lists/:listID/items` - adds selected ingredients to existing grocery list (merges duplicates via `findDuplicates()`)
- ✅ **List creation**: `POST /api/grocery/:userID/lists` - creates new grocery list if needed
- ✅ **Cosmos DB containers**: `grocery-lists` and `grocery-items` are configured
- ✅ **Ingredient merging**: `findDuplicates()` and `mergeIdenticalItems()` from `packages/shared/src/utils/grocery-grouping.ts` handle duplicate merging when adding to lists

**Flow**: User clicks "Add to Grocery List" → Modal opens → Ingredients parsed/scaled → Pantry matched → User selects list & ingredients → Items added via API → Exact pantry matches auto-marked as completed.

The test cases below test the client-side functions and API integration.

### Test Case 2.2.12.1: Generate Grocery List from Single Recipe

**Test Case ID:** TC-2.2.12.1

**Use Case:** 12 - Generate Grocery List from Recipes

**Test Inputs:**
- User login state: Authenticated user with userID: user-123
- Recipe: Single recipe with ingredients:
  - "500g chicken breast"
  - "200ml tomato puree"
  - "2 tbsp garam masala"
  - "150ml cream"
- Recipe portions: 4 servings
- Target portions: 4 (same as recipe, no scaling needed)
- Existing grocery list: list-456

**Expected Results:**
- `parseIngredients()` successfully parses all ingredient strings into structured data
- Each ingredient has: name, quantity, unit, category (if detected)
- Quantities are not scaled (targetPortions = originalPortions)
- Units are normalized (e.g., "tbsp" normalized from "tablespoon")
- Review screen displays all parsed ingredients
- User can select which ingredients to add
- Selected ingredients are added to grocery list via `POST /api/grocery/:userID/lists/:listID/items`
- API merges any duplicates with existing list items
- Items are saved to Cosmos DB with correct userID and listID

**Dependencies:**
- User is logged in and authenticated
- Recipe exists with ingredients in `recipeData.ingredients` array
- Grocery list exists (or can be created)
- API endpoint `POST /api/grocery/:userID/lists/:listID/items` is available
- Cosmos DB containers are configured
- Client-side functions: `parseIngredients()` from `packages/shared/src/utils/ingredient-parser.ts`

**Initialization:**
- User is logged in with valid session
- Recipe exists with ingredients: ["500g chicken breast", "200ml tomato puree", "2 tbsp garam masala", "150ml cream"]
- Recipe portions: "4 servings"
- Grocery list exists with ID: list-456

**Test Steps:**
1. Call `parseIngredients()` with recipe ingredient strings
2. Verify that all 4 ingredients are parsed correctly:
   - "500g chicken breast" → { name: "chicken breast", quantity: 500, unit: "g" }
   - "200ml tomato puree" → { name: "tomato puree", quantity: 200, unit: "ml" }
   - "2 tbsp garam masala" → { name: "garam masala", quantity: 2, unit: "tbsp" }
   - "150ml cream" → { name: "cream", quantity: 150, unit: "ml" }
3. Verify that `scaleIngredient()` is called but returns original (no scaling needed)
4. Verify that review screen displays all parsed ingredients
5. Call `POST /api/grocery/user-123/lists/list-456/items` with parsed ingredients
6. Verify that API returns 201 status with created items
7. Verify that items are saved to Cosmos DB with correct listID
8. Verify that items are properly formatted as GroceryItem objects

**Tear Down:**
- Delete test grocery items from Cosmos DB
- Clear any cached data
- Reset mocks

---

### Test Case 2.2.12.2: Scale Quantities for Different Household Size

**Test Case ID:** TC-2.2.12.2

**Use Case:** 12 - Generate Grocery List from Recipes

**Test Inputs:**
- User login state: Authenticated user with userID: user-123
- Recipe: Recipe with ingredients:
  - "500g chicken breast" (for 4 servings)
  - "200ml tomato puree" (for 4 servings)
  - "2 tbsp garam masala" (for 4 servings)
- Recipe portions: 4 servings
- Target portions: 8 (double the recipe portions)
- Existing grocery list: list-456

**Expected Results:**
- `scaleIngredient()` scales quantities proportionally (2x multiplier)
- Scaled ingredients: "1000g chicken breast", "400ml tomato puree", "4 tbsp garam masala"
- `parseIngredients()` parses scaled ingredient strings correctly
- Quantities in parsed items reflect scaled values
- Grocery list items contain scaled quantities
- List is saved with correct scaled quantities

**Dependencies:**
- User is logged in and authenticated
- Recipe exists with ingredients for 4 servings
- Target portions: 8 (from user profile or userPortionSize)
- Client-side functions: `scaleIngredient()` from `packages/shared/src/utils/portion-scaling.ts`, `parseIngredients()` from `packages/shared/src/utils/ingredient-parser.ts`
- API endpoint `POST /api/grocery/:userID/lists/:listID/items` is available

**Initialization:**
- User is logged in with valid session
- Recipe exists with ingredients: ["500g chicken breast", "200ml tomato puree", "2 tbsp garam masala"]
- Recipe portions: "4 servings"
- Target portions: 8 (userPortionSize or household size)
- Grocery list exists with ID: list-456

**Test Steps:**
1. Call `scaleIngredient("500g chicken breast", 4, 8)` - verify returns "1000g chicken breast"
2. Call `scaleIngredient("200ml tomato puree", 4, 8)` - verify returns "400ml tomato puree"
3. Call `scaleIngredient("2 tbsp garam masala", 4, 8)` - verify returns "4 tbsp garam masala"
4. Call `parseIngredients()` with scaled ingredient strings
5. Verify that parsed items have scaled quantities:
   - { name: "chicken breast", quantity: 1000, unit: "g" }
   - { name: "tomato puree", quantity: 400, unit: "ml" }
   - { name: "garam masala", quantity: 4, unit: "tbsp" }
6. Call `POST /api/grocery/user-123/lists/list-456/items` with scaled ingredients
7. Verify that API saves items with scaled quantities to Cosmos DB
8. Verify that quantities in database match scaled values (1000g, 400ml, 4 tbsp)

**Tear Down:**
- Delete test grocery items from Cosmos DB
- Clear any cached data
- Reset mocks

---

### Test Case 2.2.12.3: Generate Grocery List from Multiple Recipes

**Test Case ID:** TC-2.2.12.3

**Use Case:** 12 - Generate Grocery List from Recipes

**Test Inputs:**
- User login state: Authenticated user with userID: user-123
- Recipes: 
  - Recipe 1: "Chicken Tikka Masala" with "500g chicken breast", "200ml tomato puree"
  - Recipe 2: "Garlic Bread" with "200ml tomato puree", "1 loaf bread"
- Both recipes are for 4 servings
- Target portions: 4 (no scaling needed)
- Existing grocery list: list-456

**Expected Results:**
- Ingredients from both recipes are parsed separately
- All ingredients are displayed in review screen
- User selects all ingredients to add
- API endpoint `POST /api/grocery/:userID/lists/:listID/items` receives items from both recipes
- `findDuplicates()` identifies duplicate "tomato puree" items
- API merges duplicates: tomato puree 200ml + 200ml = 400ml (via `findDuplicates()` and merge logic)
- Unique ingredients are added separately
- Final list contains: "500g chicken breast", "400ml tomato puree", "1 loaf bread"
- List is saved successfully with merged quantities

**Dependencies:**
- User is logged in and authenticated
- Two recipes exist with ingredients listed above
- Client-side functions: `parseIngredients()` from `packages/shared/src/utils/ingredient-parser.ts`
- API endpoint `POST /api/grocery/:userID/lists/:listID/items` is available
- Ingredient merging: `findDuplicates()` from `packages/shared/src/utils/grocery-grouping.ts`
- Cosmos DB is available

**Initialization:**
- User is logged in with valid session
- Recipe 1 exists with ingredients: ["500g chicken breast", "200ml tomato puree"]
- Recipe 2 exists with ingredients: ["200ml tomato puree", "1 loaf bread"]
- Grocery list exists with ID: list-456

**Test Steps:**
1. Parse ingredients from Recipe 1: `parseIngredients(["500g chicken breast", "200ml tomato puree"])`
2. Parse ingredients from Recipe 2: `parseIngredients(["200ml tomato puree", "1 loaf bread"])`
3. Combine all parsed ingredients into single array
4. Call `POST /api/grocery/user-123/lists/list-456/items` with all ingredients
5. Verify that API uses `findDuplicates()` to identify duplicate "tomato puree" items
6. Verify that API merges duplicates: { name: "tomato puree", quantity: 400, unit: "ml" }
7. Verify that unique ingredients are added: chicken breast (500g), bread (1 loaf)
8. Verify that final list in Cosmos DB contains merged quantities (400ml tomato puree)

**Tear Down:**
- Delete test grocery items from Cosmos DB
- Clear any cached data
- Reset mocks

---

### Test Case 2.2.12.4: Empty Recipe Ingredients Handling

**Test Case ID:** TC-2.2.12.4

**Use Case:** 12 - Generate Grocery List from Recipes

**Test Inputs:**
- User login state: Authenticated user with userID: user-123
- Recipe: Recipe with empty ingredients array: []
- User attempts to open "Add to Grocery List" modal

**Expected Results:**
- `parseIngredients([])` returns empty array
- Modal handles empty ingredients gracefully
- Error message or warning is displayed: "Recipe has no ingredients" or "Cannot add empty recipe to grocery list"
- No ingredients are displayed in review screen
- User cannot proceed to add items
- System does not crash

**Dependencies:**
- User is logged in and authenticated
- Recipe exists with empty ingredients array: []
- Client-side component `AddToGroceryModal` handles empty ingredients
- `parseIngredients()` function from `packages/shared/src/utils/ingredient-parser.ts`

**Initialization:**
- User is logged in with valid session
- Recipe exists with empty ingredients array: []

**Test Steps:**
1. Call `parseIngredients([])` with empty array
2. Verify that function returns empty array `[]`
3. Simulate opening `AddToGroceryModal` with recipe that has empty ingredients
4. Verify that `parseRecipeIngredients()` detects empty ingredients array
5. Verify that modal displays error message or prevents proceeding
6. Verify that no API call is made to add items
7. Verify that system handles empty ingredients gracefully without crashing

**Tear Down:**
- Clear any error states
- Reset mocks

---

### Test Case 2.2.12.5: Pantry Reconciliation and Exact Match Handling

**Test Case ID:** TC-2.2.12.5

**Use Case:** 12 - Generate Grocery List from Recipes

**Test Inputs:**
- User login state: Authenticated user with userID: user-123
- Recipe: Recipe with ingredients: "500g chicken breast", "200ml tomato puree", "2 tbsp garam masala"
- Pantry items: 
  - "chicken breast" (exact match)
  - "garlic" (no match)
- Existing grocery list: list-456

**Expected Results:**
- `findPantryMatch()` identifies exact match for "chicken breast"
- `findPantryMatch()` returns null for "tomato puree" and "garam masala" (no pantry match)
- Review screen highlights exact pantry matches
- Exact matches are auto-checked (or marked as available)
- User can still add exact matches to grocery list (for tracking/planning)
- When items are added, exact matches are automatically marked as `completed: true` in grocery list
- Items are saved to Cosmos DB with correct completion status

**Dependencies:**
- User is logged in and authenticated
- Recipe exists with valid ingredients
- Pantry items exist in Cosmos DB
- Client-side function: `findPantryMatch()` from `packages/shared/src/utils/pantry-matcher.ts`
- API endpoint `POST /api/grocery/:userID/lists/:listID/items` is available
- API endpoint `PUT /api/grocery/:userID/lists/:listID/items/:itemId` for marking completed

**Initialization:**
- User is logged in with valid session
- Recipe exists with ingredients: ["500g chicken breast", "200ml tomato puree", "2 tbsp garam masala"]
- Pantry contains: "chicken breast" (exact name match)
- Grocery list exists with ID: list-456

**Test Steps:**
1. Call `findPantryMatch("chicken breast", pantryItems)` - verify returns `{ item: pantryItem, matchType: 'exact' }`
2. Call `findPantryMatch("tomato puree", pantryItems)` - verify returns `{ item: null, matchType: null }`
3. Call `findPantryMatch("garam masala", pantryItems)` - verify returns `{ item: null, matchType: null }`
4. Verify that review screen highlights exact match for "chicken breast"
5. User selects all ingredients to add (including exact match)
6. Call `POST /api/grocery/user-123/lists/list-456/items` with all ingredients
7. Verify that API creates all items in Cosmos DB
8. Verify that API automatically calls `PUT /api/grocery/user-123/lists/list-456/items/:itemId` to mark exact match as `completed: true`
9. Verify that exact match item in database has `completed: true`, others have `completed: false`

**Tear Down:**
- Delete test grocery items from Cosmos DB
- Clear any cached data
- Reset mocks

---

## Summary

This document contains 25 test cases covering 5 major requirements:
- **Requirement 2.2.2** (Login): 5 test cases - Tests client-side Firebase Auth service function `signInWithEmail` in `apps/mobile/src/services/auth.ts`. Covers Email/Password authentication, session/token creation (automatic via Firebase), profile loading, and error handling. MFA and profile completion are conditional features.
- **Requirement 2.2.4** (Generate meal ideas): 5 test cases - Tests API endpoints: `POST /api/chat/conversation`, `POST /api/chat/message`, `POST /api/chat/ai-response`
- **Requirement 2.2.5** (Generate recipe): 5 test cases - Tests API endpoint: `POST /api/generate-recipe`. Note: Dietary conflict highlighting and substitution suggestions are part of the requirement but may need additional test cases.
- **Requirement 2.2.10** (Save recipe): 5 test cases - Tests API endpoint: `PATCH /api/generate-recipe/:recipeID`. Requirement specifies simple save workflow: display "Save Recipe" button, save to database, confirm success.
- **Requirement 2.2.12** (Grocery list): 5 test cases - Tests client-side grocery list generation from recipes. Tests `parseIngredients()`, `scaleIngredient()`, and `findPantryMatch()` functions from `packages/shared/src/utils/`, and API endpoint `POST /api/grocery/:userID/lists/:listID/items`. Implementation includes: ingredient parsing, quantity scaling, pantry reconciliation, review screen with selection, and duplicate merging. All functionality is client-side in `AddToGroceryModal` component.

Each test case follows the specified format with:
- Test Case ID
- Use Case reference
- Test Inputs
- Expected Results
- Dependencies
- Initialization
- Test Steps
- Tear Down

These test cases will be implemented using Jest in Section 10.2.

