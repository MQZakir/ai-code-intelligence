import sys
from codeAnalyzer import analyzer

# Test code to analyze
test_code = """
def hello():
    print("Hello, world!")
    return 42

if __name__ == "__main__":
    result = hello()
    print(f"Result: {result}")
"""

# Try both stderr and stdout for logging
print("=== DIRECT TEST OF CODE ANALYZER (stdout) ===")
print("=== DIRECT TEST OF CODE ANALYZER (stderr) ===", file=sys.stderr)

print("Calling analyzer.analyze_code() directly...")
print("Calling analyzer.analyze_code() directly...", file=sys.stderr)

try:
    # Direct print to see if the analyzer is initialized
    print(f"Analyzer initialized: {analyzer is not None}")
    print(f"Analyzer llm available: {analyzer.llm is not None}")
    
    # Call the analyze_code method
    result = analyzer.analyze_code(test_code)
    
    # Print the result to both stdout and stderr
    print(f"Analysis result: {result}")
    print(f"Analysis result: {result}", file=sys.stderr)
    print("Test completed successfully!")
    print("Test completed successfully!", file=sys.stderr)
except Exception as e:
    print(f"Error during test: {str(e)}")
    print(f"Error during test: {str(e)}", file=sys.stderr)
    import traceback
    traceback_str = traceback.format_exc()
    print(f"Traceback: {traceback_str}")
    print(f"Traceback: {traceback_str}", file=sys.stderr)

print("=== TEST COMPLETE (stdout) ===")
print("=== TEST COMPLETE (stderr) ===", file=sys.stderr) 