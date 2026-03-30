import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface ErrorDetails {
  description: string;
  solution: string;
  commonCauses: string;
  incorrectCode: string;
  correctCode: string;
}

interface Error {
  type: string;
  message: string;
  line: number;
  file: string;
  description: string;
  fix: string;
  explanation: string;
  details: ErrorDetails;
}

interface AnalysisResult {
  explanation: string;
  errors: Error[];
}

interface FileAnalysisContextType {
  analysis: AnalysisResult | null;
  analyzeCode: (code: string) => Promise<void>;
  clearAnalysis: () => void;
  isModelLoaded: boolean;
  isLoading: boolean;
}

const FileAnalysisContext = createContext<FileAnalysisContextType>({
  analysis: null,
  analyzeCode: async () => {},
  clearAnalysis: () => {},
  isModelLoaded: false,
  isLoading: false,
});

export const FileAnalysisProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Log when the provider is mounted
  useEffect(() => {
    console.error('FileAnalysisProvider mounted');
  }, []);

  // Debug logging for state changes
  useEffect(() => {
    console.error('CONTEXT - Analysis state changed:', {
      hasAnalysis: !!analysis,
      isModelLoaded,
      isLoading,
      explanation: analysis?.explanation,
      errorCount: analysis?.errors?.length
    });
  }, [analysis, isModelLoaded, isLoading]);

  const analyzeCode = useCallback(async (code: string) => {
    console.log('------- STARTING CODE ANALYSIS -------');
    console.log(`Code length: ${code.length} characters`);
    setIsLoading(true);
    try {
      console.error('Sending request to http://localhost:8000/analyze');
      
      // Get the current user's session
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error('No user found');
      
      // First, check if the API is available
      try {
        const testResponse = await fetch('http://localhost:8000/test');
        if (!testResponse.ok) {
          console.error('API health check failed:', testResponse.status);
          setAnalysis({
            explanation: "The analysis service is not responding. Please check if the server is running.",
            errors: []
          });
          return;
        } else {
          console.log('API health check successful');
          const testData = await testResponse.json();
          console.log('API test response:', testData);
        }
      } catch (error) {
        console.error('API health check failed with error:', error);
        setAnalysis({
          explanation: "Could not connect to the analysis service. Please make sure the server is running.",
          errors: []
        });
        return;
      }
      
      // Now make the actual analysis request
      console.log('Sending code for analysis...');
      const response = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          code,
          user_id: user.id
        }),
      });

      console.log('Received response:', response.status);
      
      if (!response.ok) {
        console.error('Response not OK:', response.status, response.statusText);
        throw new Error('Failed to analyze code');
      }

      console.log('Parsing response...');
      const result = await response.json();
      console.log('Parsed response:', result);
      
      // If the model isn't loaded, the server will return a message
      if (result.message && result.message.includes("Model not loaded")) {
        console.error('Model not loaded response received');
        setIsModelLoaded(false);
        setAnalysis({
          explanation: "The analysis model is not loaded. Please ensure the model file is in the correct location.",
          errors: []
        });
        return;
      }

      console.log('Setting analysis result to state');
      setIsModelLoaded(true);
      
      // Split the response into explanation and errors
      const explanation = result.explanation || "No explanation available.";
      const errors = result.errors || [];
      
      console.log('API Response - explanation:', explanation);
      console.log('API Response - errors array:', errors);
      console.log('API Response - errors length:', errors.length);
      
      setAnalysis({
        explanation,
        errors
      });
      
      console.log('Analysis complete');
    } catch (error) {
      console.error('Error analyzing code:', error);
      setAnalysis({
        explanation: "Error analyzing code. Please check if the analysis server is running.",
        errors: []
      });
    } finally {
      setIsLoading(false);
    }
    console.log('------- CODE ANALYSIS COMPLETED -------');
  }, []);

  const clearAnalysis = useCallback(() => {
    setAnalysis(null);
  }, []);

  return (
    <FileAnalysisContext.Provider value={{ analysis, analyzeCode, clearAnalysis, isModelLoaded, isLoading }}>
      {children}
    </FileAnalysisContext.Provider>
  );
};

export const useFileAnalysis = () => useContext(FileAnalysisContext); 