export interface RunContext {
    input: any;
    startTime: number;
}

export interface ActionPlan {
    steps: ActionStep[];
}

export interface ActionStep {
    action: string;
    description: string;
    parameters: Record<string, any>;
}

export interface ExecutionResult {
    success: boolean;
    output?: string;
    error?: string;
    metrics: {
        researchIterations: number;
        totalTokens: number;
        processingTime: number;
        reasoningEffort: number;
        model: string;
    };
}

export interface IAgent {
    id: string;
    name: string;
    description: string;
    capabilities: string[];
    learn(context: RunContext): Promise<void>;
    plan(context: RunContext): Promise<ActionPlan>;
    execute(context: RunContext, plan: ActionPlan): Promise<ExecutionResult>;
}

export interface ReasoningResponse {
    status: 'complete' | 'incomplete';
    output_text: string;
    usage: {
        output_tokens: number;
        output_tokens_details: {
            reasoning_tokens: number;
        };
    };
    reasoning_steps?: string[];
    incomplete_details?: {
        reason: string;
    };
} 