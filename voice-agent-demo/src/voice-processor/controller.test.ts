import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processVoicePipeline, handlePipelineError } from './controller';
import { ProcessedAudioResult, ErrorResponse, PipelineError } from '../types/shared';

// Mock the model functions
vi.mock('./model', () => ({
  validateAudioFile: vi.fn().mockReturnValue({ valid: true }),
  extractAudioMetadata: vi.fn().mockReturnValue({
    size: 1024,
    type: 'audio/wav',
    name: 'test.wav',
    lastModified: Date.now()
  }),
  validatePipelineStages: vi.fn().mockReturnValue(true)
}));

// Mock fetch for Hume API calls
global.fetch = vi.fn();

describe('controller.ts - Audio Processing Controller', () => {
  let mockEnv: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Reset model mocks to default state
    const mockModel = await import('./model');
    vi.mocked(mockModel.validateAudioFile).mockReturnValue({ valid: true });
    vi.mocked(mockModel.extractAudioMetadata).mockReturnValue({
      size: 1024,
      type: 'audio/wav',
      name: 'test.wav',
      lastModified: Date.now()
    });
    vi.mocked(mockModel.validatePipelineStages).mockReturnValue(true);

    // Reset fetch mock for Hume API
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        generations: [{
          audio: 'base64-encoded-audio-data',
          generationId: 'gen-123'
        }]
      })
    });

    mockEnv = {
      AI: {
        run: vi.fn()
      },
      HUME_API_KEY: 'test-hume-key',
      logger: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn()
      }
    };
  });

  describe('processVoicePipeline', () => {
    it('should process complete pipeline successfully', async () => {
      const testFile = new File(['audio content'], 'test.wav', { type: 'audio/wav' });

      // Mock successful responses
      mockEnv.AI.run
        .mockResolvedValueOnce({ text: 'Transcribed text from Whisper' }) // Whisper
        .mockResolvedValueOnce({ // Llama
          choices: [{
            message: { content: 'Processed text from Llama' }
          }]
        });


      const result = await processVoicePipeline(testFile, mockEnv);

      expect(result).toEqual({
        audioBase64: 'base64-encoded-audio-data',
        metadata: {
          originalDuration: expect.any(Number),
          transcriptLength: expect.any(Number),
          processingTimeMs: expect.any(Number),
          pipelineStages: expect.arrayContaining([
            expect.objectContaining({
              stage: 'validation',
              success: true,
              durationMs: expect.any(Number)
            }),
            expect.objectContaining({
              stage: 'whisper',
              success: true,
              durationMs: expect.any(Number)
            }),
            expect.objectContaining({
              stage: 'llama',
              success: true,
              durationMs: expect.any(Number)
            }),
            expect.objectContaining({
              stage: 'hume',
              success: true,
              durationMs: expect.any(Number)
            })
          ])
        }
      });
    });

    it('should handle Whisper transcription failure', async () => {
      const testFile = new File(['audio content'], 'test.wav', { type: 'audio/wav' });

      mockEnv.AI.run.mockRejectedValueOnce(new Error('Whisper API error'));

      await expect(processVoicePipeline(testFile, mockEnv)).rejects.toThrow('Whisper transcription failed');
    });

    it('should handle Llama processing failure', async () => {
      const testFile = new File(['audio content'], 'test.wav', { type: 'audio/wav' });

      mockEnv.AI.run
        .mockResolvedValueOnce({ text: 'Transcribed text' }) // Whisper succeeds
        .mockRejectedValueOnce(new Error('Llama API error')); // Llama fails

      await expect(processVoicePipeline(testFile, mockEnv)).rejects.toThrow('LLM processing failed');
    });

    it('should handle Hume TTS failure', async () => {
      const testFile = new File(['audio content'], 'test.wav', { type: 'audio/wav' });

      mockEnv.AI.run
        .mockResolvedValueOnce({ text: 'Transcribed text' })
        .mockResolvedValueOnce({
          choices: [{ message: { content: 'Processed text' } }]
        });

      // Mock Hume API to fail
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Hume TTS service error'
      });

      await expect(processVoicePipeline(testFile, mockEnv)).rejects.toThrow('Text-to-speech synthesis failed');
    });

    it('should handle invalid pipeline validation', async () => {
      const testFile = new File(['audio content'], 'test.wav', { type: 'audio/wav' });

      mockEnv.AI.run
        .mockResolvedValueOnce({ text: '' }) // Empty transcript
        .mockResolvedValueOnce({
          choices: [{ message: { content: 'Some response' } }]
        });

      // Mock pipeline validation to fail
      const mockModel = await import('./model');
      vi.mocked(mockModel.validatePipelineStages).mockReturnValue(false);

      await expect(processVoicePipeline(testFile, mockEnv)).rejects.toThrow('Pipeline validation failed');
    });

    it('should track processing time for each stage', async () => {
      const testFile = new File(['audio content'], 'test.wav', { type: 'audio/wav' });

      // Setup sequential mock calls with delays
      mockEnv.AI.run
        .mockImplementationOnce(() => new Promise(resolve =>
          setTimeout(() => resolve({ text: 'Transcribed text' }), 10)
        ))
        .mockImplementationOnce(() => new Promise(resolve =>
          setTimeout(() => resolve({
            choices: [{ message: { content: 'Processed text' } }]
          }), 10)
        ));

      const result = await processVoicePipeline(testFile, mockEnv);

      expect(result.metadata.pipelineStages).toHaveLength(5); // validation, whisper, llama, hume, response-assembly
      result.metadata.pipelineStages.forEach(stage => {
        expect(stage.durationMs).toBeGreaterThanOrEqual(0);
      });
    });

    it('should include transcript length in metadata', async () => {
      const testFile = new File(['audio content'], 'test.wav', { type: 'audio/wav' });
      const transcriptText = 'This is a test transcript with specific length';

      mockEnv.AI.run
        .mockResolvedValueOnce({ text: transcriptText })
        .mockResolvedValueOnce({
          choices: [{ message: { content: 'Processed response' } }]
        });

      const result = await processVoicePipeline(testFile, mockEnv);

      expect(result.metadata.transcriptLength).toBe(transcriptText.length);
    });
  });

  describe('handlePipelineError', () => {
    it('should format pipeline error correctly', () => {
      const pipelineError = new PipelineError('Whisper failed', 'whisper', 'Network timeout');

      const errorResponse = handlePipelineError(pipelineError, 'whisper');

      expect(errorResponse).toEqual({
        error: 'Whisper failed',
        stage: 'whisper',
        details: 'Network timeout',
        timestamp: expect.any(String),
        requestId: expect.any(String)
      });
    });

    it('should format generic error correctly', () => {
      const genericError = new Error('Something went wrong');

      const errorResponse = handlePipelineError(genericError, 'llama');

      expect(errorResponse).toEqual({
        error: 'Something went wrong',
        stage: 'llama',
        details: expect.any(String), // Now includes stack trace info
        timestamp: expect.any(String),
        requestId: expect.any(String)
      });
    });

    it('should include current timestamp in ISO format', () => {
      const error = new Error('Test error');

      const errorResponse = handlePipelineError(error, 'validation');

      expect(errorResponse.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should generate unique request IDs', () => {
      const error1 = new Error('Error 1');
      const error2 = new Error('Error 2');

      const response1 = handlePipelineError(error1, 'whisper');
      const response2 = handlePipelineError(error2, 'llama');

      expect(response1.requestId).not.toBe(response2.requestId);
      expect(response1.requestId).toBeDefined();
      expect(response2.requestId).toBeDefined();
    });

    it('should handle error without message', () => {
      const error = new Error();

      const errorResponse = handlePipelineError(error, 'hume');

      expect(errorResponse.error).toBeDefined();
      expect(errorResponse.stage).toBe('hume');
    });
  });

  describe('Pipeline Integration', () => {
    it('should call Whisper with correct parameters', async () => {
      const testFile = new File(['audio content'], 'test.wav', { type: 'audio/wav' });

      mockEnv.AI.run.mockResolvedValue({ text: 'Transcribed text' });

      try {
        await processVoicePipeline(testFile, mockEnv);
      } catch {
        // Expected to fail due to incomplete mocking
      }

      expect(mockEnv.AI.run).toHaveBeenCalledWith(
        'whisper-large-v3',
        expect.objectContaining({
          audio: expect.any(Array),
          response_format: 'text'
        })
      );
    });

    it('should call Llama with correct message format', async () => {
      const testFile = new File(['audio content'], 'test.wav', { type: 'audio/wav' });
      const transcript = 'User said something';

      mockEnv.AI.run
        .mockResolvedValueOnce({ text: transcript })
        .mockResolvedValueOnce({
          choices: [{ message: { content: 'AI response' } }]
        });

      try {
        await processVoicePipeline(testFile, mockEnv);
      } catch {
        // Expected to fail due to incomplete mocking
      }

      expect(mockEnv.AI.run).toHaveBeenNthCalledWith(
        2, // Second call
        'llama-3.3-70b',
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: transcript
            })
          ])
        })
      );
    });
  });
});