# Get API key from .env file
$env:OPENAI_API_KEY = (Get-Content .env | Where-Object { $_ -match '^OPENAI_API_KEY=' } | ForEach-Object { $_.Split('=')[1] })

# Set up headers
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $env:OPENAI_API_KEY"
}

# Create the prompt
$prompt = @"
Create a detailed technical specification for a PromptEngineeringAgent class in TypeScript that will help optimize and manage prompts for AI interactions. The specification should include:

1. TypeScript Interfaces and Types:
   - Define all necessary types for prompts, responses, and configurations
   - Include proper documentation for each type

2. Class Structure:
   - Core PromptEngineeringAgent class
   - Methods for prompt optimization and management
   - Utility methods for common operations
   - Configuration management

3. Features:
   - Template management for different prompt types
   - Prompt optimization and refinement
   - Context management
   - History tracking
   - Performance metrics

4. Error Handling:
   - Custom error types
   - Error recovery strategies
   - Logging mechanisms

5. Integration Patterns:
   - How to integrate with existing applications
   - Example usage patterns
   - Best practices

6. Code Examples:
   - Implementation examples
   - Usage scenarios
   - Integration examples

Please provide a complete technical specification that can be implemented as a single TypeScript file.
"@

# Create request body
$body = @{
    "model" = "gpt-4"
    "messages" = @(
        @{
            "role" = "user"
            "content" = $prompt
        }
    )
    "max_tokens" = 2000
    "temperature" = 0.7
} | ConvertTo-Json -Depth 10

# Make the API call
$response = Invoke-WebRequest -Uri "https://api.openai.com/v1/chat/completions" -Method Post -Headers $headers -Body $body -ContentType "application/json"

# Parse and display the response
$result = $response.Content | ConvertFrom-Json
Write-Host "`nOpenAI Technical Specification:"
Write-Host "================================`n"
Write-Host $result.choices[0].message.content 