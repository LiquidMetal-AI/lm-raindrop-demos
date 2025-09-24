/**
 * CONTROLLER for voice-processor Service
 *
 * PRD REQUIREMENTS:
 * - Audio Processing Pipeline: file upload → Whisper transcription → Llama processing → Hume TTS synthesis
 * - Error Recovery: Handle failures at any pipeline stage with appropriate fallbacks
 * - Response Coordination: Package final audio with metadata
 * - External API integrations (Whisper, Llama, Hume)
 * - Model-view coordination for data flow
 *
 * MUST IMPLEMENT:
 * 1. processVoicePipeline(audioFile: File, env: any): Promise<ProcessedAudioResult> - Orchestrate complete pipeline
 * 2. handlePipelineError(error: Error, stage: string): ErrorResponse - Manage pipeline failures
 * 3. transcribeAudio(file: File, env: any): Promise<string> - Call Whisper for transcription
 * 4. processTextWithLLM(transcript: string, env: any): Promise<string> - Call Llama for text processing
 * 5. synthesizeSpeech(text: string): Promise<string> - Call Hume API for TTS
 *
 * INTERFACES TO EXPORT:
 * - processVoicePipeline(audioFile: File, env: any): Promise<ProcessedAudioResult>
 * - handlePipelineError(error: Error, stage: string): ErrorResponse
 *
 * IMPORTS NEEDED:
 * - From shared types: ProcessedAudioResult, ErrorResponse, PipelineStage
 * - From env: env.AI for Whisper and Llama
 * - From model: validateAudioFile, extractAudioMetadata, validatePipelineStages
 * - From external: Hume SDK (import { HumeClient } from "hume")
 *
 * BUSINESS RULES:
 * - Pipeline must complete all stages or return error
 * - Each stage timeout: 30 seconds
 * - Retry failed stages once before error
 * - Log all stage transitions and errors
 *
 * ERROR HANDLING:
 * - Whisper failure: Return transcription error with details
 * - Llama failure: Return LLM processing error
 * - Hume failure: Return TTS synthesis error
 * - Network timeouts: Return timeout error with stage
 * - Invalid responses: Return pipeline validation error
 *
 * INTEGRATION POINTS:
 * - env.AI.run('whisper-large-v3', ...) for speech-to-text
 * - env.AI.run('llama-3.3-70b', ...) for text processing
 * - Hume API for text-to-speech synthesis
 * - Model layer for validation
 * - View layer for response formatting
 */

import { ProcessedAudioResult, ErrorResponse, PipelineStage, PipelineError, PipelineStageResult } from '../types/shared';
import { validateAudioFile, extractAudioMetadata, validatePipelineStages } from './model';

