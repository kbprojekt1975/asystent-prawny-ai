import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Theme, ThemeName, loadTheme } from '../themes';
import standardTheme from '../themes/standard.json';

interface ThemeContextType {
  theme: Theme;
  themeName: ThemeName;
  setTheme: (themeName: ThemeName) => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(standardTheme as Theme);
  const [themeName, setThemeName] = useState<ThemeName>('standard');
  const [isLoading, setIsLoading] = useState(false);

  // Load saved theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme') as ThemeName | null;
    if (savedTheme && (savedTheme === 'standard' || savedTheme === 'dark')) {
      setTheme(savedTheme);
    }
  }, []);

  const setTheme = async (newThemeName: ThemeName) => {
    setIsLoading(true);
    try {
      const newTheme = await loadTheme(newThemeName);
      setThemeState(newTheme);
      setThemeName(newThemeName);
      localStorage.setItem('app-theme', newThemeName);
    } catch (error) {
      console.error('Failed to load theme:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Inject CSS variables into :root
  useEffect(() => {
    if (!theme) return;
    const root = document.documentElement;
    
    // Global colors
    root.style.setProperty('--theme-primary', theme.colors.global.primary);
    root.style.setProperty('--theme-secondary', theme.colors.global.secondary);
    root.style.setProperty('--theme-accent', theme.colors.global.accent);
    root.style.setProperty('--theme-bg-dark', theme.colors.global.background.dark);
    root.style.setProperty('--theme-bg-darker', theme.colors.global.background.darker);
    root.style.setProperty('--theme-bg-light', theme.colors.global.background.light);
    root.style.setProperty('--theme-text-primary', theme.colors.global.text.primary);
    root.style.setProperty('--theme-text-secondary', theme.colors.global.text.secondary);
    root.style.setProperty('--theme-border-default', theme.colors.global.border.default);
    
    // Andromeda context colors
    root.style.setProperty('--theme-andromeda-bg', theme.colors.andromeda.background.main);
    root.style.setProperty('--theme-andromeda-sidebar', theme.colors.andromeda.sidebar.background);
    root.style.setProperty('--theme-andromeda-header', theme.colors.andromeda.header.background);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, themeName, setTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
};
