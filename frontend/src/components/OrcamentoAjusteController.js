class OrcamentoAjusteController {
    constructor() {
        this.baseURL = 'http://localhost:3000/api/orcamentos';
        this.allowedStatuses = ['P']; 
        this.currentItem = null;
        this.originalData = null;
        console.log('OrcamentoAjusteController inicializado');
        this.init();
    }

    init() {
        console.log('Inicializando controlador...');
        this.setupEventListeners();
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => this.loadOrcamentoFromURL(), 500);
            });
        } else {
            setTimeout(() => this.loadOrcamentoFromURL(), 500);
        }
    }

    setupEventListeners() {
        console.log('Configurando event listeners...');

        const form = document.getElementById('ajusteForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
            console.log('Form listener adicionado');
        } else {
            console.log('Form não encontrado');
        }

        const cancelBtn = document.getElementById('cancelBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.handleCancel());
            console.log('Cancel button listener adicionado');
        }

        const valorInput = document.getElementById('valor');
        if (valorInput) {
            valorInput.addEventListener('input', (e) => {
                this.formatMoney(e.target);
            });
            console.log('Valor input listener adicionado');
        }
    }

    async loadOrcamentoFromURL() {
        console.log('Carregando orçamento da URL...');
        const urlParams = new URLSearchParams(window.location.search);
        const orcamentoId = urlParams.get('id');
        
        console.log('ID do orçamento:', orcamentoId);
        
        if (!orcamentoId) {
            this.showAlert('Nenhum orçamento especificado na URL. Redirecionando...', 'warning');
            setTimeout(() => this.redirectToList(), 2000);
            return;
        }

        await this.carregarOrcamento(orcamentoId);
    }

    async carregarOrcamento(id) {
        console.log('Carregando orçamento ID:', id);
        
        try {
            this.showLoading(true);
            this.showAlert('Carregando dados do orçamento...', 'info');
            
            const response = await fetch(`${this.baseURL}/${id}`);
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`Erro ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log('Resultado da API:', result);
            
            if (!result.success) {
                throw new Error(result.message || 'Erro ao buscar orçamento');
            }

            const orcamento = result.data;
            console.log('Dados do orçamento:', orcamento);

            if (!this.allowedStatuses.includes(orcamento.status)) {
                console.log('Status não permitido:', orcamento.status);
                this.showStatusError();
                return;
            }

            this.currentItem = orcamento;
            this.originalData = { ...orcamento };
            
            await this.populateOrcamentoData(orcamento);
            this.showForm();
            this.showAlert('Orçamento carregado com sucesso!', 'success');

        } catch (error) {
            console.error('Erro ao carregar orçamento:', error);
            this.hideElements();
            this.showAlert('Erro ao carregar orçamento: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async populateOrcamentoData(orcamento) {
        console.log('Populando dados do formulário...');
        
        try {
            
            this.setInputValue('numero', orcamento.id);
            this.setInputValue('valor', this.formatCurrency(orcamento.valor));
            this.setInputValue('validade', BasePageController.formatDateForInput(orcamento.validade));
            this.setInputValue('status', orcamento.status);

            if (orcamento.cliente_cpf) {
                await this.loadClienteData(orcamento.cliente_cpf);
            }

            if (orcamento.ordem_servico_cod) {
                await this.loadOrdemData(orcamento.ordem_servico_cod);
                await this.loadItensOrcamento(orcamento.ordem_servico_cod);
            }

        } catch (error) {
            console.error('Erro ao popular dados:', error);
            this.showAlert('Erro ao carregar dados relacionados: ' + error.message, 'warning');
        }
    }

    async loadClienteData(cpf) {
        try {
            const response = await fetch(`http://localhost:3000/api/clientes/${cpf}`);
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    this.populateClienteSelect(result.data);
                }
            }
        } catch (error) {
            console.error('Erro ao carregar cliente:', error);
        }
    }

    async loadOrdemData(cod) {
        try {
            const response = await fetch(`http://localhost:3000/api/ordens/${cod}`);
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    this.setInputValue('ordem_servico_titulo', result.data.titulo);
                }
            }
        } catch (error) {
            console.error('Erro ao carregar ordem:', error);
        }
    }

    async loadItensOrcamento(codOrdem) {
        try {
            
            const response = await fetch(`http://localhost:3000/api/ordens/${codOrdem}/pecas`);
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data) {
                    this.populateItensContainer(result.data);
                }
            }

            await this.carregarValorTotal(codOrdem);
        } catch (error) {
            console.error('Erro ao carregar itens:', error);
        }
    }

    async carregarValorTotal(codOrdem) {
        try {
            const response = await fetch(`http://localhost:3000/api/ordens/${codOrdem}/valor-total`);
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    const valorTotal = result.data.valor_total;
                    this.atualizarValorOrcamento(valorTotal);
                    console.log(`Valor total calculado: ${result.data.valor_formatado} (${result.data.total_itens} itens)`);
                }
            }
        } catch (error) {
            console.error('Erro ao carregar valor total:', error);
        }
    }

    populateClienteSelect(cliente) {
        const select = document.getElementById('cliente_id');
        if (select && cliente) {
            select.innerHTML = `<option value="${cliente.cpf}" selected>${cliente.nome}</option>`;
        }
    }

    populateItensContainer(itens) {
        const container = document.getElementById('itens-list');
        if (!container) {
            console.log('Container de itens não encontrado');
            return;
        }

        if (!itens || itens.length === 0) {
            container.innerHTML = '<p class="no-items">Nenhum item encontrado na ordem de serviço relacionada.</p>';
            return;
        }

        const html = itens.map(item => {
            const quantidade = item.quantidade || item.qtd_pecas || 1;
            const valorUnitario = parseFloat(item.valor || 0);
            const valorTotalItem = quantidade * valorUnitario;
            
            return `
                <div class="item-row">
                    <div class="item-info">
                        <strong>${item.nome}</strong>
                        <span class="item-desc">${item.descricao}</span>
                    </div>
                    <div class="item-details">
                        <span class="item-qty">Qtd: ${quantidade}</span>
                        <span class="item-unit-value">Unit: R$ ${valorUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        <span class="item-value">Total: R$ ${valorTotalItem.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
    }

    atualizarValorOrcamento(valorTotal) {
        const valorInput = document.getElementById('valor');
        if (valorInput) {
            valorInput.value = valorTotal.toFixed(2);
            console.log(`Valor do orçamento atualizado: R$ ${valorTotal.toFixed(2)}`);
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        console.log('Form submetido');
        
        try {
            const formData = new FormData(e.target);
            const updateData = this.extractFormData(formData);
            
            console.log('Dados do formulário:', updateData);
            
            if (!this.validateData(updateData)) {
                return;
            }

            if (!this.hasChanges(updateData)) {
                this.showAlert('Nenhuma alteração detectada', 'info');
                return;
            }

            await this.confirmChanges(updateData);

        } catch (error) {
            console.error('Erro no submit:', error);
            this.showAlert('Erro ao processar formulário: ' + error.message, 'error');
        }
    }

    extractFormData(formData) {
        return {
            valor: this.parseCurrency(formData.get('valor')),
            validade: formData.get('validade'),
            status: formData.get('status')
        };
    }

    hasChanges(newData) {
        if (!this.originalData) return true;
        
        return newData.valor !== parseFloat(this.originalData.valor) ||
               newData.validade !== BasePageController.formatDateForInput(this.originalData.validade) ||
               newData.status !== this.originalData.status;
    }

    validateData(data) {
        if (!data.valor || data.valor <= 0) {
            this.showAlert('Valor deve ser maior que zero', 'error');
            return false;
        }

        if (!data.validade) {
            this.showAlert('Data de validade é obrigatória', 'error');
            return false;
        }

        if (!data.status) {
            this.showAlert('Status é obrigatório', 'error');
            return false;
        }

        return true;
    }

    async confirmChanges(updateData) {
        const confirmed = confirm('Confirma as alterações no orçamento?');
        if (confirmed) {
            await this.updateOrcamento(updateData);
        }
    }

    async updateOrcamento(updateData) {
        try {
            this.showAlert('Salvando alterações...', 'info');
            
            const response = await fetch(`${this.baseURL}/${this.currentItem.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });

            if (!response.ok) {
                throw new Error(`Erro ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            if (!result.success) {
                throw new Error(result.message || 'Erro ao atualizar orçamento');
            }

            this.showAlert('Orçamento atualizado com sucesso!', 'success');
            await this.carregarOrcamento(this.currentItem.id);

        } catch (error) {
            console.error('Erro ao atualizar:', error);
            this.showAlert('Erro ao salvar: ' + error.message, 'error');
        }
    }

    handleCancel() {
        this.redirectToList();
    }

    redirectToList() {
        window.location.href = 'orcamentos-consulta.html';
    }

    setInputValue(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.value = value || '';
            console.log(`Campo ${id} preenchido com:`, value);
        } else {
            console.log(`Campo ${id} não encontrado`);
        }
    }

    formatCurrency(value) {
        return parseFloat(value || 0).toLocaleString('pt-BR', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        });
    }

    parseCurrency(value) {
        if (!value) return 0;
        return parseFloat(value.toString().replace(/[^\d,]/g, '').replace(',', '.'));
    }

    formatMoney(input) {
        let value = input.value.replace(/\D/g, '');
        value = (value / 100).toFixed(2) + '';
        value = value.replace('.', ',');
        value = value.replace(/(\d)(\d{3})(\d{3}),/g, '$1.$2.$3,');
        value = value.replace(/(\d)(\d{3}),/g, '$1.$2,');
        input.value = value;
    }

    showLoading(show) {
        
        const loading = document.getElementById('loading');
        BasePageController.showLoadingElement(loading, show);
    }

    showForm() {
        const formSection = document.getElementById('adjustment-form-section');
        if (formSection) {
            formSection.style.display = 'block';
            console.log('Formulário exibido');
        } else {
            console.log('Seção do formulário não encontrada');
        }
    }

    hideElements() {
        const formSection = document.getElementById('adjustment-form-section');
        if (formSection) {
            formSection.style.display = 'none';
        }
    }

    showStatusError() {
        const statusError = document.getElementById('status-validation');
        if (statusError) {
            statusError.style.display = 'block';
        }
        this.hideElements();
    }

    showAlert(message, type = 'info') {
        console.log(`Alert [${type}]:`, message);

        const container = document.getElementById('notification-container');
        if (container) {
            this.showNotification(message, type);
            return;
        }

        const alertContainer = document.getElementById('form-alert');
        if (alertContainer) {
            alertContainer.className = `alert alert-${type}`;
            alertContainer.innerHTML = `<i class='bx bx-info-circle'></i> ${message}`;
            alertContainer.style.display = 'block';
            
            if (type === 'success' || type === 'info') {
                setTimeout(() => {
                    alertContainer.style.display = 'none';
                }, 4000);
            }
        } else {
            
            alert(message);
        }
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notification-container') || this.createNotificationContainer();
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const icons = {
            success: 'bx-check-circle',
            error: 'bx-error-circle', 
            warning: 'bx-error',
            info: 'bx-info-circle'
        };
        
        notification.innerHTML = `
            <i class='bx ${icons[type]} notification-icon'></i>
            <div class="notification-content">${message}</div>
        `;
        
        container.appendChild(notification);
        
        setTimeout(() => notification.classList.add('show'), 100);
        setTimeout(() => this.removeNotification(notification), 4000);
        
        return notification;
    }

    createNotificationContainer() {
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.className = 'notification-container';
        document.body.appendChild(container);
        return container;
    }

    removeNotification(notification) {
        if (notification && notification.parentNode) {
            notification.classList.add('hide');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM carregado, inicializando controlador...');
    if (!window.orcamentoAjusteController) {
        window.orcamentoAjusteController = new OrcamentoAjusteController();
    }
});

if (document.readyState !== 'loading') {
    console.log('DOM já carregado, inicializando controlador...');
    if (!window.orcamentoAjusteController) {
        window.orcamentoAjusteController = new OrcamentoAjusteController();
    }
}