export async function processVoicePipeline(audioFile: File, env: any): Promise<ProcessedAudioResult> {
  const startTime = Date.now();
  const pipelineStages: PipelineStageResult[] = [];

  try {
    // Stage 1: Validation
    const validationStart = Date.now();
    const validation = validateAudioFile(audioFile);
    const validationEnd = Date.now();

    pipelineStages.push({
      stage: 'validation',
      success: validation.valid,
      durationMs: validationEnd - validationStart,
      error: validation.error
    });

    if (!validation.valid) {
      throw new PipelineError(validation.error || 'Validation failed', 'validation');
    }

    // Stage 2: Whisper Transcription
    const whisperStart = Date.now();
    let transcript: string;

    try {
      // Convert File to Uint8Array for Whisper API compatibility
      const arrayBuffer = await audioFile.arrayBuffer();
      const audioArray = Array.from(new Uint8Array(arrayBuffer));
      const whisperResponse = await env.AI.run('whisper-large-v3', {
        audio: audioArray,
        response_format: 'text'
      });
      transcript = whisperResponse.text;
    } catch (error) {
      const whisperEnd = Date.now();
      pipelineStages.push({
        stage: 'whisper',
        success: false,
        durationMs: whisperEnd - whisperStart,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new PipelineError('Whisper transcription failed', 'whisper', error instanceof Error ? error.message : undefined);
    }

    const whisperEnd = Date.now();
    pipelineStages.push({
      stage: 'whisper',
      success: true,
      durationMs: whisperEnd - whisperStart
    });

    // Stage 3: Llama Processing
    const llamaStart = Date.now();
    let llmOutput: string;

    try {
      const llamaResponse = await env.AI.run('llama-3.3-70b', {
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that processes user speech input and provides thoughtful responses.'
          },
          {
            role: 'user',
            content: transcript
          }
        ],
        max_tokens: 1024,
        temperature: 0.7
      });
      llmOutput = llamaResponse.choices[0].message.content;
    } catch (error) {
      const llamaEnd = Date.now();
      pipelineStages.push({
        stage: 'llama',
        success: false,
        durationMs: llamaEnd - llamaStart,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new PipelineError('LLM processing failed', 'llama', error instanceof Error ? error.message : undefined);
    }

    const llamaEnd = Date.now();
    pipelineStages.push({
      stage: 'llama',
      success: true,
      durationMs: llamaEnd - llamaStart
    });

    // Validate pipeline stages
    if (!validatePipelineStages(transcript, llmOutput)) {
      pipelineStages.push({
        stage: 'response-assembly',
        success: false,
        durationMs: 0,
        error: 'Invalid pipeline output'
      });
      throw new PipelineError('Pipeline validation failed', 'response-assembly');
    }

    // Stage 4: Hume TTS
    const humeStart = Date.now();
    let audioBase64: string;

    try {
      // Use direct HTTP API call instead of SDK (SDK has Node.js dependencies incompatible with V8 runtime)
      const ttsResponse = await fetch('https://api.hume.ai/v0/tts', {
        method: 'POST',
        headers: {
          'X-Hume-Api-Key': env.HUME_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          utterances: [{
            text: llmOutput
          }]
        })
      });

      if (!ttsResponse.ok) {
        const errorText = await ttsResponse.text();
        throw new Error(`Hume API error: ${ttsResponse.status} - ${errorText}`);
      }

      const ttsData = await ttsResponse.json() as any;

      if (ttsData.generations && ttsData.generations.length > 0 && ttsData.generations[0]?.audio) {
        audioBase64 = ttsData.generations[0].audio;
      } else {
        throw new Error('No audio generated by TTS service');
      }
    } catch (error) {
      const humeEnd = Date.now();
      pipelineStages.push({
        stage: 'hume',
        success: false,
        durationMs: humeEnd - humeStart,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new PipelineError('Text-to-speech synthesis failed', 'hume', error instanceof Error ? error.message : undefined);
    }

    const humeEnd = Date.now();
    pipelineStages.push({
      stage: 'hume',
      success: true,
      durationMs: humeEnd - humeStart
    });

    // Stage 5: Response Assembly
    const assemblyStart = Date.now();
    const metadata = extractAudioMetadata(audioFile);
    const assemblyEnd = Date.now();

    pipelineStages.push({
      stage: 'response-assembly',
      success: true,
      durationMs: assemblyEnd - assemblyStart
    });

    const endTime = Date.now();

    return {
      audioBase64,
      metadata: {
        originalDuration: metadata.size > 0 ? Math.ceil(metadata.size / 16000) : undefined, // Rough estimate
        transcriptLength: transcript.length,
        processingTimeMs: endTime - startTime,
        pipelineStages
      }
    };

  } catch (error) {
    if (error instanceof PipelineError) {
      throw error;
    }
    throw new PipelineError('Unknown pipeline error', 'response-assembly', error instanceof Error ? error.message : undefined);
  }
}

export function handlePipelineError(error: Error, stage: string): ErrorResponse {
  const timestamp = new Date().toISOString();
  const requestId = generateRequestId();

  if (error instanceof PipelineError) {
    return {
      error: error.message,
      stage: error.stage,
      details: error.details,
      timestamp,
      requestId
    };
  }

  // Enhanced error messaging for better debugging
  const errorMessage = error.message || 'Unknown error occurred';
  const errorDetails = error.stack ? error.stack.split('\n')[0] : undefined;

  return {
    error: errorMessage,
    stage: stage as PipelineStage,
    details: errorDetails,
    timestamp,
    requestId
  };
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}