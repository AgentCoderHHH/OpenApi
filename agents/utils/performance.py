import time
import functools
from typing import Any, Callable, Dict, Optional
import logging
from memory_profiler import profile
import psutil
import threading

logger = logging.getLogger(__name__)

class PerformanceMonitor:
    def __init__(self):
        self.metrics: Dict[str, Dict[str, Any]] = {}
        self._lock = threading.Lock()
        
    def track_metric(self, name: str, value: Any, tags: Optional[Dict[str, str]] = None):
        """Track a performance metric with optional tags."""
        with self._lock:
            if name not in self.metrics:
                self.metrics[name] = {"values": [], "tags": []}
            self.metrics[name]["values"].append(value)
            if tags:
                self.metrics[name]["tags"].append(tags)
                
    def get_metrics(self) -> Dict[str, Dict[str, Any]]:
        """Get all tracked metrics."""
        return self.metrics.copy()
        
    def reset_metrics(self):
        """Reset all tracked metrics."""
        with self._lock:
            self.metrics.clear()

def measure_time(func: Callable) -> Callable:
    """Decorator to measure function execution time."""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()
        execution_time = end_time - start_time
        logger.info(f"Function {func.__name__} took {execution_time:.2f} seconds to execute")
        return result
    return wrapper

def measure_memory(func: Callable) -> Callable:
    """Decorator to measure function memory usage."""
    @profile
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper

class Cache:
    def __init__(self, max_size: int = 1000):
        self.cache: Dict[str, Any] = {}
        self.max_size = max_size
        self._lock = threading.Lock()
        
    def get(self, key: str) -> Optional[Any]:
        """Get a value from the cache."""
        with self._lock:
            return self.cache.get(key)
            
    def set(self, key: str, value: Any):
        """Set a value in the cache."""
        with self._lock:
            if len(self.cache) >= self.max_size:
                # Remove oldest item
                self.cache.pop(next(iter(self.cache)))
            self.cache[key] = value
            
    def clear(self):
        """Clear the cache."""
        with self._lock:
            self.cache.clear()

def get_system_metrics() -> Dict[str, float]:
    """Get current system metrics."""
    cpu_percent = psutil.cpu_percent(interval=1)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    
    return {
        "cpu_percent": cpu_percent,
        "memory_percent": memory.percent,
        "memory_available_gb": memory.available / (1024 ** 3),
        "disk_percent": disk.percent,
        "disk_free_gb": disk.free / (1024 ** 3)
    } 