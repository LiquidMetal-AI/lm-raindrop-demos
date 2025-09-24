/**
 * VIEW LAYER + EXPORTS for voice-processor Service
 *
 * PRD REQUIREMENTS:
 * - POST /process-voice - Main endpoint accepting audio file, returning processed audio
 * - GET /health - Service health check endpoint
 * - Multipart form data validation for audio file uploads
 * - File type validation (audio formats only)
 * - Request size limits and malformed data detection
 * - Binary audio file responses with metadata headers
 * - JSON error responses with detailed messages
 * - Hono router setup and middleware configuration
 *
 * MUST IMPLEMENT:
 * 1. Set up Hono router with middleware
 * 2. POST /process-voice endpoint with multipart form handling
 * 3. GET /health endpoint returning service status
 * 4. Input validation for audio files (type, size)
 * 5. Response formatting for success (audio binary) and errors (JSON)
 * 6. CORS headers for all responses
 * 7. Error middleware for uncaught exceptions
 *
 * INTERFACES TO EXPORT:
 * - Service class extending Raindrop Service
 * - No external exports (single service, no inter-service communication)
 *
 * IMPORTS NEEDED:
 * - From shared types: ProcessedAudioResult, ErrorResponse, HealthCheckResponse
 * - From env: Service binding from Raindrop
 * - From controller: processVoicePipeline, handlePipelineError
 * - From external: Hono router and middleware
 *
 * BUSINESS RULES:
 * - Max request size: 25MB
 * - Timeout: 60 seconds per request
 * - CORS enabled for all origins
 * - Content-Type validation required
 *
 * ERROR HANDLING:
 * - 400 for invalid input (wrong file type, too large)
 * - 422 for pipeline processing errors
 * - 500 for internal server errors
 * - 503 for external service unavailable
 *
 * INTEGRATION POINTS:
 * - Controller layer for pipeline orchestration
 * - Raindrop Service framework for HTTP handling
 */

import { Service } from '@liquidmetal-ai/raindrop-framework';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Env } from './raindrop.gen';
import { processVoicePipeline, handlePipelineError } from './controller';
import { ProcessedAudioResult, ErrorResponse, HealthCheckResponse, PipelineError } from '../types/shared';

export default class extends Service<Env> {
  async fetch(request: Request): Promise<Response> {
    const app = new Hono<{ Bindings: Env }>();
    const env = this.env;

    // Add CORS middleware
    app.use('*', cors({
      origin: '*',
      allowMethods: ['GET', 'POST', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization'],
    }));

    // POST /process-voice endpoint
    app.post('/process-voice', async (c) => {
      try {
        const formData = await c.req.formData();
        const audioFile = formData.get('audio') as File;

        // Validate file presence
        if (!audioFile) {
          const errorResponse: ErrorResponse = {
            error: 'No audio file provided',
            timestamp: new Date().toISOString(),
            requestId: generateRequestId()
          };
          return c.json(errorResponse, 400);
        }

        // Validate file type
        if (!audioFile.type.startsWith('audio/')) {
          const errorResponse: ErrorResponse = {
            error: `Invalid file type: ${audioFile.type}. Expected audio format.`,
            timestamp: new Date().toISOString(),
            requestId: generateRequestId()
          };
          return c.json(errorResponse, 400);
        }

        try {
          // Process the voice pipeline
          const result: ProcessedAudioResult = await processVoicePipeline(audioFile, env);

          // Convert base64 to binary (V8 runtime compatible)
          const binaryString = atob(result.audioBase64);
          const audioBuffer = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            audioBuffer[i] = binaryString.charCodeAt(i);
          }

          // Return binary audio with metadata headers
          return new Response(audioBuffer, {
            headers: {
              'Content-Type': 'audio/wav',
              'X-Processing-Time-Ms': result.metadata.processingTimeMs.toString(),
              'X-Transcript-Length': result.metadata.transcriptLength.toString(),
              'X-Pipeline-Stages': JSON.stringify(result.metadata.pipelineStages),
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Expose-Headers': 'X-Processing-Time-Ms, X-Transcript-Length, X-Pipeline-Stages'
            }
          });

        } catch (error) {
          if (error instanceof PipelineError) {
            const errorResponse = handlePipelineError(error, error.stage);
            return c.json(errorResponse, 422);
          } else {
            const errorResponse = handlePipelineError(error as Error, 'unknown');
            return c.json(errorResponse, 500);
          }
        }

      } catch (error) {
        // Handle malformed multipart data or other request errors
        const errorResponse: ErrorResponse = {
          error: error instanceof Error ? error.message : 'Invalid request format',
          timestamp: new Date().toISOString(),
          requestId: generateRequestId()
        };
        return c.json(errorResponse, 400);
      }
    });

    // GET /health endpoint
    app.get('/health', async (c) => {
      try {
        const healthResponse: HealthCheckResponse = {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          checks: {
            whisper: true, // TODO: Add actual health checks
            llama: true,   // TODO: Add actual health checks
            hume: !!env.HUME_API_KEY
          }
        };

        return c.json(healthResponse, 200);
      } catch (error) {
        const healthResponse: HealthCheckResponse = {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        };

        return c.json(healthResponse, 503);
      }
    });

    // Handle 404 for unknown routes
    app.all('*', (c) => {
      const errorResponse: ErrorResponse = {
        error: 'Route not found',
        timestamp: new Date().toISOString(),
        requestId: generateRequestId()
      };
      return c.json(errorResponse, 404);
    });

    return app.fetch(request, env);
  }
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
