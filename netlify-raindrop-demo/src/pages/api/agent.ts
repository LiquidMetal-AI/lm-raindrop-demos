import type { APIRoute } from 'astro';
import Raindrop from '@liquidmetal-ai/lm-raindrop';
import Anthropic from '@anthropic-ai/sdk';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
    try {
        const { message, sessionId } = await request.json();

        if (!message) {
            return new Response(
                JSON.stringify({ error: 'Message is required' }),
                { status: 400 }
            );
        }

        const raindropApiKey = import.meta.env.RAINDROP_API_KEY || process.env.RAINDROP_API_KEY;
        const smartMemoryName = import.meta.env.RAINDROP_SMARTMEMORY_NAME || process.env.RAINDROP_SMARTMEMORY_NAME;
        const applicationName = import.meta.env.RAINDROP_APPLICATION_NAME || process.env.RAINDROP_APPLICATION_NAME;
        const version = import.meta.env.RAINDROP_APPLICATION_VERSION || process.env.RAINDROP_APPLICATION_VERSION;

        // Debug: Log environment variables
        console.log('Environment variables:', {
            raindropApiKey: raindropApiKey ? '✓ Set' : '✗ Missing',
            smartMemoryName,
            applicationName,
            version,
        });

        if (!raindropApiKey || !smartMemoryName || !applicationName || !version) {
            return new Response(
                JSON.stringify({
                    error: 'Missing required environment variables',
                    details: {
                        raindropApiKey: !!raindropApiKey,
                        smartMemoryName: !!smartMemoryName,
                        applicationName: !!applicationName,
                        version: !!version,
                    }
                }),
                { status: 500 }
            );
        }

        const raindrop = new Raindrop({ apiKey: raindropApiKey });

        // Use Netlify AI Gateway for Claude
        const anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY,
            baseURL: process.env.ANTHROPIC_BASE_URL,
        });

        const smartMemoryLocation = {
            smartMemory: {
                name: smartMemoryName,
                application_name: applicationName,
                version: version,
            },
        };

        const timings: Record<string, number> = {};
        const startTime = Date.now();

        // Start or get session
        let currentSessionId = sessionId;
        if (!currentSessionId) {
            const sessionStart = Date.now();
            const session = await raindrop.startSession.create({
                smartMemoryLocation: smartMemoryLocation,
            });
            currentSessionId = session.sessionId;
            timings.startSession = Date.now() - sessionStart;
        }

        // Retrieve last 5 messages from working memory
        const memoryStart = Date.now();
        const memorySearch = await raindrop.getMemory.retrieve({
            sessionId: currentSessionId,
            smartMemoryLocation: smartMemoryLocation,
            timeline: 'conversation',
            nMostRecent: 5,
        });
        timings.getMemory = Date.now() - memoryStart;

        // Build context from last 5 messages
        const memoryContext = memorySearch.memories
            ?.map((m) => `[${m.at}] ${m.content}`)
            .join('\n') || 'No previous messages found.';

        // Call Claude via Netlify AI Gateway
        const modelStart = Date.now();
        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-5-20250929',
            max_tokens: 1024,
            system: `You are a helpful AI assistant with access to your conversation memory. Here are relevant past memories:\n\n${memoryContext}\n\nUse this context to provide personalized responses. If the user asks about previous conversations, reference these memories.`,
            messages: [
                {
                    role: 'user',
                    content: message,
                },
            ],
        });
        timings.modelCall = Date.now() - modelStart;

        const assistantMessage = response.content[0].type === 'text' ? response.content[0].text : '';

        // Store this interaction in memory
        const putMemoryStart = Date.now();
        await raindrop.putMemory.create({
            sessionId: currentSessionId,
            smartMemoryLocation: smartMemoryLocation,
            content: `User said: "${message}". I responded: "${assistantMessage}"`,
            agent: 'demo-agent',
            timeline: 'conversation',
        });
        timings.putMemory = Date.now() - putMemoryStart;

        timings.total = Date.now() - startTime;

        return new Response(
            JSON.stringify({
                response: assistantMessage,
                sessionId: currentSessionId,
                memoryCount: memorySearch.memories?.length || 0,
                timings,
            }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    } catch (error) {
        console.error('Agent error:', error);
        return new Response(
            JSON.stringify({
                error: 'Failed to process message',
                details: error instanceof Error ? error.message : 'Unknown error',
            }),
            { status: 500 }
        );
    }
};
