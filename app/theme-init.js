// This script must run synchronously before any CSS loads
// It sets the data-theme attribute on the html element to prevent flash
(function() {
  try {
    const savedTheme = localStorage.getItem('colorblind-viewer-theme');
    let theme = savedTheme || 'auto';
    
    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  } catch (e) {
    // Fallback to light if localStorage fails
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();

