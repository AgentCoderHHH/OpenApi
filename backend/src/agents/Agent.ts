import { IAgent, RunContext, ActionPlan, ExecutionResult } from '../types';

export abstract class Agent implements IAgent {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  protected MODEL: string = 'gpt-4';

  constructor() {
    this.id = '';
    this.name = '';
    this.description = '';
    this.capabilities = [];
  }

  abstract learn(context: RunContext): Promise<void>;
  abstract plan(context: RunContext): Promise<ActionPlan>;
  abstract execute(context: RunContext, plan?: ActionPlan): Promise<ExecutionResult>;
} 