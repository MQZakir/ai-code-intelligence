# Ender Debugger - File Monitoring System

This is the file monitoring system for the Ender Debugger. It monitors file changes in specified directories and provides real-time updates about code changes.

## Features

- Cross-platform support (Windows/Linux)
- Real-time file monitoring
- Language detection
- Smart file filtering
- Configurable monitoring paths
- Efficient change tracking

## Supported Languages

- Python (.py)
- Java (.java)
- JavaScript (.js)
- TypeScript (.ts)
- C++ (.cpp, .h, .hpp)
- C# (.cs)

## Setup

1. Install Python 3.8 or higher
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Configuration

Edit `src/config.py` to:
- Add/remove monitored paths
- Configure ignored directories
- Set up logging
- Customize platform-specific settings

## Usage

Run the file monitor:
```bash
python src/file_monitor.py
```

## Integration

The file monitor provides real-time updates about:
- File creations
- File modifications
- File deletions
- Language detection
- File paths

## Development

To add new features:
1. Modify `file_monitor.py` for core functionality
2. Update `config.py` for configuration changes
3. Add new language support in the configuration

## Security

- Only monitors specified directories
- Ignores sensitive directories
- Filters binary files
- Respects system permissions

## Performance

- Efficient file system watching
- Minimal resource usage
- Smart path filtering
- Optimized change detection 