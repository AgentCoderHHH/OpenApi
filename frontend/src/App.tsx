import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

interface Agent {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
}

interface ExecutionResult {
  success: boolean;
  output: any;
  error?: string;
  metrics: {
    duration: number;
    resourceUsage: {
      cpu: number;
      memory: number;
      network: number;
    };
  };
}

interface AgentResponse {
  success: boolean;
  output?: string;
  metrics: {
    duration: number;
    researchIterations: number;
    totalTokens: number;
    processingTime: number;
    reasoningEffort: number;
    model: string;
  };
}

function App() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [results, setResults] = useState<ExecutionResult[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [input, setInput] = useState<string>('');
  const [response, setResponse] = useState<AgentResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddAgent = () => {
    const newAgent: Agent = {
      id: Date.now().toString(),
      name: `Agent ${agents.length + 1}`,
      description: 'A specialized agent',
      capabilities: ['capability1', 'capability2']
    };
    setAgents([...agents, newAgent]);
  };

  const handleExecute = async () => {
    try {
      const result = await axios.post<AgentResponse>('http://localhost:3001/execute', {
        agentId: selectedAgent,
        input
      });
      setResponse(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const result = await axios.post<AgentResponse>('http://localhost:3001/execute', {
        input
      }, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      setResponse(result.data);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.code === 'ECONNABORTED') {
          setError('Request timed out. Please try again.');
        } else if (err.response) {
          setError(`Server error: ${err.response.status} - ${err.response.data.error || 'Unknown error'}`);
        } else if (err.request) {
          setError('Network error: Could not connect to the server. Please make sure the backend is running.');
        } else {
          setError(`Error: ${err.message}`);
        }
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatOutput = (output: string | undefined): string => {
    if (!output) return '';
    return output.replace(/\n/g, '<br/>');
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Agent Orchestration System</h1>
      </header>
      <main>
        <div className="container">
          <div className="agents-section">
            <h2>Agents</h2>
            <button onClick={handleAddAgent}>Add Agent</button>
            <div className="agents-list">
              {agents.map(agent => (
                <div key={agent.id} className="agent-card">
                  <h3>{agent.name}</h3>
                  <p>{agent.description}</p>
                  <div className="capabilities">
                    {agent.capabilities.map(cap => (
                      <span key={cap} className="capability-tag">{cap}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="execute-section">
            <h2>Execute</h2>
            <select 
              value={selectedAgent} 
              onChange={(e) => setSelectedAgent(e.target.value)}
            >
              <option value="">Select an agent</option>
              {agents.map(agent => (
                <option key={agent.id} value={agent.id}>{agent.name}</option>
              ))}
            </select>
            
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter input for the agent..."
              rows={4}
            />
            
            <button onClick={handleExecute}>Execute</button>
          </div>
          <div className="results-section">
            <h2>Results</h2>
            <div className="results-content">
              {results.map((result, index) => (
                <div key={index} className="result-card">
                  <h3>Execution {index + 1}</h3>
                  <p>Status: {result.success ? 'Success' : 'Failed'}</p>
                  {result.error && <p className="error">Error: {result.error}</p>}
                  {result.output && (
                    <div className="output-section">
                      <h4>Agent Response:</h4>
                      <pre>{typeof result.output === 'string' ? result.output : JSON.stringify(result.output, null, 2)}</pre>
                    </div>
                  )}
                  <div className="metrics">
                    <h4>Performance Metrics:</h4>
                    <p>Duration: {result.metrics.duration.toFixed(2)}ms</p>
                    <p>CPU: {result.metrics.resourceUsage.cpu.toFixed(2)}%</p>
                    <p>Memory: {result.metrics.resourceUsage.memory.toFixed(2)}%</p>
                    <p>Network: {result.metrics.resourceUsage.network.toFixed(2)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="response-section">
            <h2>Response</h2>
            <form onSubmit={handleSubmit}>
              <div>
                <label htmlFor="input">Enter your research topic:</label>
                <textarea
                  id="input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  rows={4}
                  placeholder="Type your research topic here..."
                  disabled={loading}
                />
              </div>
              <button type="submit" disabled={loading || !input.trim()}>
                {loading ? 'Researching...' : 'Research Topic'}
              </button>
            </form>

            {error && (
              <div className="error">
                <h3>Error</h3>
                <p>{error}</p>
              </div>
            )}

            {response && (
              <div className="response">
                <h3>Research Results</h3>
                {response.output ? (
                  <div className="output" dangerouslySetInnerHTML={{ __html: formatOutput(response.output) }} />
                ) : (
                  <p>No output available</p>
                )}
                <div className="metrics">
                  <h4>Research Metrics</h4>
                  <p>Duration: {response.metrics.duration.toFixed(2)}ms</p>
                  <p>Research Iterations: {response.metrics.researchIterations}</p>
                  <p>Total Tokens: {response.metrics.totalTokens}</p>
                  <p>Processing Time: {response.metrics.processingTime}ms</p>
                  <p>Reasoning Effort: {(response.metrics.reasoningEffort * 100).toFixed(0)}%</p>
                  <p>Model: {response.metrics.model}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App; 