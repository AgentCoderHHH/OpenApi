import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { PromptEngineeringAgent } from '../PromptEngineeringAgent';
import { IPrompt, IResponse, Configuration } from '../PromptEngineeringAgent';

interface Tool {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

interface CallToolResult {
  success: boolean;
  result?: any;
  error?: string;
}

export class PromptEngineeringServer extends EventEmitter {
  private agent: PromptEngineeringAgent;
  private isConnected: boolean = false;
  private tools: Tool[] = [];

  constructor(config: Configuration) {
    super();
    this.agent = new PromptEngineeringAgent(config);
    this.initializeTools();
  }

  private initializeTools() {
    this.tools = [
      {
        name: 'addPrompt',
        description: 'Add a new prompt template to the agent',
        parameters: {
          template: 'string',
          context: 'object',
          parameters: 'object',
          metadata: 'object?'
        }
      },
      {
        name: 'processPrompt',
        description: 'Process a prompt with given parameters',
        parameters: {
          promptId: 'string',
          parameters: 'object?'
        }
      },
      {
        name: 'recordResponse',
        description: 'Record a response from an AI model',
        parameters: {
          promptId: 'string',
          response: 'string',
          metadata: 'object?'
        }
      },
      {
        name: 'getPromptMetrics',
        description: 'Get performance metrics for a prompt',
        parameters: {
          promptId: 'string'
        }
      },
      {
        name: 'optimizePrompt',
        description: 'Optimize a prompt based on the current strategy',
        parameters: {
          promptId: 'string'
        }
      }
    ];
  }

  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }
    this.isConnected = true;
    this.emit('connected');
  }

  async cleanup(): Promise<void> {
    if (!this.isConnected) {
      return;
    }
    this.isConnected = false;
    this.emit('disconnected');
  }

  async listTools(): Promise<Tool[]> {
    return this.tools;
  }

  async callTool(toolName: string, arguments_: Record<string, any> | null): Promise<CallToolResult> {
    if (!this.isConnected) {
      return {
        success: false,
        error: 'Server not connected'
      };
    }

    try {
      let result: any;

      switch (toolName) {
        case 'addPrompt':
          result = this.agent.addPrompt(arguments_ as Omit<IPrompt, 'id'>);
          break;
        case 'processPrompt':
          result = this.agent.processPrompt(
            arguments_?.promptId as string,
            arguments_?.parameters as Record<string, any>
          );
          break;
        case 'recordResponse':
          result = this.agent.recordResponse(
            arguments_?.promptId as string,
            arguments_?.response as string,
            arguments_?.metadata as Record<string, any>
          );
          break;
        case 'getPromptMetrics':
          result = this.agent.getPromptMetrics(arguments_?.promptId as string);
          break;
        case 'optimizePrompt':
          result = this.agent.optimizePrompt(arguments_?.promptId as string);
          break;
        default:
          return {
            success: false,
            error: `Unknown tool: ${toolName}`
          };
      }

      return {
        success: true,
        result
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  invalidateToolsCache(): void {
    this.initializeTools();
  }
} 