/**
 * Test suite for controller.ts
 * Tests the controller orchestration logic and error handling
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { processGitHaiku } from './controller.js';
import * as model from './model.js';

// Mock the model functions
vi.mock('./model.js', () => ({
  validateCommits: vi.fn(),
  generateHaikuPrompt: vi.fn(),
  formatHaikuResponse: vi.fn()
}));

const mockedModel = vi.mocked(model);

// Mock environment interface
interface MockEnv {
  AI: {
    run: ReturnType<typeof vi.fn>;
  };
}

describe('processGitHaiku', () => {
  let mockEnv: MockEnv;

  beforeEach(() => {
    mockEnv = {
      AI: {
        run: vi.fn()
      }
    };
    vi.clearAllMocks();
  });

  test('should return error message for invalid commits', async () => {
    const commits: string[] = [];
    mockedModel.validateCommits.mockReturnValue({ 
      valid: false, 
      error: 'Commits array cannot be empty' 
    });

    const result = await processGitHaiku(commits, mockEnv as any);
    
    expect(result).toBe('Error: Commits array cannot be empty');
    expect(mockEnv.AI.run).not.toHaveBeenCalled();
    expect(mockedModel.validateCommits).toHaveBeenCalledWith(commits);
  });

  test('should successfully process valid commits', async () => {
    const commits = ['feat: add login', 'fix: auth bug'];
    const prompt = 'Generated haiku prompt';
    const aiResponse = 'Raw AI response';
    const formattedHaiku = 'Formatted haiku\nThree lines of poetry\nCode becomes art now';

    mockedModel.validateCommits.mockReturnValue({ valid: true });
    mockedModel.generateHaikuPrompt.mockReturnValue(prompt);
    mockEnv.AI.run.mockResolvedValue({ response: aiResponse });
    mockedModel.formatHaikuResponse.mockReturnValue(formattedHaiku);

    const result = await processGitHaiku(commits, mockEnv as any);

    expect(result).toBe(formattedHaiku);
    expect(mockedModel.validateCommits).toHaveBeenCalledWith(commits);
    expect(mockedModel.generateHaikuPrompt).toHaveBeenCalledWith(commits);
    expect(mockEnv.AI.run).toHaveBeenCalledWith('@cf/meta/llama-3.3-70b-instruct-fp8-fast', { prompt });
    expect(mockedModel.formatHaikuResponse).toHaveBeenCalledWith(aiResponse);
  });

  test('should use correct AI model (@cf/meta/llama-3.3-70b-instruct-fp8-fast)', async () => {
    const commits = ['feat: add feature'];
    const prompt = 'Test prompt';

    mockedModel.validateCommits.mockReturnValue({ valid: true });
    mockedModel.generateHaikuPrompt.mockReturnValue(prompt);
    mockEnv.AI.run.mockResolvedValue({ response: 'AI response' });
    mockedModel.formatHaikuResponse.mockReturnValue('Formatted haiku');

    await processGitHaiku(commits, mockEnv as any);

    expect(mockEnv.AI.run).toHaveBeenCalledWith('@cf/meta/llama-3.3-70b-instruct-fp8-fast', { prompt });
  });

  test('should retry on AI failure (first retry succeeds)', async () => {
    const commits = ['feat: add feature'];
    const prompt = 'Test prompt';
    const formattedHaiku = 'Success on retry';

    mockedModel.validateCommits.mockReturnValue({ valid: true });
    mockedModel.generateHaikuPrompt.mockReturnValue(prompt);
    mockEnv.AI.run
      .mockRejectedValueOnce(new Error('AI service temporarily unavailable'))
      .mockResolvedValue({ response: 'AI response on retry' });
    mockedModel.formatHaikuResponse.mockReturnValue(formattedHaiku);

    const result = await processGitHaiku(commits, mockEnv as any);

    expect(result).toBe(formattedHaiku);
    expect(mockEnv.AI.run).toHaveBeenCalledTimes(2);
  });

  test('should retry on AI failure (second retry succeeds)', async () => {
    const commits = ['feat: add feature'];
    const prompt = 'Test prompt';
    const formattedHaiku = 'Success on second retry';

    mockedModel.validateCommits.mockReturnValue({ valid: true });
    mockedModel.generateHaikuPrompt.mockReturnValue(prompt);
    mockEnv.AI.run
      .mockRejectedValueOnce(new Error('First failure'))
      .mockRejectedValueOnce(new Error('Second failure'))
      .mockResolvedValue({ response: 'AI response on third try' });
    mockedModel.formatHaikuResponse.mockReturnValue(formattedHaiku);

    const result = await processGitHaiku(commits, mockEnv as any);

    expect(result).toBe(formattedHaiku);
    expect(mockEnv.AI.run).toHaveBeenCalledTimes(3);
  });

  test('should return error after all retries exhausted', async () => {
    const commits = ['feat: add feature'];
    const prompt = 'Test prompt';

    mockedModel.validateCommits.mockReturnValue({ valid: true });
    mockedModel.generateHaikuPrompt.mockReturnValue(prompt);
    mockEnv.AI.run
      .mockRejectedValue(new Error('Persistent AI failure'))
      .mockRejectedValue(new Error('Persistent AI failure'))
      .mockRejectedValue(new Error('Persistent AI failure'));

    const result = await processGitHaiku(commits, mockEnv as any);

    expect(result).toBe('Error: Failed to generate haiku after multiple attempts. Please try again later.');
    expect(mockEnv.AI.run).toHaveBeenCalledTimes(3);
    expect(mockedModel.formatHaikuResponse).not.toHaveBeenCalled();
  });

  test('should handle AI returning empty response', async () => {
    const commits = ['feat: add feature'];
    const prompt = 'Test prompt';

    mockedModel.validateCommits.mockReturnValue({ valid: true });
    mockedModel.generateHaikuPrompt.mockReturnValue(prompt);
    mockEnv.AI.run.mockResolvedValue({ response: '' });
    mockedModel.formatHaikuResponse.mockReturnValue('');

    const result = await processGitHaiku(commits, mockEnv as any);

    expect(result).toBe('');
    expect(mockedModel.formatHaikuResponse).toHaveBeenCalledWith('');
  });

  test('should handle different types of AI errors', async () => {
    const commits = ['feat: add feature'];
    const prompt = 'Test prompt';

    mockedModel.validateCommits.mockReturnValue({ valid: true });
    mockedModel.generateHaikuPrompt.mockReturnValue(prompt);
    
    // Test with different error types
    mockEnv.AI.run
      .mockRejectedValueOnce(new Error('Network timeout'))
      .mockRejectedValueOnce('String error')
      .mockRejectedValueOnce({ message: 'Object error' });

    const result = await processGitHaiku(commits, mockEnv as any);

    expect(result).toBe('Error: Failed to generate haiku after multiple attempts. Please try again later.');
    expect(mockEnv.AI.run).toHaveBeenCalledTimes(3);
  });
});