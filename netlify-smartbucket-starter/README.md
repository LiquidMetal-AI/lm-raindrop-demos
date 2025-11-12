# SmartBucket Starter

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/LiquidMetal-AI/lm-raindrop-demos&base=netlify-smartbucket-starter)

Minimal starter template demonstrating document storage and semantic search using Raindrop's SmartBucket feature on Netlify.

## What It Does

SmartBucket provides document storage with automatic chunking, embedding, and semantic search. Upload documents (PDF, TXT, JSON, MD) and search them using natural language queries.

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

That's it! Your SmartBucket app is ready to use.

## Environment Variables

When you add the Raindrop integration to your Netlify project, these environment variables are **automatically set**:

- `RAINDROP_API_KEY`
- `RAINDROP_SMARTBUCKET_NAME`

No manual configuration needed! The integration handles everything.

## Project Structure

```
netlify-smartbucket-starter/
├── netlify.toml                    # Netlify configuration
├── netlify/functions/
│   ├── upload.js                   # Handles document uploads
│   └── search.js                   # Handles semantic search
└── public/
    ├── index.html                  # Tab interface (Upload/Search)
    ├── style.css                   # Styling
    └── app.js                      # Client-side logic
```

## How It Works

### API Endpoints (Netlify Functions)

#### POST /.netlify/functions/upload
Uploads a document to SmartBucket.

**Request:**
```json
{
  "fileName": "document.pdf",
  "fileContent": "base64_encoded_content",
  "contentType": "application/pdf"
}
```

**Response:**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "fileName": "document.pdf",
  "bucket": { "bucketName": "my-bucket" }
}
```

#### POST /.netlify/functions/search
Performs semantic search across uploaded documents.

**Request:**
```json
{
  "query": "What is the main topic?"
}
```

**Response:**
```json
{
  "results": [
    {
      "text": "Matched text chunk...",
      "score": 95,
      "fileName": "document.pdf",
      "bucketName": "my-bucket",
      "chunkId": "uuid",
      "type": "text"
    }
  ],
  "count": 1,
  "query": "What is the main topic?"
}
```

### SmartBucket Operations

**Upload Document:**
```javascript
client.bucket.put({
  bucketLocation: {
    bucket: { name: process.env.RAINDROP_SMARTBUCKET_NAME }
  },
  content: base64Content,
  contentType: 'application/pdf',
  key: 'filename.pdf'
})
```

**Semantic Search:**
```javascript
client.query.chunkSearch({
  bucketLocations: [
    { bucket: { name: process.env.RAINDROP_SMARTBUCKET_NAME } }
  ],
  input: 'natural language query',
  requestId: crypto.randomUUID()
})
```

## Features

### Upload Interface
- Drag-and-drop file upload
- Click to browse files
- Supported formats: PDF, TXT, JSON, MD
- File size display
- Upload status feedback

### Search Interface
- Natural language queries
- Relevance scores (0-100%)
- Result highlighting
- Source file attribution
- Visual score indicators

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

- **Bucket**: Named container for documents
- **Chunking**: Documents are automatically split into searchable chunks
- **Embedding**: Chunks are converted to vector embeddings for semantic search
- **Semantic Search**: Find content by meaning, not just keywords
- **Relevance Score**: Similarity percentage between query and result

## Next Steps

- Add authentication to protect uploads
- Implement file management (list, delete documents)
- Add support for more file types
- Implement advanced search filters
- Add pagination for search results
- Store metadata with documents
