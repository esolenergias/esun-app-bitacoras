import { useState, useEffect } from 'react';

export function useTheme() {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    // Read current theme from WordPress (set via PHP)
    const htmlElement = document.documentElement;
    const currentTheme = htmlElement.getAttribute('data-theme') || 'light';
    setTheme(currentTheme);

    // Listen for theme changes
    const handleThemeChange = () => {
      const newTheme = htmlElement.getAttribute('data-theme') || 'light';
      setTheme(newTheme);
    };

    // Custom event listener for theme changes from other parts of the page
    window.addEventListener('themechange', handleThemeChange);

    return () => {
      window.removeEventListener('themechange', handleThemeChange);
    };
  }, []);

  return theme;
}
