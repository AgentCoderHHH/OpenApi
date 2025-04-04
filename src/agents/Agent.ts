import { ExecutionResult } from '../types';

export abstract class Agent {
  protected readonly MODEL = 'gpt-4-turbo-2024-04-09';

  abstract execute(topic: string, reasoningEffort?: number): Promise<ExecutionResult>;
} 