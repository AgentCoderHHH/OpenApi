import { IAgent, RunContext, ActionPlan, ExecutionResult } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';
import { chromium, Browser, Page, ElementHandle, Locator } from 'playwright';
import { Octokit } from '@octokit/rest';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import { Agent } from '../Agent';

dotenv.config();

interface InternetDocumentationRequest {
  topic: string;
  targetAudience?: 'technical' | 'non-technical' | 'mixed';
  depth?: 'overview' | 'intermediate' | 'comprehensive';
  format?: 'markdown' | 'html' | 'plaintext';
  sections?: string[];
  maxTokens?: number;
  reasoningEffort?: 'low' | 'medium' | 'high';
  repoInfo?: {
    owner: string;
    repo: string;
    branch?: string;
  };
}

interface KnowledgeStore {
  sources: Array<{
    url: string;
    title: string;
    credibilityScore: number;
    extractedInfo: any;
  }>;
  keyInsights: string[];
  codeExamples: string[];
  bestPractices: string[];
}

interface SearchResult {
  url: string;
  title: string;
  snippet?: string;
}

export class InternetDocumentationAgent extends Agent {
  id: string = uuidv4();
  name: string = 'Internet Documentation Agent';
  description: string = 'Specialized in creating comprehensive documentation using internet research and AI-powered synthesis';
  capabilities: string[] = ['research', 'documentation', 'content-creation', 'technical-writing', 'browser-automation', 'github-integration'];

  protected readonly MODEL = 'gpt-4-turbo-2024-04-09';
  private openai: OpenAI;
  private browser: Browser | null = null;
  private octokit: Octokit;
  private s3Client: S3Client;
  private readonly MAX_TOKENS_PER_REQUEST = 4000;
  private readonly MAX_RESEARCH_ITERATIONS = 3;
  private readonly DEFAULT_REASONING_EFFORT: 'low' | 'medium' | 'high' = 'medium';
  private readonly QUALITY_THRESHOLD = 0.7;

  constructor() {
    super();
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
  }

  async learn(context: RunContext): Promise<void> {
    // Implement learning from previous documentation requests
  }

  async plan(context: RunContext): Promise<ActionPlan> {
    const request = context.input as InternetDocumentationRequest;
    
    return {
      steps: [
        {
          action: 'browser-research',
          description: 'Conduct internet research using browser automation',
          parameters: {
            topic: request.topic,
            depth: request.depth || 'comprehensive',
            maxTokens: request.maxTokens || this.MAX_TOKENS_PER_REQUEST,
            reasoningEffort: request.reasoningEffort || this.DEFAULT_REASONING_EFFORT
          }
        },
        {
          action: 'synthesize',
          description: 'Synthesize and store information on GitHub',
          parameters: {
            repoInfo: request.repoInfo,
            format: request.format || 'markdown'
          }
        },
        {
          action: 'evaluate',
          description: 'Evaluate and reassess documentation quality',
          parameters: {
            topic: request.topic,
            repoInfo: request.repoInfo
          }
        },
        {
          action: 'generate',
          description: 'Generate final documentation',
          parameters: {
            topic: request.topic,
            repoInfo: request.repoInfo,
            targetAudience: request.targetAudience || 'mixed'
          }
        }
      ]
    };
  }

