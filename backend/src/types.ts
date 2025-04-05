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
  input: {
    content?: string;
    config?: any;
    sourceType?: string;
  };
  data?: {
    documentationOutput?: string;
    content?: string;
    config?: any;
  };
  startTime: number;
}

export interface ActionPlan {
  steps: ActionStep[];
  dependencies: string[];
  priority: number;
}

export interface ActionStep {
  action: string;
  description: string;
  parameters: Record<string, any>;
}

export interface ExecutionResult {
  success: boolean;
  output: any;
  error?: string;
  metrics: {
    researchIterations: number;
    totalTokens: number;
    processingTime: number;
    reasoningEffort: number;
    model: string;
  };
} 