#!/usr/bin/env python3
from agents.monitoring_ui import start_monitoring
import argparse

def main():
    parser = argparse.ArgumentParser(description='Start the AgentOpenApi monitoring dashboard')
    parser.add_argument('--host', default='0.0.0.0', help='Host to bind the server to')
    parser.add_argument('--port', type=int, default=5000, help='Port to bind the server to')
    
    args = parser.parse_args()
    
    print(f"Starting monitoring dashboard on {args.host}:{args.port}")
    print("Press Ctrl+C to stop")
    
    try:
        start_monitoring(host=args.host, port=args.port)
    except KeyboardInterrupt:
        print("\nStopping monitoring dashboard...")

if __name__ == '__main__':
    main() 