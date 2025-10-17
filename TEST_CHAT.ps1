#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Test the Chat-Driven Recipe Discovery API
.DESCRIPTION
    This script tests the chat API endpoints to verify they're working correctly
.EXAMPLE
    ./TEST_CHAT.ps1
#>

param(
    [string]$ApiUrl = "http://localhost:3000",
    [string]$UserId = "test-user-$(Get-Random -Maximum 10000)"
)

Write-Host "Chat API Testing Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Color functions
function Write-Success { param([string]$Message); Write-Host "[OK] $Message" -ForegroundColor Green }
function Write-ErrorMsg { param([string]$Message); Write-Host "[ERROR] $Message" -ForegroundColor Red }
function Write-InfoMsg { param([string]$Message); Write-Host "[INFO] $Message" -ForegroundColor Blue }
function Write-WarnMsg { param([string]$Message); Write-Host "[WARN] $Message" -ForegroundColor Yellow }

# Test 1: Health Check
Write-InfoMsg "Test 1: Checking API Health"
try {
    $response = Invoke-RestMethod -Uri "$ApiUrl/health" -Method GET
    Write-Success "API is running: $($response.status)"
    Write-InfoMsg "Timestamp: $($response.timestamp)"
} catch {
    Write-ErrorMsg "API health check failed. Is the API running on $ApiUrl ?"
    Write-ErrorMsg $_.Exception.Message
    exit 1
}

Write-Host ""

# Test 2: Create Conversation
Write-InfoMsg "Test 2: Creating a new conversation"
$body = @{
    userID = $UserId
} | ConvertTo-Json

try {
    $convResponse = Invoke-RestMethod -Uri "$ApiUrl/api/chat/conversation" -Method POST `
        -Headers @{'Content-Type' = 'application/json'} `
        -Body $body
    
    if ($convResponse.error) {
        Write-WarnMsg "Chat service not available (expected if Cosmos DB not configured)"
        Write-InfoMsg "Error: $($convResponse.error)"
        Write-InfoMsg "To fully test, set up Cosmos DB and configure COSMOS_ENDPOINT and COSMOS_KEY in apps/api/.env"
        exit 0
    }
    
    $conversationID = $convResponse.conversation.conversationID
    Write-Success "Conversation created: $conversationID"
    Write-InfoMsg "User ID: $UserId"
} catch {
    if ($_.Exception.Response.StatusCode -eq 503 -or $_.Exception.Message -like "*503*") {
        Write-WarnMsg "Chat service not available (expected if Cosmos DB not configured)"
        Write-InfoMsg "Error: Cosmos DB is not configured"
        Write-InfoMsg "To fully test, set up Cosmos DB and configure COSMOS_ENDPOINT and COSMOS_KEY in apps/api/.env"
        Write-InfoMsg "See TROUBLESHOOTING.md for detailed setup instructions"
        exit 0
    }
    Write-ErrorMsg "Failed to create conversation: $($_.Exception.Message)"
    exit 1
}

Write-Host ""

# Test 3: Send Message
Write-InfoMsg "Test 3: Sending a test message"
$messageBody = @{
    conversationID = $conversationID
    role = "user"
    content = "I want something spicy for dinner"
} | ConvertTo-Json

try {
    $msgResponse = Invoke-RestMethod -Uri "$ApiUrl/api/chat/message" -Method POST `
        -Headers @{'Content-Type' = 'application/json'} `
        -Body $messageBody
    
    Write-Success "Message sent successfully"
    Write-InfoMsg "Message ID: $($msgResponse.message.id)"
    Write-InfoMsg "Message Index: $($msgResponse.message.messageIndex)"
} catch {
    Write-ErrorMsg "Failed to send message: $($_.Exception.Message)"
    exit 1
}

Write-Host ""

# Test 4: Get Messages
Write-InfoMsg "Test 4: Retrieving conversation messages"
try {
    $messagesResponse = Invoke-RestMethod -Uri "$ApiUrl/api/chat/messages/$conversationID" -Method GET
    
    Write-Success "Retrieved $($messagesResponse.messages.Count) messages"
    $messagesResponse.messages | ForEach-Object {
        Write-InfoMsg "  [$($_.messageIndex)] $($_.role): $($_.content.Substring(0, [Math]::Min(50, $_.content.Length)))..."
    }
} catch {
    Write-ErrorMsg "Failed to retrieve messages: $($_.Exception.Message)"
    exit 1
}

Write-Host ""

# Test 5: Get Conversations
Write-InfoMsg "Test 5: Retrieving user conversations"
try {
    $convsResponse = Invoke-RestMethod -Uri "$ApiUrl/api/chat/conversations/user/$UserId" -Method GET
    
    Write-Success "Retrieved $($convsResponse.conversations.Count) conversations"
    $convsResponse.conversations | ForEach-Object {
        Write-InfoMsg "  Conversation: $($_.conversationID) (Status: $($_.status))"
    }
} catch {
    Write-ErrorMsg "Failed to retrieve conversations: $($_.Exception.Message)"
    exit 1
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "All tests passed!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Open http://localhost:8081 in your browser" -ForegroundColor Cyan
Write-Host "2. Click the Chat tab" -ForegroundColor Cyan
Write-Host "3. Start typing messages" -ForegroundColor Cyan
Write-Host "4. After a few messages, click Find Recipe" -ForegroundColor Cyan
Write-Host ""
Write-Host "Note: Recipe generation requires Cosmos DB to be set up." -ForegroundColor Yellow
Write-Host "See TROUBLESHOOTING.md for more details." -ForegroundColor Yellow
