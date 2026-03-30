import asyncio
import websockets
import json
import logging
import os
from typing import Set, Dict, Any
from file_monitor import FileMonitor

class WebSocketServer:
    def __init__(self):
        self.clients: Set[websockets.WebSocketServerProtocol] = set()
        self.file_monitor = FileMonitor()
        self.loop = None

    async def handle_message(self, message: Dict[str, Any], websocket: websockets.WebSocketServerProtocol):
        """Handle incoming WebSocket messages."""
        if message.get('type') == 'create_project':
            project_name = message.get('name')
            if project_name:
                workspace_path = self.file_monitor.get_workspace_path()
                project_path = os.path.join(workspace_path, project_name)
                
                try:
                    # Create project directory and structure
                    os.makedirs(project_path, exist_ok=True)
                    os.makedirs(os.path.join(project_path, 'src'), exist_ok=True)
                    os.makedirs(os.path.join(project_path, 'tests'), exist_ok=True)
                    os.makedirs(os.path.join(project_path, 'docs'), exist_ok=True)
                    
                    # Create README.md
                    readme_path = os.path.join(project_path, 'README.md')
                    if not os.path.exists(readme_path):
                        with open(readme_path, 'w') as f:
                            f.write(f"# {project_name}\n\nThis is a project managed by Ender Debugger.\n")
                    
                    # Notify client of success
                    await websocket.send(json.dumps({
                        'type': 'project_created',
                        'name': project_name,
                        'path': project_path
                    }))
                except Exception as e:
                    logging.error(f"Error creating project: {e}")
                    await websocket.send(json.dumps({
                        'type': 'error',
                        'message': f"Failed to create project: {str(e)}"
                    }))

    async def notify_clients(self, change: Dict[str, Any]):
        """Notify all connected clients about a file change."""
        if not self.clients:
            return

        message = json.dumps(change)
        disconnected = set()
        for client in self.clients:
            try:
                await client.send(message)
            except websockets.exceptions.ConnectionClosed:
                disconnected.add(client)
            except Exception as e:
                logging.error(f"Error sending message to client: {e}")
                disconnected.add(client)

        # Remove disconnected clients
        self.clients -= disconnected

    def file_change_callback(self, change: Dict[str, Any]):
        """Callback for file changes that runs in the event loop."""
        if self.loop and self.loop.is_running():
            asyncio.run_coroutine_threadsafe(self.notify_clients(change), self.loop)

    async def register(self, websocket: websockets.WebSocketServerProtocol):
        """Register a new client connection."""
        self.clients.add(websocket)
        logging.info(f"New client connected. Total clients: {len(self.clients)}")

    async def unregister(self, websocket: websockets.WebSocketServerProtocol):
        """Unregister a client connection."""
        self.clients.discard(websocket)
        logging.info(f"Client disconnected. Total clients: {len(self.clients)}")

    async def handler(self, websocket):
        """Handle a WebSocket connection."""
        await self.register(websocket)
        try:
            async for message in websocket:
                try:
                    data = json.loads(message)
                    await self.handle_message(data, websocket)
                except json.JSONDecodeError:
                    logging.error("Invalid JSON message received")
        except websockets.exceptions.ConnectionClosed:
            pass
        finally:
            await self.unregister(websocket)

    async def start(self):
        """Start the WebSocket server and file monitor."""
        self.loop = asyncio.get_running_loop()
        self.file_monitor.start([], self.file_change_callback)
        logging.info("File monitor started")

        async with websockets.serve(self.handler, "localhost", 8765):
            logging.info("WebSocket server started on ws://localhost:8765")
            await asyncio.Future()  # run forever

def main():
    logging.basicConfig(level=logging.INFO)
    server = WebSocketServer()
    asyncio.run(server.start())

if __name__ == "__main__":
    main() 