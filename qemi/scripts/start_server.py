#!/usr/bin/env python3
import os
import sys
import subprocess
import argparse
import time
import signal
import platform
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)

logger = logging.getLogger("server_launcher")

# Default ports
DEFAULT_DEBUGGER_PORT = 9229
DEFAULT_FILE_MONITOR_PORT = 9230

def parse_args():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description='Start Ender Debugger backend servers')
    parser.add_argument('--host', default='localhost', help='Host to bind the servers to')
    parser.add_argument('--debugger-port', type=int, default=DEFAULT_DEBUGGER_PORT, help='Port for the debugger server')
    parser.add_argument('--file-monitor-port', type=int, default=DEFAULT_FILE_MONITOR_PORT, help='Port for the file monitor server')
    parser.add_argument('--watch-paths', nargs='+', default=[], help='Paths to watch with the file monitor')
    parser.add_argument('--no-install', action='store_true', help='Skip package installation')
    return parser.parse_args()

def install_dependencies():
    """Install required Python packages"""
    logger.info("Installing required Python packages...")
    requirements = [
        "websockets",
        "watchdog",
        "debugpy",
        "pygments",
        "psutil"
    ]
    
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "--upgrade"] + requirements)
        logger.info("Dependencies installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"Failed to install dependencies: {e}")
        return False

def get_server_path():
    """Get the path to the backend server script"""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(script_dir, '..'))
    
    server_path = os.path.join(project_root, 'backend', 'src', 'main.py')
    
    if not os.path.exists(server_path):
        logger.error(f"Server script not found at {server_path}")
        sys.exit(1)
    
    return server_path

def start_server(args):
    """Start the backend server"""
    server_path = get_server_path()
    logger.info(f"Starting server from {server_path}")
    
    # Build command
    cmd = [
        sys.executable,
        server_path,
        "--host", args.host,
        "--port", str(args.debugger_port),
        "--file-monitor-port", str(args.file_monitor_port)
    ]
    
    # Add watch paths if specified
    if args.watch_paths:
        cmd.extend(["--watch-paths"] + args.watch_paths)
    
    logger.info(f"Running command: {' '.join(cmd)}")
    
    # Start the server process
    try:
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            universal_newlines=True,
            bufsize=1
        )
        
        # Set up a handler for graceful shutdown
        def signal_handler(sig, frame):
            logger.info("Shutting down server...")
            process.terminate()
            process.wait(timeout=5)
            sys.exit(0)
        
        signal.signal(signal.SIGINT, signal_handler)
        if platform.system() != 'Windows':
            signal.signal(signal.SIGTERM, signal_handler)
        
        # Print server output
        while True:
            line = process.stdout.readline()
            if not line:
                break
            print(line.rstrip())
        
        # Wait for process to complete
        return_code = process.wait()
        
        if return_code != 0:
            logger.error(f"Server exited with code {return_code}")
            return False
        
        return True
        
    except Exception as e:
        logger.error(f"Failed to start server: {e}")
        return False

def main():
    args = parse_args()
    
    # Install dependencies if needed
    if not args.no_install:
        if not install_dependencies():
            logger.error("Failed to install dependencies. Run with --no-install to skip this step.")
            return 1
    
    # Start the server
    if not start_server(args):
        logger.error("Server failed to start or ended with an error")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main()) 