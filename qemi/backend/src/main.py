import os
import sys
import asyncio
import logging
import argparse
from file_monitor import FileMonitor

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

# Parse command line arguments
def parse_args():
    parser = argparse.ArgumentParser(description='Ender File Monitor Server')
    parser.add_argument('--host', default='localhost', help='Host to bind the server to')
    parser.add_argument('--port', type=int, default=9230, help='Port for the file monitor server')
    parser.add_argument('--watch-paths', nargs='+', default=[], help='Paths to watch with the file monitor')
    return parser.parse_args()

async def main():
    args = parse_args()
    
    try:
        # Start the file monitor
        file_monitor = FileMonitor()
        
        # Start file monitor
        file_monitor.start(args.watch_paths, lambda change: logger.info(f"File change: {change['type']} - {change['path']}"))
        logger.info(f"File monitor started watching: {args.watch_paths}")
        
        # Create a future that never completes
        # We'll cancel it when we want to stop the server
        stop_future = asyncio.Future()
        
        # Wait until we're interrupted
        try:
            await stop_future
        except asyncio.CancelledError:
            logger.info("Server shutting down")
            
        # Stop the file monitor
        file_monitor.stop()
            
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    try:
        exit_code = asyncio.run(main())
        sys.exit(exit_code)
    except KeyboardInterrupt:
        logger.info("Server stopped by user")
        sys.exit(0) 