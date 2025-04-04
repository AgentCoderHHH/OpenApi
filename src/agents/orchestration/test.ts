import { AgentOrchestrator, IAgent, ActionPlan, RunContext, ExecutionResult } from './AgentOrchestrator';
import { v4 as uuidv4 } from 'uuid';

// Example specialized agents
class ResearchAgent implements IAgent {
  id: string = uuidv4();
  name: string = 'ResearchAgent';
  description: string = 'Specialized in gathering and analyzing information';
  capabilities: string[] = ['web_search', 'data_analysis', 'report_generation'];

  async learn(context: RunContext): Promise<void> {
    // Implement learning logic
    console.log(`${this.name} learning from context:`, context);
  }

  async plan(context: RunContext): Promise<ActionPlan> {
    return {
      id: uuidv4(),
      agentId: this.id,
      actions: [
        {
          id: uuidv4(),
          type: 'web_search',
          parameters: { query: context.data.query },
          dependencies: []
        },
        {
          id: uuidv4(),
          type: 'analyze_results',
          parameters: {},
          dependencies: ['web_search']
        }
      ],
      dependencies: [],
      priority: 1
    };
  }

  async execute(context: RunContext, plan: ActionPlan): Promise<ExecutionResult> {
    const startTime = new Date();
    
    try {
      // Simulate execution
      console.log(`${this.name} executing plan:`, plan);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        output: { results: 'Simulated research results' },
        metrics: {
          startTime,
          endTime: new Date(),
          duration: 1000,
          resourceUsage: { cpu: 0.5, memory: 0.3, network: 0.7 }
        }
      };
    } catch (error) {
      return {
        success: false,
        output: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        metrics: {
          startTime,
          endTime: new Date(),
          duration: 1000,
          resourceUsage: { cpu: 0.5, memory: 0.3, network: 0.7 }
        }
      };
    }
  }
}

class WritingAgent implements IAgent {
  id: string = uuidv4();
  name: string = 'WritingAgent';
  description: string = 'Specialized in content creation and editing';
  capabilities: string[] = ['content_generation', 'editing', 'formatting'];

  async learn(context: RunContext): Promise<void> {
    console.log(`${this.name} learning from context:`, context);
  }

  async plan(context: RunContext): Promise<ActionPlan> {
    return {
      id: uuidv4(),
      agentId: this.id,
      actions: [
        {
          id: uuidv4(),
          type: 'generate_content',
          parameters: { topic: context.data.topic },
          dependencies: []
        },
        {
          id: uuidv4(),
          type: 'edit_content',
          parameters: {},
          dependencies: ['generate_content']
        }
      ],
      dependencies: [],
      priority: 2
    };
  }

  async execute(context: RunContext, plan: ActionPlan): Promise<ExecutionResult> {
    const startTime = new Date();
    
    try {
      console.log(`${this.name} executing plan:`, plan);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return {
        success: true,
        output: { content: 'Simulated written content' },
        metrics: {
          startTime,
          endTime: new Date(),
          duration: 1500,
          resourceUsage: { cpu: 0.3, memory: 0.2, network: 0.1 }
        }
      };
    } catch (error) {
      return {
        success: false,
        output: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        metrics: {
          startTime,
          endTime: new Date(),
          duration: 1500,
          resourceUsage: { cpu: 0.3, memory: 0.2, network: 0.1 }
        }
      };
    }
  }
}

async function testOrchestration() {
  // Create orchestrator
  const orchestrator = new AgentOrchestrator();

  // Register agents
  const researchAgent = new ResearchAgent();
  const writingAgent = new WritingAgent();
  
  orchestrator.registerAgent(researchAgent);
  orchestrator.registerAgent(writingAgent);

  // Create context
  const context = orchestrator.createContext({
    query: 'AI agent orchestration',
    topic: 'Implementing AI agents'
  });

  try {
    // Test LLM-based orchestration
    console.log('Testing LLM-based orchestration...');
    const llmResults = await orchestrator.orchestrateLLM(context);
    console.log('LLM orchestration results:', llmResults);

    // Test code-based orchestration
    console.log('\nTesting code-based orchestration...');
    const predefinedFlow: ActionPlan[] = [
      {
        id: uuidv4(),
        agentId: researchAgent.id,
        actions: [
          {
            id: uuidv4(),
            type: 'web_search',
            parameters: { query: 'AI agent patterns' },
            dependencies: []
          }
        ],
        dependencies: [],
        priority: 1
      },
      {
        id: uuidv4(),
        agentId: writingAgent.id,
        actions: [
          {
            id: uuidv4(),
            type: 'generate_content',
            parameters: { topic: 'AI agent patterns' },
            dependencies: []
          }
        ],
        dependencies: [researchAgent.id],
        priority: 2
      }
    ];

    const codeResults = await orchestrator.orchestrateCode(context, predefinedFlow);
    console.log('Code orchestration results:', codeResults);

    // Test parallel execution
    console.log('\nTesting parallel execution...');
    const parallelResults = await orchestrator.executeParallel(context, predefinedFlow);
    console.log('Parallel execution results:', parallelResults);

    // Evaluate results
    const evaluation = await orchestrator.evaluateExecution([
      ...llmResults,
      ...codeResults,
      ...parallelResults
    ]);
    console.log('\nExecution evaluation:', evaluation);

  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testOrchestration().catch(console.error); 