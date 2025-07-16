
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
        this.themeController = new ThemeController();
        this.sidebarController = new SidebarController();
        this.navbarController = new NavbarController();
        this.initPageSpecificControllers();
        this.initProgressBars();
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


// Preenche o select de aquisições na página
function preencherSelectAquisicoes() {
    const select = document.getElementById('aquisicaoId');
    if (!select) return;
    fetch('http://localhost:3000/api/aquisicoes')
        .then(res => res.json())
        .then(result => {
            if (result.success && Array.isArray(result.data)) {
                result.data.forEach(aquisicao => {
                    const option = document.createElement('option');
                    const data = aquisicao.dia_da_compra ? new Date(aquisicao.dia_da_compra).toLocaleDateString() : '';
                    option.value = aquisicao.id;
                    option.textContent = `${aquisicao.id} - ${data}`;
                    select.appendChild(option);
                });
            }
        });
}


// Inicializa a aplicação ao carregar o DOM
document.addEventListener('DOMContentLoaded', () => {
    new App();
    preencherSelectAquisicoes();
});
