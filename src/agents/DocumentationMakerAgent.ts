import { IAgent, RunContext, ActionPlan, ExecutionResult, ReasoningResponse } from '../types';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

interface DocumentationRequest {
  topic: string;
  targetAudience?: 'technical' | 'non-technical' | 'mixed';
  depth?: 'overview' | 'intermediate' | 'comprehensive';
  format?: 'markdown' | 'html' | 'plaintext';
  sections?: string[];
  maxTokens?: number;
  reasoningEffort?: 'low' | 'medium' | 'high';
}

interface DocumentationResult {
  content: string;
  sections: string[];
  researchSources: string[];
  estimatedTokens: number;
  reasoningSteps?: string[];
}

export class DocumentationMakerAgent implements IAgent {
  id: string = uuidv4();
  name: string = 'Documentation Maker Agent';
  description: string = 'Specialized in creating comprehensive, clear, and user-friendly documentation using AI-powered research and reasoning';
  capabilities: string[] = ['research', 'documentation', 'content-creation', 'technical-writing', 'reasoning'];

  private openai: OpenAI;
  private readonly MAX_TOKENS_PER_REQUEST = 4000;
  private readonly MAX_RESEARCH_ITERATIONS = 3;
  private readonly DEFAULT_REASONING_EFFORT: 'low' | 'medium' | 'high' = 'medium';
  private readonly MODEL = "gpt-4-turbo-2024-04-09"; // Latest model version

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async learn(context: RunContext): Promise<void> {
    // Implement learning from previous documentation requests
    // This could include storing successful documentation patterns
    // and learning from user feedback
  }

  async plan(context: RunContext): Promise<ActionPlan> {
    const request = context.input as DocumentationRequest;
    
    return {
      steps: [
        {
          action: 'research',
          description: 'Conduct initial research on the topic',
          parameters: {
            topic: request.topic,
            depth: request.depth || 'comprehensive',
            maxTokens: request.maxTokens || this.MAX_TOKENS_PER_REQUEST,
            reasoningEffort: request.reasoningEffort || this.DEFAULT_REASONING_EFFORT,
            model: this.MODEL
          }
        },
        {
          action: 'structure',
          description: 'Create documentation structure',
          parameters: {
            sections: request.sections || ['overview', 'installation', 'usage', 'examples', 'troubleshooting'],
            format: request.format || 'markdown',
            reasoningEffort: request.reasoningEffort || this.DEFAULT_REASONING_EFFORT,
            model: this.MODEL
          }
        },
        {
          action: 'generate',
          description: 'Generate documentation content',
          parameters: {
            targetAudience: request.targetAudience || 'mixed',
            maxTokens: request.maxTokens || this.MAX_TOKENS_PER_REQUEST,
            reasoningEffort: request.reasoningEffort || this.DEFAULT_REASONING_EFFORT,
            model: this.MODEL
          }
        }
      ]
    };
  }

  async execute(context: RunContext, plan: ActionPlan): Promise<ExecutionResult> {
    const request = context.input as DocumentationRequest;
    let researchResults: string[] = [];
    let documentationContent = '';
    let estimatedTokens = 0;
    let reasoningSteps: string[] = [];

    // Research phase with reasoning
    for (let i = 0; i < this.MAX_RESEARCH_ITERATIONS; i++) {
      const researchResponse = await this.openai.chat.completions.create({
        model: this.MODEL,
        messages: [
          {
            role: "system",
            content: `You are a research assistant specializing in ${request.topic}. 
            Provide comprehensive information about the topic, focusing on:
            1. Core concepts and principles
            2. Best practices and standards
            3. Common use cases and examples
            4. Potential challenges and solutions
            Keep responses concise and factual.`
          },
          {
            role: "user",
            content: `Research the topic: ${request.topic}. Focus on ${request.depth} level understanding.`
          }
        ],
        max_tokens: Math.floor(this.MAX_TOKENS_PER_REQUEST / this.MAX_RESEARCH_ITERATIONS)
      });

      researchResults.push(researchResponse.choices[0].message.content || '');
      estimatedTokens += researchResponse.usage?.total_tokens || 0;
    }

    // Documentation generation phase with reasoning
    const documentationResponse = await this.openai.chat.completions.create({
      model: this.MODEL,
      messages: [
        {
          role: "system",
          content: `You are a documentation expert. Create comprehensive documentation for ${request.topic}.
          Follow these guidelines:
          1. Write for ${request.targetAudience} audience
          2. Use ${request.format} format
          3. Include clear examples and explanations
          4. Structure content logically
          5. Use consistent terminology
          6. Include practical use cases`
        },
        {
          role: "user",
          content: `Based on this research: ${researchResults.join('\n\n')}
          Create comprehensive documentation for ${request.topic}.`
        }
      ],
      max_tokens: this.MAX_TOKENS_PER_REQUEST
    });

    documentationContent = documentationResponse.choices[0].message.content || '';
    estimatedTokens += documentationResponse.usage?.total_tokens || 0;

    return {
      success: true,
      output: {
        content: documentationContent,
        sections: request.sections || ['overview', 'installation', 'usage', 'examples', 'troubleshooting'],
        researchSources: researchResults,
        estimatedTokens,
        reasoningSteps
      } as DocumentationResult,
      metrics: {
        researchIterations: this.MAX_RESEARCH_ITERATIONS,
        totalTokens: estimatedTokens,
        processingTime: Date.now() - context.startTime,
        reasoningEffort: request.reasoningEffort || this.DEFAULT_REASONING_EFFORT,
        model: this.MODEL
      }
    };
  }
} 