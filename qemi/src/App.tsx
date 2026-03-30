import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Global, css } from '@emotion/react';
import Login from './pages/Login';
import Register from './pages/Register';
import ExperienceSelection from './pages/ExperienceSelection';
import Debug from './pages/Debug';
import EditProfile from './pages/EditProfile';
import ChangePassword from './pages/ChangePassword';
import SplashScreen from './components/SplashScreen';
import styled from '@emotion/styled';
import { theme } from './theme';
import { FontSizeProvider } from './contexts/FontSizeContext';
import { ThemeProvider } from './contexts/ThemeContext';
import './styles/fontSizes.css';
import './styles/themes.css';
import { FileMonitorProvider } from './contexts/FileMonitorContext';
import { DebuggerProvider } from './contexts/DebuggerContext';
import { FileAnalysisProvider } from './contexts/FileAnalysisContext';

// Constants for minimum app dimensions
const MIN_WIDTH = 1000;
const MIN_HEIGHT = 700;

const globalStyles = css`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: var(--color-background, ${theme.colors.background});
    color: var(--color-text, ${theme.colors.text});
    overflow: hidden;
  }

  #root {
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
  }
`;

const AppContainer = styled.div`
  width: 100%;
  height: 100%;
  min-width: ${MIN_WIDTH}px;
  min-height: ${MIN_HEIGHT}px;
  background-color: var(--color-background, ${theme.colors.background});
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const PageContainer = styled.div`
  flex: 1;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
`;

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Navigate to="/register" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/experience" element={<ExperienceSelection />} />
        <Route path="/debug" element={<Debug />} />
        <Route path="/edit-profile" element={<EditProfile />} />
        <Route path="/change-password" element={<ChangePassword />} />
      </Routes>
    </AnimatePresence>
  );
};

// Try to safely access window.electron if it exists
type ElectronAPI = {
  setWindowSize?: (width: number, height: number) => Promise<boolean>;
  onWindowResize?: (callback: (width: number, height: number) => void) => (() => void);
  lockCurrentSizeAsMinimum?: () => Promise<{ width: number, height: number }>;
  resetMinimumSize?: () => Promise<boolean>;
  getWindowSize?: () => Promise<{ width: number, height: number } | null>;
};

// Safe wrapper around window.electron
const electronAPI: ElectronAPI = 
  typeof window !== 'undefined' && 'electron' in window 
    ? (window as any).electron 
    : {};

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [appReady, setAppReady] = useState(false);
  
  // Set the initial size and lock minimum size after loading the Debug page
  const handleDebugPageReady = async () => {
    // Only set minimum size once the app is fully loaded
    if (!appReady && electronAPI.lockCurrentSizeAsMinimum) {
      try {
        const size = await electronAPI.lockCurrentSizeAsMinimum();
        console.log('Set minimum size to:', size);
        setAppReady(true);
      } catch (err) {
        console.error('Failed to set minimum size:', err);
      }
    }
  };

  useEffect(() => {
    // Initialize any window-related logic here
    const handleResize = () => {
      // This function is intentionally left empty but could
      // be used to update state based on window size if needed
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Handler for when splash screen completes
  const handleSplashComplete = () => {
    setShowSplash(false);
    
    // Set a timeout to ensure the app is fully rendered before measuring
    setTimeout(() => {
      handleDebugPageReady();
    }, 1000);
  };

  return (
    <ThemeProvider>
      <FileMonitorProvider>
        <DebuggerProvider>
          <FileAnalysisProvider>
            <FontSizeProvider>
              <Router>
                <Global styles={globalStyles} />
                {showSplash ? (
                  <SplashScreen onComplete={handleSplashComplete} />
                ) : (
                  <AppContainer>
                    <PageContainer>
                      <AnimatedRoutes />
                    </PageContainer>
                  </AppContainer>
                )}
              </Router>
            </FontSizeProvider>
          </FileAnalysisProvider>
        </DebuggerProvider>
      </FileMonitorProvider>
    </ThemeProvider>
  );
}

export default App;
