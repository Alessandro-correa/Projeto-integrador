import '../../src/components/ThemeController.js';
import '../../src/components/SidebarController.js';
import NavbarController from '../../src/components/NavbarController.js';
import FilterController from '../../src/components/FilterController.js';


// Classe principal da aplicação
class App {
    constructor() {
        this.init();
    }

    // Inicializa controladores e recursos globais
    init() {
        const currentPage = window.location.pathname;
        
        // Inicializar o ThemeController
        if (!window.themeController) {
            window.themeController = new ThemeController();
        }

        // Inicializar o NavbarController
        if (!window.navbarController) {
            window.navbarController = new NavbarController();
        }

        // Inicializar o FilterController apenas nas páginas de consulta
        if (currentPage.includes('-consulta.html')) {
            const tableId = this.getTableId(currentPage);
            if (tableId) {
                this.filterController = new FilterController(tableId);
                window.filterController = this.filterController;
            }
        }
    }

    // Mapeia a página atual para o ID da tabela correspondente
    getTableId(currentPage) {
        const tableMap = {
            'os-consulta': 'os-table',
            'clientes-consulta': 'clientes-table',
            'motos-consulta': 'motos-table',
            'marcas-consulta': 'marcas-table',
            'fornecedores-consulta': 'fornecedores-table',
            'pecas-consulta': 'pecas-table',
            'orcamentos-consulta': 'orcamentos-table',
            'usuarios-consulta': 'usuarios-table'
        };

        for (const [page, tableId] of Object.entries(tableMap)) {
            if (currentPage.includes(page)) {
                return tableId;
            }
        }
        return null;
    }

    // Inicializa filtros para tabelas específicas
    initPageSpecificControllers() {
        const tableIds = ['os-table', 'clientes-table', 'motos-table', 'marcas-table', 
            'fornecedores-table', 'pecas-table', 'orcamentos-table', 'usuarios-table'];
        tableIds.forEach(tableId => {
            if (document.getElementById(tableId)) {
                this.filterController = new FilterController(tableId);
                window.filterController = this.filterController;
            }
        });
    }

    // Atualiza barras de progresso nas cards
    initProgressBars() {
        const allProgress = document.querySelectorAll('main .card .progress');
        allProgress.forEach(item => {
            item.style.setProperty('--value', item.dataset.value);
        });
    }
}


// Inicializa a aplicação ao carregar o DOM
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
