class ThemeController {
    constructor() {
        this.themeToggle = document.getElementById('theme-toggle-checkbox');
        this.init();
    }

    init() {
        if (this.themeToggle) {
            const currentTheme = localStorage.getItem('theme');
            if (currentTheme === 'dark') {
                document.body.classList.add('dark');
                this.themeToggle.checked = true;
            } else {
                document.body.classList.remove('dark');
                this.themeToggle.checked = false;
            }

            this.themeToggle.addEventListener('change', (e) => {
                this.toggleTheme(e.target.checked);
            });
        }
    }

    toggleTheme(isDark) {
        if (isDark) {
            document.body.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }
}

export default ThemeController; 