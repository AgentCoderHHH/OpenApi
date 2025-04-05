export interface IAgent {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  learn(context: RunContext): Promise<void>;
  plan(context: RunContext): Promise<ActionPlan>;
  execute(context: RunContext, plan?: ActionPlan): Promise<ExecutionResult>;
}

export interface RunContext {
  input: string;
  config?: any;
  sourceType?: string;
  content?: string;
  startTime?: number;
}

export interface ActionStep {
  action: string;
  description: string;
  parameters: Record<string, any>;
}

export interface ActionPlan {
  steps: ActionStep[];
  dependencies?: string[];
  priority?: number;
}

export interface ExecutionMetrics {
  processingTime: number;
  reasoningEffort: number;
  researchIterations: number;
  totalTokens: number;
  model: string;
  error?: string;
}

export interface ExecutionResult {
  success: boolean;
  output: string;
  metrics: ExecutionMetrics;
} 