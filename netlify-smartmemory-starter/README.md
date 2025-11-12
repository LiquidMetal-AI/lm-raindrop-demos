# SmartMemory Starter

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/LiquidMetal-AI/lm-raindrop-demos&base=netlify-smartmemory-starter)

Minimal starter template demonstrating persistent conversation memory using Raindrop's SmartMemory feature on Netlify.

## What It Does

SmartMemory stores conversation history across sessions, allowing AI agents to remember previous interactions. This demo creates a chat interface where the agent can access past messages.

## Quick Start

1. **Deploy to Netlify**: Click the button above to clone this template to a new Netlify project

2. **Add Raindrop Integration**: Follow the tutorial to add the Raindrop integration to your Netlify project:
   - [Netlify Integration Tutorial](https://docs.liquidmetal.ai/tutorials/netlify-integration/)
   - This automatically sets all required environment variables

3. **Run Locally** (optional):
   ```bash
   npm install
   netlify link              # Connect to your Netlify project
   npm run dev               # Pulls env vars from Netlify automatically
   ```

That's it! Your SmartMemory app is ready to use.

## Environment Variables

When you add the Raindrop integration to your Netlify project, these environment variables are **automatically set**:

- `RAINDROP_API_KEY`
- `RAINDROP_SMARTMEMORY_NAME`
- `RAINDROP_APPLICATION_NAME`
- `RAINDROP_APPLICATION_VERSION`

No manual configuration needed! The integration handles everything.

## Project Structure

```
netlify-smartmemory-starter/
├── netlify.toml                    # Netlify configuration
├── netlify/functions/
│   ├── create-session.js           # Creates new SmartMemory session
│   └── chat.js                     # Handles chat with memory
└── public/
    ├── index.html                  # Chat UI
    ├── style.css                   # Styling
    └── app.js                      # Client-side logic
```

## How It Works

### API Endpoints (Netlify Functions)

#### POST /.netlify/functions/create-session
Creates a new SmartMemory session.

**Response:**
```json
{
  "sessionId": "uuid",
  "message": "Session created successfully"
}
```

#### POST /.netlify/functions/chat
Sends a message and retrieves memory context.

**Request:**
```json
{
  "message": "Hello",
  "sessionId": "uuid"
}
```

**Response:**
```json
{
  "response": "Assistant message",
  "sessionId": "uuid",
  "memoryCount": 5
}
```

### Memory Operations

**Create Session:**
```javascript
raindrop.startSession.create({
  smartMemoryLocation: {
    smartMemory: {
      name: process.env.RAINDROP_SMARTMEMORY_NAME,
      application_name: process.env.RAINDROP_APPLICATION_NAME,
      version: process.env.RAINDROP_APPLICATION_VERSION
    }
  }
})
```

**Retrieve Memory:**
```javascript
raindrop.getMemory.retrieve({
  sessionId: sessionId,
  smartMemoryLocation: smartMemoryLocation,
  timeline: 'conversation',
  nMostRecent: 5
})
```

**Store Memory:**
```javascript
raindrop.putMemory.create({
  sessionId: sessionId,
  smartMemoryLocation: smartMemoryLocation,
  content: 'Conversation content',
  agent: 'agent-name',
  timeline: 'conversation'
})
```

## Deployment

### Deploy to Netlify

1. Install the Raindrop integration in your Netlify project
2. Push to your connected Git repository, or use:

```bash
npm run deploy
```

The Raindrop integration automatically sets all required environment variables.

### Netlify Configuration

The `netlify.toml` file configures:
- `publish = "public"` - serves static files from public/
- `functions = "netlify/functions"` - functions directory
- API redirects from `/api/*` to `/.netlify/functions/*`

## Key Concepts

- **Session**: Unique identifier grouping related memories
- **Timeline**: Organizes memories by context (e.g., 'conversation')
- **SmartMemory Location**: Identifies the memory store by name, application, and version
- **Memory Retrieval**: Fetches the N most recent memories for context

## Next Steps

- Replace demo responses with actual LLM integration (Anthropic, OpenAI, etc.)
- Add authentication to protect sessions
- Implement memory search for finding specific past interactions
- Add multiple timelines for different conversation contexts
