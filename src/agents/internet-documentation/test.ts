import { InternetDocumentationAgent } from './InternetDocumentationAgent';
import { RunContext } from '../../types';

async function testInternetDocumentation() {
  const agent = new InternetDocumentationAgent();
  
  const context: RunContext = {
    input: {
      topic: "Quantum Computing",
      targetAudience: "technical",
      depth: "comprehensive",
      format: "markdown",
      sections: [
        "Introduction",
        "Core Concepts",
        "Quantum Algorithms",
        "Applications",
        "Current Challenges",
        "Future Outlook"
      ],
      maxTokens: 8000,
      reasoningEffort: "high",
      repoInfo: {
        owner: "your-github-username",
        repo: "quantum-computing-docs",
        branch: "main"
      }
    },
    startTime: Date.now()
  };

  try {
    const plan = await agent.plan(context);
    console.log("Generated Plan:", JSON.stringify(plan, null, 2));

    const result = await agent.execute(context, plan);
    console.log("\nDocumentation Generation Result:");
    console.log("Success:", result.success);
    console.log("Processing Time:", result.metrics.processingTime, "ms");
    console.log("Total Tokens:", result.metrics.totalTokens);
    console.log("Model Used:", result.metrics.model);

    if (result.success) {
      console.log("\nGenerated Documentation Preview:");
      console.log(result.output.content.substring(0, 500) + "...");
      
      if (result.output.knowledgeStore) {
        console.log("\nKnowledge Store Summary:");
        console.log("Sources:", result.output.knowledgeStore.sources.length);
        console.log("Key Insights:", result.output.knowledgeStore.keyInsights.length);
        console.log("Code Examples:", result.output.knowledgeStore.codeExamples.length);
        console.log("Best Practices:", result.output.knowledgeStore.bestPractices.length);
      }
    } else {
      console.error("Error:", result.output.error);
    }
  } catch (error) {
    console.error("Test failed:", error);
  }
}

// Run the test
testInternetDocumentation(); 