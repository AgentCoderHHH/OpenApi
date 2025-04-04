/**
 * @file PromptEngineeringAgent.ts
 * @description A sophisticated agent for managing and optimizing AI prompts
 * @author AgentCoderHHH
 * @version 1.0.0
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

/**
 * Represents the structure of a prompt template
 */
export interface IPrompt {
  /** Unique identifier for the prompt */
  id: string;
  /** The prompt template with placeholder markers */
  template: string;
  /** Context data for the prompt */
  context: Record<string, any>;
  /** Parameters to be injected into the template */
  parameters: Record<string, any>;
  /** Optional metadata for the prompt */
  metadata?: {
    category?: string;
    tags?: string[];
    version?: string;
    created?: Date;
    modified?: Date;
  };
}

/**
 * Represents the structure of a response from an AI model
 */
export interface IResponse {
  /** Unique identifier for the response */
  id: string;
  /** Reference to the prompt that generated this response */
  promptId: string;
  /** The actual response content */
  response: string;
  /** Timestamp of when the response was received */
  timestamp: number;
  /** Optional metadata about the response */
  metadata?: {
    modelUsed?: string;
    tokensUsed?: number;
    processingTime?: number;
    confidence?: number;
  };
}

/**
 * Configuration options for the PromptEngineeringAgent
 */
export interface Configuration {
  /** Strategy to use for prompt optimization */
  optimizationStrategy: 'minimal' | 'balanced' | 'aggressive';
  /** How to manage context between prompts */
  contextManagement: 'isolated' | 'chained' | 'hierarchical';
  /** Whether to track prompt/response history */
  historyTracking: boolean;
  /** Whether to collect performance metrics */
  performanceMetrics: boolean;
  /** Maximum number of history items to keep */
  historyLimit?: number;
  /** Logging configuration */
  logging?: {
    level: 'error' | 'warn' | 'info' | 'debug';
    enabled: boolean;
  };
}

/**
 * Custom error class for PromptEngineeringAgent
 */
export class PromptEngineeringError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'PromptEngineeringError';
  }
}

/**
 * Main agent class for managing and optimizing prompts
 */
export class PromptEngineeringAgent extends EventEmitter {
  private prompts: Map<string, IPrompt> = new Map();
  private responses: Map<string, IResponse> = new Map();
  private configuration: Configuration;
  private history: Array<{ promptId: string, responseId: string }> = [];

  /**
   * Creates a new instance of PromptEngineeringAgent
   * @param configuration - Configuration options for the agent
   */
  constructor(configuration: Configuration) {
    super();
    this.configuration = {
      ...this.getDefaultConfiguration(),
      ...configuration
    };
    this.validateConfiguration();
  }

  /**
   * Gets the default configuration
   * @returns Default configuration object
   */
  private getDefaultConfiguration(): Configuration {
    return {
      optimizationStrategy: 'balanced',
      contextManagement: 'isolated',
      historyTracking: true,
      performanceMetrics: true,
      historyLimit: 1000,
      logging: {
        level: 'error',
        enabled: true
      }
    };
  }

  /**
   * Validates the current configuration
   * @throws {PromptEngineeringError} If configuration is invalid
   */
  private validateConfiguration(): void {
    const validOptimizationStrategies = ['minimal', 'balanced', 'aggressive'];
    const validContextManagement = ['isolated', 'chained', 'hierarchical'];

    if (!validOptimizationStrategies.includes(this.configuration.optimizationStrategy)) {
      throw new PromptEngineeringError(
        'Invalid optimization strategy',
        'CONFIG_ERROR',
        { valid: validOptimizationStrategies }
      );
    }

    if (!validContextManagement.includes(this.configuration.contextManagement)) {
      throw new PromptEngineeringError(
        'Invalid context management strategy',
        'CONFIG_ERROR',
        { valid: validContextManagement }
      );
    }
  }