  private async conductBrowserResearch(topic: string, depth: number = 3): Promise<KnowledgeStore> {
    let knowledgeStore: KnowledgeStore = {
      sources: [],
      keyInsights: [],
      codeExamples: [],
      bestPractices: []
    };

    const browser = await chromium.launch({
      channel: 'msedge',
      headless: true
    });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      // Initial search queries
      const initialQueries = await this.generateQueries(topic);
      
      for (const query of initialQueries) {
        await page.goto('https://www.bing.com/');
        await page.fill('input[name="q"]', query);
        await page.press('input[name="q"]', 'Enter');
        await page.waitForLoadState('networkidle');

        const searchResults = await page.evaluate(() => {
          const results: SearchResult[] = [];
          const resultElements = document.querySelectorAll('.b_algo');
          
          resultElements.forEach(element => {
            const titleElement = element.querySelector('h2 a') as HTMLAnchorElement | null;
            const url = titleElement?.href;
            const title = titleElement?.textContent;
            const snippet = element.querySelector('.b_caption p')?.textContent || undefined;
            
            if (url && title) {
              results.push({ url, title, snippet });
            }
          });
          
          return results.slice(0, 10);
        });

        const credibleResults = await this.filterCredibleSources(searchResults);

        for (const result of credibleResults) {
          try {
            await page.goto(result.url, { timeout: 30000 });
            await page.waitForLoadState('domcontentloaded');

            const content = await page.evaluate(() => {
              const elementsToRemove = [
                'nav', 'header', 'footer', 'aside', 
                '[class*="ad"]', '[class*="banner"]', '[id*="ad"]',
                '[class*="nav"]', '[class*="menu"]'
              ];
              
              elementsToRemove.forEach(selector => {
                document.querySelectorAll(selector).forEach(el => el.remove());
              });
              
              const mainContent = document.querySelector('main') || document.querySelector('article') || document.body;
              return {
                title: document.title,
                text: mainContent.textContent || '',
                html: mainContent.innerHTML,
                codeBlocks: Array.from(document.querySelectorAll('pre, code')).map(el => el.textContent || '')
              };
            });

            const analysisResult = await this.analyzeContent(content, topic);
            
            if (analysisResult.score > this.QUALITY_THRESHOLD) {
              const extractedInfo = await this.extractStructuredInfo(content, topic);
              
              knowledgeStore.sources.push({
                url: result.url,
                title: result.title,
                credibilityScore: analysisResult.score,
                extractedInfo
              });
              
              knowledgeStore.keyInsights = [...knowledgeStore.keyInsights, ...extractedInfo.insights];
              knowledgeStore.codeExamples = [...knowledgeStore.codeExamples, ...extractedInfo.codeExamples];
              knowledgeStore.bestPractices = [...knowledgeStore.bestPractices, ...extractedInfo.bestPractices];
            }
          } catch (error) {
            console.error(`Error processing ${result.url}:`, error instanceof Error ? error.message : String(error));
            continue;
          }
        }
      }
    } finally {
      await browser.close();
    }

