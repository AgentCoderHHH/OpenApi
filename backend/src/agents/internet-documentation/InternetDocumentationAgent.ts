import { Agent } from '../Agent';
import { RunContext, ActionPlan, ExecutionResult } from '../../types';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

export class InternetDocumentationAgent extends Agent {
  private openai: OpenAI;

  constructor() {
    super();
    this.id = 'internet-documentation';
    this.name = 'Internet Documentation Agent';
    this.description = 'Generates documentation from internet sources';
    this.capabilities = ['documentation', 'research'];
    
    console.log('Checking OpenAI API key...');
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not set in environment variables');
      throw new Error('OPENAI_API_KEY is not set in environment variables');
    }
    
    console.log('OpenAI API key found, initializing client...');
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    console.log('OpenAI client initialized successfully');
  }

  async learn(context: RunContext): Promise<void> {
    // Implementation not needed for this agent
  }

  async plan(context: RunContext): Promise<ActionPlan> {
    return {
      steps: [
        {
          action: 'generate_documentation',
          description: 'Generate documentation from internet sources',
          parameters: { topic: context.input }
        }
      ],
      dependencies: [],
      priority: 1
    };
  }

  async execute(context: RunContext, plan?: ActionPlan): Promise<ExecutionResult> {
    const startTime = Date.now();
    
    try {
      if (!context.input) {
        throw new Error('No input provided for documentation generation');
      }

      console.log('Generating documentation for:', context.input);
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a technical documentation expert. Generate comprehensive documentation about the given topic, including overview, key concepts, implementation details, and references. Use markdown formatting."
          },
          {
            role: "user",
            content: `Generate detailed documentation about: ${context.input}`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      console.log('OpenAI response received');
      const documentation = response.choices[0].message.content || 'No documentation generated';

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      return {
        success: true,
        output: documentation,
        metrics: {
          processingTime,
          reasoningEffort: 0.8,
          researchIterations: 1,
          totalTokens: response.usage?.total_tokens || 0,
          model: "gpt-3.5-turbo"
        }
      };
    } catch (error) {
      console.error('Error in InternetDocumentationAgent:', error);
      const endTime = Date.now();
      const processingTime = endTime - startTime;

      return {
        success: false,
        output: `Error generating documentation: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metrics: {
          processingTime,
          reasoningEffort: 0.8,
          researchIterations: 0,
          totalTokens: 0,
          model: "gpt-3.5-turbo"
        }
      };
    }
  }
} 