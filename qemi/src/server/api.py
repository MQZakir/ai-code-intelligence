from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from codeAnalyzer import analyzer
import sys
import os
import time

# Set up logging to a file
LOG_DIR = os.path.dirname(os.path.abspath(__file__))
LOG_FILE = os.path.join(LOG_DIR, "api_log.txt")

def log(message):
    """Write logs to both a file and stdout"""
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
    with open(LOG_FILE, "a") as f:
        f.write(f"[{timestamp}] {message}\n")
    print(f"[{timestamp}] {message}")

log("\n=== API SERVER STARTING ===")

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define API request models
class CodeRequest(BaseModel):
    code: str
    user_id: str = "unknown"

class DebugRequest(BaseModel):
    code: str
    filename: str
    user_id: str = "unknown"

@app.post("/analyze")
async def analyze_code(request: CodeRequest):
    log("\n=== RECEIVED API REQUEST ===")
    log(f"Code length: {len(request.code)}")
    log(f"User ID: {request.user_id}")
    
    try:
        # Get analysis from the analyzer
        log("Calling analyzer.analyze_code()")
        
        try:
            analysis = analyzer.analyze_code(request.code, request.user_id)
            log(f"Received analysis result: {analysis}")
            
            # Log the errors specifically for debugging
            if "errors" in analysis and analysis["errors"]:
                log(f"Errors found: {len(analysis['errors'])}")
                for i, error in enumerate(analysis["errors"]):
                    log(f"Error {i+1}: {error}")
            else:
                log("No errors found in analysis")
                
        except Exception as e:
            log(f"Error in analyzer.analyze_code(): {str(e)}")
            import traceback
            log(f"Traceback: {traceback.format_exc()}")
            analysis = {
                "message": f"Error in code analysis: {str(e)}",
                "explanation": "An error occurred while analyzing the code.",
                "errors": []
            }
        
        # If the model isn't loaded, the analyzer will return a message
        if isinstance(analysis, dict) and "message" in analysis and analysis["message"]:
            log(f"Model not loaded or error: {analysis['message']}")
            return {
                "message": analysis["message"],
                "explanation": analysis.get("explanation", ""),
                "errors": []
            }
        
        # Handle missing fields in analysis
        if not isinstance(analysis, dict):
            log(f"Invalid analysis type: {type(analysis)}")
            analysis = {"explanation": "", "errors": []}
        
        # Ensure we have all required fields
        result = {
            "message": "",
            "explanation": analysis.get("explanation", "Analysis completed but no explanation was provided."),
            "errors": analysis.get("errors", [])
        }
        
        # Return the analysis result
        log(f"Returning analysis result with {len(result['errors'])} errors")
        log("=== API REQUEST COMPLETE ===\n")
        return result
    except Exception as e:
        log(f"Unexpected error in analyze_code API: {str(e)}")
        import traceback
        log(f"Traceback: {traceback.format_exc()}")
        return {
            "message": f"Error analyzing code: {str(e)}",
            "explanation": "An unexpected error occurred while analyzing the code. Please try again.",
            "errors": []
        }

@app.post("/debug")
async def debug_code(request: DebugRequest):
    log("\n=== RECEIVED DEBUG REQUEST ===")
    log(f"Code length: {len(request.code)}")
    log(f"Filename: {request.filename}")
    log(f"User ID: {request.user_id}")
    
    try:
        # Get debug information from the analyzer
        log("Calling analyzer.debug_code()")
        
        try:
            debug_info = analyzer.debug_code(code=request.code, filename=request.filename, user_id=request.user_id)
            log(f"Received debug result: {debug_info}")
        except Exception as e:
            log(f"Error in analyzer.debug_code(): {str(e)}")
            import traceback
            log(f"Traceback: {traceback.format_exc()}")
            debug_info = {
                "message": f"Error in code debugging: {str(e)}",
                "variables": [],
                "call_stack": [],
                "scopes": [],
                "network_requests": []
            }
        
        # If the model isn't loaded, the analyzer will return a message
        if isinstance(debug_info, dict) and "message" in debug_info and debug_info["message"]:
            log(f"Model not loaded or error: {debug_info['message']}")
            return {
                "message": debug_info["message"],
                "variables": [],
                "call_stack": [],
                "scopes": [],
                "network_requests": [],
                "finalValue": ""
            }
        
        # Handle missing fields in debug_info
        if not isinstance(debug_info, dict):
            log(f"Invalid debug info type: {type(debug_info)}")
            debug_info = {"variables": [], "call_stack": [], "scopes": [], "network_requests": [], "finalValue": ""}
        
        # Ensure we have all required fields
        result = {
            "message": "",
            "variables": debug_info.get("variables", []),
            "call_stack": debug_info.get("call_stack", []),
            "scopes": debug_info.get("scopes", []),
            "network_requests": debug_info.get("network_requests", []),
            "finalValue": debug_info.get("finalValue", "")
        }
        
        # Log finalValue for debugging
        log(f"Final value in response: {result['finalValue']}")
        
        # Return the debug result
        log("Returning debug result")
        log("=== DEBUG REQUEST COMPLETE ===\n")
        return result
    except Exception as e:
        log(f"Unexpected error in debug_code API: {str(e)}")
        import traceback
        log(f"Traceback: {traceback.format_exc()}")
        return {
            "message": f"Error debugging code: {str(e)}",
            "variables": [],
            "call_stack": [],
            "scopes": [],
            "network_requests": [],
            "finalValue": ""
        }

# Add a simple test endpoint
@app.get("/test")
async def test():
    log("Test endpoint called")
    return {"message": "API is working correctly"}

if __name__ == "__main__":
    import uvicorn
    log("Starting API server on port 8000...")
    uvicorn.run(app, host="0.0.0.0", port=8000) 