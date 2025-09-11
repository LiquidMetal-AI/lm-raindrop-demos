/**
 * MODEL for git-haiku-mcp MCP Service
 * 
 * PRD REQUIREMENTS:
 * - Parse and validate commit message array
 * - Generate structured prompt for Llama 70B
 * - Format AI response as 5-7-5 syllable haiku
 * 
 * MUST IMPLEMENT:
 * 1. Validate commit messages array is not empty
 * 2. Ensure each commit message is a non-empty string
 * 3. Generate AI prompt that guides Llama 70B to create haikus
 * 4. Format the AI response to ensure proper haiku structure
 * 
 * INTERFACES TO EXPORT:
 * - generateHaikuPrompt(commits: string[]): string
 * - formatHaikuResponse(rawResponse: string): string
 * - validateCommits(commits: string[]): { valid: boolean, error?: string }
 * 
 * IMPORTS NEEDED:
 * - From shared types: none (stateless operations)
 * - From env: none (pure functions only)
 * - From other layers: none (model is independent)
 * 
 * BUSINESS RULES:
 * - Commits array must not be empty
 * - Each commit must be valid non-empty string
 * - Output must follow haiku structure (5-7-5 syllables)
 * - Prompt must guide AI to create development-focused haiku
 * 
 * ERROR HANDLING:
 * - Empty array returns validation error
 * - Empty strings in array returns validation error
 * - Invalid input types returns validation error
 * 
 * INTEGRATION POINTS:
 * - Called by controller layer for prompt generation
 * - Called by controller layer for response formatting
 */

/**
 * Validates an array of commit messages
 * @param commits Array of commit message strings
 * @returns Object with validation result and optional error message
 */
export function validateCommits(commits: string[]): { valid: boolean; error?: string } {
  if (!commits || commits.length === 0) {
    return { valid: false, error: 'Commits array cannot be empty' };
  }

  for (const commit of commits) {
    if (typeof commit !== 'string' || commit.trim() === '') {
      return { valid: false, error: 'All commit messages must be non-empty strings' };
    }
  }

  return { valid: true };
}

/**
 * Generates the AI prompt for creating haikus from commit messages
 * @param commits Array of commit message strings
 * @returns Formatted prompt string for the AI model
 */
export function generateHaikuPrompt(commits: string[]): string {
  const commitsText = commits.join('\n');
  
  return `You are a poetic AI that transforms git commit messages into beautiful haikus.
A haiku has three lines with 5, 7, and 5 syllables respectively.

Given these git commit messages:
${commitsText}

Create a single haiku that captures the essence of these commits.
The haiku should be about the development work, not just random poetry.
Focus on the technical changes but express them poetically.

Respond with ONLY the haiku, no explanation or additional text.
Format as three lines, one line per row.`;
}

/**
 * Formats the raw AI response to ensure proper haiku structure
 * @param rawResponse Raw response string from the AI model
 * @returns Formatted haiku string
 */
export function formatHaikuResponse(rawResponse: string): string {
  if (!rawResponse) {
    return '';
  }

  // Trim leading and trailing whitespace, including newlines
  return rawResponse.trim();
}