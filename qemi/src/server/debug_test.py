import os
import sys
import requests
import time

# Create a log file
LOG_DIR = os.path.dirname(os.path.abspath(__file__))
LOG_FILE = os.path.join(LOG_DIR, "debug_log.txt")

# Function to write to log file
def log(message):
    with open(LOG_FILE, "a") as f:
        f.write(f"{message}\n")
    print(message)  # Also print to console

log(f"Starting debug test at {time.ctime()}")
log(f"Log file location: {LOG_FILE}")

# Test if the API server is running
try:
    log("Testing connection to API server...")
    response = requests.get("http://localhost:8000/test")
    log(f"API server responded with status: {response.status_code}")
    log(f"Response content: {response.text}")
except Exception as e:
    log(f"Error connecting to API server: {e}")

# Test sending code for analysis
try:
    log("Testing code analysis...")
    test_code = """
def hello():
    print("Hello, world!")
    return 42
"""
    
    response = requests.post(
        "http://localhost:8000/analyze",
        json={"code": test_code}
    )
    
    log(f"Analysis response status: {response.status_code}")
    log(f"Analysis response content: {response.json()}")
except Exception as e:
    log(f"Error during analysis: {e}")

log("Debug test complete") 