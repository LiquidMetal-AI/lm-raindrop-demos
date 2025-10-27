import type { APIRoute } from 'astro';
import Raindrop from '@liquidmetal-ai/lm-raindrop';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
    try {
        const { input, bucketName } = await request.json();

        if (!input) {
            return new Response(
                JSON.stringify({ error: 'Input query is required' }),
                { status: 400 }
            );
        }

        const apiKey = import.meta.env.RAINDROP_API_KEY || process.env.RAINDROP_API_KEY;
        const client = new Raindrop({ apiKey });
        const bucketToUse = bucketName || import.meta.env.RAINDROP_SMARTBUCKET_NAME || process.env.RAINDROP_SMARTBUCKET_NAME;

        if (!bucketToUse) {
            return new Response(
                JSON.stringify({ error: 'Bucket name not configured' }),
                { status: 500 }
            );
        }

        const response = await client.query.chunkSearch({
            bucketLocations: [{ bucket: { name: bucketToUse } }],
            input,
            requestId: crypto.randomUUID(),
        });

        console.log('Search response:', JSON.stringify(response, null, 2));

        return new Response(
            JSON.stringify(response),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    } catch (error) {
        console.error('Search error:', error);
        return new Response(
            JSON.stringify({
                error: 'Failed to perform search',
                details: error instanceof Error ? error.message : 'Unknown error'
            }),
            { status: 500 }
        );
    }
};
