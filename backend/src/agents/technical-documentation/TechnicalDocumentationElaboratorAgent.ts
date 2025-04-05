import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { IAgent, RunContext, ActionPlan, ExecutionResult } from '../../types';
import { Agent } from '../Agent';

dotenv.config();

export class TechnicalDocumentationElaboratorAgent extends Agent implements IAgent {
  id: string = uuidv4();
  name: string = 'Technical Documentation Elaborator Agent';
  description: string = 'Creates comprehensive production plans with implementation steps and visual diagrams';
  capabilities: string[] = [
    'technical-planning',
    'implementation-guide',
    'diagram-generation',
    'production-mapping'
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
          action: 'analyze_requirements',
          description: 'Analyze technical requirements and documentation',
          parameters: { input: context.input }
        },
        {
          action: 'generate_architecture',
          description: 'Generate system architecture and components',
          parameters: { input: context.input }
        },
        {
          action: 'create_implementation_plan',
          description: 'Create detailed implementation plan',
          parameters: { input: context.input }
        },
        {
          action: 'generate_diagrams',
          description: 'Generate Mermaid diagrams for visualization',
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
        throw new Error('No input provided for production plan generation');
      }

      console.log('Generating production plan for:', context.input);
      
      // Step 1: Analyze requirements and create architecture
      const architectureResponse = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are a technical architect and implementation expert. Analyze the provided documentation and create a comprehensive production plan.
            Include:
            1. System Architecture Overview
            2. Core Components and Their Relationships
            3. Data Flow and Processing
            4. Integration Points
            5. Security Considerations
            6. Performance Requirements
            
            Use Mermaid diagrams for visualization where appropriate.`
          },
          {
            role: "user",
            content: `Create a production plan for: ${context.input}`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      console.log('Architecture response received');
      const architecture = architectureResponse.choices[0].message.content || '';

      // Step 2: Generate implementation steps
      const implementationResponse = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `Based on the architecture, create a detailed implementation plan with:
            1. Development Phases
            2. Component Implementation Order
            3. Testing Strategy
            4. Deployment Steps
            5. Monitoring and Maintenance
            
            Include Mermaid diagrams for:
            - Development Workflow
            - Deployment Pipeline
            - Monitoring Architecture`
          },
          {
            role: "user",
            content: `Create implementation steps for: ${architecture}`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      console.log('Implementation response received');
      const implementation = implementationResponse.choices[0].message.content || '';

      // Step 3: Generate best practices and recommendations
      const recommendationsResponse = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `Based on the architecture and implementation plan, provide:
            1. Best Practices for Each Component
            2. Performance Optimization Tips
            3. Security Recommendations
            4. Scalability Considerations
            5. Maintenance Guidelines
            
            Include Mermaid diagrams for:
            - Performance Optimization Flow
            - Security Architecture
            - Scalability Strategy`
          },
          {
            role: "user",
            content: `Provide recommendations for: ${implementation}`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      console.log('Recommendations response received');
      const recommendations = recommendationsResponse.choices[0].message.content || '';

      // Combine all responses into a comprehensive plan
      const elaboration = `# Production Implementation Plan

## 1. System Architecture
${architecture}

## 2. Implementation Steps
${implementation}

## 3. Best Practices and Recommendations
${recommendations}

## 4. Visual Diagrams
The following Mermaid diagrams provide visual representations of the system:

### System Architecture
\`\`\`mermaid
graph TD
    A[Client] --> B[API Gateway]
    B --> C[Authentication Service]
    B --> D[Core Service]
    D --> E[Database]
    D --> F[Cache]
    D --> G[Message Queue]
\`\`\`

### Development Workflow
\`\`\`mermaid
graph LR
    A[Planning] --> B[Development]
    B --> C[Testing]
    C --> D[Deployment]
    D --> E[Monitoring]
    E --> A
\`\`\`

### Security Architecture
\`\`\`mermaid
graph TD
    A[Client] -->|HTTPS| B[API Gateway]
    B -->|JWT| C[Auth Service]
    C -->|RBAC| D[Services]
    D -->|Encryption| E[Data Storage]
\`\`\`
`;

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      return {
        success: true,
        output: elaboration,
        metrics: {
          processingTime,
          reasoningEffort: 0.9,
          researchIterations: 3,
          totalTokens: (architectureResponse.usage?.total_tokens || 0) + 
                      (implementationResponse.usage?.total_tokens || 0) + 
                      (recommendationsResponse.usage?.total_tokens || 0),
          model: "gpt-4"
        }
      };
    } catch (error) {
      console.error('Error in TechnicalDocumentationElaboratorAgent:', error);
      const endTime = Date.now();
      const processingTime = endTime - startTime;

      return {
        success: false,
        output: `Error creating production plan: ${error instanceof Error ? error.message : 'Unknown error'}`,
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