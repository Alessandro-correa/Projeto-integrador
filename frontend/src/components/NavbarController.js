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
        this.setupDocsButton();
    }

    setupDocsButton() {
        // Criar o botão de documentação
        const docsButton = document.createElement('a');
        docsButton.href = '#';
        docsButton.className = 'nav-link';
        docsButton.innerHTML = '<i class="bx bxs-book-alt icon" title="Documentação API"></i>';
        
        // Inserir antes do divider da profile
        const divider = document.querySelector('nav .divider');
        divider.parentNode.insertBefore(docsButton, divider);

        // Adicionar evento de clique
        docsButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.redirectToSwaggerDocs();
        });
    }

    redirectToSwaggerDocs() {
        // Obter o token do localStorage
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Você precisa estar logado para acessar a documentação.');
            return;
        }

        // Abrir a documentação em uma nova aba
        const docsUrl = 'http://localhost:3000/api-docs';
        const newWindow = window.open(docsUrl, '_blank');
        
        // Adicionar o token ao localStorage da nova aba
        newWindow.addEventListener('load', () => {
            newWindow.localStorage.setItem('swagger_token', token);
            // Executar script para preencher o token no Swagger UI
            newWindow.eval(`
                setTimeout(() => {
                    const token = localStorage.getItem('swagger_token');
                    if (token) {
                        window.ui.preauthorizeApiKey("bearerAuth", token);
                    }
                }, 1000);
            `);
        });
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
