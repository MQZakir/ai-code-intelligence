import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

type ThemeType = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  isDarkMode: boolean;
}

// Create context with default value
const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  setTheme: () => {},
  isDarkMode: true,
});

// Custom hook for using the theme context
export const useTheme = () => useContext(ThemeContext);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Get the initial theme from localStorage or default to 'dark'
  const [theme, setTheme] = useState<ThemeType>(() => {
    const savedTheme = localStorage.getItem('theme');
    return (savedTheme as ThemeType) || 'dark';
  });
  
  // Determine if dark mode is active
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  
  // Function to check if system prefers dark mode
  const systemPrefersDark = () => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  };
  
  // Update isDarkMode based on the theme
  useEffect(() => {
    if (theme === 'system') {
      setIsDarkMode(systemPrefersDark());
    } else {
      setIsDarkMode(theme === 'dark');
    }
    
    // Add theme class to document
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    
    // Save the theme to localStorage
    localStorage.setItem('theme', theme);
  }, [theme, isDarkMode]);
  
  // Listen for system theme changes if theme is set to 'system'
  useEffect(() => {
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      if (theme === 'system') {
        setIsDarkMode(e.matches);
      }
    };
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', handleSystemThemeChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}; 