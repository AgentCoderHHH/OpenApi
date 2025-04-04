import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs-extra';

// Load environment variables
dotenv.config();

export interface AIResponse {
  content: string;
  error?: string;
}

interface ErrorLog {
  timestamp: string;
  errorCode: string;
  message: string;
  details?: any;
  stack?: string;
}

class AIError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AIError';
  }
}

export class OpenAIService {
  private static instance: OpenAIService;
  private readonly openai: OpenAI;
  private readonly logPath: string;

  private constructor() {
    // Validate environment variables
    if (!process.env.OPENAI_API_KEY) {
      throw new AIError(
        'CONFIG_ERROR',
        'OpenAI API key not found in environment variables'
      );
    }

    // Initialize OpenAI client
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    // Path for error logs
    this.logPath = path.join(process.cwd(), 'logs');
    
    try {
      // Ensure logs directory exists
      fs.ensureDirSync(this.logPath);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error initializing OpenAI service';
      this.logError('INIT_ERROR', errorMessage, error);
      throw error;
    }
  }

  private logError(code: string, message: string, error?: any) {
    const errorLog: ErrorLog = {
      timestamp: new Date().toISOString(),
      errorCode: code,
      message: message,
      details: error ? {
        name: error.name,
        message: error.message,
        code: error instanceof AIError ? error.code : error.code
      } : undefined,
      stack: error?.stack
    };

    const logFile = path.join(this.logPath, 'openai-errors.log');
    const logEntry = JSON.stringify(errorLog, null, 2) + '\n---\n';

    try {
      fs.appendFileSync(logFile, logEntry);
    } catch (e) {
      console.error('Failed to write error log:', e);
    }

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('\nOpenAI Error:');
      console.error(JSON.stringify(errorLog, null, 2));
    }
  }

  static getInstance(): OpenAIService {
    if (!this.instance) {
      this.instance = new OpenAIService();
    }
    return this.instance;
  }

  async analyze(content: string): Promise<AIResponse> {
    try {
      if (!content.trim()) {
        throw new AIError(
          'EMPTY_CONTENT',
          'Content cannot be empty'
        );
      }

      const completion = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          {
            role: 'user',
            content: content
          }
        ],
        max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS || '2000'),
        temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7')
      });

      const response = completion.choices[0]?.message?.content;
      
      if (!response) {
        throw new AIError(
          'EMPTY_RESPONSE',
          'Received empty response from OpenAI'
        );
      }

      return { content: response };
    } catch (error) {
      if (error instanceof AIError) {
        this.logError(error.code, error.message, error);
        throw error;
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logError('API_ERROR', errorMessage, error);
        throw new AIError('API_ERROR', errorMessage, error);
      }
    }
  }

  // Method to get error logs
  async getErrorLogs(limit: number = 10): Promise<ErrorLog[]> {
    try {
      const logFile = path.join(this.logPath, 'openai-errors.log');
      if (!fs.existsSync(logFile)) {
        return [];
      }

      const content = await fs.readFile(logFile, 'utf-8');
      const logs = content.split('---\n')
        .filter(entry => entry.trim())
        .map(entry => JSON.parse(entry));

      return logs.slice(-limit);
    } catch (error) {
      console.error('Error reading error logs:', error);
      return [];
    }
  }
} 