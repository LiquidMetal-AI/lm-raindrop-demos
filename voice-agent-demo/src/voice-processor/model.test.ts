import { describe, it, expect } from 'vitest';
import { validateAudioFile, extractAudioMetadata, validatePipelineStages } from './model';
import { ValidationResult, AudioMetadata } from '../types/shared';

describe('model.ts - Audio Processing Model', () => {
  describe('validateAudioFile', () => {
    it('should validate supported audio file formats', async () => {
      // Test wav format
      const wavFile = new File(['fake wav content'], 'test.wav', { type: 'audio/wav' });
      const result = validateAudioFile(wavFile);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();

      // Test mp3 format
      const mp3File = new File(['fake mp3 content'], 'test.mp3', { type: 'audio/mp3' });
      const mp3Result = validateAudioFile(mp3File);
      expect(mp3Result.valid).toBe(true);

      // Test m4a format
      const m4aFile = new File(['fake m4a content'], 'test.m4a', { type: 'audio/mp4' });
      const m4aResult = validateAudioFile(m4aFile);
      expect(m4aResult.valid).toBe(true);
    });

    it('should reject unsupported file formats', () => {
      const txtFile = new File(['text content'], 'test.txt', { type: 'text/plain' });
      const result = validateAudioFile(txtFile);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unsupported file format');
      expect(result.details?.unsupportedFormat).toBe(true);
    });

    it('should reject files larger than 25MB', () => {
      const largeFileSize = 26 * 1024 * 1024; // 26MB
      const largeBuffer = new ArrayBuffer(largeFileSize);
      const largeFile = new File([new Uint8Array(largeBuffer)], 'large.wav', { type: 'audio/wav' });

      const result = validateAudioFile(largeFile);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('File size exceeds');
      expect(result.details?.maxSizeExceeded).toBe(true);
      expect(result.details?.fileSize).toBe(largeFileSize);
    });

    it('should accept files under 25MB limit', () => {
      const validFileSize = 20 * 1024 * 1024; // 20MB
      const validBuffer = new ArrayBuffer(validFileSize);
      const validFile = new File([new Uint8Array(validBuffer)], 'valid.mp3', { type: 'audio/mp3' });

      const result = validateAudioFile(validFile);
      expect(result.valid).toBe(true);
      expect(result.details?.fileSize).toBe(validFileSize);
    });

    it('should handle edge case of exactly 25MB', () => {
      const exactFileSize = 25 * 1024 * 1024; // Exactly 25MB
      const exactBuffer = new ArrayBuffer(exactFileSize);
      const exactFile = new File([new Uint8Array(exactBuffer)], 'exact.wav', { type: 'audio/wav' });

      const result = validateAudioFile(exactFile);
      expect(result.valid).toBe(true);
      expect(result.details?.fileSize).toBe(exactFileSize);
    });

    it('should provide detailed error information', () => {
      const invalidFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const result = validateAudioFile(invalidFile);

      expect(result.valid).toBe(false);
      expect(result.details).toBeDefined();
      expect(result.details?.fileType).toBe('application/pdf');
      expect(result.details?.unsupportedFormat).toBe(true);
    });
  });

  describe('extractAudioMetadata', () => {
    it('should extract basic file metadata', () => {
      const testFile = new File(['test content'], 'audio.wav', {
        type: 'audio/wav',
        lastModified: 1234567890
      });

      const metadata = extractAudioMetadata(testFile);
      expect(metadata.size).toBe(testFile.size);
      expect(metadata.type).toBe('audio/wav');
      expect(metadata.name).toBe('audio.wav');
      expect(metadata.lastModified).toBe(1234567890);
    });

    it('should handle files without lastModified', () => {
      const testFile = new File(['test content'], 'audio.mp3', { type: 'audio/mp3' });

      const metadata = extractAudioMetadata(testFile);
      expect(metadata.size).toBeGreaterThan(0);
      expect(metadata.type).toBe('audio/mp3');
      expect(metadata.name).toBe('audio.mp3');
      expect(metadata.lastModified).toBeDefined();
    });

    it('should handle files with no name', () => {
      const testFile = new File(['content'], '', { type: 'audio/wav' });

      const metadata = extractAudioMetadata(testFile);
      expect(metadata.size).toBeGreaterThan(0);
      expect(metadata.type).toBe('audio/wav');
      expect(metadata.name).toBe('');
    });
  });

  describe('validatePipelineStages', () => {
    it('should validate successful pipeline with valid transcript and LLM output', () => {
      const transcript = 'This is a valid transcript from Whisper';
      const llmOutput = 'This is processed output from Llama';

      const result = validatePipelineStages(transcript, llmOutput);
      expect(result).toBe(true);
    });

    it('should reject empty transcript', () => {
      const transcript = '';
      const llmOutput = 'Valid LLM output';

      const result = validatePipelineStages(transcript, llmOutput);
      expect(result).toBe(false);
    });

    it('should reject whitespace-only transcript', () => {
      const transcript = '   \n\t  ';
      const llmOutput = 'Valid LLM output';

      const result = validatePipelineStages(transcript, llmOutput);
      expect(result).toBe(false);
    });

    it('should reject empty LLM output', () => {
      const transcript = 'Valid transcript';
      const llmOutput = '';

      const result = validatePipelineStages(transcript, llmOutput);
      expect(result).toBe(false);
    });

    it('should reject whitespace-only LLM output', () => {
      const transcript = 'Valid transcript';
      const llmOutput = '  \n  ';

      const result = validatePipelineStages(transcript, llmOutput);
      expect(result).toBe(false);
    });

    it('should accept single character inputs', () => {
      const transcript = 'a';
      const llmOutput = 'b';

      const result = validatePipelineStages(transcript, llmOutput);
      expect(result).toBe(true);
    });

    it('should handle special characters and unicode', () => {
      const transcript = 'Hello 世界! 🌍';
      const llmOutput = 'Response with émojis 🤖';

      const result = validatePipelineStages(transcript, llmOutput);
      expect(result).toBe(true);
    });
  });
});