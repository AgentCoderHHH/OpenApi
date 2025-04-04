import { PromptEngineeringServer } from './PromptEngineeringServer';
import { Configuration } from '../PromptEngineeringAgent';

async function testMCPServer() {
  // Create server configuration
  const config: Configuration = {
    optimizationStrategy: 'balanced',
    contextManagement: 'isolated',
    historyTracking: true,
    performanceMetrics: true
  };

  // Create and connect to the server
  const server = new PromptEngineeringServer(config);
  await server.connect();

  try {
    // List available tools
    const tools = await server.listTools();
    console.log('Available tools:', tools);

    // Add a prompt template
    const addPromptResult = await server.callTool('addPrompt', {
      template: "Given {context}, please {action}",
      context: { domain: "AI" },
      parameters: {
        context: "a programming problem",
        action: "suggest a solution"
      }
    });

    if (!addPromptResult.success) {
      throw new Error(`Failed to add prompt: ${addPromptResult.error}`);
    }

    const promptId = addPromptResult.result;
    console.log('Added prompt with ID:', promptId);

    // Process the prompt with custom parameters
    const processResult = await server.callTool('processPrompt', {
      promptId,
      parameters: {
        context: "a TypeScript error",
        action: "explain how to fix it"
      }
    });

    if (!processResult.success) {
      throw new Error(`Failed to process prompt: ${processResult.error}`);
    }

    console.log('Processed prompt:', processResult.result);

    // Record a response
    const recordResult = await server.callTool('recordResponse', {
      promptId,
      response: "To fix this TypeScript error, you should...",
      metadata: {
        modelUsed: "gpt-4",
        tokensUsed: 50,
        processingTime: 200,
        confidence: 0.95
      }
    });

    if (!recordResult.success) {
      throw new Error(`Failed to record response: ${recordResult.error}`);
    }

    console.log('Recorded response with ID:', recordResult.result);

    // Get metrics
    const metricsResult = await server.callTool('getPromptMetrics', {
      promptId
    });

    if (!metricsResult.success) {
      throw new Error(`Failed to get metrics: ${metricsResult.error}`);
    }

    console.log('Prompt metrics:', metricsResult.result);

    // Optimize the prompt
    const optimizeResult = await server.callTool('optimizePrompt', {
      promptId
    });

    if (!optimizeResult.success) {
      throw new Error(`Failed to optimize prompt: ${optimizeResult.error}`);
    }

    console.log('Optimized prompt:', optimizeResult.result);

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    // Cleanup
    await server.cleanup();
  }
}

// Run the test
testMCPServer().catch(console.error); 