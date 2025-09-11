/**
 * Test suite for model.ts
 * Tests all model layer functions following TDD approach
 */

import { describe, test, expect } from 'vitest';
import { validateCommits, generateHaikuPrompt, formatHaikuResponse } from './model.js';

// Test validateCommits function
describe('validateCommits', () => {
  test('should return valid=true for non-empty array of strings', () => {
    const commits = ['feat: add login functionality', 'fix: resolve auth bug'];
    const result = validateCommits(commits);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  test('should return valid=false for empty array', () => {
    const commits: string[] = [];
    const result = validateCommits(commits);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Commits array cannot be empty');
  });

  test('should return valid=false for array with empty strings', () => {
    const commits = ['feat: add login', '', 'fix: bug'];
    const result = validateCommits(commits);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('All commit messages must be non-empty strings');
  });

  test('should return valid=false for array with non-string elements', () => {
    const commits = ['feat: add login', null as any, 'fix: bug'];
    const result = validateCommits(commits);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('All commit messages must be non-empty strings');
  });

  test('should return valid=false for array with whitespace-only strings', () => {
    const commits = ['feat: add login', '   ', 'fix: bug'];
    const result = validateCommits(commits);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('All commit messages must be non-empty strings');
  });

  test('should return valid=true for single commit', () => {
    const commits = ['feat: implement user authentication'];
    const result = validateCommits(commits);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });
});

// Test generateHaikuPrompt function
describe('generateHaikuPrompt', () => {
  test('should generate correct prompt with single commit', () => {
    const commits = ['feat: add login functionality'];
    const result = generateHaikuPrompt(commits);
    
    expect(result).toContain('You are a poetic AI that transforms git commit messages into beautiful haikus.');
    expect(result).toContain('A haiku has three lines with 5, 7, and 5 syllables respectively.');
    expect(result).toContain('Given these git commit messages:');
    expect(result).toContain('feat: add login functionality');
    expect(result).toContain('Create a single haiku that captures the essence of these commits.');
    expect(result).toContain('The haiku should be about the development work, not just random poetry.');
    expect(result).toContain('Focus on the technical changes but express them poetically.');
    expect(result).toContain('Respond with ONLY the haiku, no explanation or additional text.');
    expect(result).toContain('Format as three lines, one line per row.');
  });

  test('should generate correct prompt with multiple commits', () => {
    const commits = [
      'feat: add login functionality', 
      'fix: resolve authentication bug',
      'docs: update API documentation'
    ];
    const result = generateHaikuPrompt(commits);
    
    expect(result).toContain('feat: add login functionality');
    expect(result).toContain('fix: resolve authentication bug');
    expect(result).toContain('docs: update API documentation');
    expect(result.includes('[COMMIT_MESSAGES]')).toBe(false);
  });

  test('should replace [COMMIT_MESSAGES] placeholder', () => {
    const commits = ['test: add unit tests'];
    const result = generateHaikuPrompt(commits);
    
    expect(result.includes('[COMMIT_MESSAGES]')).toBe(false);
    expect(result).toContain('test: add unit tests');
  });
});

// Test formatHaikuResponse function
describe('formatHaikuResponse', () => {
  test('should return clean haiku with proper formatting', () => {
    const rawResponse = `Code flows like water
Through functions and classes deep
Bug fixes bring peace`;
    
    const result = formatHaikuResponse(rawResponse);
    expect(result).toBe(`Code flows like water
Through functions and classes deep
Bug fixes bring peace`);
  });

  test('should trim whitespace from response', () => {
    const rawResponse = `   Code flows like water
Through functions and classes deep
Bug fixes bring peace   `;
    
    const result = formatHaikuResponse(rawResponse);
    expect(result).toBe(`Code flows like water
Through functions and classes deep
Bug fixes bring peace`);
  });

  test('should handle response with extra newlines', () => {
    const rawResponse = `\n\nCode flows like water\nThrough functions and classes deep\nBug fixes bring peace\n\n`;
    
    const result = formatHaikuResponse(rawResponse);
    expect(result).toBe(`Code flows like water
Through functions and classes deep
Bug fixes bring peace`);
  });

  test('should handle single line response by returning as-is', () => {
    const rawResponse = 'Code flows like water Through functions and classes deep Bug fixes bring peace';
    
    const result = formatHaikuResponse(rawResponse);
    expect(result).toBe('Code flows like water Through functions and classes deep Bug fixes bring peace');
  });

  test('should handle empty response', () => {
    const rawResponse = '';
    
    const result = formatHaikuResponse(rawResponse);
    expect(result).toBe('');
  });

  test('should preserve internal formatting of haiku lines', () => {
    const rawResponse = `Code flows   like water
Through functions and   classes deep
Bug fixes    bring peace`;
    
    const result = formatHaikuResponse(rawResponse);
    expect(result).toBe(`Code flows   like water
Through functions and   classes deep
Bug fixes    bring peace`);
  });
});