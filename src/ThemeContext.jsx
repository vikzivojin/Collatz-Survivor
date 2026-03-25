import { createContext, useContext, useState, useEffect } from 'react';

export const THEMES = [
  { id: 'light',  label: 'Light',  icon: '☀️' },
  { id: 'dark',   label: 'Dark',   icon: '🌙' },
  { id: 'red',    label: 'Red',    icon: '🔴' },
  { id: 'blue',   label: 'Blue',   icon: '🔵' },
  { id: 'green',  label: 'Green',  icon: '🟢' },
  { id: 'pink',   label: 'Pink',   icon: '🩷' },
  { id: 'orange', label: 'Orange', icon: '🟠' },
];

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('collatz-theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('collatz-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
