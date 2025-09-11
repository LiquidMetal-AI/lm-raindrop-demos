/**
 * VIEW for git-haiku-mcp MCP Service
 * 
 * PRD REQUIREMENTS:
 * - Expose MCP tool interface for AI model access
 * - Handle git-haiku tool registration
 * - Validate input parameters
 * - Return formatted responses
 * 
 * MUST IMPLEMENT:
 * 1. Register git-haiku tool with MCP server
 * 2. Define input schema for commits array parameter
 * 3. Validate commits parameter is array of strings
 * 4. Call controller layer to process haiku generation
 * 5. Return formatted MCP response with haiku text
 * 6. Handle errors with appropriate error messages
 * 
 * INTERFACES TO EXPORT:
 * - MCP tool registration callback (implemented in default export)
 * 
 * IMPORTS NEEDED:
 * - From shared types: none
 * - From env: passed as parameter
 * - From other layers: controller (processGitHaiku)
 * 
 * BUSINESS RULES:
 * - Tool name must be "git-haiku"
 * - Description must clearly explain tool purpose
 * - Input must be validated as array of strings
 * - Empty arrays must be rejected
 * 
 * ERROR HANDLING:
 * - Invalid input type returns error message
 * - Empty commits array returns error message
 * - Controller errors are passed through to user
 * 
 * INTEGRATION POINTS:
 * - Registers with MCP server
 * - Calls controller layer for processing
 * - Returns MCP-compliant responses
 */

import { ActorState } from "@liquidmetal-ai/raindrop-framework";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Env } from './raindrop.gen.js';
import { processGitHaiku } from './controller.js';

export const implementation = {
  name: "git-haiku-mcp",
  version: "1.0.0",
}

export default (server: McpServer, env: Env, state: ActorState) => {
  // Register git-haiku tool
  server.registerTool("git-haiku",
    {
      title: "Git Haiku Generator",
      description: "Transform git commit messages into beautiful haikus that capture the essence of development work",
      inputSchema: {
        commits: z.array(z.string()).min(1),
      },
    },
    async ({ commits }: { commits: string[] }) => {
      try {
        const haiku = await processGitHaiku(commits, env);
        return { content: [{ type: "text", text: haiku }] };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        throw new Error(errorMessage);
      }
    });
}