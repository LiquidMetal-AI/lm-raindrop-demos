/**
 * MODEL for voice-processor Service
 *
 * PRD REQUIREMENTS:
 * - File validation and format verification for uploaded audio
 * - Audio file metadata extraction (duration, format, size)
 * - Response data transformation and validation
 * - Audio file size limits and format restrictions
 * - Pipeline processing validation (transcript non-empty, valid Hume response)
 * - Error handling for malformed inputs
 *
 * MUST IMPLEMENT:
 * 1. validateAudioFile(file: File): ValidationResult - Verify audio file meets requirements
 * 2. extractAudioMetadata(file: File): AudioMetadata - Get file properties
 * 3. validatePipelineStages(transcript: string, llmOutput: string): boolean - Ensure pipeline integrity
 *
 * INTERFACES TO EXPORT:
 * - validateAudioFile(file: File): ValidationResult
 * - extractAudioMetadata(file: File): AudioMetadata
 * - validatePipelineStages(transcript: string, llmOutput: string): boolean
 *
 * IMPORTS NEEDED:
 * - From shared types: ValidationResult, AudioMetadata, PipelineValidation
 * - From env: None (pure data operations)
 * - From other layers: None (model is independent)
 *
 * BUSINESS RULES:
 * - Max audio file size: 25MB
 * - Supported formats: wav, mp3, m4a, webm, mp4, mpeg, mpga
 * - Minimum transcript length: 1 character
 * - LLM output must not be empty
 * - File must be valid audio format
 *
 * ERROR HANDLING:
 * - Invalid file format returns validation error
 * - File too large returns size error
 * - Empty transcript returns pipeline error
 * - Invalid metadata returns metadata error
 *
 * INTEGRATION POINTS:
 * - Used by controller for input validation
 * - Provides data structures for view layer responses
 */

import { ValidationResult, AudioMetadata } from '../types/shared';

// Configuration constants
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const SUPPORTED_MIME_TYPES = [
  'audio/wav', 'audio/mp3', 'audio/mpeg',
  'audio/mp4', 'audio/webm', 'audio/m4a', 'audio/mpga'
];
const SUPPORTED_EXTENSIONS = [
  'wav', 'mp3', 'm4a', 'webm', 'mp4', 'mpeg', 'mpga'
];

export function validateAudioFile(file: File): ValidationResult {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      details: {
        fileSize: file.size,
        fileType: file.type,
        maxSizeExceeded: true,
        unsupportedFormat: false
      }
    };
  }

  // Check file type by MIME type and extension
  const isValidMimeType = SUPPORTED_MIME_TYPES.includes(file.type);
  const fileExtension = file.name.toLowerCase().split('.').pop();
  const hasValidExtension = fileExtension && SUPPORTED_EXTENSIONS.includes(fileExtension);

  if (!isValidMimeType && !hasValidExtension) {
    return {
      valid: false,
      error: `Unsupported file format. Supported formats: ${SUPPORTED_EXTENSIONS.join(', ')}`,
      details: {
        fileSize: file.size,
        fileType: file.type,
        maxSizeExceeded: false,
        unsupportedFormat: true
      }
    };
  }

  // Valid file
  return {
    valid: true,
    details: {
      fileSize: file.size,
      fileType: file.type,
      maxSizeExceeded: false,
      unsupportedFormat: false
    }
  };
}

export function extractAudioMetadata(file: File): AudioMetadata {
  return {
    size: file.size,
    type: file.type,
    name: file.name,
    lastModified: file.lastModified
  };
}

export function validatePipelineStages(transcript: string, llmOutput: string): boolean {
  // Check if transcript is empty or whitespace only
  if (!transcript || transcript.trim().length === 0) {
    return false;
  }

  // Check if LLM output is empty or whitespace only
  if (!llmOutput || llmOutput.trim().length === 0) {
    return false;
  }

  return true;
}