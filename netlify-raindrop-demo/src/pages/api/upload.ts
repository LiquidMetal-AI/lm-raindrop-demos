import type { APIRoute } from 'astro';
import Raindrop from '@liquidmetal-ai/lm-raindrop';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
    try {
        const { key, content, contentType, bucketName } = await request.json();

        if (!key || !content) {
            return new Response(
                JSON.stringify({ error: 'Key and content are required' }),
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

        const response = await client.bucket.put({
            bucketLocation: { bucket: { name: bucketToUse } },
            content,
            contentType: contentType || 'application/pdf',
            key,
        });

        return new Response(
            JSON.stringify({
                bucket: response.bucket,
                message: `Document "${key}" uploaded successfully`
            }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    } catch (error) {
        console.error('Upload error:', error);
        return new Response(
            JSON.stringify({
                error: 'Failed to upload document',
                details: error instanceof Error ? error.message : 'Unknown error'
            }),
            { status: 500 }
        );
    }
};
