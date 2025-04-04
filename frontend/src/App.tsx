import React, { useState } from 'react';
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

function App() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [results, setResults] = useState<ExecutionResult[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [input, setInput] = useState<string>('');

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
      const response = await fetch('http://localhost:3001/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId: selectedAgent,
          input: input
        }),
      });
      const result = await response.json();
      setResults([...results, result]);
    } catch (error) {
      console.error('Execution failed:', error);
    }
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
        </div>
      </main>
    </div>
  );
}

export default App; 