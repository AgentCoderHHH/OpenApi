from flask import Flask, render_template, jsonify
from agents.utils.performance import PerformanceMonitor, get_system_metrics
import threading
import time
import json
from typing import Dict, Any

app = Flask(__name__)
performance_monitor = PerformanceMonitor()

def collect_metrics():
    """Background thread to collect system metrics."""
    while True:
        system_metrics = get_system_metrics()
        performance_monitor.track_metric("system", system_metrics)
        time.sleep(5)  # Collect metrics every 5 seconds

@app.route('/')
def index():
    """Render the main dashboard page."""
    return render_template('dashboard.html')

@app.route('/api/metrics')
def get_metrics():
    """API endpoint to get current metrics."""
    metrics = performance_monitor.get_metrics()
    return jsonify(metrics)

@app.route('/api/system')
def get_system():
    """API endpoint to get current system metrics."""
    return jsonify(get_system_metrics())

def start_monitoring(host: str = '0.0.0.0', port: int = 5000):
    """Start the monitoring dashboard."""
    # Start metrics collection thread
    metrics_thread = threading.Thread(target=collect_metrics, daemon=True)
    metrics_thread.start()
    
    # Start Flask app
    app.run(host=host, port=port) 