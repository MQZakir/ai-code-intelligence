# QEMI Debugger

A basic debugging tool that provides real-time insights into system performance, resource utilization, and process management, with predictive insights on code and its debugging information.

## Features

- Real-time system monitoring (CPU, Memory)
- File server which reads file contents
- WebSocket-based real-time updates
- RESTful API endpoints
- Model running locally giving predictive insights on code
- Debugging insights predictied by model
- Visualizations for variable state changes

## Prerequisites

- Node.js (v14 or higher)
- Python 3.8 or higher
- npm or yarn package manager

## Installation

1. Install Node.js dependencies:
```bash
npm install
```

2. Set up Python virtual environment:
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

## Project Structure

- `qemi/` - Main application code
- `test-cases/` - Test suite for functional and system testing
- `model-training/` - LLM fine-tuning scripts

## Usage

1. Start the main application:
```bash
cd qemi && npm run start # On powershell: cd qemi; npm run start
```

2. Access the web interface at `http://localhost:3000`

## Testing

Run the test suite:
```bash
cd test-cases
py funtion_tests.py
py system_tests.py
```

## License

MIT License - See LICENSE file for details 
