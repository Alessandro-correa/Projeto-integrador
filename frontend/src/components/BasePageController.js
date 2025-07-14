class BasePageController {
    constructor() {
        this.baseURL = 'http://localhost:3000/api';
        this.subControllers = {};
        this.init();
    }

    init() {
        this.initializeGlobalFeatures();
        this.loadSubControllers();
    }

    initializeGlobalFeatures() {
        
        this.createGlobalStyles();
        this.setupGlobalEventListeners();
    }

    loadSubControllers() {
        
        const currentPage = this.getCurrentPage();
        
        switch(currentPage.module) {
            case 'clientes':
                this.subControllers.cliente = new ClienteController();
                if (currentPage.action === 'ajustar') {
                    this.subControllers.clienteAjuste = new ClienteAjusteController();
                }
                break;
            case 'usuarios':
                this.subControllers.usuario = new UsuarioController();
                if (currentPage.action === 'ajustar') {
                    this.subControllers.usuarioAjuste = new UsuarioAjusteController();
                }
                break;
            case 'motocicletas':
                this.subControllers.motocicleta = new MotocicletaController();
                if (currentPage.action === 'ajustar') {
                    this.subControllers.motocicletaAjuste = new MotocicletaAjusteController();
                }
                break;
            case 'fornecedores':
                this.subControllers.fornecedor = new FornecedorController();
                if (currentPage.action === 'ajustar') {
                    this.subControllers.fornecedorAjuste = new FornecedorAjusteController();
                }
                break;
            case 'os':
                this.subControllers.ordem = new OrdemController();
                if (currentPage.action === 'ajustar') {
                    this.subControllers.ordemAjuste = new OrdemAjusteController();
                }
                break;
            case 'orcamentos':
                this.subControllers.orcamento = new OrcamentoController();
                if (currentPage.action === 'ajustar') {
                    this.subControllers.orcamentoAjuste = new OrcamentoAjusteController();
                }
                break;
        }
    }

    getCurrentPage() {
        const path = window.location.pathname;
        const filename = path.substring(path.lastIndexOf('/') + 1);

        const parts = filename.replace('.html', '').split('-');
        
        return {
            module: parts[0],
            action: parts[1] || 'consulta',
            subAction: parts[2] || null
        };
    }

    setupGlobalEventListeners() {
        
        document.addEventListener('keydown', (e) => {
            
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });

        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });
    }

    closeAllModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (modal.style.display === 'block') {
                modal.style.display = 'none';
            }
        });
    }

    cleanup() {
        
        Object.values(this.subControllers).forEach(controller => {
            if (controller.cleanup) {
                controller.cleanup();
            }
        });
    }

    createGlobalStyles() {
        const style = document.createElement('style');
        style.textContent = `
            
            .btn-adjust {
                background: var(--orange);
                color: white;
                border: none;
                padding: 6px 8px;
                border-radius: 4px;
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
                font-size: 14px;
            }

            .btn-adjust:hover {
                background: #d97706;
                transform: translateY(-1px);
            }

            .btn-adjust i {
                font-size: 16px;
            }

            .search-section {
                margin-bottom: 24px;
            }

            .search-card {
                background: var(--light);
                border-radius: 12px;
                padding: 24px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                margin-bottom: 24px;
            }

            .search-card h4 {
                color: var(--dark);
                margin-bottom: 20px;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .search-form .form-row {
                display: flex;
                gap: 16px;
                align-items: end;
            }

            .edit-section {
                display: none;
            }

            .current-data-info {
                background: var(--light);
                border-radius: 12px;
                padding: 24px;
                margin-bottom: 24px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }

            .current-data-info h4 {
                color: var(--dark);
                margin-bottom: 20px;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .current-info-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 16px;
            }

            .info-row {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .info-row .label {
                font-size: 12px;
                color: var(--grey);
                font-weight: 600;
                text-transform: uppercase;
            }

            .info-row .value {
                font-size: 14px;
                color: var(--dark);
                font-weight: 500;
            }

            .adjust-form {
                background: var(--light);
                border-radius: 12px;
                padding: 24px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }

            .adjust-form h4 {
                color: var(--dark);
                margin-bottom: 24px;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .form-actions {
                display: flex;
                gap: 12px;
                margin-top: 24px;
                justify-content: flex-end;
            }

            .btn-warning {
                background: var(--orange);
                color: white;
                border: none;
                padding: 10px 16px;
                border-radius: 8px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.3s ease;
            }

            .btn-warning:hover {
                background: #d97706;
                transform: translateY(-1px);
            }

            .form-group small {
                color: var(--grey);
                font-size: 12px;
                margin-top: 4px;
                display: block;
            }

            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 9999;
                max-width: 400px;
                color: white;
                display: flex;
                align-items: center;
                gap: 10px;
                animation: slideInRight 0.3s ease;
            }

            .notification-success {
                background: #10b981;
            }

            .notification-error {
                background: #ef4444;
            }

            .notification-warning {
                background: #f59e0b;
            }

            .notification-info {
                background: #3b82f6;
            }

            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }

            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }

            @media screen and (max-width: 768px) {
                .search-form .form-row {
                    flex-direction: column;
                }
                
                .form-actions {
                    flex-direction: column;
                }
                
                .current-info-grid {
                    grid-template-columns: 1fr;
                }
            }
        `;
        document.head.appendChild(style);
    }

    static showNotification(message, type = 'info') {
        
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;

        const icon = type === 'success' ? 'check-circle' : 
                    type === 'error' ? 'x-circle' : 
                    type === 'warning' ? 'error-circle' : 'info-circle';

        notification.innerHTML = `
            <i class='bx bx-${icon}'></i>
            <span>${message}</span>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }

    static formatCPF(cpf) {
        if (!cpf) return '';
        const cleaned = cpf.replace(/\D/g, '');
        return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }

    static formatCNPJ(cnpj) {
        if (!cnpj) return '';
        const cleaned = cnpj.replace(/\D/g, '');
        return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }

    static formatPhone(phone) {
        if (!phone) return '';
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length <= 10) {
            return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        } else {
            return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        }
    }

    static formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    }

    static formatDateForInput(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    }

    static showLoadingElement(element, show) {
        if (!element) return;
        if (show) {
            element.style.display = 'block';
        } else {
            element.style.display = 'none';
        }
    }

    static applyMask(input, type) {
        input.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            
            switch(type) {
                case 'cpf':
                    value = value.replace(/(\d{3})(\d)/, '$1.$2');
                    value = value.replace(/(\d{3})(\d)/, '$1.$2');
                    value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
                    break;
                case 'cnpj':
                    value = value.replace(/(\d{2})(\d)/, '$1.$2');
                    value = value.replace(/(\d{3})(\d)/, '$1.$2');
                    value = value.replace(/(\d{3})(\d)/, '$1/$2');
                    value = value.replace(/(\d{4})(\d{1,2})$/, '$1-$2');
                    break;
                case 'phone':
                    if (value.length <= 10) {
                        value = value.replace(/(\d{2})(\d)/, '($1) $2');
                        value = value.replace(/(\d{4})(\d)/, '$1-$2');
                    } else {
                        value = value.replace(/(\d{2})(\d)/, '($1) $2');
                        value = value.replace(/(\d{5})(\d)/, '$1-$2');
                    }
                    break;
            }
            
            e.target.value = value;
        });
    }

    static async loadClientesIntoSelect(selectElement, apiUrl, showNotificationCallback, placeholder = 'Selecione um cliente') {
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error('Erro ao carregar clientes');
            
            const result = await response.json();
            const clientes = result.data || [];
            
            if (selectElement) {
                selectElement.innerHTML = `<option value="">${placeholder}</option>`;
                clientes.forEach(cliente => {
                    selectElement.innerHTML += `<option value="${cliente.cpf}">${cliente.nome} - ${cliente.cpf}</option>`;
                });
                
                if (clientes.length === 0) {
                    selectElement.innerHTML = '<option value="">Nenhum cliente cadastrado</option>';
                    if (showNotificationCallback) {
                        showNotificationCallback('Não há clientes cadastrados. Cadastre um cliente primeiro.', 'warning');
                    }
                }
            }
            
            return clientes;
            
        } catch (error) {
            console.error('Erro ao carregar clientes:', error);
            if (showNotificationCallback) {
                showNotificationCallback('Erro ao carregar lista de clientes. Verifique a conexão.', 'error');
            }
            if (selectElement) {
                selectElement.innerHTML = '<option value="">Erro ao carregar clientes</option>';
            }
            throw error;
        }
    }
}

class BaseAjusteController {
    constructor(moduleName, baseURL) {
        this.moduleName = moduleName;
        this.baseURL = baseURL;
        this.currentItem = null;
        this.originalData = null;
        this.searchField = null; 
        this.init();
    }

    init() {
        this.bindEvents();
        this.applyMasks();
        this.checkURLParams();
    }

    bindEvents() {
        
        document.getElementById('btn-search').addEventListener('click', () => this.buscarItem());
        document.getElementById(`search-${this.searchField}`).addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.buscarItem();
        });

        document.getElementById('adjust-form').addEventListener('submit', (e) => this.salvarAjustes(e));
        document.getElementById('btn-cancel').addEventListener('click', () => this.cancelarAjuste());
        document.getElementById('btn-reset').addEventListener('click', () => this.restaurarDados());
    }

    applyMasks() {
        
    }

    checkURLParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const searchValue = urlParams.get(this.searchField);
        
        if (searchValue) {
            const searchInput = document.getElementById(`search-${this.searchField}`);
            searchInput.value = this.formatSearchValue(searchValue);
            setTimeout(() => {
                this.buscarItem();
            }, 500);
        }
    }

    formatSearchValue(value) {
        
        return value;
    }

    async buscarItem() {
        
        throw new Error('Método buscarItem deve ser implementado');
    }

    preencherFormulario(item) {
        
        throw new Error('Método preencherFormulario deve ser implementado');
    }

    mostrarSecaoEdicao() {
        document.getElementById('searchSection').style.display = 'none';
        document.getElementById('editSection').style.display = 'block';
        
        document.getElementById('editSection').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }

    async salvarAjustes(e) {
        e.preventDefault();

        if (!this.currentItem) {
            BasePageController.showNotification(`Nenhum ${this.moduleName} selecionado para ajuste`, 'error');
            return;
        }

        const formData = new FormData(e.target);
        const dadosAjustados = this.extrairDadosFormulario(formData);

        const houveMudancas = this.verificarMudancas(dadosAjustados);
        if (!houveMudancas) {
            BasePageController.showNotification('Nenhuma alteração foi feita', 'warning');
            return;
        }

        try {
            const submitBtn = document.querySelector('#adjust-form button[type="submit"]');
            BasePageController.showLoading(submitBtn, true, '<i class="bx bx-save"></i> Salvar Ajustes');

            const response = await fetch(`${this.baseURL}/${this.currentItem.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dadosAjustados)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Erro ao atualizar ${this.moduleName}`);
            }

            const itemAtualizado = await response.json();
            
            this.registrarAjuste(dadosAjustados, formData.get('observacoes'));
            
            BasePageController.showNotification(`${this.moduleName} ajustado com sucesso!`, 'success');
            
            this.currentItem = itemAtualizado;
            this.originalData = { ...itemAtualizado };
            
            document.getElementById('adjust-observacoes').value = '';

        } catch (error) {
            console.error('Erro ao salvar ajustes:', error);
            BasePageController.showNotification(error.message || 'Erro ao salvar ajustes', 'error');
        } finally {
            const submitBtn = document.querySelector('#adjust-form button[type="submit"]');
            BasePageController.showLoading(submitBtn, false, '<i class="bx bx-save"></i> Salvar Ajustes');
        }
    }

    extrairDadosFormulario(formData) {
        
        throw new Error('Método extrairDadosFormulario deve ser implementado');
    }

    verificarMudancas(dadosNovos) {
        
        for (const campo in dadosNovos) {
            const valorOriginal = this.originalData[campo] || '';
            const valorNovo = dadosNovos[campo] || '';
            
            if (valorOriginal !== valorNovo) {
                return true;
            }
        }
        return false;
    }

    registrarAjuste(dadosNovos, observacoes) {
        const mudancas = [];
        
        Object.keys(dadosNovos).forEach(campo => {
            const valorOriginal = this.originalData[campo] || '';
            const valorNovo = dadosNovos[campo] || '';
            
            if (valorOriginal !== valorNovo) {
                mudancas.push({
                    campo: campo,
                    anterior: valorOriginal,
                    novo: valorNovo
                });
            }
        });

        const registroAjuste = {
            itemId: this.currentItem.id,
            itemNome: this.getItemDisplayName(),
            modulo: this.moduleName,
            dataAjuste: new Date().toISOString(),
            mudancas: mudancas,
            observacoes: observacoes || 'Nenhuma observação'
        };

        const storageKey = `historicoAjustes${this.moduleName}`;
        const historico = JSON.parse(localStorage.getItem(storageKey) || '[]');
        historico.unshift(registroAjuste);
        
        if (historico.length > 100) {
            historico.splice(100);
        }
        
        localStorage.setItem(storageKey, JSON.stringify(historico));
        
        console.log('Ajuste registrado:', registroAjuste);
    }

    getItemDisplayName() {
        
        return this.currentItem.nome || this.currentItem.id;
    }

    restaurarDados() {
        if (!this.originalData) {
            BasePageController.showNotification('Nenhum dado original para restaurar', 'warning');
            return;
        }

        if (confirm('Deseja restaurar todos os dados aos valores originais?')) {
            this.preencherFormulario(this.originalData);
            BasePageController.showNotification('Dados restaurados aos valores originais', 'info');
        }
    }

    cancelarAjuste() {
        if (confirm('Deseja cancelar o ajuste? As alterações não salvas serão perdidas.')) {
            this.voltarParaBusca();
        }
    }

    voltarParaBusca() {
        document.getElementById('searchSection').style.display = 'block';
        document.getElementById('editSection').style.display = 'none';
        document.getElementById(`search-${this.searchField}`).value = '';
        document.getElementById('adjust-form').reset();
        this.currentItem = null;
        this.originalData = null;
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    cleanup() {
        
    }
}

let mainController;
document.addEventListener('DOMContentLoaded', () => {
    mainController = new BasePageController();
});
