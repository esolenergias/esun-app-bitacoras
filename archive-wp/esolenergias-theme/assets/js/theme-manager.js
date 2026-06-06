/**
 * Theme Manager - Sincronización Dark/Light Mode
 * eSol Energías - WordPress + React Theme Sync
 */

(function () {
  'use strict';

  const THEME_KEY = 'esol-theme';
  const THEME_DURATION = 86400000; // 24 hours in milliseconds

  /**
   * Get current theme from different sources in priority order
   * 1. HTML attribute (set by PHP or previous session)
   * 2. localStorage (user preference)
   * 3. System preference (prefers-color-scheme media query)
   * 4. Default: 'light'
   */
  function getTheme() {
    const html = document.documentElement;

    // Check if HTML has theme attribute
    const htmlTheme = html.getAttribute('data-theme');
    if (htmlTheme && ['light', 'dark'].includes(htmlTheme)) {
      return htmlTheme;
    }

    // Check localStorage (stored as JSON {theme, expiryTime} or plain string)
    const stored = localStorage.getItem(THEME_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && ['light', 'dark'].includes(parsed.theme) && Date.now() < parsed.expiryTime) {
          return parsed.theme;
        }
      } catch (e) {
        if (['light', 'dark'].includes(stored)) return stored;
      }
    }

    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    // Default
    return 'light';
  }

  /**
   * Set theme and save to localStorage + HTML attribute
   */
  function setTheme(theme) {
    if (!['light', 'dark'].includes(theme)) return;

    // Update HTML attribute
    document.documentElement.setAttribute('data-theme', theme);

    // Save to localStorage with expiry
    const expiryTime = Date.now() + THEME_DURATION;
    localStorage.setItem(THEME_KEY, JSON.stringify({ theme, expiryTime }));

    // Set cookie for server-side PHP (24h)
    document.cookie = `${THEME_KEY}=${theme}; max-age=86400; path=/; SameSite=Lax`;

    // Dispatch custom event for React and other listeners
    window.dispatchEvent(
      new CustomEvent('themechange', {
        detail: { theme },
      })
    );
  }

  /**
   * Toggle between light and dark
   */
  function toggleTheme() {
    const current = getTheme();
    const next = current === 'light' ? 'dark' : 'light';
    setTheme(next);
  }

  /**
   * Setup theme on page load
   */
  function initTheme() {
    const theme = getTheme();
    setTheme(theme);

    // Listen for theme toggle button clicks
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', toggleTheme);
    }

    // Listen for system theme preference changes
    if (window.matchMedia) {
      const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
      darkModeQuery.addEventListener('change', (e) => {
        const newTheme = e.matches ? 'dark' : 'light';
        setTheme(newTheme);
      });
    }
  }

  // Initialize on DOM ready or immediately if already ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme);
  } else {
    initTheme();
  }

  // Expose to global scope for external use
  window.esolTheme = {
    get: getTheme,
    set: setTheme,
    toggle: toggleTheme,
  };
})();
