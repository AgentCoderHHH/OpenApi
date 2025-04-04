import { DocumentationMakerAgent } from '../DocumentationMakerAgent';
import { RunContext } from '../../types';

async function testDocumentationMaker() {
    const agent = new DocumentationMakerAgent();
    
    const context: RunContext = {
        input: {
            topic: "Quantum Computing",
            targetAudience: "technical",
            depth: "comprehensive",
            format: "markdown",
            sections: [
                "Introduction",
                "Quantum Principles",
                "Quantum Gates",
                "Quantum Algorithms",
                "Applications",
                "Current Challenges",
                "Future Outlook"
            ],
            maxTokens: 8000,
            reasoningEffort: "high" // Using high reasoning effort for complex topic
        },
        startTime: Date.now()
    };

    try {
        const plan = await agent.plan(context);
        console.log("Documentation Plan:", plan);

        const result = await agent.execute(context, plan);
        console.log("\nDocumentation Generated Successfully!");
        console.log("\nMetrics:", result.metrics);
        console.log("\nDocumentation Sections:", result.output.sections);
        console.log("\nEstimated Tokens Used:", result.output.estimatedTokens);
        
        if (result.output.reasoningSteps && result.output.reasoningSteps.length > 0) {
            console.log("\nReasoning Steps:");
            result.output.reasoningSteps.forEach((step: string, index: number) => {
                console.log(`\nStep ${index + 1}:`, step);
            });
        }
        
        // Save the documentation to a file
        const fs = require('fs');
        fs.writeFileSync('quantum_computing_documentation.md', result.output.content);
        console.log("\nDocumentation saved to quantum_computing_documentation.md");
        
    } catch (error) {
        console.error("Error generating documentation:", error);
    }
}

testDocumentationMaker(); 