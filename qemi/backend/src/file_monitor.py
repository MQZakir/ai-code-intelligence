import os
import sys
import time
import json
import platform
from pathlib import Path
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from typing import Dict, List, Optional, Set, Callable, Any
import logging
import pygments
from pygments.lexers import get_lexer_for_filename
from pygments.util import ClassNotFound

def get_common_dev_directories() -> List[str]:
    """Get a list of common development directories to monitor."""
    user_home = Path.home()
    common_paths = [
        str(user_home / "Documents"),
        str(user_home / "Projects"),
        str(user_home / "Desktop"),
        str(user_home / "workspace"),
        str(user_home / "code"),
        str(user_home / "OneDrive"),
        str(user_home / "Downloads")
    ]
    
    # Add platform-specific paths
    if platform.system() == "Windows":
        common_paths.extend([
            str(user_home / "Documents" / "Visual Studio Code"),
            str(user_home / "Documents" / "GitHub"),
            str(user_home / "Documents" / "GitLab")
        ])
    else:  # Linux/Mac
        common_paths.extend([
            str(user_home / "workspace"),
            str(user_home / "code"),
            str(user_home / "git")
        ])
    
    return [path for path in common_paths if os.path.exists(path)]

class FileChangeHandler(FileSystemEventHandler):
    def __init__(self, callback: Callable[[Dict[str, Any]], None]):
        self.callback = callback
        self.ignored_dirs = {'.git', '__pycache__', 'node_modules', '.idea', '.vscode', '.venv', 'env', '.env', 'dist', 'build', 'out', 'target', 'bin', 'obj'}
        self.ignored_extensions = {
            # System files
            '.exe', '.dll', '.so', '.dylib', '.pyd', '.pyc', '.pyo', '.class', '.jar', '.war', '.ear',
            # Document files
            '.txt','.doc', '.docx', '.pdf', '.xls', '.xlsx', '.ppt', '.pptx', '.odt', '.ods', '.odp',
            # Media files
            '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.ico', '.webp', '.mp3', '.wav', '.mp4', '.avi', '.mov', '.mkv',
            # Archive files
            '.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz', '.iso', '.img',
            # Executable and binary
            '.msi', '.deb', '.rpm', '.apk', '.app', '.dmg', '.pkg', '.bin', '.dat',
            # System and config
            '.ini', '.cfg', '.conf', '.config', '.log', '.tmp', '.temp', '.bak', '.backup', '.old',
            # Windows specific
            '.lnk', '.url', '.bat', '.cmd', '.ps1', '.reg', '.dll', '.sys', '.drv',
            # Mac specific
            '.app', '.dmg', '.pkg', '.plist', '.icns', '.webloc',
            # Linux specific
            '.run', '.sh', '.deb', '.rpm', '.service', '.socket',
            # Development but not code
            '.gitignore', '.gitkeep', '.gitattributes', '.editorconfig', '.prettierrc', '.eslintrc',
            '.babelrc', '.npmrc', '.yarnrc', '.pnp', '.pnp.js', '.lock', '.map', '.min.js', '.min.css',
            # IDE and editor
            '.vscode', '.idea', '.vs', '.suo', '.user', '.sln', '.csproj', '.vcxproj', '.vcproj',
            # Virtual environments
            '.venv', 'venv', 'env', '.env', 'node_modules', 'bower_components', 'jspm_packages',
            # Build and output
            'dist', 'build', 'out', 'target', 'bin', 'obj', 'Debug', 'Release', '.next', '.nuxt',
            # Cache and temp
            '.cache', '.temp', '.tmp', '.swp', '.swo', '.swn', '.bak', '.backup', '.old',
            # Database
            '.db', '.sqlite', '.sqlite3', '.mdb', '.accdb', '.frm', '.ibd', '.myd', '.myi',
            # Fonts
            '.ttf', '.otf', '.woff', '.woff2', '.eot', '.svg',
            # Misc
            '.DS_Store', 'Thumbs.db', '.localized', '.directory', '.Trash', '.Trashes', '.fseventsd',
            '.Spotlight-V100', '.TemporaryItems', '.apdisk', '.com.apple.timemachine.donotpresent'
        }
        self.supported_extensions = {
            # Programming Languages
            '.py': 'python',
            '.java': 'java',
            '.js': 'javascript',
            '.ts': 'typescript',
            '.jsx': 'javascript',
            '.tsx': 'typescript',
            '.cpp': 'cpp',
            '.c': 'c',
            '.h': 'cpp',
            '.hpp': 'cpp',
            '.cs': 'csharp',
            '.go': 'go',
            '.rb': 'ruby',
            '.php': 'php',
            '.swift': 'swift',
            '.kt': 'kotlin',
            '.rs': 'rust',
            '.scala': 'scala',
            
            # Web Development
            '.html': 'html',
            '.css': 'css',
            '.scss': 'scss',
            '.sass': 'sass',
            '.less': 'less',
            '.json': 'json',
            '.xml': 'xml',
            '.yaml': 'yaml',
            '.yml': 'yaml',
            
            # Configuration
            '.env': 'text',
            '.config': 'text',
            '.conf': 'text',
            '.ini': 'text',
            
            # Documentation
            '.md': 'markdown',
            '.txt': 'text',
            
            # Scripts
            '.sh': 'shell',
            '.bat': 'batch',
            '.ps1': 'powershell',
            
            # Database
            '.sql': 'sql',
            '.db': 'sql',
            '.sqlite': 'sql',
            '.sqlite3': 'sql'
        }
        self.base_paths = set()

    def add_base_path(self, path: str):
        """Add a base path to track."""
        self.base_paths.add(path)

    def get_relative_path(self, full_path: str) -> str:
        """Convert full path to relative path."""
        for base_path in self.base_paths:
            if full_path.startswith(base_path):
                return full_path[len(base_path):].lstrip('/\\')
        return full_path

    def should_ignore(self, path: str) -> bool:
        """Check if the path should be ignored."""
        path_parts = Path(path).parts
        return any(part in self.ignored_dirs for part in path_parts) or \
               Path(path).suffix.lower() in self.ignored_extensions or \
               Path(path).suffix.lower() not in self.supported_extensions

    def get_file_content(self, file_path: str) -> str:
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                return file.read()
        except Exception as e:
            logging.error(f"Error reading file {file_path}: {e}")
            return ""

    def get_language(self, file_path: str) -> str:
        try:
            lexer = get_lexer_for_filename(file_path)
            return lexer.name.lower()
        except ClassNotFound:
            return "text"

    def on_created(self, event):
        if not event.is_directory and not self.should_ignore(event.src_path):
            logging.info(f"File created: {event.src_path}")
            self.callback({
                'type': 'file_created',
                'path': self.get_relative_path(event.src_path),
                'language': self.get_language(event.src_path),
                'content': self.get_file_content(event.src_path),
                'timestamp': time.time()
            })

    def on_modified(self, event):
        if not event.is_directory and not self.should_ignore(event.src_path):
            logging.info(f"File modified: {event.src_path}")
            self.callback({
                'type': 'file_modified',
                'path': self.get_relative_path(event.src_path),
                'language': self.get_language(event.src_path),
                'content': self.get_file_content(event.src_path),
                'timestamp': time.time()
            })

    def on_deleted(self, event):
        if not event.is_directory and not self.should_ignore(event.src_path):
            logging.info(f"File deleted: {event.src_path}")
            self.callback({
                'type': 'file_deleted',
                'path': self.get_relative_path(event.src_path),
                'timestamp': time.time()
            })

