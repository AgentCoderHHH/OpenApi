"""
AgentOpenApi - A collection of AI agents for documentation and technical analysis
"""

# Import only what's needed for monitoring
from .monitoring import monitoring_server
from .monitoring_ui import start_monitoring

__all__ = ['monitoring_server', 'start_monitoring'] 