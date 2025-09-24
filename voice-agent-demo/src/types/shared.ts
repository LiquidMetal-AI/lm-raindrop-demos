/**
 * Shared type definitions for Voice Processing API
 *
 * These types are used across the MVC layers to ensure
 * type safety and consistency throughout the application.
 */

// Request/Response Types

export interface ProcessedAudioResult {
  audioBase64: string;
  metadata: AudioProcessingMetadata;
}

export interface AudioProcessingMetadata {
  originalDuration?: number;
  transcriptLength: number;
  processingTimeMs: number;
  pipelineStages: PipelineStageResult[];
}

export interface PipelineStageResult {
  stage: PipelineStage;
  success: boolean;
  durationMs: number;
  error?: string;
}

export type PipelineStage = 'validation' | 'whisper' | 'llama' | 'hume' | 'response-assembly';

// Validation Types

export interface ValidationResult {
  valid: boolean;
  error?: string;
  details?: {
    fileSize?: number;
    fileType?: string;
    maxSizeExceeded?: boolean;
    unsupportedFormat?: boolean;
  };
}

export interface AudioMetadata {
  size: number;
  type: string;
  name?: string;
  lastModified?: number;
}

// Error Types

export interface ErrorResponse {
  error: string;
  stage?: PipelineStage;
  details?: string;
  timestamp: string;
  requestId?: string;
}

export class PipelineError extends Error {
  constructor(
    message: string,
    public stage: PipelineStage,
    public details?: string
  ) {
    super(message);
    this.name = 'PipelineError';
  }
}

// Health Check Types

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  checks?: {
    whisper: boolean;
    llama: boolean;
    hume: boolean;
  };
}

// Pipeline Types

export interface PipelineValidation {
  transcriptValid: boolean;
  llmOutputValid: boolean;
  errors: string[];
}

// Hume TTS Types (based on Hume SDK)

export interface HumeTTSRequest {
  text: string;
  voice?: {
    name?: string;
    description?: string;
  };
  numGenerations?: number;
}

export interface HumeTTSResponse {
  generations: Array<{
    audio: string; // base64 encoded
    generationId: string;
  }>;
}

// AI Model Types (for Raindrop AI integration)

export interface WhisperRequest {
  file: File | Blob;
  response_format?: 'text' | 'json' | 'verbose_json';
  language?: string;
  temperature?: number;
}

export interface WhisperResponse {
  text: string;
  segments?: Array<{
    start: number;
    end: number;
    text: string;
  }>;
}

export interface LlamaRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  max_tokens?: number;
  temperature?: number;
}

export interface LlamaResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}