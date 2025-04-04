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
            "role" = "system"
            "content" = "You are a technical expert in AI agent orchestration and implementation. Provide detailed, practical advice on implementing agent patterns."
        },
        @{
            "role" = "user"
            "content" = "I'm implementing an AI agent system with multiple specialized agents. I need guidance on:

1. How to implement agent orchestration patterns in TypeScript, specifically:
   - LLM-based orchestration where agents can autonomously plan and delegate
   - Code-based orchestration for deterministic flows
   - Mixed approaches combining both patterns

2. Best practices for:
   - Agent communication and handoffs
   - Context management between agents
   - Error handling and recovery
   - Performance monitoring and optimization

3. Implementation details for:
   - RunContext management
   - Tool integration
   - Agent specialization
   - Parallel execution
   - Evaluation and feedback loops

Please provide:
- TypeScript interfaces and classes for core components
- Example implementations of different orchestration patterns
- Code snippets showing agent interactions
- Best practices for each pattern
- Common pitfalls to avoid"
        }
    )
    "max_tokens" = 2000
    "temperature" = 0.7
} | ConvertTo-Json

# Make the API call
$response = Invoke-WebRequest -Uri "https://api.openai.com/v1/chat/completions" -Method Post -Headers $headers -Body $body -ContentType "application/json"

# Parse and display the response
$result = $response.Content | ConvertFrom-Json
Write-Host "`nOpenAI Response:"
Write-Host $result.choices[0].message.content 