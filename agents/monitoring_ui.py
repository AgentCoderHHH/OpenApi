from flask import Flask, render_template, jsonify
import psutil
import time
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
from .monitoring import monitoring_server, API_CALLS, API_ERRORS, OPERATION_DURATION, ACTIVE_OPERATIONS
import threading
import os

app = Flask(__name__)

def get_system_metrics():
    """Get current system metrics"""
    return {
        'cpu_percent': psutil.cpu_percent(),
        'memory_percent': psutil.virtual_memory().percent,
        'memory_available': psutil.virtual_memory().available / (1024 * 1024 * 1024),  # GB
        'disk_usage': psutil.disk_usage('/').percent
    }

@app.route('/')
def index():
    """Render the monitoring dashboard"""
    return render_template('monitoring.html')

@app.route('/metrics')
def metrics():
    """Return Prometheus metrics"""
    return generate_latest(), 200, {'Content-Type': CONTENT_TYPE_LATEST}

@app.route('/api/system_metrics')
def system_metrics():
    """Return current system metrics"""
    return jsonify(get_system_metrics())

@app.route('/api/agent_metrics')
def agent_metrics():
    """Return agent-specific metrics"""
    metrics = {
        'api_calls': {},
        'api_errors': {},
        'operation_duration': {},
        'active_operations': {}
    }
    
    # Collect metrics from Prometheus collectors
    for sample in API_CALLS.collect():
        for s in sample.samples:
            metrics['api_calls'][f"{s.labels['agent']}_{s.labels['operation']}"] = s.value
    
    for sample in API_ERRORS.collect():
        for s in sample.samples:
            metrics['api_errors'][f"{s.labels['agent']}_{s.labels['operation']}_{s.labels['error_type']}"] = s.value
    
    for sample in OPERATION_DURATION.collect():
        for s in sample.samples:
            metrics['operation_duration'][f"{s.labels['agent']}_{s.labels['operation']}"] = s.value
    
    for sample in ACTIVE_OPERATIONS.collect():
        for s in sample.samples:
            metrics['active_operations'][s.labels['agent']] = s.value
    
    return jsonify(metrics)

def start_monitoring(host='0.0.0.0', port=5000):
    """Start the monitoring dashboard server"""
    # Ensure templates directory exists
    os.makedirs('templates', exist_ok=True)
    
    # Create monitoring template if it doesn't exist
    if not os.path.exists('templates/monitoring.html'):
        with open('templates/monitoring.html', 'w') as f:
            f.write('''
<!DOCTYPE html>
<html>
<head>
    <title>AgentOpenApi Monitoring Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .metric-card { 
            border: 1px solid #ddd; 
            padding: 15px; 
            margin: 10px; 
            border-radius: 5px; 
            display: inline-block;
            width: 200px;
        }
        .chart-container { 
            width: 100%; 
            height: 300px; 
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <h1>AgentOpenApi Monitoring Dashboard</h1>
    
    <div id="system-metrics">
        <h2>System Metrics</h2>
        <div class="metric-card">
            <h3>CPU Usage</h3>
            <div id="cpu-usage">Loading...</div>
        </div>
        <div class="metric-card">
            <h3>Memory Usage</h3>
            <div id="memory-usage">Loading...</div>
        </div>
        <div class="metric-card">
            <h3>Available Memory</h3>
            <div id="available-memory">Loading...</div>
        </div>
        <div class="metric-card">
            <h3>Disk Usage</h3>
            <div id="disk-usage">Loading...</div>
        </div>
    </div>

    <div class="chart-container">
        <canvas id="system-chart"></canvas>
    </div>

    <div id="agent-metrics">
        <h2>Agent Metrics</h2>
        <div class="chart-container">
            <canvas id="api-calls-chart"></canvas>
        </div>
        <div class="chart-container">
            <canvas id="api-errors-chart"></canvas>
        </div>
        <div class="chart-container">
            <canvas id="operation-duration-chart"></canvas>
        </div>
        <div class="chart-container">
            <canvas id="active-operations-chart"></canvas>
        </div>
    </div>

    <script>
        // System metrics update
        function updateSystemMetrics() {
            fetch('/api/system_metrics')
                .then(response => response.json())
                .then(data => {
                    document.getElementById('cpu-usage').textContent = data.cpu_percent + '%';
                    document.getElementById('memory-usage').textContent = data.memory_percent + '%';
                    document.getElementById('available-memory').textContent = data.memory_available.toFixed(2) + ' GB';
                    document.getElementById('disk-usage').textContent = data.disk_usage + '%';
                    
                    // Update charts
                    updateSystemChart(data);
                });
        }

        // Agent metrics update
        function updateAgentMetrics() {
            fetch('/api/agent_metrics')
                .then(response => response.json())
                .then(data => {
                    updateApiCallsChart(data.api_calls);
                    updateApiErrorsChart(data.api_errors);
                    updateOperationDurationChart(data.operation_duration);
                    updateActiveOperationsChart(data.active_operations);
                });
        }

        // Chart initialization and updates
        let systemChart = new Chart(
            document.getElementById('system-chart'),
            {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [
                        { label: 'CPU %', data: [] },
                        { label: 'Memory %', data: [] },
                        { label: 'Disk %', data: [] }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            }
        );

        function updateSystemChart(data) {
            const now = new Date().toLocaleTimeString();
            systemChart.data.labels.push(now);
            systemChart.data.datasets[0].data.push(data.cpu_percent);
            systemChart.data.datasets[1].data.push(data.memory_percent);
            systemChart.data.datasets[2].data.push(data.disk_usage);
            
            if (systemChart.data.labels.length > 20) {
                systemChart.data.labels.shift();
                systemChart.data.datasets.forEach(dataset => dataset.data.shift());
            }
            
            systemChart.update();
        }

        // Initialize other charts similarly...

        // Update metrics every 5 seconds
        setInterval(updateSystemMetrics, 5000);
        setInterval(updateAgentMetrics, 5000);
        
        // Initial update
        updateSystemMetrics();
        updateAgentMetrics();
    </script>
</body>
</html>
            ''')
    
    # Start the Flask server
    app.run(host=host, port=port) 