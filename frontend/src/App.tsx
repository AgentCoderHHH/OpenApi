import React, { useState } from 'react';
import './App.css';

interface AgentResponse {
  success: boolean;
  documentationOutput?: string;
  technicalOutput?: string;
  elaboratorOutput?: string;
  error?: string;
  metrics?: {
    documentation?: AgentMetrics;
    technical?: AgentMetrics;
    elaborator?: AgentMetrics;
  };
}

interface AgentMetrics {
  researchIterations: number;
  totalTokens: number;
  processingTime: number;
  reasoningEffort: number;
  model: string;
}

function App() {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState<AgentResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('http://localhost:3001/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input }),
      });

      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setError('Failed to fetch response');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatOutput = (output?: string) => {
    if (!output) return '';
    return output.replace(/\n/g, '<br />');
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Documentation Generator</h1>
      </header>

      <main>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="input">Enter your topic:</label>
            <input
              type="text"
              id="input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter your topic here..."
              required
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Generating...' : 'Generate Documentation'}
          </button>
        </form>

        {error && <div className="error">{error}</div>}

        {response && (
          <div className="response-container">
            {response.documentationOutput && (
              <section className="documentation-section">
                <h2>Documentation Agent Response</h2>
                <div
                  className="output"
                  dangerouslySetInnerHTML={{
                    __html: formatOutput(response.documentationOutput),
                  }}
                />
                {response.metrics?.documentation && (
                  <div className="metrics">
                    <h3>Metrics</h3>
                    <ul>
                      <li>Processing Time: {response.metrics.documentation.processingTime}ms</li>
                      <li>Reasoning Effort: {response.metrics.documentation.reasoningEffort}</li>
                      <li>Total Tokens: {response.metrics.documentation.totalTokens}</li>
                      <li>Research Iterations: {response.metrics.documentation.researchIterations}</li>
                      <li>Model: {response.metrics.documentation.model}</li>
                    </ul>
                  </div>
                )}
              </section>
            )}

            {response.technicalOutput && (
              <section className="technical-section">
                <h2>Technical Documentation Agent Response</h2>
                <div
                  className="output"
                  dangerouslySetInnerHTML={{
                    __html: formatOutput(response.technicalOutput),
                  }}
                />
                {response.metrics?.technical && (
                  <div className="metrics">
                    <h3>Metrics</h3>
                    <ul>
                      <li>Processing Time: {response.metrics.technical.processingTime}ms</li>
                      <li>Reasoning Effort: {response.metrics.technical.reasoningEffort}</li>
                      <li>Total Tokens: {response.metrics.technical.totalTokens}</li>
                      <li>Research Iterations: {response.metrics.technical.researchIterations}</li>
                      <li>Model: {response.metrics.technical.model}</li>
                    </ul>
                  </div>
                )}
              </section>
            )}

            {response.elaboratorOutput && (
              <section className="elaborator-section">
                <h2>Technical Documentation Elaborator Response</h2>
                <div
                  className="output"
                  dangerouslySetInnerHTML={{
                    __html: formatOutput(response.elaboratorOutput),
                  }}
                />
                {response.metrics?.elaborator && (
                  <div className="metrics">
                    <h3>Metrics</h3>
                    <ul>
                      <li>Processing Time: {response.metrics.elaborator.processingTime}ms</li>
                      <li>Reasoning Effort: {response.metrics.elaborator.reasoningEffort}</li>
                      <li>Total Tokens: {response.metrics.elaborator.totalTokens}</li>
                      <li>Research Iterations: {response.metrics.elaborator.researchIterations}</li>
                      <li>Model: {response.metrics.elaborator.model}</li>
                    </ul>
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App; 