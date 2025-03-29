import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';
type ColorScheme = 'default' | 'purple' | 'blue' | 'green';

interface ThemeContextType {
  theme: Theme;
  colorScheme: ColorScheme;
  toggleTheme: () => void;
  setColorScheme: (scheme: ColorScheme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Initialize from localStorage or system preference
    const savedTheme = localStorage.getItem('theme') as Theme;
    const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    return savedTheme || systemPreference;
  });

  const [colorScheme, setColorScheme] = useState<ColorScheme>(() => {
    // Initialize from localStorage or default to 'default'
    return (localStorage.getItem('colorScheme') as ColorScheme) || 'default';
  });

  useEffect(() => {
    // Update localStorage and document class when theme changes
    localStorage.setItem('theme', theme);
    
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  useEffect(() => {
    // Update localStorage and document class when color scheme changes
    localStorage.setItem('colorScheme', colorScheme);
    
    const root = window.document.documentElement;
    root.classList.remove('theme-default', 'theme-purple', 'theme-blue', 'theme-green');
    root.classList.add(`theme-${colorScheme}`);
  }, [colorScheme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, colorScheme, toggleTheme, setColorScheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
