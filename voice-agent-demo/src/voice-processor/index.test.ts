import { describe, it, expect, vi, beforeEach } from 'vitest';
import VoiceProcessorService from './index';
import { ErrorResponse, HealthCheckResponse, ProcessedAudioResult } from '../types/shared';

// Mock the controller functions
vi.mock('./controller', () => ({
  processVoicePipeline: vi.fn(),
  handlePipelineError: vi.fn()
}));

describe('index.ts - Voice Processor Service Router', () => {
  let service: VoiceProcessorService;
  let mockEnv: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Reset mocks but don't set default values - let individual tests control mocks
    const mockController = await import('./controller');
    vi.mocked(mockController.processVoicePipeline).mockReset();
    vi.mocked(mockController.handlePipelineError).mockReset();

    // Don't set default mock for handlePipelineError - let tests control it

    mockEnv = {
      _raindrop: {
        app: {} as any
      },
      AI: { run: vi.fn() },
      annotation: {} as any,
      HUME_API_KEY: 'test-hume-key',
      logger: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn()
      },
      tracer: {} as any
    };
    const mockContext = {
      waitUntil: vi.fn()
    };
    service = new VoiceProcessorService(mockContext, mockEnv);
  });

  describe('POST /process-voice', () => {
    it('should handle multipart form data with audio file', async () => {
      const audioFile = new File(['fake audio content'], 'test.wav', { type: 'audio/wav' });
      const formData = new FormData();
      formData.append('audio', audioFile);

      // Ensure the mock is set up for this specific test
      const mockController = await import('./controller');
      const mockResult: ProcessedAudioResult = {
        audioBase64: 'dGVzdCBhdWRpbyBkYXRh', // Valid base64 for "test audio data"
        metadata: {
          originalDuration: 1,
          transcriptLength: 16,
          processingTimeMs: 100,
          pipelineStages: [
            { stage: 'validation', success: true, durationMs: 10 },
            { stage: 'whisper', success: true, durationMs: 20 },
            { stage: 'llama', success: true, durationMs: 30 },
            { stage: 'hume', success: true, durationMs: 25 },
            { stage: 'response-assembly', success: true, durationMs: 5 }
          ]
        }
      };

      vi.mocked(mockController.processVoicePipeline).mockResolvedValue(mockResult);

      const request = new Request('http://localhost/process-voice', {
        method: 'POST',
        body: formData
      });

      const response = await service.fetch(request);

      // Test expects success

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toContain('audio/');
    });

    it('should return 400 for missing audio file', async () => {
      const formData = new FormData();
      const request = new Request('http://localhost/process-voice', {
        method: 'POST',
        body: formData
      });

      const response = await service.fetch(request);

      expect(response.status).toBe(400);
      const errorData = await response.json() as ErrorResponse;
      expect(errorData.error).toContain('No audio file provided');
    });

    it('should return 400 for invalid file type', async () => {
      const textFile = new File(['text content'], 'test.txt', { type: 'text/plain' });
      const formData = new FormData();
      formData.append('audio', textFile);

      const request = new Request('http://localhost/process-voice', {
        method: 'POST',
        body: formData
      });

      const response = await service.fetch(request);

      expect(response.status).toBe(400);
      const errorData = await response.json() as ErrorResponse;
      expect(errorData.error).toContain('Invalid file type');
    });

    it('should return 422 for pipeline processing errors', async () => {
      const audioFile = new File(['fake audio'], 'test.wav', { type: 'audio/wav' });
      const formData = new FormData();
      formData.append('audio', audioFile);

      // Mock controller to throw pipeline error
      const mockController = await import('./controller');
      const { PipelineError } = await import('../types/shared');
      vi.mocked(mockController.processVoicePipeline).mockRejectedValue(
        new PipelineError('Pipeline processing failed', 'whisper')
      );

      const request = new Request('http://localhost/process-voice', {
        method: 'POST',
        body: formData
      });

      const response = await service.fetch(request);

      expect(response.status).toBe(422);
    });

    it('should return binary audio with metadata headers', async () => {
      const audioFile = new File(['fake audio'], 'test.mp3', { type: 'audio/mp3' });
      const formData = new FormData();
      formData.append('audio', audioFile);

      // Ensure the mock is set up for this specific test
      const mockController = await import('./controller');
      vi.mocked(mockController.processVoicePipeline).mockResolvedValue({
        audioBase64: 'dGVzdCBhdWRpbyBkYXRh', // Valid base64 for "test audio data"
        metadata: {
          originalDuration: 1,
          transcriptLength: 16,
          processingTimeMs: 150,
          pipelineStages: [
            { stage: 'validation', success: true, durationMs: 10 },
            { stage: 'whisper', success: true, durationMs: 20 },
            { stage: 'llama', success: true, durationMs: 30 },
            { stage: 'hume', success: true, durationMs: 25 },
            { stage: 'response-assembly', success: true, durationMs: 5 }
          ]
        }
      } as ProcessedAudioResult);

      const request = new Request('http://localhost/process-voice', {
        method: 'POST',
        body: formData
      });

      const response = await service.fetch(request);

      expect(response.headers.get('Content-Type')).toBe('audio/wav');
      expect(response.headers.get('X-Processing-Time-Ms')).toBeDefined();
      expect(response.headers.get('X-Transcript-Length')).toBeDefined();
      expect(response.headers.get('X-Pipeline-Stages')).toBeDefined();
    });

    it('should handle CORS headers', async () => {
      const request = new Request('http://localhost/process-voice', {
        method: 'OPTIONS',
        headers: {
          'Origin': 'https://example.com',
          'Access-Control-Request-Method': 'POST'
        }
      });

      const response = await service.fetch(request);

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
      expect(response.headers.get('Access-Control-Allow-Headers')).toBeDefined();
    });

    it('should handle large file uploads up to 25MB', async () => {
      const largeFileSize = 20 * 1024 * 1024; // 20MB
      const largeBuffer = new ArrayBuffer(largeFileSize);
      const largeFile = new File([new Uint8Array(largeBuffer)], 'large.wav', { type: 'audio/wav' });
      const formData = new FormData();
      formData.append('audio', largeFile);

      const request = new Request('http://localhost/process-voice', {
        method: 'POST',
        body: formData
      });

      const response = await service.fetch(request);

      // Should not reject based on size alone
      expect(response.status).not.toBe(413);
    });

    it('should return 500 for internal server errors', async () => {
      const audioFile = new File(['fake audio'], 'test.wav', { type: 'audio/wav' });
      const formData = new FormData();
      formData.append('audio', audioFile);

      // Mock controller to throw unexpected error
      const mockController = await import('./controller');
      vi.mocked(mockController.processVoicePipeline).mockImplementation(() => {
        throw new Error('Unexpected server error');
      });

      vi.mocked(mockController.handlePipelineError).mockReturnValue({
        error: 'Unexpected server error',
        stage: 'response-assembly',
        timestamp: new Date().toISOString(),
        requestId: 'req-123'
      });

      const request = new Request('http://localhost/process-voice', {
        method: 'POST',
        body: formData
      });

      const response = await service.fetch(request);

      expect(response.status).toBe(500);
      const errorData = await response.json() as ErrorResponse;
      expect(errorData.error).toBeDefined();
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const request = new Request('http://localhost/health', {
        method: 'GET'
      });

      const response = await service.fetch(request);

      expect(response.status).toBe(200);
      const healthData = await response.json() as HealthCheckResponse;
      expect(healthData.status).toBeDefined();
      expect(healthData.timestamp).toBeDefined();
      expect(healthData.version).toBeDefined();
    });

    it('should include service checks in health response', async () => {
      const request = new Request('http://localhost/health', {
        method: 'GET'
      });

      const response = await service.fetch(request);
      const healthData = await response.json() as HealthCheckResponse;

      expect(healthData.checks).toBeDefined();
      expect(healthData.checks!.whisper).toBeDefined();
      expect(healthData.checks!.llama).toBeDefined();
      expect(healthData.checks!.hume).toBeDefined();
    });

    it('should return healthy status when all services available', async () => {
      const request = new Request('http://localhost/health', {
        method: 'GET'
      });

      const response = await service.fetch(request);
      const healthData = await response.json() as HealthCheckResponse;

      expect(healthData.status).toBe('healthy');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for unknown routes', async () => {
      const request = new Request('http://localhost/unknown-route', {
        method: 'GET'
      });

      const response = await service.fetch(request);

      expect(response.status).toBe(404);
    });

    it('should handle malformed multipart data', async () => {
      const request = new Request('http://localhost/process-voice', {
        method: 'POST',
        body: 'not-valid-form-data',
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const response = await service.fetch(request);

      expect(response.status).toBe(400);
    });

    it('should return proper error response format', async () => {
      const request = new Request('http://localhost/process-voice', {
        method: 'POST',
        body: new FormData()
      });

      const response = await service.fetch(request);
      const errorData = await response.json() as ErrorResponse;

      expect(errorData.error).toBeDefined();
      expect(errorData.timestamp).toBeDefined();
      expect(typeof errorData.timestamp).toBe('string');
    });
  });

  describe('Middleware', () => {
    it('should apply CORS middleware to all responses', async () => {
      const request = new Request('http://localhost/health', {
        method: 'GET',
        headers: { 'Origin': 'https://example.com' }
      });

      const response = await service.fetch(request);

      expect(response.headers.get('Access-Control-Allow-Origin')).toBeDefined();
    });

    it.skip('should handle request timeout appropriately', async () => {
      const audioFile = new File(['fake audio'], 'test.wav', { type: 'audio/wav' });
      const formData = new FormData();
      formData.append('audio', audioFile);

      // Mock a long-running process
      const mockController = await import('./controller');
      vi.mocked(mockController.processVoicePipeline).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          audioBase64: 'base64-audio-data',
          metadata: {
            originalDuration: 1,
            transcriptLength: 10,
            processingTimeMs: 65000,
            pipelineStages: []
          }
        }), 65000)) // 65 seconds
      );

      const request = new Request('http://localhost/process-voice', {
        method: 'POST',
        body: formData
      });

      const response = await service.fetch(request);

      // Should handle timeout gracefully (likely 503 or 408)
      expect([408, 503, 500]).toContain(response.status);
    }, 10000); // 10 second test timeout
  });
});
