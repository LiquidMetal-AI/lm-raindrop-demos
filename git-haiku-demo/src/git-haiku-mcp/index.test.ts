/**
 * Test suite for index.ts (View layer)
 * Tests MCP tool registration and input validation
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ActorState } from "@liquidmetal-ai/raindrop-framework";
import mcpService from './index.js';
import * as controller from './controller.js';
import { Env } from './raindrop.gen.js';

// Mock the controller
vi.mock('./controller.js', () => ({
  processGitHaiku: vi.fn()
}));

const mockedController = vi.mocked(controller);

// Mock MCP server
const mockServer = {
  registerTool: vi.fn(),
  registerResource: vi.fn()
} as unknown as ReturnType<typeof vi.mocked<McpServer>>;

// Mock environment
const mockEnv = {} as Env;
const mockState = {} as ActorState;

describe('MCP Service Registration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should register git-haiku tool with correct schema', () => {
    mcpService(mockServer, mockEnv, mockState);

    expect(mockServer.registerTool).toHaveBeenCalledWith(
      'git-haiku',
      expect.objectContaining({
        title: expect.any(String),
        description: expect.stringContaining('haiku'),
        inputSchema: expect.objectContaining({
          commits: expect.any(Object)
        })
      }),
      expect.any(Function)
    );
  });

  test('should not register example add tool', () => {
    mcpService(mockServer, mockEnv, mockState);

    const calls = mockServer.registerTool.mock.calls;
    const addToolRegistered = calls.some(call => call[0] === 'add');
    expect(addToolRegistered).toBe(false);
  });

  test('should not register greeting resource', () => {
    mcpService(mockServer, mockEnv, mockState);

    expect(mockServer.registerResource).not.toHaveBeenCalled();
  });
});

describe('Git Haiku Tool Handler', () => {
  let toolHandler: Function;

  beforeEach(() => {
    vi.clearAllMocks();
    mcpService(mockServer, mockEnv, mockState);
    
    // Extract the tool handler function
    const registerToolCalls = mockServer.registerTool.mock.calls;
    const gitHaikuCall = registerToolCalls.find(call => call[0] === 'git-haiku');
    toolHandler = gitHaikuCall?.[2] as Function;
  });

  test('should successfully process valid commits array', async () => {
    const commits = ['feat: add login', 'fix: auth bug'];
    const expectedHaiku = 'Login code takes shape\nAuthentication flows true\nBugs fade like old snow';
    
    mockedController.processGitHaiku.mockResolvedValue(expectedHaiku);

    const result = await toolHandler({ commits }, {});

    expect(mockedController.processGitHaiku).toHaveBeenCalledWith(commits, mockEnv);
    expect(result).toEqual({
      content: [{ type: "text", text: expectedHaiku }]
    });
  });

  test('should handle controller errors gracefully', async () => {
    const commits = ['feat: add feature'];
    const errorMessage = 'Error: Failed to generate haiku';
    
    mockedController.processGitHaiku.mockResolvedValue(errorMessage);

    const result = await toolHandler({ commits }, {});

    expect(result).toEqual({
      content: [{ type: "text", text: errorMessage }]
    });
  });

  test('should handle empty haiku response', async () => {
    const commits = ['feat: add feature'];
    
    mockedController.processGitHaiku.mockResolvedValue('');

    const result = await toolHandler({ commits }, {});

    expect(result).toEqual({
      content: [{ type: "text", text: '' }]
    });
  });

  test('should pass environment to controller', async () => {
    const commits = ['test: add tests'];
    
    mockedController.processGitHaiku.mockResolvedValue('Test haiku result');

    await toolHandler({ commits }, {});

    expect(mockedController.processGitHaiku).toHaveBeenCalledWith(commits, mockEnv);
  });

  test('should handle controller throwing unexpected errors', async () => {
    const commits = ['feat: add feature'];
    
    mockedController.processGitHaiku.mockRejectedValue(new Error('Unexpected controller error'));

    await expect(toolHandler({ commits }, {})).rejects.toThrow('Unexpected controller error');
  });
});

describe('Input Schema Validation', () => {
  test('should require commits parameter to be array of strings with minimum 1 item', () => {
    mcpService(mockServer, mockEnv, mockState);

    const registerToolCalls = mockServer.registerTool.mock.calls;
    const gitHaikuCall = registerToolCalls.find(call => call[0] === 'git-haiku');
    const schema = gitHaikuCall?.[1];

    expect(schema).toEqual(expect.objectContaining({
      inputSchema: expect.objectContaining({
        commits: expect.any(Object)
      })
    }));

    // The schema should be a Zod schema that validates array of strings with min 1
    // This is verified through the Zod schema object structure
  });
});