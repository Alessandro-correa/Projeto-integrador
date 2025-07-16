class SidebarController {
    constructor() {
        this.sidebar = document.getElementById('sidebar');
        this.toggleSidebar = document.querySelector('nav .toggle-sidebar');
        this.allSideDivider = document.querySelectorAll('#sidebar .divider');
        this.allDropdown = document.querySelectorAll('#sidebar .side-dropdown');
        this.overlay = null;
        this.isMobile = false;
        this.init();
    }

    init() {
        this.createOverlay();
        this.setupSidebarCollapse();
        this.setupSidebarHover();
        this.setupDropdowns();
        this.setActiveMenuItem();
        this.handleResize();
        this.setupEventListeners();
    }

    createOverlay() {
        
        if (!document.getElementById('sidebar-overlay')) {
            this.overlay = document.createElement('div');
            this.overlay.id = 'sidebar-overlay';
            this.overlay.className = 'sidebar-overlay';
            document.body.appendChild(this.overlay);
            
            this.overlay.addEventListener('click', () => {
                this.closeSidebar();
            });
        } else {
            this.overlay = document.getElementById('sidebar-overlay');
        }
    }

    setupEventListeners() {
        
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isMobile && this.sidebar.classList.contains('active')) {
                this.closeSidebar();
            }
        });
    }

    handleResize() {
        const wasIsMobile = this.isMobile;
        this.isMobile = window.innerWidth <= 992;
        
        if (wasIsMobile !== this.isMobile) {
            if (!this.isMobile) {
                
                this.closeSidebar();
                this.sidebar.classList.remove('active');
                if (this.overlay) {
                    this.overlay.classList.remove('active');
                }
            }
        }
    }

    setupSidebarCollapse() {
        if (this.toggleSidebar) {
            this.toggleSidebar.addEventListener('click', () => {
                if (this.isMobile) {
                    this.toggleMobileSidebar();
                } else {
                    this.sidebar.classList.toggle('hide');
                    this.updateSidebarState();
                }
            });
        }
    }

    toggleMobileSidebar() {
        const isActive = this.sidebar.classList.contains('active');
        
        if (isActive) {
            this.closeSidebar();
        } else {
            this.openSidebar();
        }
    }

    openSidebar() {
        this.sidebar.classList.add('active');
        if (this.overlay) {
            this.overlay.classList.add('active');
        }
        document.body.style.overflow = 'hidden';
    }

    closeSidebar() {
        this.sidebar.classList.remove('active');
        if (this.overlay) {
            this.overlay.classList.remove('active');
        }
        document.body.style.overflow = '';
    }

    setupSidebarHover() {
        if (this.sidebar && !this.isMobile) {
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

window.SidebarController = SidebarController;
