# Real AI Chat App

## Current State
New project with no existing implementation.

## Requested Changes (Diff)

### Add
- Chat interface with message bubbles (user and assistant)
- Chat history panel showing past conversations
- Text input with send button
- Typing indicator animation while waiting for response
- Suggested prompt chips to get started
- Backend that processes user messages and returns contextual AI-like responses
- Dark/modern theme

### Modify
- N/A

### Remove
- N/A

## Implementation Plan
1. Backend: Motoko canister with message processing logic
   - Store conversation history (list of messages with role + content)
   - `sendMessage(text: Text) -> Text` - processes input and returns AI-like response
   - `getHistory() -> [Message]` - returns full conversation history
   - `clearHistory()` - resets conversation
   - Response generation: rule-based contextual replies covering common topics (greetings, help, tech, general knowledge)
2. Frontend: React chat UI
   - Sidebar with chat history list (grouped by session)
   - Main chat area with scrollable message bubbles
   - Typing indicator (animated dots) during response
   - Suggested prompt chips shown when no messages exist
   - Bottom input bar with textarea and send button
   - Dark modern theme
