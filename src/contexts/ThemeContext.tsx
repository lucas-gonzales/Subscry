import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Appearance } from 'react-native';

type Theme = 'light' | 'dark';

interface Colors {
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  primary: string;
  accent: string;
  border: string;
  danger: string;
}

export const lightColors: Colors = {
  background: '#F4F6F8',
  card: '#ffffff',
  text: '#1A1A1A',
  textSecondary: '#637381',
  primary: '#4F46E5', // Indigo
  accent: '#10B981', // Emerald
  border: '#E0E0E0',
  danger: '#EF4444',
};

export const darkColors: Colors = {
  background: '#0F172A', // Slate 900
  card: '#1E293B', // Slate 800
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  primary: '#6366F1', // Indigo 500
  accent: '#34D399',
  border: '#334155',
  danger: '#F87171',
};

type ThemeContextType = {
  theme: Theme;
  isDark: boolean;
  colors: Colors;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  isDark: false,
  colors: lightColors,
  toggleTheme: () => {},
  setTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const colorScheme = Appearance.getColorScheme();
  const [theme, setThemeState] = useState<Theme>(colorScheme === 'dark' ? 'dark' : 'light');

  const isDark = theme === 'dark';
  const colors = isDark ? darkColors : lightColors;

  const setTheme = (t: Theme) => {
    setThemeState(t);
  };

  const toggleTheme = () => setThemeState((t) => (t === 'light' ? 'dark' : 'light'));

  return (
    <ThemeContext.Provider value={{ theme, isDark, colors, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
