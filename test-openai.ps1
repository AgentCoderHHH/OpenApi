# Get API key from .env file
$env:OPENAI_API_KEY = (Get-Content .env | Where-Object { $_ -match '^OPENAI_API_KEY=' } | ForEach-Object { $_.Split('=')[1] })

# Set up headers and request body
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $env:OPENAI_API_KEY"
}

$body = @{
    "model" = "gpt-4"
    "messages" = @(
        @{
            "role" = "user"
            "content" = "Write a short motivational message for a programmer who's been debugging all day."
        }
    )
    "max_tokens" = 100
    "temperature" = 0.8
} | ConvertTo-Json

# Make the API call
$response = Invoke-WebRequest -Uri "https://api.openai.com/v1/chat/completions" -Method Post -Headers $headers -Body $body -ContentType "application/json"

# Parse and display the response
$result = $response.Content | ConvertFrom-Json
Write-Host "`nOpenAI Response:"
Write-Host $result.choices[0].message.content 

await server.connect(); 

# List available tools
const tools = await server.listTools();

# Add a prompt
const result = await server.callTool('addPrompt', {
  template: "Your template here",
  context: { /* context data */ },
  parameters: { /* parameters */ }
}); 

await server.cleanup(); 

class MySpecializedAgent implements IAgent {
  id: string = uuidv4();
  name: string = 'MyAgent';
  description: string = 'My agent description';
  capabilities: string[] = ['capability1', 'capability2'];

  async learn(context: RunContext): Promise<void> { /* ... */ }
  async plan(context: RunContext): Promise<ActionPlan> { /* ... */ }
  async execute(context: RunContext, plan: ActionPlan): Promise<ExecutionResult> { /* ... */ }
} 

const orchestrator = new AgentOrchestrator();
const myAgent = new MySpecializedAgent();
orchestrator.registerAgent(myAgent); 

# LLM-based orchestration
const llmResults = await orchestrator.orchestrateLLM(context);

# Code-based orchestration
const codeResults = await orchestrator.orchestrateCode(context, predefinedFlow);

# Parallel execution
const parallelResults = await orchestrator.executeParallel(context, plans); 

const evaluation = await orchestrator.evaluateExecution(results); 