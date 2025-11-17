import type { APIRoute } from 'astro';
import Raindrop from '@liquidmetal-ai/lm-raindrop';

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

        const raindropApiKey = process.env.RAINDROP_API_KEY;
        const smartMemoryName = process.env.RAINDROP_SMARTMEMORY_NAME;
        const applicationName = process.env.RAINDROP_APPLICATION_NAME;
        const version = process.env.RAINDROP_APPLICATION_VERSION;

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
        const memories = memorySearch.memories || [];

        // Generate demo response showing memory functionality
        const modelStart = Date.now();
        let assistantMessage = '';

        if (memories.length === 0) {
            assistantMessage = `🎭 Demo Mode: This is your first message! I'm demonstrating SmartMemory functionality without using a real LLM to prevent abuse.\n\nYour message: "${message}"\n\nTry sending more messages to see how I remember our conversation history!`;
        } else {
            assistantMessage = `🎭 Demo Mode: I can see our conversation history stored in SmartMemory!\n\nYou just said: "${message}"\n\n📚 Recent conversation history (${memories.length} memories):\n${memories.map((m, i) => `${i + 1}. ${m.content}`).join('\n')}\n\nThis demonstrates that SmartMemory is persisting your conversation across messages!`;
        }

        timings.modelCall = Date.now() - modelStart;

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
                memoryCount: (memorySearch.memories?.length || 0) + 1,
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
