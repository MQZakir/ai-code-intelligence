import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

type FontSizeType = 'small' | 'medium' | 'large';

interface FontSizeContextType {
  fontSize: FontSizeType;
  setFontSize: (size: FontSizeType) => void;
}

// Create context with default value
const FontSizeContext = createContext<FontSizeContextType>({
  fontSize: 'medium',
  setFontSize: () => {},
});

// Custom hook for using the font size context
export const useFontSize = () => useContext(FontSizeContext);

// Font size multipliers
export const fontSizeMultipliers = {
  small: 0.85,
  medium: 1,
  large: 1.2,
};

interface FontSizeProviderProps {
  children: ReactNode;
}

export const FontSizeProvider: React.FC<FontSizeProviderProps> = ({ children }) => {
  // Get the initial font size from localStorage or default to 'medium'
  const [fontSize, setFontSize] = useState<FontSizeType>(() => {
    const savedFontSize = localStorage.getItem('fontSize');
    return (savedFontSize as FontSizeType) || 'medium';
  });

  // Save the font size to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('fontSize', fontSize);
    
    // Apply the font size to the HTML root element
    document.documentElement.style.setProperty('--font-size-multiplier', fontSizeMultipliers[fontSize].toString());
  }, [fontSize]);

  return (
    <FontSizeContext.Provider value={{ fontSize, setFontSize }}>
      {children}
    </FontSizeContext.Provider>
  );
}; 