  /**
   * Adds a new prompt to the agent
   * @param prompt - The prompt to add
   * @returns The ID of the added prompt
   */
  public addPrompt(prompt: Omit<IPrompt, 'id'>): string {
    const id = uuidv4();
    const newPrompt: IPrompt = {
      ...prompt,
      id,
      metadata: {
        ...prompt.metadata,
        created: new Date(),
        modified: new Date()
      }
    };

    this.prompts.set(id, newPrompt);
    this.emit('promptAdded', newPrompt);
    return id;
  }

  /**
   * Updates an existing prompt
   * @param id - ID of the prompt to update
   * @param newPrompt - New prompt data
   * @throws {PromptEngineeringError} If prompt doesn't exist
   */
  public updatePrompt(id: string, newPrompt: Partial<IPrompt>): void {
    const existingPrompt = this.prompts.get(id);
    if (!existingPrompt) {
      throw new PromptEngineeringError(
        `Prompt with ID ${id} not found`,
        'NOT_FOUND'
      );
    }

    const updatedPrompt: IPrompt = {
      ...existingPrompt,
      ...newPrompt,
      id,
      metadata: {
        ...existingPrompt.metadata,
        ...newPrompt.metadata,
        modified: new Date()
      }
    };

    this.prompts.set(id, updatedPrompt);
    this.emit('promptUpdated', updatedPrompt);
  }

  /**
   * Processes a prompt with given parameters
   * @param promptId - ID of the prompt to process
   * @param parameters - Parameters to use in processing
   * @returns Processed prompt string
   */
  public processPrompt(promptId: string, parameters?: Record<string, any>): string {
    const prompt = this.prompts.get(promptId);
    if (!prompt) {
      throw new PromptEngineeringError(
        `Prompt with ID ${promptId} not found`,
        'NOT_FOUND'
      );
    }

    let processedPrompt = prompt.template;
    const mergedParams = { ...prompt.parameters, ...parameters };

    // Replace all parameters in the template
    Object.entries(mergedParams).forEach(([key, value]) => {
      const regex = new RegExp(`{${key}}`, 'g');
      processedPrompt = processedPrompt.replace(regex, String(value));
    });

    return processedPrompt;
  }

  /**
   * Records a response from an AI model
   * @param promptId - ID of the prompt that generated the response
   * @param response - The response content
   * @param metadata - Optional metadata about the response
   * @returns The ID of the recorded response
   */
  public recordResponse(
    promptId: string,
    response: string,
    metadata?: IResponse['metadata']
  ): string {
    const id = uuidv4();
    const newResponse: IResponse = {
      id,
      promptId,
      response,
      timestamp: Date.now(),
      metadata
    };

    this.responses.set(id, newResponse);
    
    if (this.configuration.historyTracking) {
      this.history.push({ promptId, responseId: id });
      if (this.configuration.historyLimit && this.history.length > this.configuration.historyLimit) {
        this.history.shift();
      }
    }

    this.emit('responseRecorded', newResponse);
    return id;
  }

  /**
   * Gets the history of prompt-response pairs
   * @param limit - Optional limit on number of items to return
   * @returns Array of prompt-response pairs
   */
  public getHistory(limit?: number): Array<{
    prompt: IPrompt,
    response: IResponse
  }> {
    const history = this.history
      .map(item => ({
        prompt: this.prompts.get(item.promptId)!,
        response: this.responses.get(item.responseId)!
      }))
      .filter(item => item.prompt && item.response);

    return limit ? history.slice(-limit) : history;
  }

  /**
   * Updates the agent's configuration
   * @param newConfiguration - New configuration options
   */
  public updateConfiguration(newConfiguration: Partial<Configuration>): void {
    this.configuration = {
      ...this.configuration,
      ...newConfiguration
    };
    this.validateConfiguration();
    this.emit('configurationUpdated', this.configuration);
  }

