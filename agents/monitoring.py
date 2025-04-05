from prometheus_client import Counter, Histogram, Gauge, start_http_server
from functools import wraps
import time
import threading
from typing import Callable, Any
from loguru import logger
import os
from pathlib import Path

# Ensure logs directory exists
Path("logs").mkdir(exist_ok=True)

# Prometheus metrics
API_CALLS = Counter(
    'api_calls_total',
    'Total number of API calls',
    ['agent', 'operation']
)

API_ERRORS = Counter(
    'api_errors_total',
    'Total number of API errors',
    ['agent', 'operation', 'error_type']
)

OPERATION_DURATION = Histogram(
    'operation_duration_seconds',
    'Time spent in operations',
    ['agent', 'operation'],
    buckets=(0.1, 0.5, 1.0, 2.0, 5.0, 10.0, float('inf'))
)

ACTIVE_OPERATIONS = Gauge(
    'active_operations',
    'Number of currently active operations',
    ['agent']
)

class MonitoringServer:
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super().__new__(cls)
                cls._instance.initialized = False
            return cls._instance
    
    def __init__(self):
        if not self.initialized:
            self.port = int(os.getenv("METRICS_PORT", "8000"))
            self.started = False
            self.initialized = True
    
    def start(self):
        """Start the Prometheus metrics server in a separate thread"""
        if not self.started:
            try:
                def run_server():
                    start_http_server(self.port)
                    logger.info(f"Prometheus metrics server started on port {self.port}")
                
                thread = threading.Thread(target=run_server, daemon=True)
                thread.start()
                self.started = True
            except Exception as e:
                logger.error(f"Failed to start Prometheus server: {e}")

def monitor(agent: str, operation: str) -> Callable:
    """Decorator to monitor agent operations"""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs) -> Any:
            start_time = time.time()
            ACTIVE_OPERATIONS.labels(agent=agent).inc()
            API_CALLS.labels(agent=agent, operation=operation).inc()
            
            try:
                result = await func(*args, **kwargs)
                duration = time.time() - start_time
                OPERATION_DURATION.labels(
                    agent=agent,
                    operation=operation
                ).observe(duration)
                return result
            except Exception as e:
                API_ERRORS.labels(
                    agent=agent,
                    operation=operation,
                    error_type=type(e).__name__
                ).inc()
                raise
            finally:
                ACTIVE_OPERATIONS.labels(agent=agent).dec()
                
        return wrapper
    return decorator

# Configure Loguru logger
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
LOG_FORMAT = "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>"

logger.remove()  # Remove default handler
logger.add(
    "logs/agent_system.log",
    rotation="500 MB",
    retention="10 days",
    compression="zip",
    format=LOG_FORMAT,
    level=LOG_LEVEL,
    backtrace=True,
    diagnose=True
)
logger.add(
    "logs/errors.log",
    rotation="100 MB",
    retention="7 days",
    compression="zip",
    format=LOG_FORMAT,
    level="ERROR",
    backtrace=True,
    diagnose=True,
    filter=lambda record: record["level"].name == "ERROR"
)

# Add console output for non-production environments
if os.getenv("ENVIRONMENT", "development") != "production":
    logger.add(
        lambda msg: print(msg, end=""),
        format=LOG_FORMAT,
        level=LOG_LEVEL,
        colorize=True
    )

# Initialize monitoring server
monitoring_server = MonitoringServer()
monitoring_server.start() 