    return knowledgeStore;
  }

  private async generateQueries(topic: string): Promise<string[]> {
    const response = await this.openai.chat.completions.create({
      model: this.MODEL,
      messages: [
        {
          role: "system",
          content: "You are an expert in breaking down complex documentation topics into searchable components."
        },
        {
          role: "user",
          content: `Break down the following documentation topic into 5-7 specific search queries that would help gather comprehensive information using a web browser: "${topic}"`
        }
      ],
      temperature: 0.3
    });

    return response.choices[0].message.content?.split('\n').filter(Boolean) || [];
  }

  private async filterCredibleSources(results: SearchResult[]): Promise<SearchResult[]> {
    // Implement source credibility filtering
    return results.filter(result => {
      const url = result.url.toLowerCase();
      return !url.includes('wikipedia') && 
             !url.includes('quora') && 
             !url.includes('reddit') &&
             !url.includes('stackoverflow');
    });
  }

  private async analyzeContent(content: any, topic: string): Promise<{ score: number }> {
    const response = await this.openai.chat.completions.create({
      model: this.MODEL,
      messages: [
        {
          role: "system",
          content: "You are an expert in evaluating the quality and relevance of technical information."
        },
        {
          role: "user",
          content: `Analyze the following content and rate it on relevance, accuracy, recency, and technical depth for a documentation project on "${topic}". Provide a score from 0-10 for each dimension and justify your ratings.
          
          Content: ${content.text}
          Title: ${content.title}
          Code Samples: ${content.codeBlocks.join('\n\n')}`
        }
      ],
      temperature: 0.2
    });

    // Parse the response to extract the score
    const score = 0.8; // Placeholder - implement actual score parsing
    return { score };
  }

  private async extractStructuredInfo(content: any, topic: string): Promise<any> {
    const response = await this.openai.chat.completions.create({
      model: this.MODEL,
      messages: [
        {
          role: "system",
          content: "You are an expert in extracting structured information from technical content."
        },
        {
          role: "user",
          content: `Extract key insights, code examples, and best practices from the following content about "${topic}":
          
          ${content.text}
          
          Code Samples:
          ${content.codeBlocks.join('\n\n')}`
        }
      ],
      temperature: 0.3
    });

    // Parse the response to extract structured information
    return {
      insights: [],
      codeExamples: [],
      bestPractices: []
    };
  }

  async execute(topic: string, reasoningEffort: number = 0.8): Promise<ExecutionResult> {
    const startTime = Date.now();
    let totalTokens = 0;

    try {
      // Initialize browser if needed
      if (!this.browser) {
        this.browser = await chromium.launch();
      }

      // Research phase
      const researchResult = await this.research(topic);
      totalTokens += researchResult.tokens;

      // Documentation generation phase
      const documentation = await this.generateDocumentation(researchResult.content, reasoningEffort);
      totalTokens += documentation.tokens;

      // Close browser
      await this.browser.close();
      this.browser = null;

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
      // Ensure browser is closed on error
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
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

  private async research(topic: string): Promise<{ content: string; tokens: number }> {
    const page = await this.browser!.newPage();
    const searchResults: SearchResult[] = [];

    try {
      // Search on Bing
      await page.goto('https://www.bing.com');
      await page.fill('input[name="q"]', topic);
      await page.press('input[name="q"]', 'Enter');
      await page.waitForLoadState('networkidle');

      // Extract search results
      const links = await page.$$eval('h2 > a', (elements) => {
        return elements.slice(0, 5).map((el) => ({
          url: el.getAttribute('href') || '',
          title: el.textContent || ''
        }));
      });

      searchResults.push(...links.filter(link => link.url));

      // Visit each result and extract content
      let combinedContent = '';
      for (const result of searchResults) {
        try {
          await page.goto(result.url, { timeout: 30000 });
          await page.waitForLoadState('networkidle');

          // Extract main content using page.evaluate
          const content = await page.evaluate(() => {
            const mainContent = document.querySelector('main') || document.querySelector('article') || document.body;
            return mainContent?.textContent?.trim() || '';
          });

          combinedContent += `${result.title}\n${content}\n\n`;
        } catch (err) {
          console.error(`Error visiting ${result.url}:`, err instanceof Error ? err.message : String(err));
        }
      }

      await page.close();

      // Use OpenAI to summarize the research
      const response = await this.openai.chat.completions.create({
        model: this.MODEL,
        messages: [
          {
            role: "system",
            content: "You are a research assistant. Provide a comprehensive overview of the given topic based on the provided research content."
          },
          {
            role: "user",
            content: `Summarize this research about ${topic}:\n\n${combinedContent}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      return {
        content: response.choices[0].message.content || '',
        tokens: response.usage?.total_tokens || 0
      };
    } catch (err) {
      await page.close();
      throw err instanceof Error ? err : new Error(String(err));
    }
  }

  private async generateDocumentation(
    researchContent: string,
    reasoningEffort: number
  ): Promise<{ content: string; tokens: number }> {
    const response = await this.openai.chat.completions.create({
      model: this.MODEL,
      messages: [
        {
          role: "system",
          content: `You are a documentation specialist. Create professional, comprehensive documentation based on the research provided. Use a reasoning effort level of ${reasoningEffort}.`
        },
        {
          role: "user",
          content: `Generate documentation based on this research: ${researchContent}`
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

  private async resolveContradictions(knowledgeStore: KnowledgeStore): Promise<KnowledgeStore> {
    // Implement contradiction resolution
    return knowledgeStore;
  }

  private async organizeByTopics(knowledgeStore: KnowledgeStore): Promise<any> {
    // Implement topic organization
    return knowledgeStore;
  }

  private async storeOnGitHub(content: string, repoInfo: any, topic: string): Promise<void> {
    const fileName = `docs/${this.slugify(topic)}.md`;
    
    try {
      await this.octokit.rest.repos.createOrUpdateFileContents({
        owner: repoInfo.owner,
        repo: repoInfo.repo,
        path: fileName,
        message: `Update documentation for ${topic}`,
        content: Buffer.from(content).toString('base64'),
        branch: repoInfo.branch || 'main'
      });
    } catch (error) {
      console.error('Error storing documentation on GitHub:', error);
      throw error;
    }
  }

  private slugify(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-');
  }
} 