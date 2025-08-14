const toggleButton = document.getElementById('theme-toggle');
const htmlElement = document.documentElement;

// Theme setzen
function setTheme(theme) {
  htmlElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  updateThemeIcon(theme);
}

// Theme-Icon aktualisieren
function updateThemeIcon(theme) {
  const icon = theme === 'dark' ? '☀️' : '🌙';
  toggleButton.textContent = icon;
}

// Initialisierung
document.addEventListener('DOMContentLoaded', () => {
  const preferredTheme = localStorage.getItem('theme') || 'light'; // Light als Default
  setTheme(preferredTheme);

  toggleButton.addEventListener('click', () => {
    const currentTheme = htmlElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  });
});
