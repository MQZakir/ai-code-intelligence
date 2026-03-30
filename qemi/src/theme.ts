// Define color palettes for light and dark modes
const colors = {
    dark: {
        primary: '#E6FF4B',
        primaryDark: '#D4ED3A',
        secondary: '#4CAF50',
        accent: '#E6FF4B',
        text: '#FFFFFF',
        textSecondary: '#A0A0A0',
        textInverted: '#333333',
        error: '#FF5252',
        warning: '#FFA726',
        info: '#29B6F6',
        success: '#4CAF50',
        background: '#000000',
        cardBackground: '#111111',
        border: '#222222',
        surface: '#111111',
        hover: '#222222',
        gradient: {
            primary: 'linear-gradient(135deg, #E6FF4B 0%, #4CAF50 100%)',
            secondary: 'linear-gradient(135deg, #4CAF50 0%, #E6FF4B 100%)',
        },
        // RGB values for rgba() CSS functions
        primaryRGB: '230, 255, 75',
        accentRGB: '230, 255, 75',
        errorRGB: '255, 82, 82',
        warningRGB: '255, 167, 38',
        successRGB: '76, 175, 80',
    },
    light: {
        primary: '#4CAF50',
        primaryDark: '#3B9C3E',
        secondary: '#E6FF4B',
        accent: '#4CAF50',
        text: '#222222',
        textSecondary: '#666666',
        textInverted: '#FFFFFF',
        error: '#D32F2F',
        warning: '#F57C00',
        info: '#0288D1',
        success: '#388E3C',
        background: '#FFFFFF',
        cardBackground: '#F5F5F5',
        border: '#E0E0E0',
        surface: '#F9F9F9',
        hover: '#EEEEEE',
        gradient: {
            primary: 'linear-gradient(135deg, #4CAF50 0%, #7BC67E 100%)',
            secondary: 'linear-gradient(135deg, #7BC67E 0%, #4CAF50 100%)',
        },
        // RGB values for rgba() CSS functions
        primaryRGB: '76, 175, 80',
        accentRGB: '76, 175, 80',
        errorRGB: '211, 47, 47',
        warningRGB: '245, 124, 0',
        successRGB: '56, 142, 60',
    }
};

// Function to get the current theme colors based on the data-theme attribute
const getThemeColors = () => {
    const theme = document.documentElement.getAttribute('data-theme') || 'dark';
    return colors[theme === 'light' ? 'light' : 'dark'];
};

// Shared theme values that don't change between light and dark
const sharedTheme = {
    transitions: {
        default: 'all 0.3s ease',
    },
    borderRadius: {
        small: '8px',
        medium: '12px',
        large: '16px',
        xlarge: '24px',
        full: '9999px',
    },
    shadows: {
        neon: '0 0 10px rgba(230, 255, 75, 0.5)',
        glow: '0 0 20px rgba(230, 255, 75, 0.3)',
    },
    spacing: {
        xs: '0.5rem',
        sm: '0.875rem',
        md: '1.25rem',
        lg: '1.5rem',
        xl: '2rem',
        xxl: '3rem',
    },
    fontSize: {
        // Base font sizes that will be multiplied by the font size multiplier
        xs: 'calc(0.75rem * var(--font-size-multiplier, 1))',
        sm: 'calc(0.875rem * var(--font-size-multiplier, 1))',
        base: 'calc(1rem * var(--font-size-multiplier, 1))',
        md: 'calc(1.1rem * var(--font-size-multiplier, 1))',
        lg: 'calc(1.25rem * var(--font-size-multiplier, 1))',
        xl: 'calc(1.5rem * var(--font-size-multiplier, 1))',
        xxl: 'calc(2rem * var(--font-size-multiplier, 1))',
    },
};

// Create CSS variables for dynamic theme changes
const createCSSVariables = () => {
    if (typeof document !== 'undefined') {
        const root = document.documentElement;
        const theme = root.getAttribute('data-theme') || 'dark';
        const currentColors = colors[theme === 'light' ? 'light' : 'dark'];
        
        Object.entries(currentColors).forEach(([key, value]) => {
            if (typeof value === 'string') {
                root.style.setProperty(`--color-${key}`, value);
                // If there's an RGB version, set that too
                if (key.endsWith('RGB')) {
                    root.style.setProperty(`--color-${key.replace('RGB', '-rgb')}`, value);
                }
            } else if (typeof value === 'object') {
                Object.entries(value).forEach(([subKey, subValue]) => {
                    root.style.setProperty(`--color-${key}-${subKey}`, subValue as string);
                });
            }
        });
    }
};

// Call the function when the theme file is imported
if (typeof window !== 'undefined') {
    createCSSVariables();
    
    // Update CSS variables when the theme changes
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'data-theme') {
                createCSSVariables();
            }
        });
    });
    
    if (document.documentElement) {
        observer.observe(document.documentElement, { attributes: true });
    }
}

// Export the theme
export const theme = {
    colors: getThemeColors(),
    ...sharedTheme,
};

export const darkTheme = {
    colors: {
        primary: '#E6FF4B',
        primaryDark: '#D4ED3A',
        secondary: '#4CAF50',
        accent: '#E6FF4B',
        text: '#F5F5F5',
        textSecondary: '#BBBBBB',
        textInverted: '#333333',
        error: '#FF6B6B',
        warning: '#FFA726',
        info: '#29B6F6',
        success: '#4CAF50',
        background: '#000000',
        cardBackground: '#111111',
        border: '#222222',
        surface: '#111111',
        hover: '#222222',
        gradient: {
            primary: 'linear-gradient(135deg, #E6FF4B 0%, #4CAF50 100%)',
            secondary: 'linear-gradient(135deg, #4CAF50 0%, #E6FF4B 100%)',
        },
        // RGB values for rgba() CSS functions
        primaryRGB: '230, 255, 75',
        accentRGB: '230, 255, 75',
        errorRGB: '255, 82, 82',
        warningRGB: '255, 167, 38',
        successRGB: '76, 175, 80',
    },
    ...sharedTheme,
}; 