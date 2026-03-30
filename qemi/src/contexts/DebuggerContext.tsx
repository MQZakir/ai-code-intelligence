import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

// Define the basic types we still need for compatibility
export enum DebuggerLanguage {
  Python = 'python',
  JavaScript = 'javascript',
  TypeScript = 'typescript',
  Unknown = 'unknown'
}

export interface Breakpoint {
  id: number;
  path: string;
  line: number;
  verified: boolean;
  condition?: string;
}

export interface StackFrame {
  id: number;
  name: string;
  function?: string;
  path: string;
  line: number;
  column: number;
}

export interface Variable {
  name: string;
  value: string;
  values?: string[];
  type: string;
  variablesReference: number;
  hasChildren?: boolean;
}

export interface VariablesResponse {
  variables: Variable[];
}

export interface ThreadInfo {
  id: number;
  name: string;
  status: 'running' | 'paused' | 'stopped';
}

export interface ConsoleMessage {
  id: string;
  text: string;
  type: 'log' | 'error' | 'warning' | 'info';
  timestamp: number;
}

export interface NetworkRequest {
  id: string;
  method: string;
  url: string;
  status: number;
  statusText: string;
  time: number;
  type: string;
  contentType: string;
  timings?: { [key: string]: number };
  requestHeaders?: { [key: string]: string };
  responseHeaders?: { [key: string]: string };
}

export interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  category: 'memory' | 'cpu' | 'network' | 'rendering' | 'other';
}

export interface DebuggerError {
  id: string;
  message: string;
  stackTrace?: string;
  timestamp: number;
  count: number;
}

export interface StorageItem {
  id: string;
  key: string;
  value: string;
  type: 'localStorage' | 'sessionStorage' | 'cookie' | 'other';
  timestamp: number;
}

// Basic responses
export interface BreakpointResponse {
  success: boolean;
  breakpoint?: Breakpoint;
  error?: string;
}

export interface StateResponse {
  success: boolean;
  state?: any;
  error?: string;
}

export interface ErrorResponse {
  success: boolean;
  error: string;
}

export interface DebuggerState {
  connected: boolean;
  status: 'disconnected' | 'connecting' | 'connected' | 'paused' | 'running' | 'stopped';
  supportedLanguages: DebuggerLanguage[];
  activeLanguage: DebuggerLanguage;
  breakpoints: Breakpoint[];
  callStack: StackFrame[];
  variables: Variable[];
  threads: ThreadInfo[];
  consoleMessages: ConsoleMessage[];
  networkRequests: NetworkRequest[];
  performanceMetrics: PerformanceMetric[];
  errors: DebuggerError[];
  storageItems: StorageItem[];
  finalValue?: string;
  additionalDebugData?: {
    scopes: any[];
    message: string;
    rawData: any;
  };
}

export interface DebuggerContextType {
  state: DebuggerState;
  
  // Connection Management
  connect: (url: string) => Promise<boolean>;
  disconnect: () => Promise<boolean>;
  
  // Breakpoint Management
  setBreakpoint: (path: string, line: number, condition?: string) => Promise<BreakpointResponse>;
  removeBreakpoint: (id: number) => Promise<BreakpointResponse>;
  toggleBreakpoint: (path: string, line: number, condition?: string) => Promise<BreakpointResponse>;
  clearAllBreakpoints: () => Promise<boolean>;
  
  // Execution Control
  continue_: () => Promise<boolean>;
  pause: () => Promise<boolean>;
  stepOver: () => Promise<boolean>;
  stepInto: () => Promise<boolean>;
  stepOut: () => Promise<boolean>;
  restart: () => Promise<boolean>;
  stop: () => Promise<boolean>;
  
  // Variable Inspection
  expandVariable: (variablesReference: number) => Promise<VariablesResponse>;
  evaluateExpression: (expression: string) => Promise<Variable>;
  
  // Console Management
  clearConsole: () => void;
  executeConsoleCommand: (command: string) => Promise<ConsoleMessage>;
  
  // State Management
  captureApplicationState: () => Promise<StateResponse>;
  clearErrors: () => void;
  
  // Network Management
  clearNetworkRequests: () => void;
  
  // Storage Management
  clearStorageItems: () => void;
  
  // Performance Monitoring
  capturePerformanceSnapshot: () => Promise<boolean>;
  
