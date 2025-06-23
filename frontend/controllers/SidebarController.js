class SidebarController {
    constructor() {
        this.sidebar = document.getElementById('sidebar');
        this.toggleSidebar = document.querySelector('nav .toggle-sidebar');
        this.allSideDivider = document.querySelectorAll('#sidebar .divider');
        this.allDropdown = document.querySelectorAll('#sidebar .side-dropdown');
        this.init();
    }

    init() {
        this.setupSidebarCollapse();
        this.setupSidebarHover();
        this.setupDropdowns();
        this.setActiveMenuItem();
    }

    setupSidebarCollapse() {
        if (this.toggleSidebar) {
            this.toggleSidebar.addEventListener('click', () => {
                this.sidebar.classList.toggle('hide');
                this.updateSidebarState();
            });
        }
    }

    setupSidebarHover() {
        if (this.sidebar) {
            this.sidebar.addEventListener('mouseleave', () => {
                if (this.sidebar.classList.contains('hide')) {
                    this.collapseSidebar();
                }
            });

            this.sidebar.addEventListener('mouseenter', () => {
                if (this.sidebar.classList.contains('hide')) {
                    this.expandSidebar();
                }
            });
        }
    }

    setupDropdowns() {
        this.allDropdown.forEach(item => {
            const a = item.parentElement.querySelector('a:first-child');
            if (a) {
                a.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.toggleDropdown(item, a);
                });
            }
        });
    }

    toggleDropdown(item, link) {
        if (!link.classList.contains('active')) {
            this.allDropdown.forEach(i => {
                const aLink = i.parentElement.querySelector('a:first-child');
                if (aLink) {
                    aLink.classList.remove('active');
                    i.classList.remove('show');
                }
            });
        }

        link.classList.toggle('active');
        item.classList.toggle('show');
    }

    updateSidebarState() {
        if (this.sidebar.classList.contains('hide')) {
            this.collapseSidebar();
        } else {
            this.expandSidebar();
        }
    }

    collapseSidebar() {
        this.allSideDivider.forEach(item => {
            item.textContent = '-';
        });
        this.allDropdown.forEach(item => {
            const a = item.parentElement.querySelector('a:first-child');
            if (a) {
                a.classList.remove('active');
                item.classList.remove('show');
            }
        });
    }

    expandSidebar() {
        this.allSideDivider.forEach(item => {
            item.textContent = item.dataset.text;
        });
    }

    setActiveMenuItem() {
        const currentPath = window.location.pathname;
        const menuItems = document.querySelectorAll('#sidebar .side-menu a');
        
        menuItems.forEach(item => {
            if (item.getAttribute('href') && currentPath.includes(item.getAttribute('href'))) {
                item.classList.add('active');
            }
        });
    }
}

export default SidebarController; 