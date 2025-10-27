import type { APIRoute } from 'astro';
import Raindrop from '@liquidmetal-ai/lm-raindrop';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
    try {
        const raindropApiKey = import.meta.env.RAINDROP_API_KEY || process.env.RAINDROP_API_KEY;
        const smartMemoryName = import.meta.env.RAINDROP_SMARTMEMORY_NAME || process.env.RAINDROP_SMARTMEMORY_NAME;
        const applicationName = import.meta.env.RAINDROP_APPLICATION_NAME || process.env.RAINDROP_APPLICATION_NAME;
        const version = import.meta.env.RAINDROP_APPLICATION_VERSION || process.env.RAINDROP_APPLICATION_VERSION;

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

        const startTime = Date.now();
        const session = await raindrop.startSession.create({
            smartMemoryLocation: smartMemoryLocation,
        });
        const timings = {
            startSession: Date.now() - startTime,
        };

        return new Response(
            JSON.stringify({
                sessionId: session.sessionId,
                timings,
            }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    } catch (error) {
        console.error('Create session error:', error);
        return new Response(
            JSON.stringify({
                error: 'Failed to create session',
                details: error instanceof Error ? error.message : 'Unknown error',
            }),
            { status: 500 }
        );
    }
};