  // Debug Code
  debugCode: (code: string, filename: string) => Promise<any>;
}

const initialDebuggerState: DebuggerState = {
  connected: false,
  status: 'disconnected',
  supportedLanguages: [DebuggerLanguage.Python, DebuggerLanguage.JavaScript, DebuggerLanguage.TypeScript],
  activeLanguage: DebuggerLanguage.Unknown,
  breakpoints: [],
  callStack: [],
  variables: [],
  threads: [],
  consoleMessages: [],
  networkRequests: [],
  performanceMetrics: [],
  errors: [],
  storageItems: [],
  finalValue: '',
  additionalDebugData: undefined
};

// Create the context with default values
export const DebuggerContext = createContext<DebuggerContextType>({
  state: initialDebuggerState,
  connect: async () => false,
  disconnect: async () => false,
  setBreakpoint: async () => ({ success: false }),
  removeBreakpoint: async () => ({ success: false }),
  toggleBreakpoint: async () => ({ success: false }),
  clearAllBreakpoints: async () => false,
  continue_: async () => false,
  pause: async () => false,
  stepOver: async () => false,
  stepInto: async () => false,
  stepOut: async () => false,
  restart: async () => false,
  stop: async () => false,
  expandVariable: async () => ({ variables: [] }),
  evaluateExpression: async () => ({ name: '', value: '', type: '', variablesReference: 0 }),
  clearConsole: () => {},
  executeConsoleCommand: async () => ({ id: '', text: '', type: 'log', timestamp: Date.now() }),
  captureApplicationState: async () => ({ success: false }),
  clearErrors: () => {},
  clearNetworkRequests: () => {},
  clearStorageItems: () => {},
  capturePerformanceSnapshot: async () => false,
  debugCode: async () => ({})
});

export const useDebugger = () => useContext(DebuggerContext);

