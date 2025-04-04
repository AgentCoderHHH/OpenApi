import { OpenAIService } from './services/OpenAIService';

async function test() {
  try {
    console.log('Initializing OpenAI service...');
    const openai = OpenAIService.getInstance();

    console.log('Sending test message to OpenAI...');
    const response = await openai.analyze('Hi! Please respond with a simple "Hello!" to confirm you received this message.');
    
    console.log('\nResponse from OpenAI:');
    console.log(response.content);

    // Get and display the last 3 error logs (if any)
    const errorLogs = await openai.getErrorLogs(3);
    if (errorLogs.length > 0) {
      console.log('\nLast 3 error logs:');
      console.log(JSON.stringify(errorLogs, null, 2));
    }

  } catch (error) {
    console.error('\nTest failed with error:', error);
    process.exit(1);
  }

  process.exit(0);
}

test(); 