class FileMonitor:
    def __init__(self):
        self.observer = None
        self.event_handler = None
        self.watched_paths: Set[str] = set()
        self.is_running = False

    def start(self, paths: List[str], callback: Callable[[Dict[str, Any]], None]):
        """Start monitoring the specified paths."""
        if self.is_running:
            self.stop()

        self.event_handler = FileChangeHandler(callback)
        self.observer = Observer()
        
        # Get common development directories
        dev_dirs = get_common_dev_directories()
        
        # Combine with user-specified paths
        all_paths = list(set(paths + dev_dirs))
        
        for path in all_paths:
            if os.path.exists(path):
                self.observer.schedule(self.event_handler, path, recursive=True)
                self.event_handler.add_base_path(path)
                logging.info(f"Monitoring path: {path}")
                self.watched_paths.add(path)
            else:
                logging.info(f"Path does not exist, skipping: {path}")

        self.observer.start()
        self.is_running = True
        logging.info(f"File monitor started. Watching {len(self.watched_paths)} paths.")

    def stop(self):
        """Stop the file monitoring."""
        if self.observer and self.is_running:
            self.observer.stop()
            self.observer.join()
            self.is_running = False
            self.watched_paths.clear()
            logging.info("File monitor stopped.")

    def add_path(self, path: str):
        """Add a new path to monitor."""
        if self.observer and self.is_running and os.path.exists(path):
            logging.info(f"Adding new path to monitor: {path}")
            self.observer.schedule(self.event_handler, path, recursive=True)
            self.event_handler.add_base_path(path)
            self.watched_paths.add(path)

    def remove_path(self, path: str):
        """Remove a path from monitoring."""
        if path in self.watched_paths:
            logging.info(f"Removing path from monitor: {path}")
            self.stop()
            self.watched_paths.remove(path)
            if self.watched_paths:
                self.start(list(self.watched_paths), self.event_handler.callback)

def main():
    # Example usage
    def print_change(change):
        print(json.dumps(change, indent=2))

    monitor = FileMonitor()
    
    try:
        monitor.start([], print_change)
        print("File monitoring started. Press Ctrl+C to stop.")
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        monitor.stop()
        print("File monitoring stopped.")

if __name__ == "__main__":
    main() 