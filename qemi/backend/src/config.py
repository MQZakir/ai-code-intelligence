import os
from pathlib import Path
from typing import List

# Default paths to monitor
DEFAULT_PATHS = [
    str(Path.home() / "Documents"),
    str(Path.home() / "Projects"),
    str(Path.home() / "Desktop")
]

# File extensions to monitor
SUPPORTED_EXTENSIONS = {
    '.py': 'python',
    '.java': 'java',
    '.js': 'javascript',
    '.ts': 'typescript',
    '.cpp': 'cpp',
    '.h': 'cpp',
    '.hpp': 'cpp',
    '.cs': 'csharp'
}

# Directories to ignore
IGNORED_DIRS = {
    '.git',
    '__pycache__',
    'node_modules',
    '.idea',
    '.vscode',
    'venv',
    'env',
    '.env'
}

# File extensions to ignore
IGNORED_EXTENSIONS = {
    '.pyc',
    '.pyo',
    '.pyd',
    '.so',
    '.dll',
    '.exe',
    '.class',
    '.jar',
    '.war',
    '.ear'
}

# Logging configuration
LOG_CONFIG = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'standard': {
            'format': '%(asctime)s [%(levelname)s] %(name)s: %(message)s'
        },
    },
    'handlers': {
        'default': {
            'level': 'INFO',
            'formatter': 'standard',
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        '': {
            'handlers': ['default'],
            'level': 'INFO',
            'propagate': True
        }
    }
}

# Platform-specific configurations
if os.name == 'nt':  # Windows
    DEFAULT_PATHS.extend([
        str(Path.home() / "OneDrive"),
        str(Path.home() / "Downloads")
    ])
else:  # Linux/Unix
    DEFAULT_PATHS.extend([
        str(Path.home() / "workspace"),
        str(Path.home() / "code")
    ]) 