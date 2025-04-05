import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { IAgent, RunContext, ActionPlan, ExecutionResult } from '../../types';
import { Agent } from '../Agent';

dotenv.config();

export class TechnicalDocumentationAgent extends Agent implements IAgent {
  id: string = uuidv4();
  name: string = 'Technical Documentation Agent';
  description: string = 'Generates detailed technical documentation in TypeScript from general documentation or requirements';
  capabilities: string[] = [
    'technical-writing', 
    'code-documentation', 
    'typescript', 
    'api-documentation',
    'component-documentation'
  ];
  
  private openai: OpenAI;

  constructor() {
    super();
    
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set in environment variables');
    }
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async learn(context: RunContext): Promise<void> {
    // Implementation not needed for this agent
  }

  async plan(context: RunContext): Promise<ActionPlan> {
    return {
      steps: [
        {
          action: 'generate_technical_documentation',
          description: 'Generate technical documentation with code examples',
          parameters: { input: context.input }
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
        throw new Error('No input provided for technical documentation generation');
      }

      console.log('Generating technical documentation for:', context.input);
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a technical documentation expert specializing in TypeScript. Generate detailed technical documentation including architecture, code examples, and implementation details. Use markdown formatting and include TypeScript code examples where appropriate."
          },
          {
            role: "user",
            content: `Generate technical documentation for: ${context.input}`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      console.log('OpenAI response received');
      const documentation = response.choices[0].message.content || 'No technical documentation generated';

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
          model: "gpt-4"
        }
      };
    } catch (error) {
      console.error('Error in TechnicalDocumentationAgent:', error);
      const endTime = Date.now();
      const processingTime = endTime - startTime;

      return {
        success: false,
        output: `Error generating technical documentation: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metrics: {
          processingTime,
          reasoningEffort: 0.8,
          researchIterations: 0,
          totalTokens: 0,
          model: "gpt-4"
        }
      };
    }
  }
} 