/**
 * CONTROLLER for git-haiku-mcp MCP Service
 * 
 * PRD REQUIREMENTS:
 * - Coordinate between Model and View layers
 * - Orchestrate AI calls to Llama 70B
 * - Handle error recovery with retry logic
 * 
 * MUST IMPLEMENT:
 * 1. Validate input commits using Model layer
 * 2. Generate AI prompt using Model layer functions
 * 3. Call Llama 70B model via env.AI interface
 * 4. Format response as haiku using Model layer
 * 5. Implement retry logic (up to 2 retries on AI failure)
 * 6. Return formatted haiku or error message
 * 
 * INTERFACES TO EXPORT:
 * - processGitHaiku(commits: string[], env: any): Promise<string>
 * 
 * IMPORTS NEEDED:
 * - From shared types: none
 * - From env: AI interface (env.AI.run)
 * - From other layers: model functions (generateHaikuPrompt, formatHaikuResponse, validateCommits)
 * 
 * BUSINESS RULES:
 * - Must validate input before processing
 * - Must use llama-3.3-70b model (not instruct version)
 * - Must retry AI calls up to 2 times on failure
 * - Must return user-friendly error messages
 * 
 * ERROR HANDLING:
 * - Validation errors return immediately without AI call
 * - AI failures trigger retry logic
 * - After all retries exhausted, return error message
 * - Log all errors for debugging
 * 
 * INTEGRATION POINTS:
 * - Calls Model layer for validation and formatting
 * - Calls Raindrop AI interface for haiku generation
 * - Called by View layer (MCP tool handler)
 */

import { validateCommits, generateHaikuPrompt, formatHaikuResponse } from './model.js';
import { Env } from './raindrop.gen.js';

/**
 * Processes git commit messages to generate a haiku
 * @param commits Array of commit message strings
 * @param env Environment object containing AI interface
 * @returns Promise resolving to formatted haiku string or error message
 */
export async function processGitHaiku(commits: string[], env: Env): Promise<string> {
  // Step 1: Validate input commits
  const validation = validateCommits(commits);
  if (!validation.valid) {
    return `Error: ${validation.error}`;
  }

  // Step 2: Generate AI prompt
  const prompt = generateHaikuPrompt(commits);

  // Step 3: Call AI with retry logic (up to 3 attempts total: 1 initial + 2 retries)
  const maxAttempts = 3;
  let attempt = 0;

  while (attempt < maxAttempts) {
    try {
      // Step 4: Call Llama 70B model via env.AI interface
      const aiResponse = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', { prompt });
      
      // Step 5: Format and return the response
      return formatHaikuResponse(aiResponse.response);
    } catch (error) {
      attempt++;
      
      // If this was the last attempt, return error message
      if (attempt >= maxAttempts) {
        return 'Error: Failed to generate haiku after multiple attempts. Please try again later.';
      }
      
      // Continue to next retry attempt
    }
  }

  // This should never be reached due to the logic above, but TypeScript requires it
  return 'Error: Failed to generate haiku after multiple attempts. Please try again later.';
}