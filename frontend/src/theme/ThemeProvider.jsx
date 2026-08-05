import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import { THEMES, DEFAULT_THEME, applyTheme } from './themes';

const ThemeContext = createContext(null);

const LS_KEY = 'cafe-theme-cache';

function loadCache() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; }
  catch { return {}; }
}
function saveCache(data) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch {}
}

export function ThemeProvider({ children }) {
  const cache = loadCache();

  // Initialise from cache immediately to avoid FOUC
  const [themeId, setThemeId]       = useState(cache.theme || DEFAULT_THEME);
  const [customColors, setCustomColors] = useState(cache.customColors || {});
  const [ready, setReady]           = useState(false);

  // Apply theme to DOM whenever themeId / customColors changes
  useEffect(() => {
    applyTheme(themeId, customColors);
    setReady(true);
  }, [themeId, customColors]);

  // Fetch from server on mount (updates over the cache)
  useEffect(() => {
    api.get('/settings')
      .then(({ data }) => {
        const { theme, customColors: cc } = data.settings;
        const newTheme  = theme && THEMES[theme] ? theme : DEFAULT_THEME;
        const newColors = cc || {};
        setThemeId(newTheme);
        setCustomColors(newColors);
        saveCache({ theme: newTheme, customColors: newColors });
      })
      .catch(() => {/* use cached values */});
  }, []);

  const updateTheme = useCallback((id, colors = customColors) => {
    setThemeId(id);
    setCustomColors(colors);
    saveCache({ theme: id, customColors: colors });
  }, [customColors]);

  const updateCustomColors = useCallback((colors) => {
    setCustomColors(colors);
    saveCache({ theme: themeId, customColors: colors });
  }, [themeId]);

  return (
    <ThemeContext.Provider value={{ themeId, customColors, updateTheme, updateCustomColors, ready }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
