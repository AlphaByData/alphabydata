/* Theme Toggle Controller (Default Light Mode with Dark Mode Support) */
(function() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  applyTheme(savedTheme);

  document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('theme-toggle-btn');
    const toggleIcon = document.getElementById('theme-toggle-icon');

    updateToggleIcon(document.documentElement.classList.contains('dark'));

    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const isDark = document.documentElement.classList.contains('dark');
        const nextTheme = isDark ? 'light' : 'dark';
        applyTheme(nextTheme);
        updateToggleIcon(!isDark);
      });
    }
  });

  function applyTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.remove('light-mode');
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark-mode');
      document.body.classList.add('light-mode');
      localStorage.setItem('theme', 'light');
    }
  }

  function updateToggleIcon(isDark) {
    const icon = document.getElementById('theme-toggle-icon');
    if (icon) {
      icon.className = isDark ? 'pi pi-sun' : 'pi pi-moon';
    }
  }
})();
