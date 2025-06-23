class NavbarController {
    constructor() {
        this.profile = document.querySelector('nav .profile');
        this.allMenu = document.querySelectorAll('main .content-data .head .menu');
        this.init();
    }

    init() {
        this.setupProfileDropdown();
        this.setupMenuDropdowns();
        this.setupGlobalClickHandlers();
    }

    setupProfileDropdown() {
        if (this.profile) {
            const imgProfile = this.profile.querySelector('i.icon');
            const dropdownProfile = this.profile.querySelector('.profile-link');

            if (imgProfile) {
                imgProfile.addEventListener('click', () => {
                    if (dropdownProfile) {
                        dropdownProfile.classList.toggle('show');
                    }
                });
            }
        }
    }

    setupMenuDropdowns() {
        this.allMenu.forEach(item => {
            const icon = item.querySelector('.icon');
            const menuLink = item.querySelector('.menu-link');

            if (icon && menuLink) {
                icon.addEventListener('click', () => {
                    menuLink.classList.toggle('show');
                });
            }
        });
    }

    setupGlobalClickHandlers() {
        window.addEventListener('click', (e) => {
            this.handleProfileClick(e);
            this.handleMenuClick(e);
        });
    }

    handleProfileClick(e) {
        if (this.profile) {
            const imgProfile = this.profile.querySelector('i.icon');
            const dropdownProfile = this.profile.querySelector('.profile-link');
            
            if (e.target !== imgProfile && e.target !== dropdownProfile) {
                if (dropdownProfile && dropdownProfile.classList.contains('show')) {
                    dropdownProfile.classList.remove('show');
                }
            }
        }
    }

    handleMenuClick(e) {
        this.allMenu.forEach(item => {
            const icon = item.querySelector('.icon');
            const menuLink = item.querySelector('.menu-link');

            if (e.target !== icon) {
                if (e.target !== menuLink) {
                    if (menuLink && menuLink.classList.contains('show')) {
                        menuLink.classList.remove('show');
                    }
                }
            }
        });
    }
}

export default NavbarController; 