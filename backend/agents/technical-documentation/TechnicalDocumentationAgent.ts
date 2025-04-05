import { BaseAgent } from '../BaseAgent';
import { AgentResponse } from '../../types/AgentResponse';
import { AgentMetrics } from '../../types/AgentMetrics';
import OpenAI from 'openai';

export class TechnicalDocumentationAgent extends BaseAgent {
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
      reasoningEffort: 0.8,
      model: 'gpt-4'
    };

    try {
      const { content, documentationOutput } = input.data;
      
      // Step 1: Get technical implementation details
      const implementationDetails = await this.getImplementationDetails(content, documentationOutput);
      
      // Step 2: Generate code examples
      const codeExamples = await this.generateCodeExamples(implementationDetails);
      
      // Step 3: Create final technical documentation
      const technicalOutput = await this.createTechnicalDocumentation(
        content,
        documentationOutput,
        implementationDetails,
        codeExamples
      );
      
      metrics.processingTime = Date.now() - startTime;
      
      return {
        success: true,
        output: technicalOutput,
        metrics
      };
    } catch (error) {
      console.error('Error in TechnicalDocumentationAgent:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        metrics
      };
    }
  }

  private async getImplementationDetails(topic: string, documentationOutput: string): Promise<string> {
    const prompt = `Based on the following documentation, provide detailed technical implementation steps:

Topic: ${topic}
Documentation: ${documentationOutput}

Please provide:
1. System architecture and components
2. Required technologies and frameworks
3. Data models and schemas
4. API endpoints and interfaces
5. Security implementation details
6. Performance optimization strategies

Format the response in clear sections with technical specifications.`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a technical architect specializing in software development.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7
    });

    return response.choices[0].message.content || '';
  }

  private async generateCodeExamples(implementationDetails: string): Promise<string> {
    const prompt = `Based on these implementation details, provide complete code examples:

${implementationDetails}

Please provide:
1. TypeScript/Node.js code examples for each component
2. Configuration files and setup
3. API endpoint implementations
4. Data models and schemas
5. Utility functions and helpers
6. Testing code examples

Include complete, working code snippets that can be used directly.`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a senior software engineer with expertise in TypeScript and Node.js.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7
    });

    return response.choices[0].message.content || '';
  }

  private async createTechnicalDocumentation(
    topic: string,
    documentationOutput: string,
    implementationDetails: string,
    codeExamples: string
  ): Promise<string> {
    const prompt = `Create comprehensive technical documentation combining:

Topic: ${topic}
Original Documentation: ${documentationOutput}
Implementation Details: ${implementationDetails}
Code Examples: ${codeExamples}

Please structure the documentation with:
1. System Architecture (include Mermaid diagrams)
2. Technical Specifications
3. Implementation Guide
4. Code Examples and Usage
5. Configuration and Setup
6. Testing and Deployment
7. Security and Performance

Use proper markdown formatting, include diagrams, and provide complete code examples.`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a technical documentation specialist.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7
    });

    return response.choices[0].message.content || '';
  }
} 