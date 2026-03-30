import json
import threading
from typing import Dict, List, Optional
import os
import sys
import time
import threading
import traceback
import re
import queue
from typing import Dict, List, Optional

import requests
from supabase import create_client, Client

# Import llama-cpp-python if available
try:
    from llama_cpp import Llama
    llama_available = True
except ImportError:
    llama_available = False
    pass

# Initialize Supabase client with the same credentials from supabase.ts
SUPABASE_URL = "https://ugkcvnpbyxgpcuvwrwnf.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVna2N2bnBieXhncGN1dndyd25mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3OTQxMjgsImV4cCI6MjA4NzM3MDEyOH0.Y2ZV1Px-tTwoxUEep8feKbJeLW7uUKBs5ZiClGSTohU"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Set up logging to a file
LOG_DIR = os.path.dirname(os.path.abspath(__file__))
LOG_FILE = os.path.join(LOG_DIR, "analyzer_log.txt")

def log(message):
    """Write logs to both a file and stdout"""
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
    with open(LOG_FILE, "a") as f:
        f.write(f"[{timestamp}] {message}\n")
    print(f"[{timestamp}] {message}")

class CodeAnalyzer:
    def __init__(self):
        # Use direct path to the model
        model_path = "../Debugger-model/ender-model.gguf"
        
        log(f"Looking for model at: {model_path}")
        
        # Check if model file exists
        if not os.path.exists(model_path):
            log(f"Warning: Model file not found at {model_path}")
            self.llm = None
            return

        try:
            log("Initializing Llama...")
            # Redirect stdout temporarily to suppress Llama output
            original_stdout = sys.stdout
            sys.stdout = open(os.devnull, 'w')
            
            self.llm = Llama(
                model_path=model_path,
                n_ctx=10000,
                n_threads=4,
                verbose=False,
            )
            
            # Restore stdout
            sys.stdout = original_stdout
            log("Llama initialized successfully!")
        except Exception as e:
            log(f"Error initializing Llama: {str(e)}")
            self.llm = None
            return

    def analyze_code(self, code: str, user_id: str) -> Dict:
        log(f"analyze_code called with code length: {len(code)}")
        
        if not self.llm:
            log("Model not loaded - returning early")
            return {
                "message": "Model not loaded.",
                "explanation": "",
                "errors": []
            }

        try:
            # Fetch user's experience level from Supabase
            response = supabase.table("users").select("experience_level").eq("id", user_id).execute()
            experience_level = response.data[0]["experience_level"] if response.data else "beginner"
            
            log(f"User experience level: {experience_level}")
            
            log("Starting analysis with Llama model")
            
            # For longer code, limit the length to avoid overloading the model
            max_code_length = 5000  # Characters
            if len(code) > max_code_length:
                log(f"Code too long ({len(code)} chars), truncating to {max_code_length} chars")
                code = code[:max_code_length] + "\n# ... (code truncated due to length) ..."
            
            prompt = f"""
### Task:
Quickly analyze the following code. Provide the following clearly separated sections:

1. [CODE EXPLANATION]  
Explain what the code is intended to do. Explain each line of the code and their purpose in bullet points. Explain it to a {experience_level} programmer.

2. [ERRORS]  
List ALL errors, even those which will potentially happen. For each error, include:
   - Line number (if available)
   - Type of error (SyntaxError, NameError, RuntimeError, TypeError, etc.). Predict any potential errors as well.
   - Description of what's wrong for a {experience_level} programmer.
   - Fixes to the error. Only that part of the code fixed. Predict what the code will do and predict fixes accordingly explained for a {experience_level} programmer.

Only provide these two sections.

### Code:
{code}
"""

            log("=== Starting Analysis ===")
            log(f"Code length: {len(code)}")
            log("Sending prompt to Llama...")
            
            # Set timeout for model call
            import threading
            import time
            
            response = None
            error_msg = None
            
            def model_call():
                nonlocal response
                try:
                    response = self.llm(prompt, max_tokens=1024, temperature=0.1)
                except Exception as e:
                    nonlocal error_msg
                    error_msg = str(e)
            
            # Start the model call in a thread
            thread = threading.Thread(target=model_call)
            thread.start()
            
            # Wait for the thread to finish with no timeout
            thread.join()  # No timeout - will wait indefinitely
            
            if error_msg:
                log(f"Error during model call: {error_msg}")
                return {
                    "message": f"Error during model call: {error_msg}",
                    "explanation": "An error occurred while analyzing the code.",
                    "errors": []
                }
                
            if not response:
                log("Model returned empty response")
                return {
                    "message": "Model returned empty response",
                    "explanation": "The model did not provide any analysis.",
                    "errors": []
                }
            
            log("Received response from Llama")
            log(f"Raw response from Llama: {response}")
            
            if not response or 'choices' not in response or not response['choices']:
                log("Error: Invalid response format from Llama")
                return {
                    "message": "Error: Invalid response from model",
                    "explanation": "The model returned an invalid response format.",
                    "errors": []
                }
                
            log(f"Llama choices[0]['text']: {response['choices'][0]['text']}")
            log("Parsing response...")
            analysis = self._parse_response(response['choices'][0]['text'])
            log(f"Analysis result: {analysis}")
            log("=== Analysis Complete ===")
            return analysis
            
        except Exception as e:
            log(f"Error in analyze_code: {str(e)}")
            import traceback
            log(f"Traceback: {traceback.format_exc()}")
            return {
                "message": f"Error analyzing code: {str(e)}",
                "explanation": "An error occurred during code analysis.",
                "errors": []
            }

    def _parse_response(self, response: str) -> Dict:
        try:
            log(f"Raw response to parse: {response}")
            
            # Initialize the result dictionary
            result = {
                "message": "",
                "explanation": "",
                "errors": []
            }
            
            # Check for response with a colon at the beginning (which can cause issues)
            response = response.lstrip(':').strip()
            
            # Check if the response has specific section headers
            code_explanation_match = re.search(r'(?:###\s*(?:CODE EXPLANATION|1\.\s*CODE EXPLANATION|1\.\s*\[CODE EXPLANATION\]))\s*([\s\S]*?)(?=(?:###\s*(?:ERRORS|2\.\s*ERRORS|2\.\s*\[ERRORS\]))|$)', response)
            errors_match = re.search(r'(?:###\s*(?:ERRORS|2\.\s*ERRORS|2\.\s*\[ERRORS\]))\s*([\s\S]*?)(?=$)', response)
            
            # Extract code explanation if found
            if code_explanation_match:
                # Get the explanation text without the header
                explanation_text = code_explanation_match.group(1).strip()
                result["explanation"] = explanation_text
            else:
                # If no specific header found, try to find an explanation section
                # Look for numbered list with bullet points (common in code explanations)
                numbered_exp_match = re.search(r'(?:^|\n)\s*1\.\s+(.*?)(?=\n\s*\d+\.\s+|###|$)', response, re.DOTALL)
                if numbered_exp_match:
                    result["explanation"] = numbered_exp_match.group(1).strip()
                else:
                    # Otherwise, use everything before any ERROR heading as the explanation
                    exp_text = re.split(r'(?:###\s*(?:ERRORS|2\.\s*ERRORS|2\.\s*\[ERRORS\]))', response)[0].strip()
                    if exp_text:
                        result["explanation"] = exp_text
                    else:
                        # Last resort, use the whole response
                        result["explanation"] = response
            
            # Parse errors if present
            if errors_match:
                errors_section = errors_match.group(1).strip()
                
                # Try to parse different error formats
                parsed_errors = self._parse_errors_section(errors_section)
                if parsed_errors:
                    result["errors"] = parsed_errors
            else:
                # If no errors section found but there are numbered entries that look like errors
                # This handles the case when there's no explicit ERRORS header
                if "\n1. Line" in response or "\n1. (Potential error) Line" in response:
                    # Extract all text after "1. Line" appears
                    potential_errors = re.search(r'(?:^|\n)\s*1\.\s*(?:\(Potential error\)\s*)?(Line.+?)$', response, re.DOTALL)
                    if potential_errors:
                        parsed_errors = self._parse_errors_section(potential_errors.group(1))
                        if parsed_errors:
                            result["errors"] = parsed_errors
            
            log(f"Parsed response: {result}")
            return result
            
        except Exception as e:
            log(f"Error parsing response: {str(e)}")
            import traceback
            log(f"Traceback: {traceback.format_exc()}")
            return {
                "message": f"Error parsing response: {str(e)}",
                "explanation": response,  # Return the raw response if parsing fails
                "errors": []
            }
    
    def _parse_errors_section(self, errors_text: str) -> List[Dict]:
        """Parse different error formats from the model response."""
        errors = []
        
        # Check if there are no errors stated explicitly
        if re.search(r'(no errors|no syntax errors|code is correct)', errors_text.lower()):
            return errors
            
        # Try to parse the numbered list format (1. Line 10: `terms = 5;`) or (1. (Potential error) Line 13: ...)
        numbered_pattern = re.compile(r'(\d+)\.\s*(?:\((Potential error|Possible error)\)\s*)?(Line\s+\d+:.+?)(?=\n\d+\.\s*|$)', re.DOTALL)
        numbered_matches = numbered_pattern.findall(errors_text)
        
        if numbered_matches:
            for match in numbered_matches:
                index = match[0]
                is_potential = bool(match[1])  # Will be empty string if no potential marker
                error_text = match[2]
                
                # If there's a potential marker, add it to the error text for correct parsing
                if is_potential:
                    error_text = f"(Potential error) {error_text}"
                
                error_obj = self._parse_single_error(error_text)
                if error_obj:
                    # Add the index as position in the list
                    error_obj["index"] = int(index)
                    # Set isPotential based on the marker
                    if is_potential:
                        error_obj["isPotential"] = True
                    errors.append(error_obj)
            return errors
            
        # Try to parse bulleted list format (- Line 10: `terms = 5;`)
        bulleted_pattern = re.compile(r'(?:^|\n)\s*-\s*(Line\s+\d+:.+?)(?=\n\s*-\s*|$)', re.DOTALL)
        bulleted_matches = bulleted_pattern.findall(errors_text)
        
        if bulleted_matches:
            for index, error_text in enumerate(bulleted_matches, 1):
                error_obj = self._parse_single_error(error_text)
                if error_obj:
                    # Add the index as position in the list
                    error_obj["index"] = index
                    errors.append(error_obj)
            return errors
            
        # If no structured format is found, try to extract line by line
        lines = errors_text.split("\n")
        current_error = None
        error_index = 1
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Check if this is a new error (starts with Line X:)
            if line.startswith("Line") and ":" in line:
                # Save previous error if exists
                if current_error and (current_error.get("type") or current_error.get("description")):
                    current_error["index"] = error_index
                    errors.append(current_error)
                    error_index += 1
                    
                # Start new error
                current_error = {
                    "line": self._extract_line_number(line),
                    "type": "",
                    "description": "",
                    "solution": ""
                }
                
                # Try to extract error type if mentioned in the same line
                type_match = re.search(r'Type.*?:\s*([^:]+)(?:$|(?=:))', line)
                if type_match:
                    current_error["type"] = type_match.group(1).strip()
                    
            elif current_error:
                # Add to current error's description
                if line.startswith("Type:") or line.startswith("- Type:"):
                    current_error["type"] = line.split(":", 1)[1].strip()
                elif line.startswith("Description:") or line.startswith("- Description:"):
                    current_error["description"] = line.split(":", 1)[1].strip()
                elif line.startswith("Fix:") or line.startswith("- Fix:"):
                    current_error["solution"] = line.split(":", 1)[1].strip()
                elif current_error["description"]:
                    current_error["description"] += "\n" + line
        
        # Add the last error if exists
        if current_error and (current_error.get("type") or current_error.get("description")):
            current_error["index"] = error_index
            errors.append(current_error)
            
        return errors
    
    def _parse_single_error(self, error_text: str) -> Dict:
        """Parse a single error entry from various formats."""
        error = {
            "line": None,
            "type": "",
            "description": "",
            "solution": "",
            "isPotential": False
        }
        
        # Check if error is potential/possible/warning
        lower_text = error_text.lower()
        if ("potential" in lower_text or 
            "possible" in lower_text or 
            "warning" in lower_text or 
            "may" in lower_text or 
            "might" in lower_text or
            "consider" in lower_text):
            error["isPotential"] = True
        
        # Extract line number
        line_match = re.search(r'Line\s+(\d+)', error_text)
        if line_match:
            try:
                error["line"] = int(line_match.group(1))
            except:
                pass
                
        # Extract error type - try "Type of error" format first which is in the example
        type_match = re.search(r'Type\s+of\s+error:\s*([^\n]+)', error_text)
        if not type_match:
            # Try other formats if "Type of error" isn't found
            type_match = re.search(r'(?:Type|Error type|Error).*?:\s*([^:]+)(?:$|(?=:))', error_text)
            
        if type_match:
            error["type"] = type_match.group(1).strip()
        elif "RuntimeError" in error_text:
            error["type"] = "RuntimeError"
        elif "SyntaxError" in error_text:
            error["type"] = "SyntaxError"
        elif "TypeError" in error_text:
            error["type"] = "TypeError"
        elif "ValueError" in error_text:
            error["type"] = "ValueError"
        elif "IndexError" in error_text:
            error["type"] = "IndexError"
        elif "NameError" in error_text:
            error["type"] = "NameError"
        elif "Warning" in error_text:
            error["type"] = "Warning"
            error["isPotential"] = True
            
        # If no type was found, try to determine from context
        if not error["type"]:
            if "error" in lower_text:
                error["type"] = "Error"
            elif "warning" in lower_text:
                error["type"] = "Warning"
                error["isPotential"] = True
            elif "issue" in lower_text:
                error["type"] = "Issue"
            else:
                error["type"] = "Problem"
            
        # Extract description - first try with bullet format from example
        desc_match = re.search(r'- Description:\s*([^\n]+(?:\n[^-\n][^\n]*)*)', error_text, re.DOTALL)
        if not desc_match:
            # Try other formats if bullet format isn't found
            desc_match = re.search(r'(?:Description|Problem|Issue):\s*(.*?)(?=(?:(?:\n\s*-\s*Fix|Fix|Solution|Suggestion|Recommend):|$))', error_text, re.DOTALL)
            
        if desc_match:
            error["description"] = desc_match.group(1).strip()
        else:
            # If no specific description field, use the text after the line number
            after_line = re.search(r'Line\s+\d+:(.*?)(?=(?:Fix|Solution|Suggestion|Recommend):|$)', error_text, re.DOTALL)
            if after_line:
                # Check if there's a type label within this text
                type_in_desc = re.search(r'^(.*?)(?:Type|Error type|Error):', after_line.group(1))
                if type_in_desc:
                    error["description"] = type_in_desc.group(1).strip()
                else:
                    error["description"] = after_line.group(1).strip()
                    
        # Extract solution if available - first try with bullet format from example
        solution_match = re.search(r'- Fix:\s*([^\n]+(?:\n[^-\n][^\n]*)*)', error_text, re.DOTALL)
        if not solution_match:
            # Try other formats if bullet format isn't found
            solution_match = re.search(r'(?:Fix|Solution|Suggestion|Recommend(?:ation)?):\s*(.*?)$', error_text, re.DOTALL)
            
        if solution_match:
            error["solution"] = solution_match.group(1).strip()
            
        # Clean up description and solution
        if error["description"]:
            # Remove leading dash if present
            error["description"] = re.sub(r'^-\s*', '', error["description"])
            # Remove type information if present at the beginning
            if error["type"]:
                error["description"] = re.sub(f"^{re.escape(error['type'])}[:\\s-]*", "", error["description"])
            error["description"] = error["description"].strip()
            
        if error["solution"]:
            # Remove leading dash if present
            error["solution"] = re.sub(r'^-\s*', '', error["solution"])
            error["solution"] = error["solution"].strip()
            
        # Only return if we have at least a line number or a description
        if error["line"] or error["description"]:
            return error
        return None
    
    def _extract_line_number(self, text: str) -> Optional[int]:
        """Extract line number from text like 'Line 10: ...'"""
        match = re.search(r'Line\s+(\d+)', text)
        if match:
            try:
                return int(match.group(1))
            except:
                pass
        return None

    def debug_code(self, code: str, filename: str, user_id: str) -> dict:
        """
        Debug a piece of code and return debugging information.
        
        Args:
            code: The code to debug
            filename: The name of the file being debugged
            user_id: The ID of the user requesting the debug
            
        Returns:
            A dictionary containing the debug information with variables, call stack, scopes, and network requests
        """
        # Log the debug request
        log(f"debug_code called for file: {filename}, code length: {len(code)}")
        
        # Check if model is loaded
        if not self.llm:
            log("Model not loaded")
            return {
                "message": "Model not loaded. Please initialize the model first.",
                "variables": [],
                "call_stack": [],
                "scopes": [],
                "network_requests": []
            }
            
        # Get the user's experience level
        try:
            response = supabase.table("users").select("experience_level").eq("id", user_id).execute()
            experience_level = response.data[0]["experience_level"] if response.data else "beginner"
            log(f"User experience level for debugging: {experience_level}")
        except Exception as e:
            log(f"Error getting user experience: {str(e)}")
            experience_level = "beginner"  # Default to beginner if we can't get the experience level
            
        # Prepare the prompt for debugging
        log("=== Starting Debugging ===")
        log(f"Code length: {len(code)}")
        
        # Truncate the code if it's too long to avoid token limits
        max_code_length = 10000
        if len(code) > max_code_length:
            log(f"Code too long ({len(code)} chars), truncating to {max_code_length} chars")
            code = code[:max_code_length] + "\n# ... [code truncated] ..."
            
        # Make the prompt for the model
        prompt = f"""QUICKLY go through the code and please get accurate variable values of all variables in this {filename} code. Just list each variable and its values for the respective code in order including the print statement outputs and just list out the scope, call stacks and network requests.
        If user input detected, assume a small/easy value for the variable to debug.

IMPORTANT: Include the actual program output or return value in the finalValue field, not just this placeholder text.

Code:
```
{code}
```

Return ONLY this JSON format:
{{
    "variables": [
        {{
            "name": "variable_name",
            "values": ["value1", "value2", "value3"],
            "type": "variable_type"
        }}
    ],
    "call_stack": [
        {{
            "function": "function_name",
            "line": line_number,
            "args": ["arg1", "arg2"]
        }}
    ],
    "scopes": [
        {{
            "name": "scope_name",
            "variables": [
                {{
                    "name": "variable_name",
                    "value": "variable_value"
                }}
            ]
        }}
    ],
    "network_requests": [
        {{
            "url": "request_url",
            "method": "GET/POST/etc",
            "status": "status_code",
            "response": "response_summary"
        }}
    ],
    "finalValue": "Put the actual REAL accurate final outputs or return values here, the print statement (if any) output please, nothing else."
}}

No explanations. Just values."""

        log("Sending prompt to Llama...")
        
        # Create a separate thread for the model call to prevent hanging
        result_queue = queue.Queue()
        
        def model_thread():
            try:
                # Make the API call to the model
                response = None
                try:
                    # Call the model directly if loaded
                    if self.llm:
                        log("Using direct Llama instance")
                        response = self.llm(prompt, max_tokens=4096, temperature=0.2, top_p=0.95)
                    else:
                        # This should never happen, but just in case
                        log("Model not loaded, cannot proceed")
                        result_queue.put({
                            "message": "Model not loaded. Please initialize the model first.",
                            "variables": [],
                            "call_stack": [],
                            "scopes": [],
                            "network_requests": [],
                            "finalValue": ""
                        })
                        return
                    
                except Exception as e:
                    log(f"Error calling model: {e}")
                    result_queue.put({
                        "message": f"Error calling model: {e}",
                        "variables": [],
                        "call_stack": [],
                        "scopes": [],
                        "network_requests": [],
                        "finalValue": ""
                    })
                    return
                
                # Parse the response
                if response:
                    log(f"Got response from model, length: {len(str(response))}")
                    
                    # Parse the response to JSON (may include extraction from text)
                    if isinstance(response, dict) and 'choices' in response:
                        response_text = response['choices'][0]['text']
                        log(f"Response text: {response_text}")
                        parsed_response = self._parse_debug_response(response_text)
                    else:
                        # Direct response as string
                        log(f"Response: {response}")
                        parsed_response = self._parse_debug_response(response)
                    
                    # Add any other necessary fields
                    parsed_response["message"] = ""
                    
                    # Log finalValue before returning
                    log(f"Final value before returning: {parsed_response.get('finalValue', '')}")
                    
                    result_queue.put(parsed_response)
                    log("Successfully processed debugging results")
                else:
                    log("Empty response from model")
                    result_queue.put({
                        "message": "No response from the model",
                        "variables": [],
                        "call_stack": [],
                        "scopes": [],
                        "network_requests": [],
                        "finalValue": ""
                    })
            
            except Exception as e:
                log(f"Error in model thread: {e}")
                import traceback
                log(f"Traceback: {traceback.format_exc()}")
                result_queue.put({
                    "message": f"Error in debugging: {e}",
                    "variables": [],
                    "call_stack": [],
                    "scopes": [],
                    "network_requests": [],
                    "finalValue": ""
                })
        
        # Start the model call in a separate thread
        thread = threading.Thread(target=model_thread)
        thread.daemon = True
        thread.start()
        
        # Wait for the result without a timeout
        try:
            log("Waiting for model response (no timeout)...")
            result = result_queue.get()  # Remove timeout
            log("Got result from model thread")
            log(f"Final value in result: {result.get('finalValue', '')}")
            return result
        except Exception as e:
            log(f"Error waiting for model response: {str(e)}")
            return {
                "message": f"Error in model response: {str(e)}",
                "variables": [],
                "call_stack": [],
                "scopes": [],
                "network_requests": [],
                "finalValue": ""
            }

    def _parse_debug_response(self, response: str) -> dict:
        """Parse the response from the model for debugging information."""
        log(f"Parsing debug response: {response}")
        
        # Default empty structure
        result = {
            "variables": [],
            "call_stack": [],
            "scopes": [],
            "network_requests": [],
            "finalValue": ""
        }
        
        try:
            # Check for the actual final output in the text outside the JSON format
            final_output_patterns = [
                r'The final output of the program is[:\s]*(.*?)(?=$|\n\n)',
                r'Fibonacci Series:[^\n]*(.*?)(?=$|\n\n)',
                r'Output:[^\n]*(.*?)(?=$|\n\n)',
                r'Final result:[^\n]*(.*?)(?=$|\n\n)',
                r'Program output:[^\n]*(.*?)(?=$|\n\n)'
            ]
            
            actual_final_value = ""
            for pattern in final_output_patterns:
                match = re.search(pattern, response, re.IGNORECASE | re.DOTALL)
                if match:
                    actual_final_value = match.group(1).strip()
                    if actual_final_value:
                        log(f"Found actual final value outside JSON: {actual_final_value}")
                        result["finalValue"] = actual_final_value
                        break
            
            # Try to parse as JSON first - the ideal case
            try:
                # Find JSON block in the response
                json_match = re.search(r'```json\s*([\s\S]*?)\s*```|{\s*"variables"[\s\S]*}', response)
                if json_match:
                    json_str = json_match.group(1) or json_match.group(0)
                    parsed = json.loads(json_str)
                    log(f"Successfully parsed JSON response: {parsed}")
                    
                    # Copy valid fields to result
                    for field in ["variables", "call_stack", "scopes", "network_requests"]:
                        if field in parsed and isinstance(parsed[field], list):
                            result[field] = parsed[field]
                    
                    # Only use finalValue from JSON if it's not the placeholder and we didn't find one outside JSON
                    if "finalValue" in parsed and parsed["finalValue"] and not parsed["finalValue"].startswith("Final output or return value"):
                        result["finalValue"] = parsed["finalValue"]
                        log(f"Using finalValue from JSON: {result['finalValue']}")
                    # If we already found a finalValue outside JSON, keep that
                    elif actual_final_value:
                        result["finalValue"] = actual_final_value
                        log(f"Using finalValue from outside JSON: {result['finalValue']}")
                    # If the JSON finalValue is the placeholder but we found examples elsewhere in the response
                    elif "finalValue" in parsed and parsed["finalValue"].startswith("Final output or return value"):
                        # Search for "Fibonacci Series" or similar in the response
                        fibonacci_match = re.search(r'Fibonacci Series:([^\n]*)', response)
                        if fibonacci_match:
                            result["finalValue"] = fibonacci_match.group(0).strip()
                            log(f"Extracted finalValue from Fibonacci mention: {result['finalValue']}")
                    
                    # Log the finalValue specifically for debugging
                    log(f"Final extracted finalValue: {result.get('finalValue', '')}")
                    
                    return result
            except json.JSONDecodeError as e:
                log(f"Failed to parse response as JSON: {e}")
            
            # If JSON parsing fails, try to extract data using regex patterns
            
            # Extract variables
            variables_match = re.search(r'variables\s*:\s*\[([\s\S]*?)\]', response)
            if variables_match:
                variables_text = variables_match.group(1)
                # Extract individual variable blocks
                var_blocks = re.finditer(r'{([\s\S]*?)}', variables_text)
                for block in var_blocks:
                    var_text = block.group(1)
                    var = {}
                    
                    # Extract variable name
                    name_match = re.search(r'name["\s:]+([^",\s]+)', var_text)
                    if name_match:
                        var["name"] = name_match.group(1).strip()
                    else:
                        continue  # Skip if no name found
                    
                    # Extract variable values
                    values_match = re.search(r'values["\s:]+\[([\s\S]*?)\]', var_text)
                    if values_match:
                        values_text = values_match.group(1)
                        var["values"] = re.findall(r'"([^"]*)"', values_text)
                    else:
                        # Try single value format
                        value_match = re.search(r'value["\s:]+([^",\s]+|"[^"]*")', var_text)
                        if value_match:
                            value = value_match.group(1).strip()
                            if value.startswith('"') and value.endswith('"'):
                                value = value[1:-1]
                            var["values"] = [value]
                        else:
                            var["values"] = []
                    
                    # Extract variable type
                    type_match = re.search(r'type["\s:]+([^",\s]+|"[^"]*")', var_text)
                    if type_match:
                        var_type = type_match.group(1).strip()
                        if var_type.startswith('"') and var_type.endswith('"'):
                            var_type = var_type[1:-1]
                        var["type"] = var_type
                    else:
                        var["type"] = "unknown"
                    
                    result["variables"].append(var)
            
            # Extract finalValue using regex if present
            final_value_match = re.search(r'finalValue["\s:]+([^",\s]+|"[^"]*")', response)
            if final_value_match:
                final_value = final_value_match.group(1).strip()
                if final_value.startswith('"') and final_value.endswith('"'):
                    final_value = final_value[1:-1]
                
                # Only use if it's not the placeholder and we don't already have a finalValue
                if not final_value.startswith("Final output or return value") and not result["finalValue"]:
                    result["finalValue"] = final_value
                    log(f"Extracted finalValue using regex: {final_value}")
            
            # If we still don't have a finalValue, look for Fibonacci output
            if not result["finalValue"]:
                fibonacci_match = re.search(r'Fibonacci Series:([^\n]*)', response)
                if fibonacci_match:
                    result["finalValue"] = fibonacci_match.group(0).strip()
                    log(f"Extracted finalValue from Fibonacci mention: {result['finalValue']}")
            
            # Extract call stack
            call_stack_match = re.search(r'call_stack\s*:\s*\[([\s\S]*?)\]', response)
            if call_stack_match:
                stack_text = call_stack_match.group(1)
                # Extract individual stack frame blocks
                frame_blocks = re.finditer(r'{([\s\S]*?)}', stack_text)
                for block in frame_blocks:
                    frame_text = block.group(1)
                    frame = {}
                    
                    # Extract function name
                    func_match = re.search(r'function["\s:]+([^",\s]+|"[^"]*")', frame_text)
                    if func_match:
                        func = func_match.group(1).strip()
                        if func.startswith('"') and func.endswith('"'):
                            func = func[1:-1]
                        frame["function"] = func
                    else:
                        continue  # Skip if no function name found
                    
                    # Extract line number
                    line_match = re.search(r'line["\s:]+(\d+)', frame_text)
                    if line_match:
                        frame["line"] = int(line_match.group(1))
                    else:
                        frame["line"] = 0
                    
                    # Extract arguments
                    args_match = re.search(r'args["\s:]+\[([\s\S]*?)\]', frame_text)
                    if args_match:
                        args_text = args_match.group(1)
                        frame["args"] = re.findall(r'"([^"]*)"', args_text)
                    else:
                        frame["args"] = []
                    
                    result["call_stack"].append(frame)
            
            # Extract scopes
            scopes_match = re.search(r'scopes\s*:\s*\[([\s\S]*?)\]', response)
            if scopes_match:
                scopes_text = scopes_match.group(1)
                # Extract individual scope blocks
                scope_blocks = re.finditer(r'{([\s\S]*?)}', scopes_text)
                for block in scope_blocks:
                    scope_text = block.group(1)
                    scope = {}
                    
                    # Extract scope name
                    name_match = re.search(r'name["\s:]+([^",\s]+|"[^"]*")', scope_text)
                    if name_match:
                        name = name_match.group(1).strip()
                        if name.startswith('"') and name.endswith('"'):
                            name = name[1:-1]
                        scope["name"] = name
                    else:
                        scope["name"] = "unknown"
                    
                    # Extract scope variables
                    vars_match = re.search(r'variables["\s:]+\[([\s\S]*?)\]', scope_text)
                    scope_vars = []
                    if vars_match:
                        vars_text = vars_match.group(1)
                        # Extract individual variable blocks
                        var_blocks = re.finditer(r'{([\s\S]*?)}', vars_text)
                        for var_block in var_blocks:
                            var_text = var_block.group(1)
                            var = {}
                            
                            # Extract variable name
                            var_name_match = re.search(r'name["\s:]+([^",\s]+|"[^"]*")', var_text)
                            if var_name_match:
                                var_name = var_name_match.group(1).strip()
                                if var_name.startswith('"') and var_name.endswith('"'):
                                    var_name = var_name[1:-1]
                                var["name"] = var_name
                            else:
                                continue  # Skip if no name found
                            
                            # Extract variable value
                            var_value_match = re.search(r'value["\s:]+([^",\s]+|"[^"]*")', var_text)
                            if var_value_match:
                                var_value = var_value_match.group(1).strip()
                                if var_value.startswith('"') and var_value.endswith('"'):
                                    var_value = var_value[1:-1]
                                var["value"] = var_value
                            else:
                                var["value"] = ""
                            
                            scope_vars.append(var)
                    scope["variables"] = scope_vars
                    
                    result["scopes"].append(scope)
            
            # Extract network requests
            network_match = re.search(r'network_requests\s*:\s*\[([\s\S]*?)\]', response)
            if network_match:
                network_text = network_match.group(1)
                # Extract individual request blocks
                req_blocks = re.finditer(r'{([\s\S]*?)}', network_text)
                for block in req_blocks:
                    req_text = block.group(1)
                    req = {}
                    
                    # Extract URL
                    url_match = re.search(r'url["\s:]+([^",\s]+|"[^"]*")', req_text)
                    if url_match:
                        url = url_match.group(1).strip()
                        if url.startswith('"') and url.endswith('"'):
                            url = url[1:-1]
                        req["url"] = url
                    else:
                        continue  # Skip if no URL found
                    
                    # Extract method
                    method_match = re.search(r'method["\s:]+([^",\s]+|"[^"]*")', req_text)
                    if method_match:
                        method = method_match.group(1).strip()
                        if method.startswith('"') and method.endswith('"'):
                            method = method[1:-1]
                        req["method"] = method
                    else:
                        req["method"] = "GET"  # Default method
                    
                    # Extract status
                    status_match = re.search(r'status["\s:]+([^",\s]+|"[^"]*")', req_text)
                    if status_match:
                        status = status_match.group(1).strip()
                        if status.startswith('"') and status.endswith('"'):
                            status = status[1:-1]
                        req["status"] = status
                    else:
                        req["status"] = ""
                    
                    # Extract response
                    resp_match = re.search(r'response["\s:]+([^",\s]+|"[^"]*")', req_text)
                    if resp_match:
                        resp = resp_match.group(1).strip()
                        if resp.startswith('"') and resp.endswith('"'):
                            resp = resp[1:-1]
                        req["response"] = resp
                    else:
                        req["response"] = ""
                    
                    result["network_requests"].append(req)
            
            log(f"Parsed debug response using regex: {result}")
            
        except Exception as e:
            log(f"Error parsing debug response: {e}")
            import traceback
            log(f"Traceback: {traceback.format_exc()}")
        
        return result

# Create a singleton instance
analyzer = CodeAnalyzer() 