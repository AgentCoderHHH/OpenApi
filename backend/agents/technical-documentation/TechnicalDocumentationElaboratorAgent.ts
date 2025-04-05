import { BaseAgent } from '../BaseAgent';
import { AgentResponse } from '../../types/AgentResponse';
import { AgentMetrics } from '../../types/AgentMetrics';
import OpenAI from 'openai';

export class TechnicalDocumentationElaboratorAgent extends BaseAgent {
  private openai: OpenAI;

  constructor() {
    super();
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async execute(input: { input: { content: string }, data: any, startTime: number }): Promise<AgentResponse> {
    const startTime = Date.now();
    const metrics: AgentMetrics = {
      researchIterations: 0,
      totalTokens: 0,
      processingTime: 0,
      reasoningEffort: 0.9,
      model: 'gpt-4'
    };

    try {
      const { content, technicalOutput } = input.data;
      
      // Step 1: Analyze technical documentation and break down implementation
      const implementationBreakdown = await this.analyzeImplementation(technicalOutput);
      
      // Step 2: Generate detailed build steps
      const buildSteps = await this.generateBuildSteps(implementationBreakdown);
      
      // Step 3: Create comprehensive project guide
      const projectGuide = await this.createProjectGuide(
        content,
        technicalOutput,
        implementationBreakdown,
        buildSteps
      );
      
      metrics.processingTime = Date.now() - startTime;
      
      return {
        success: true,
        output: projectGuide,
        metrics
      };
    } catch (error) {
      console.error('Error in TechnicalDocumentationElaboratorAgent:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        metrics
      };
    }
  }

  private async analyzeImplementation(technicalOutput: string): Promise<string> {
    const prompt = `As a senior technical architect, analyze this technical documentation and break down the implementation requirements:

${technicalOutput}

Focus on:
1. Core components and their relationships
2. Required technologies and versions
3. Integration points and dependencies
4. Data flow and processing requirements
5. Security and performance considerations

Provide a concise, structured breakdown that can be used for implementation planning.`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a senior technical architect with expertise in system design and implementation.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    return response.choices[0].message.content || '';
  }

  private async generateBuildSteps(implementationBreakdown: string): Promise<string> {
    const prompt = `Based on this implementation breakdown, provide detailed build steps:

${implementationBreakdown}

Include:
1. Environment setup and configuration
2. Component implementation order
3. Integration steps
4. Testing and validation procedures
5. Deployment checklist

Provide specific, actionable steps with code examples where relevant.`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a senior software engineer specializing in project implementation.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    return response.choices[0].message.content || '';
  }

  private async createProjectGuide(
    topic: string,
    technicalOutput: string,
    implementationBreakdown: string,
    buildSteps: string
  ): Promise<string> {
    const prompt = `Create a comprehensive project implementation guide combining:

Topic: ${topic}
Technical Documentation: ${technicalOutput}
Implementation Breakdown: ${implementationBreakdown}
Build Steps: ${buildSteps}

Structure the guide with:
1. Project Overview and Goals
2. Technical Architecture (with diagrams)
3. Implementation Roadmap
4. Detailed Build Instructions
5. Testing and Validation
6. Deployment and Maintenance
7. Troubleshooting Guide

Use markdown formatting and include code examples, diagrams, and checklists.`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a technical documentation specialist and project implementation expert.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 4000
    });

    return response.choices[0].message.content || '';
  }
} 