import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

// Core interfaces
export interface IAgent {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  learn(context: RunContext): Promise<void>;
  plan(context: RunContext): Promise<ActionPlan>;
  execute(context: RunContext, plan: ActionPlan): Promise<ExecutionResult>;
}

export interface ActionPlan {
  id: string;
  agentId: string;
  actions: Action[];
  dependencies: string[];
  priority: number;
}

export interface Action {
  id: string;
  type: string;
  parameters: Record<string, any>;
  dependencies: string[];
}

export interface ExecutionResult {
  success: boolean;
  output: any;
  error?: string;
  metrics: ExecutionMetrics;
}

export interface ExecutionMetrics {
  startTime: Date;
  endTime: Date;
  duration: number;
  resourceUsage: ResourceUsage;
}

export interface ResourceUsage {
  cpu: number;
  memory: number;
  network: number;
}

export interface RunContext {
  id: string;
  parentContext?: RunContext;
  data: Record<string, any>;
  metadata: Record<string, any>;
  usage: Usage;
}

export interface Usage {
  tokens: number;
  cost: number;
  time: number;
}

// Orchestration patterns
export class AgentOrchestrator extends EventEmitter {
  private agents: Map<string, IAgent>;
  private contextStore: Map<string, RunContext>;
  private executionQueue: ActionPlan[];

  constructor() {
    super();
    this.agents = new Map();
    this.contextStore = new Map();
    this.executionQueue = [];
  }

  // Agent management
  registerAgent(agent: IAgent): void {
    this.agents.set(agent.id, agent);
    this.emit('agentRegistered', agent);
  }

  unregisterAgent(agentId: string): void {
    this.agents.delete(agentId);
    this.emit('agentUnregistered', agentId);
  }

  // Context management
  createContext(data: Record<string, any> = {}, parentContext?: RunContext): RunContext {
    const context: RunContext = {
      id: uuidv4(),
      parentContext,
      data,
      metadata: {},
      usage: {
        tokens: 0,
        cost: 0,
        time: 0
      }
    };
    this.contextStore.set(context.id, context);
    return context;
  }

  getContext(contextId: string): RunContext | undefined {
    return this.contextStore.get(contextId);
  }

  // Orchestration methods
  async orchestrateLLM(context: RunContext): Promise<ExecutionResult[]> {
    const results: ExecutionResult[] = [];
    
    // Let each agent plan autonomously
    for (const agent of this.agents.values()) {
      try {
        const plan = await agent.plan(context);
        this.executionQueue.push(plan);
      } catch (error) {
        this.emit('planningError', { agentId: agent.id, error });
      }
    }

    // Execute plans in priority order
    this.executionQueue.sort((a, b) => b.priority - a.priority);
    
    for (const plan of this.executionQueue) {
      const agent = this.agents.get(plan.agentId);
      if (!agent) continue;

      try {
        const result = await agent.execute(context, plan);
        results.push(result);
        this.emit('executionComplete', { planId: plan.id, result });
      } catch (error) {
        this.emit('executionError', { planId: plan.id, error });
      }
    }

    return results;
  }

  async orchestrateCode(context: RunContext, flow: ActionPlan[]): Promise<ExecutionResult[]> {
    const results: ExecutionResult[] = [];
    
    // Execute plans in specified order
    for (const plan of flow) {
      const agent = this.agents.get(plan.agentId);
      if (!agent) continue;

      try {
        const result = await agent.execute(context, plan);
        results.push(result);
        this.emit('executionComplete', { planId: plan.id, result });
      } catch (error) {
        this.emit('executionError', { planId: plan.id, error });
      }
    }

    return results;
  }

  // Parallel execution
  async executeParallel(context: RunContext, plans: ActionPlan[]): Promise<ExecutionResult[]> {
    const executions = plans.map(plan => {
      const agent = this.agents.get(plan.agentId);
      if (!agent) return Promise.resolve({
        success: false,
        output: null,
        error: `Agent ${plan.agentId} not found`,
        metrics: {
          startTime: new Date(),
          endTime: new Date(),
          duration: 0,
          resourceUsage: { cpu: 0, memory: 0, network: 0 }
        }
      });

      return agent.execute(context, plan);
    });

    return Promise.all(executions);
  }

  // Evaluation and feedback
  async evaluateExecution(results: ExecutionResult[]): Promise<EvaluationResult> {
    const evaluation: EvaluationResult = {
      success: results.every(r => r.success),
      totalTime: results.reduce((sum, r) => sum + r.metrics.duration, 0),
      averageResourceUsage: {
        cpu: results.reduce((sum, r) => sum + r.metrics.resourceUsage.cpu, 0) / results.length,
        memory: results.reduce((sum, r) => sum + r.metrics.resourceUsage.memory, 0) / results.length,
        network: results.reduce((sum, r) => sum + r.metrics.resourceUsage.network, 0) / results.length
      },
      errors: results.filter(r => !r.success).map(r => r.error)
    };

    this.emit('evaluationComplete', evaluation);
    return evaluation;
  }
}

export interface EvaluationResult {
  success: boolean;
  totalTime: number;
  averageResourceUsage: ResourceUsage;
  errors: (string | undefined)[];
} 