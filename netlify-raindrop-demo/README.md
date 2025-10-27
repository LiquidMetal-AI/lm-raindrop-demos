# Raindrop + Netlify Integration Demo

An example application demonstrating how to build AI-powered features using [Raindrop](https://liquidmetal.ai) (by LiquidMetal) integrated with Netlify. This starter includes two complete demos showing semantic document search and AI agents with persistent memory.

[Live Demo](https://netlify-raindrop-demo.netlify.app/) | [Raindrop Documentation](https://docs.liquidmetal.ai)

## What's Included

This demo application showcases:

### 🗂️ SmartBucket Demo

Upload and search documents using semantic search powered by Raindrop SmartBuckets. Features:

- Document upload with automatic processing
- Semantic search (finds relevant content even when keywords don't match exactly)
- Built-in multi-modal RAG (Retrieval Augmented Generation)
- Automatic chunking, embeddings, and vector storage and graph database

### 🤖 SmartMemory Agent Demo

Chat with an AI agent (Claude via Netlify AI Gateway) that remembers your conversations. Features:

- Persistent conversation memory across sessions
- Context retention using Raindrop SmartMemory
- Working memory for current chat
- Episodic memory for past conversations

## Quick Start

### Option 1: Deploy to Netlify (Recommended)

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/LiquidMetal-AI/lm-raindrop-demos)

1. Click the "Deploy to Netlify" button above
2. Connect your GitHub account and create a new repository
3. Once deployed, go to your site's **Integrations** page
4. Search for **LiquidMetal** in the extensions store and install it:
   - Sign up at [liquidmetal.ai](https://liquidmetal.ai) if you don't have an account
   - Get your API key from the Raindrop dashboard
   - Add the API key to the integration settings
   - Click **Provision Resources** to auto-create SmartBucket, SmartMemory, and SmartSQL instances
5. Trigger a new deploy to pick up the auto-provisioned environment variables
6. Visit your site and start exploring the demos!

### Option 2: Local Development

#### Prerequisites

- [Node.js](https://nodejs.org/) v18.14+
- [Netlify CLI](https://docs.netlify.com/cli/get-started/) installed globally
- A [Raindrop account](https://liquidmetal.ai) with API key

#### Setup

1. Clone this repository:

```bash
git clone https://github.com/LiquidMetal-AI/lm-raindrop-demos.git
cd lm-raindrop-demos/netlify-raindrop-demo
```

2. Install dependencies:

```bash
npm install
```

3. Link to Netlify (or create a new site):

```bash
netlify link
```

4. Install the LiquidMetal integration in your Netlify site:

   - Go to your site's **Integrations** page in the Netlify dashboard
   - Search for **LiquidMetal** in the extensions store and add it
   - Provision resources using your Raindrop API key
   - This automatically sets all required environment variables

5. Pull environment variables locally:

```bash
netlify env:pull
```

6. Start the development server:

```bash
netlify dev
```

Visit [localhost:8888](http://localhost:8888) to see the app.

## How It Works

### Architecture

```
┌─────────────────────────────┐
│   Astro Frontend            │
│   (React components)        │
└──────────┬──────────────────┘
           │
           ├──> Netlify Edge Functions
           │    └──> Claude (via Netlify AI Gateway)
           │
           └──> Raindrop SDK
                ├──> SmartBucket (document storage & search)
                ├──> SmartMemory (agent memory management)
                └──> SmartSQL (coming soon)
```

### Key Files

- **`/src/pages/smartbucket/`** - SmartBucket demo with document upload and search
- **`/src/pages/smartmemory/`** - SmartMemory agent chat demo
- **`/src/pages/api/`** - Netlify serverless functions handling API requests
- **`/src/pages/api/agent.ts`** - Agent endpoint integrating Claude + SmartMemory

## Environment Variables

When you install the Raindrop integration on Netlify, these variables are automatically provisioned:

```bash
RAINDROP_API_KEY              # Your Raindrop API key
RAINDROP_SMARTBUCKET_NAME     # Auto-provisioned SmartBucket name
RAINDROP_SMARTMEMORY_NAME     # Auto-provisioned SmartMemory name
RAINDROP_SMARTSQL_NAME        # Auto-provisioned SmartSQL name
RAINDROP_APPLICATION_NAME     # Your application identifier
RAINDROP_APPLICATION_VERSION  # Version identifier
```

## Built With

- **[Astro](https://astro.build)** - Web framework
- **[React](https://react.dev)** - Interactive components
- **[Tailwind CSS](https://tailwindcss.com)** - Styling
- **[Netlify](https://netlify.com)** - Hosting, edge functions, AI gateway
- **[Raindrop](https://liquidmetal.ai)** - AI infrastructure (SmartBucket, SmartMemory, SmartSQL)
- **[Claude](https://anthropic.com/claude)** - AI model (via Netlify Model Hub)

## Learn More

- [Raindrop Documentation](https://docs.liquidmetal.ai)
- [Netlify Documentation](https://docs.netlify.com)
- [Astro Documentation](https://docs.astro.build)
- [Netlify AI Gateway](https://docs.netlify.com/build/ai-gateway/overview/)
