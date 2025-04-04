import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

export class InternetDocumentationAgent {
  id: string = uuidv4();
  name: string = 'Internet Documentation Agent';
  description: string = 'Specialized in creating comprehensive documentation using AI-powered synthesis';
  capabilities: string[] = ['documentation', 'content-creation', 'technical-writing'];

  protected readonly MODEL = 'gpt-4-turbo-2024-04-09';
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async execute(topic: string, reasoningEffort: number = 0.8): Promise<{
    success: boolean;
    output: string;
    metrics: {
      researchIterations: number;
      totalTokens: number;
      processingTime: number;
      reasoningEffort: number;
      model: string;
    };
  }> {
    const startTime = Date.now();
    let totalTokens = 0;

    try {
      // Generate documentation directly without browser automation
      const documentation = await this.generateDocumentation(topic, reasoningEffort);
      totalTokens += documentation.tokens;

      return {
        success: true,
        output: documentation.content,
        metrics: {
          researchIterations: 1,
          totalTokens,
          processingTime: Date.now() - startTime,
          reasoningEffort,
          model: this.MODEL
        }
      };
    } catch (error) {
      return {
        success: false,
        output: error instanceof Error ? error.message : 'Unknown error occurred',
        metrics: {
          researchIterations: 0,
          totalTokens,
          processingTime: Date.now() - startTime,
          reasoningEffort,
          model: this.MODEL
        }
      };
    }
  }

  private async generateDocumentation(
    topic: string,
    reasoningEffort: number
  ): Promise<{ content: string; tokens: number }> {
    const response = await this.openai.chat.completions.create({
      model: this.MODEL,
      messages: [
        {
          role: "system",
          content: `You are a documentation specialist. Create professional, comprehensive documentation about "${topic}". Use a reasoning effort level of ${reasoningEffort}.`
        },
        {
          role: "user",
          content: `Generate comprehensive documentation about: ${topic}`
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    return {
      content: response.choices[0].message.content || '',
      tokens: response.usage?.total_tokens || 0
    };
  }
} 