# QEMI Debugger

A versatile, modern debugging tool that supports multiple programming languages.

## Features

- **Multi-Language Support**: Debug applications written in Python, JavaScript, and more
- **Interactive UI**: Modern, intuitive interface with dark mode support
- **Real-time File Monitoring**: Automatically track changes in your project files
- **Comprehensive Debug Tools**:
  - Predicted Variable inspection
  - Call stack viewing
  - Scope view
  - Performance monitoring
  - Network request tracking
  - Error logging

## Requirements

- Node.js (v16+)
- Python 3.8+
- Git

## Installation

1. Install Node dependencies:
   ```
   npm install
   ```

2. Python dependencies will be installed automatically when you run the backend server.

## Running the Application

You can run both the frontend and backend with a single command:

```bash
cd qemi && npm run start # On powershell: cd qemi; npm run start
```

Or run them separately:

- Frontend only: `npm run start:frontend`
- Backend only: `npm run start:backend`
- Backend with file monitoring: `npm run start:backend:watch`

## Debugging Languages

The Ender Debugger currently supports:

- **Python**
- **JavaScript**
- **Java**
- **C#**
- **C++**
- **Bash**

## Architecture

The application consists of:

1. **Frontend**: React/TypeScript application with Electron for desktop support
2. **Debugger Service**: FastAPI server that manages debugging sessions and API endpoints to fetch, return and parse model responses
3. **File Monitor Service**: Service that watches for file changes in the project

## Acknowledgments

- Built with React, TypeScript, and Emotion
- Uses WebSockets for real-time communication
- Electron for cross-platform desktop support