  /**
   * Optimizes a prompt based on the current optimization strategy
   * @param promptId - ID of the prompt to optimize
   * @returns Optimized prompt template
   */
  public optimizePrompt(promptId: string): string {
    const prompt = this.prompts.get(promptId);
    if (!prompt) {
      throw new PromptEngineeringError(
        `Prompt with ID ${promptId} not found`,
        'NOT_FOUND'
      );
    }

    let optimizedTemplate = prompt.template;
    
    switch (this.configuration.optimizationStrategy) {
      case 'minimal':
        // Basic cleanup
        optimizedTemplate = optimizedTemplate.trim().replace(/\s+/g, ' ');
        break;
      
      case 'balanced':
        // More sophisticated optimization
        optimizedTemplate = this.balancedOptimization(optimizedTemplate);
        break;
      
      case 'aggressive':
        // Advanced optimization
        optimizedTemplate = this.aggressiveOptimization(optimizedTemplate);
        break;
    }

    return optimizedTemplate;
  }

  /**
   * Performs balanced optimization on a prompt template
   * @param template - Template to optimize
   * @returns Optimized template
   */
  private balancedOptimization(template: string): string {
    // Remove unnecessary whitespace
    let optimized = template.trim().replace(/\s+/g, ' ');
    
    // Remove redundant punctuation
    optimized = optimized.replace(/([.!?])\1+/g, '$1');
    
    // Ensure proper spacing around special characters
    optimized = optimized.replace(/([.!?])\s*/g, '$1 ');
    
    return optimized;
  }

  /**
   * Performs aggressive optimization on a prompt template
   * @param template - Template to optimize
   * @returns Optimized template
   */
  private aggressiveOptimization(template: string): string {
    // Start with balanced optimization
    let optimized = this.balancedOptimization(template);
    
    // Remove filler words
    const fillerWords = ['just', 'very', 'quite', 'basically', 'actually'];
    fillerWords.forEach(word => {
      optimized = optimized.replace(new RegExp(`\\b${word}\\b`, 'gi'), '');
    });
    
    // Compress multiple spaces
    optimized = optimized.replace(/\s+/g, ' ').trim();
    
    return optimized;
  }

  /**
   * Gets performance metrics for a prompt
   * @param promptId - ID of the prompt to analyze
   * @returns Performance metrics
   */
  public getPromptMetrics(promptId: string): {
    usageCount: number;
    averageResponseTime: number;
    successRate: number;
  } {
    if (!this.configuration.performanceMetrics) {
      throw new PromptEngineeringError(
        'Performance metrics are disabled',
        'METRICS_DISABLED'
      );
    }

    const responses = Array.from(this.responses.values())
      .filter(r => r.promptId === promptId);

    if (responses.length === 0) {
      return {
        usageCount: 0,
        averageResponseTime: 0,
        successRate: 0
      };
    }

    const responseTimes = responses
      .filter(r => r.metadata?.processingTime)
      .map(r => r.metadata!.processingTime!);

    return {
      usageCount: responses.length,
      averageResponseTime: responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0,
      successRate: responses.filter(r => r.metadata?.confidence && r.metadata.confidence > 0.5).length / responses.length
    };
  }
}

// Example usage:
/*
const agent = new PromptEngineeringAgent({
  optimizationStrategy: 'balanced',
  contextManagement: 'isolated',
  historyTracking: true,
  performanceMetrics: true
});

const promptId = agent.addPrompt({
  template: "Hello, {name}! How can I help you with {topic}?",
  context: {},
  parameters: {
    name: "default",
    topic: "general questions"
  }
});

const processedPrompt = agent.processPrompt(promptId, {
  name: "John",
  topic: "programming"
});

const responseId = agent.recordResponse(
  promptId,
  "I can help you with programming questions.",
  {
    modelUsed: "gpt-4",
    tokensUsed: 10,
    processingTime: 100,
    confidence: 0.95
  }
);

const metrics = agent.getPromptMetrics(promptId);
*/ 