import type { ThemeConfig } from 'antd';
import React, { createContext, useContext, useEffect, useState } from 'react';

export type AppTheme = 'light' | 'dark';

interface ThemeContextValue {
  theme: AppTheme;
  toggleTheme: () => void;
  setTheme: (theme: AppTheme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  toggleTheme: () => undefined,
  setTheme: () => undefined,
});

export const useAppTheme = () => useContext(ThemeContext);

const STORAGE_KEY = 'secretpad-theme';

const lightToken: ThemeConfig['token'] = {
  colorPrimary: '#0071e3',
  colorSuccess: '#34c759',
  colorWarning: '#ff9500',
  colorError: '#ff3b30',
  colorInfo: '#0071e3',
  colorText: '#1d1d1f',
  colorTextSecondary: '#86868b',
  colorBorder: 'rgba(0, 0, 0, 0.08)',
  borderRadius: 10,
  fontSize: 14,
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Icons", "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
};

const darkToken: ThemeConfig['token'] = {
  colorPrimary: '#0a84ff',
  colorSuccess: '#30d158',
  colorWarning: '#ff9f0a',
  colorError: '#ff453a',
  colorInfo: '#0a84ff',
  colorText: '#f5f5f7',
  colorTextSecondary: '#8e8e93',
  colorBorder: 'rgba(255, 255, 255, 0.08)',
  borderRadius: 10,
  fontSize: 14,
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Icons", "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
};

export const appThemeConfig: Record<AppTheme, ThemeConfig> = {
  light: { token: lightToken },
  dark: { token: darkToken },
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    if (typeof window === 'undefined') return 'light';
    return (localStorage.getItem(STORAGE_KEY) as AppTheme) || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const setTheme = (next: AppTheme) => setThemeState(next);
  const toggleTheme = () =>
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