export const DebuggerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<DebuggerState>(initialDebuggerState);
  
  // Mock implementation for the provider
  // All functions return mock data to maintain compatibility
  
  const connect = useCallback(async (url: string): Promise<boolean> => {
    console.log(`[MockDebugger] Connect called for ${url}`);
    setState(prev => ({ ...prev, connected: true, status: 'connected' }));
    return true;
  }, []);
  
  const disconnect = useCallback(async (): Promise<boolean> => {
    console.log('[MockDebugger] Disconnect called');
    setState(prev => ({ ...prev, connected: false, status: 'disconnected' }));
    return true;
  }, []);
  
  const setBreakpoint = useCallback(async (path: string, line: number, condition?: string): Promise<BreakpointResponse> => {
    console.log(`[MockDebugger] Set breakpoint at ${path}:${line}`);
    const newBreakpoint: Breakpoint = {
      id: Date.now(),
      path,
      line,
      verified: true,
      condition
    };
    
    setState(prev => ({
      ...prev,
      breakpoints: [...prev.breakpoints, newBreakpoint]
    }));
    
    return {
      success: true,
      breakpoint: newBreakpoint
    };
  }, []);
  
  const removeBreakpoint = useCallback(async (id: number): Promise<BreakpointResponse> => {
    console.log(`[MockDebugger] Remove breakpoint ${id}`);
    setState(prev => ({
      ...prev,
      breakpoints: prev.breakpoints.filter(bp => bp.id !== id)
    }));
    
    return { success: true };
  }, []);
  
  const toggleBreakpoint = useCallback(async (path: string, line: number, condition?: string): Promise<BreakpointResponse> => {
    console.log(`[MockDebugger] Toggle breakpoint at ${path}:${line}`);
    const existingBreakpoint = state.breakpoints.find(bp => bp.path === path && bp.line === line);
    
    if (existingBreakpoint) {
      return removeBreakpoint(existingBreakpoint.id);
    } else {
      return setBreakpoint(path, line, condition);
    }
  }, [state.breakpoints, removeBreakpoint, setBreakpoint]);
  
  const clearAllBreakpoints = useCallback(async (): Promise<boolean> => {
    console.log('[MockDebugger] Clear all breakpoints');
    setState(prev => ({ ...prev, breakpoints: [] }));
    return true;
  }, []);
  
  const continue_ = useCallback(async (): Promise<boolean> => {
    console.log('[MockDebugger] Continue called');
    setState(prev => ({ ...prev, status: 'running' }));
    return true;
  }, []);
  
  const pause = useCallback(async (): Promise<boolean> => {
    console.log('[MockDebugger] Pause called');
    setState(prev => ({ ...prev, status: 'paused' }));
    return true;
  }, []);
  
  const stepOver = useCallback(async (): Promise<boolean> => {
    console.log('[MockDebugger] Step over called');
    return true;
  }, []);
  
  const stepInto = useCallback(async (): Promise<boolean> => {
    console.log('[MockDebugger] Step into called');
    return true;
  }, []);
  
  const stepOut = useCallback(async (): Promise<boolean> => {
    console.log('[MockDebugger] Step out called');
    return true;
  }, []);
  
  const restart = useCallback(async (): Promise<boolean> => {
    console.log('[MockDebugger] Restart called');
    return true;
  }, []);
  
  const stop = useCallback(async (): Promise<boolean> => {
    console.log('[MockDebugger] Stop called');
    setState(prev => ({ ...prev, status: 'stopped' }));
    return true;
  }, []);
  
  const expandVariable = useCallback(async (variablesReference: number): Promise<VariablesResponse> => {
    console.log(`[MockDebugger] Expand variable ${variablesReference}`);
    return {
      variables: [
        { name: 'mock_child1', value: '42', type: 'number', variablesReference: 0 },
        { name: 'mock_child2', value: 'text', type: 'string', variablesReference: 0 }
      ]
    };
  }, []);
  
  const evaluateExpression = useCallback(async (expression: string): Promise<Variable> => {
    console.log(`[MockDebugger] Evaluate expression: ${expression}`);
    return {
      name: expression,
      value: 'Mock value',
      type: 'string',
      variablesReference: 0
    };
  }, []);
  
  const clearConsole = useCallback(() => {
    console.log('[MockDebugger] Clear console');
    setState(prev => ({ ...prev, consoleMessages: [] }));
  }, []);
  
  const executeConsoleCommand = useCallback(async (command: string): Promise<ConsoleMessage> => {
    console.log(`[MockDebugger] Execute console command: ${command}`);
    const message: ConsoleMessage = {
      id: Date.now().toString(),
      text: `Executed: ${command}`,
      type: 'log',
      timestamp: Date.now()
    };
    
    setState(prev => ({
      ...prev,
      consoleMessages: [...prev.consoleMessages, message]
    }));
    
    return message;
  }, []);
  
  const captureApplicationState = useCallback(async (): Promise<StateResponse> => {
    console.log('[MockDebugger] Capture application state');
    return {
      success: true,
      state: { mockState: 'Mock application state' }
    };
  }, []);
  
  const clearErrors = useCallback(() => {
    console.log('[MockDebugger] Clear errors');
    setState(prev => ({ ...prev, errors: [] }));
  }, []);
  
  const clearNetworkRequests = useCallback(() => {
    console.log('[MockDebugger] Clear network requests');
    setState(prev => ({ ...prev, networkRequests: [] }));
  }, []);
  
  const clearStorageItems = useCallback(() => {
    console.log('[MockDebugger] Clear storage items');
    setState(prev => ({ ...prev, storageItems: [] }));
  }, []);
  
  const capturePerformanceSnapshot = useCallback(async (): Promise<boolean> => {
    console.log('[MockDebugger] Capture performance snapshot');
    return true;
  }, []);
  
  const debugCode = useCallback(async (code: string, filename: string): Promise<any> => {
    console.log(`[Debugger] Debug code called for ${filename}, length: ${code.length}`);
    
    try {
      // Set state to indicate debugging is in progress
      setState(prev => ({
        ...prev,
        status: 'running',
        variables: [],
        callStack: [],
        networkRequests: []
      }));
      
      // First check if the API is available
      try {
        const testResponse = await fetch('http://localhost:8000/test');
        if (!testResponse.ok) {
          console.error('API health check failed:', testResponse.status);
          setState(prev => ({
            ...prev,
            status: 'stopped',
            errors: [
              ...prev.errors,
              {
                id: Date.now().toString(),
                message: "The debugging service is not responding. Please check if the server is running.",
                timestamp: Date.now(),
                count: 1
              }
            ]
          }));
          return {
            message: "The debugging service is not responding. Please check if the server is running.",
            variables: [],
            call_stack: [],
            scopes: [],
            network_requests: []
          };
        } else {
          console.log('API health check successful');
        }
      } catch (error) {
        console.error('API health check failed with error:', error);
        setState(prev => ({
          ...prev,
          status: 'stopped',
          errors: [
            ...prev.errors,
            {
              id: Date.now().toString(),
              message: "Could not connect to the debugging service. Please make sure the server is running.",
              timestamp: Date.now(),
              count: 1
            }
          ]
        }));
        return {
          message: "Could not connect to the debugging service. Please make sure the server is running.",
          variables: [],
          call_stack: [],
          scopes: [],
          network_requests: []
        };
      }
      
      // Get the current user's session
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error('No user found');
      
      console.log('Sending code for debugging...');
      const response = await fetch('http://localhost:8000/debug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          code,
          filename,
          user_id: user.id
        }),
      });
      
      console.log('Received debug response:', response.status);
      
      if (!response.ok) {
        console.error('Debug response not OK:', response.status, response.statusText);
        setState(prev => ({
          ...prev,
          status: 'stopped',
          errors: [
            ...prev.errors,
            {
              id: Date.now().toString(),
              message: `Failed to debug code: ${response.statusText}`,
              timestamp: Date.now(),
              count: 1
            }
          ]
        }));
        throw new Error('Failed to debug code');
      }
      
      const data = await response.json();
      console.log('Debug data:', data);
      
      // Convert data to match our state structure
      const variables = data.variables ? data.variables.map((v: any, index: number) => ({
        name: v.name || `var_${index}`,
        value: Array.isArray(v.values) ? v.values[v.values.length - 1] || '' : v.value || '',
        values: v.values || undefined,
        type: v.type || 'unknown',
        variablesReference: index,
        hasChildren: false
      })) : [];
      
      const callStack = data.call_stack ? data.call_stack.map((frame: any, index: number) => ({
        id: index,
        name: frame.function || `frame_${index}`,
        function: frame.function,
        path: frame.file || filename,
        line: frame.line || 0,
        column: 0
      })) : [];
      
      const networkRequests = data.network_requests ? data.network_requests.map((req: any, index: number) => ({
        id: `net_${index}`,
        method: req.method || 'GET',
        url: req.url || '',
        status: req.status ? parseInt(req.status) : 200,
        statusText: req.response || 'OK',
        time: 100, // Default time
        type: 'xhr',
        contentType: 'application/json'
      })) : [];
      
      // Store everything in the state
      setState(prev => ({
        ...prev,
        status: 'paused', // Set to paused to indicate debugging is complete but debugger is active
        connected: true,
        variables,
        callStack,
        networkRequests,
        finalValue: data.finalValue || '', // Add finalValue from the API response
        // Store the original data for components that need the full structure
        additionalDebugData: {
          scopes: data.scopes || [],
          message: data.message || '',
          rawData: data
        }
      }));
      
      return data;
    } catch (error) {
      console.error('Error debugging code:', error);
      setState(prev => ({
        ...prev,
        status: 'stopped',
        errors: [
          ...prev.errors,
          {
            id: Date.now().toString(),
            message: `Error debugging code: ${error instanceof Error ? error.message : String(error)}`,
            timestamp: Date.now(),
            count: 1
          }
        ]
      }));
      return {
        message: `Error debugging code: ${error instanceof Error ? error.message : String(error)}`,
        variables: [],
        call_stack: [],
        scopes: [],
        network_requests: []
      };
    }
  }, []);
  
  const contextValue: DebuggerContextType = {
    state,
    connect,
    disconnect,
    setBreakpoint,
    removeBreakpoint,
    toggleBreakpoint,
    clearAllBreakpoints,
    continue_,
    pause,
    stepOver,
    stepInto,
    stepOut,
    restart,
    stop,
    expandVariable,
    evaluateExpression,
    clearConsole,
    executeConsoleCommand,
    captureApplicationState,
    clearErrors,
    clearNetworkRequests,
    clearStorageItems,
    capturePerformanceSnapshot,
    debugCode
  };
  
  return (
    <DebuggerContext.Provider value={contextValue}>
      {children}
    </DebuggerContext.Provider>
  );
}; 