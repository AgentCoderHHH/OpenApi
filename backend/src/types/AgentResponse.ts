export interface AgentMetrics {
  processingTime: number;
  reasoningEffort: number;
  tokenCount: number;
  success: boolean;
  error?: string;
}

export interface AgentResponse {
  output: string;
  metrics: AgentMetrics;
} 