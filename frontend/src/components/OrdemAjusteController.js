class OrdemAjusteController {
    constructor() {
        this.baseURL = 'http://localhost:3000/api/ordens';
        this.currentItem = null;
        this.originalData = null;
        this.allowedStatuses = ['Em Andamento', 'Ajuste Pendente', 'Validação Pendente'];
        this.init();

        const loading = document.getElementById('loading');
        Controller.showLoadingElement(loading, show);
    }

    setupThemeListeners() {
        document.addEventListener('themeChanged', (e) => {
            this.onThemeChanged(e.detail.isDark);
        });
    }

    onThemeChanged(isDark) {
        
        const notifications = document.querySelectorAll('.notification');
        notifications.forEach(notification => {

        });
    }

    init() {
        this.setupEventListeners();
        
        setTimeout(() => this.loadOrdemFromURL(), 100);
    }

    setupEventListeners() {
        
        const form = document.getElementById('ajusteForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        const cancelBtn = document.getElementById('cancelBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.handleCancel());
        }

        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.recarregarOS());
        }

        const addPecaBtn = document.getElementById('addPecaBtn');
        if (addPecaBtn) {
            addPecaBtn.addEventListener('click', () => this.addPecaItem());
        }

        const valorTotalInput = document.getElementById('valor_total');
        if (valorTotalInput) {
            valorTotalInput.addEventListener('input', () => {
                valorTotalInput.style.borderColor = '';
                valorTotalInput.title = '';
            });
        }
    }

    async loadOrdemFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const osId = urlParams.get('id') || urlParams.get('cod');
        
        if (!osId) {
            this.showNotification(
                'Nenhuma ordem especificada. Redirecionando...', 
                'warning',
                null,
                3000
            );
            this.redirectToList();
            return;
        }

        await this.carregarOS(osId);
    }

    async carregarOS(codigo) {
        try {
            this.showLoading(true);
            this.showNotification('Carregando...', 'info', null, 0);
            
            const response = await fetch(`${this.baseURL}/${codigo}`);
            if (!response.ok) {
                throw new Error(`Erro ${response.status}: ${response.statusText}`);
            }
            const result = await response.json();
            if (!result.success) {
                throw new Error(result.message || 'Erro ao buscar ordem de serviço');
            }
            const ordem = result.data;
            
            console.log('Dados da ordem recebidos:', ordem); 

            this.clearAllNotifications();
            
            if (!this.allowedStatuses.includes(ordem.status)) {
                this.showStatusValidationError(ordem.status);
                return;
            }
            this.currentItem = ordem;
            this.originalData = JSON.parse(JSON.stringify(ordem));

            await this.loadClientes(ordem.cliente_cpf, ordem.motocicleta_placa);
            await this.preencherFormulario(ordem);
            
            document.getElementById('adjustment-form-section').style.display = 'block';
            this.showNotification('Dados carregados', 'success', null, 2000);
        } catch (error) {
            console.error('Erro ao carregar OS:', error);
            this.clearAllNotifications();
            this.showNotification('Erro ao carregar dados', 'error', null, 5000);
            setTimeout(() => this.redirectToList(), 3000);
        } finally {
            this.showLoading(false);
        }
    }

    showStatusValidationError(currentStatus) {
        const validationDiv = document.getElementById('status-validation');
        const allowedText = this.allowedStatuses.join('", "');
        
        validationDiv.innerHTML = `
            <i class='bx bx-error'></i>
            <span>Esta ordem de serviço não pode ser ajustada.</span><br>
            <small>Status atual: "<strong>${currentStatus}</strong>". 
            Apenas OS com status: "<strong>${allowedText}</strong>" podem ser editadas.</small>
        `;
        validationDiv.style.display = 'block';

        setTimeout(() => this.redirectToList(), 5000);
    }

    async preencherFormulario(ordem) {
        try {
            
            document.getElementById('numero').value = ordem.cod || '';
            document.getElementById('titulo').value = ordem.titulo || '';
            
            if (ordem.data) {
                const date = new Date(ordem.data);
                document.getElementById('data_abertura').value = date.toISOString().split('T')[0];
            }

            if (ordem.cliente_cpf && ordem.cliente_nome) {
                const clienteSelect = document.getElementById('cliente_id');
                clienteSelect.innerHTML = `<option value="${ordem.cliente_cpf}">${ordem.cliente_nome} - ${ordem.cliente_cpf}</option>`;
                clienteSelect.value = ordem.cliente_cpf;
            }

            if (ordem.motocicleta_placa && ordem.motocicleta_modelo) {
                const motoSelect = document.getElementById('motocicleta_id');
                motoSelect.innerHTML = `<option value="${ordem.motocicleta_placa}">${ordem.motocicleta_modelo} - ${ordem.motocicleta_placa}</option>`;
                motoSelect.value = ordem.motocicleta_placa;
            }

            document.getElementById('descricao').value = ordem.descricao || '';
            document.getElementById('status').value = ordem.status || 'Em Andamento';
            document.getElementById('observacoes').value = ordem.observacao || '';

            const valorTotal = ordem.valor_total || ordem.valor_total_os || ordem.valor_total_pecas || 0;
            document.getElementById('valor_total').value = parseFloat(valorTotal).toFixed(2);

            this.carregarPecas(ordem.pecas || []);

        } catch (error) {
            console.error('Erro ao preencher formulário:', error);
            this.showAlert('Erro ao carregar dados do formulário', 'error');
        }
    }

    async loadClientes(selectedCpf, selectedPlaca) {
        try {
            const response = await fetch('http://localhost:3000/api/clientes');
            if (!response.ok) throw new Error('Erro ao carregar clientes');
            const result = await response.json();
            const clientes = result.data || result;
            const select = document.getElementById('cliente_id');
            select.innerHTML = '<option value="">Selecione um cliente...</option>';
            clientes.forEach(cliente => {
                const option = document.createElement('option');
                option.value = cliente.cpf;
                option.textContent = `${cliente.nome} - ${cliente.cpf}`;
                select.appendChild(option);
            });
            if (selectedCpf) {
                select.value = selectedCpf;
                await this.loadMotocicletas(selectedPlaca);
            }
        } catch (error) {
            console.error('Erro ao carregar clientes:', error);
            this.showAlert('Erro ao carregar lista de clientes', 'error');
        }
    }

    async loadMotocicletas(selectedPlaca) {
        const clienteCpf = document.getElementById('cliente_id').value;
        const select = document.getElementById('motocicleta_id');
        select.innerHTML = '<option value="">Selecione uma motocicleta...</option>';
        if (!clienteCpf) return;
        try {
            const response = await fetch(`http://localhost:3000/api/motocicletas?cliente_cpf=${clienteCpf}`);
            if (!response.ok) throw new Error('Erro ao carregar motocicletas');
            const result = await response.json();
            const motocicletas = result.data || result;
            motocicletas.forEach(moto => {
                const option = document.createElement('option');
                option.value = moto.placa;
                option.textContent = `${moto.modelo} (${moto.placa}) - ${moto.ano}`;
                select.appendChild(option);
            });
            if (selectedPlaca) {
                select.value = selectedPlaca;
            }
        } catch (error) {
            console.error('Erro ao carregar motocicletas:', error);
        }
    }

    recarregarOS() {
        if (this.currentItem && this.currentItem.cod) {
            this.carregarOS(this.currentItem.cod);
        } else {
            this.showAlert('Nenhuma OS carregada para recarregar', 'warning');
            this.redirectToList();
        }
    }

    formatMoney(value) {
        if (typeof value === 'number') {
            return value.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            });
        }
        return 'R$ 0,00';
    }

    getStatusBadgeClass(status) {
        const classes = {
            'Em Andamento': 'warning',
            'Ajuste Pendente': 'info',
            'Validação Pendente': 'info', 
            'Validado': 'success',
            'Validada': 'success',
            'Rejeitado': 'danger',
            'Rejeitada': 'danger'
        };
        return classes[status] || 'secondary';
    }

    async handleSubmit(event) {
        event.preventDefault();
        
        if (!this.currentItem) {
            this.showNotification('Nenhuma ordem carregada', 'error', null, 4000);
            return;
        }

        if (!this.validateForm()) {
            return;
        }

        const formData = new FormData(event.target);
        const updateData = this.extractFormData(formData);
        
        if (!this.hasChanges(updateData)) {
            this.showNotification('Nenhuma alteração detectada', 'info', null, 3000);
            return;
        }

        try {
            this.showLoading(true);
            this.showNotification('Salvando alterações...', 'info', null, 0);
            
            const url = `${this.baseURL}/${this.currentItem.cod}`;
            const response = await fetch(url, {
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
                throw new Error(result.message || 'Erro ao atualizar ordem de serviço');
            }

            this.clearAllNotifications();

            this.showNotification('Ordem atualizada com sucesso!', 'success', null, 3000);

            setTimeout(() => {
                this.redirectToList();
            }, 2000);

        } catch (error) {
            console.error('Erro ao atualizar OS:', error);
            this.clearAllNotifications();
            this.showNotification('Erro ao salvar alterações', 'error', null, 5000);
        } finally {
            this.showLoading(false);
        }
    }

    validateForm() {
        const descricao = document.getElementById('descricao').value.trim();
        const status = document.getElementById('status').value;

        if (!descricao) {
            this.showNotification('Campo descrição é obrigatório', 'warning', null, 4000);
            document.getElementById('descricao').focus();
            return false;
        }

        if (!status) {
            this.showNotification('Selecione um status', 'warning', null, 4000);
            document.getElementById('status').focus();
            return false;
        }

        return true;
    }

    extractFormData(formData) {
        const data = {
            descricao: formData.get('descricao'),
            status: formData.get('status'),
            observacao: formData.get('observacoes'),
            valor_total: parseFloat(formData.get('valor_total')) || 0
        };

        const pecas = this.getPecasFromForm();
        if (pecas && pecas.length > 0) {
            data.pecas = pecas;
        }

        return data;
    }

    hasChanges(updateData) {
        if (!this.originalData) return true;

        const fieldsToCompare = ['descricao', 'status', 'observacao', 'valor_total'];
        
        for (const field of fieldsToCompare) {
            const currentValue = updateData[field];
            const originalValue = this.originalData[field];
            
            if (currentValue !== originalValue) {
                return true;
            }
        }

        if (updateData.pecas) {
            const originalPecas = this.originalData.pecas || [];
            if (JSON.stringify(updateData.pecas) !== JSON.stringify(originalPecas)) {
                return true;
            }
        }

        return false;
    }

    carregarPecas(pecas) {
        const container = document.getElementById('pecas-container');
        if (!container) return;

        container.innerHTML = '';

        if (!pecas || pecas.length === 0) {
            this.addPecaItem(); 
            return;
        }

        pecas.forEach(peca => {
            this.addPecaItem(peca);
        });
    }

    addPecaItem(peca = null) {
        const container = document.getElementById('pecas-container');
        if (!container) return;

        const index = container.children.length;
        const pecaDiv = document.createElement('div');
        pecaDiv.className = 'peca-item row mb-3';
        
        pecaDiv.innerHTML = `
            <div class="col-md-4">
                <label class="form-label">Nome da Peça</label>
                <input type="text" class="form-control" name="pecas[${index}][nome]" 
                       value="${peca ? peca.nome || '' : ''}" placeholder="Nome da peça">
            </div>
            <div class="col-md-2">
                <label class="form-label">Quantidade</label>
                <input type="number" class="form-control" name="pecas[${index}][quantidade]" 
                       value="${peca ? peca.quantidade || peca.qtd_pecas || 1 : 1}" 
                       min="1" onchange="this.closest('.peca-item').querySelector('.calc-total').dispatchEvent(new Event('change'))">
            </div>
            <div class="col-md-3">
                <label class="form-label">Valor Unitário</label>
                <input type="number" class="form-control calc-total" name="pecas[${index}][valor]" 
                       value="${peca ? peca.valor || 0 : 0}" step="0.01" min="0" 
                       placeholder="0.00" onchange="this.calculateTotal()">
            </div>
            <div class="col-md-2">
                <label class="form-label">Total</label>
                <input type="text" class="form-control total-peca" readonly>
            </div>
            <div class="col-md-1">
                <label class="form-label">&nbsp;</label>
                <button type="button" class="btn btn-danger btn-sm d-block" onclick="this.closest('.peca-item').remove(); this.updateTotalGeral()">
                    <i class="bx bx-trash"></i>
                </button>
            </div>
        `;

        container.appendChild(pecaDiv);

        if (peca && peca.valor) {
            const qtd = peca.quantidade || peca.qtd_pecas || 1;
            const total = parseFloat(peca.valor) * qtd;
            pecaDiv.querySelector('.total-peca').value = this.formatMoney(total);
        }

        this.updateTotalGeral();
    }

    getPecasFromForm() {
        const pecasItems = document.querySelectorAll('.peca-item');
        const pecas = [];

        pecasItems.forEach(item => {
            const nome = item.querySelector('[name*="[nome]"]')?.value?.trim();
            const quantidade = parseInt(item.querySelector('[name*="[quantidade]"]')?.value) || 0;
            const valor = parseFloat(item.querySelector('[name*="[valor]"]')?.value) || 0;

            if (nome && quantidade > 0 && valor > 0) {
                pecas.push({
                    nome,
                    quantidade,
                    valor
                });
            }
        });

        return pecas;
    }

    updateTotalGeral() {
        const pecas = this.getPecasFromForm();
        const total = pecas.reduce((sum, peca) => sum + (peca.valor * peca.quantidade), 0);

        const valorTotalInput = document.getElementById('valor_total');
        if (valorTotalInput && !valorTotalInput.value) {
            
            valorTotalInput.value = total.toFixed(2);
        }

        if (valorTotalInput && valorTotalInput.value) {
            const valorDigitado = parseFloat(valorTotalInput.value) || 0;
            const diferenca = Math.abs(valorDigitado - total);
            
            if (diferenca > 0.01) {
                
                valorTotalInput.title = `Valor calculado das peças: R$ ${total.toFixed(2)}`;
                valorTotalInput.style.borderColor = '#ffc107';
            } else {
                valorTotalInput.title = '';
                valorTotalInput.style.borderColor = '';
            }
        }
    }

    handleCancel() {
        if (confirm('Deseja cancelar as alterações e voltar à lista?')) {
            this.redirectToList();
        }
    }

    redirectToList() {
        window.location.href = '/frontend/views/os/os-consulta.html';
    }

    showLoading(show) {
        const loadingEl = document.getElementById('loading');
        if (loadingEl) {
            loadingEl.style.display = show ? 'block' : 'none';
        }
    }

    showAlert(message, type = 'info', title = null, duration = 5000) {
        this.showNotification(message, type, title, duration);
    }

    showNotification(message, type = 'info', title = null, duration = 5000) {
        const container = document.getElementById('notification-container');
        if (!container) {
            console.error('Container de notificações não encontrado');
            return;
        }

        const existingNotifications = container.querySelectorAll('.notification');
        for (let existing of existingNotifications) {
            const existingMessage = existing.querySelector('.notification-message')?.textContent;
            const existingType = existing.classList.contains(`notification-${type}`);
            if (existingMessage === message && existingType) {
                
                return existing.id;
            }
        }

        if (!title) {
            const titles = {
                success: 'Sucesso!',
                error: 'Erro!',
                warning: 'Atenção!',
                info: 'Informação'
            };
            title = titles[type] || 'Notificação';
        }

        const icons = {
            success: 'bx-check-circle',
            error: 'bx-error-circle',
            warning: 'bx-error',
            info: 'bx-info-circle'
        };

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;

        const notificationId = 'notification-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        notification.id = notificationId;

        notification.innerHTML = `
            <i class='bx ${icons[type]} notification-icon'></i>
            <div class="notification-content">
                <div class="notification-title">${title}</div>
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close" onclick="window.closeNotification('${notificationId}')">
                <i class='bx bx-x'></i>
            </button>
            <div class="notification-progress" style="width: 100%;"></div>
        `;

        container.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        if (duration > 0) {
            const progressBar = notification.querySelector('.notification-progress');

            setTimeout(() => {
                progressBar.style.transition = `width ${duration}ms linear`;
                progressBar.style.width = '0%';
            }, 200);

            setTimeout(() => {
                this.removeNotification(notificationId);
            }, duration + 200);
        }

        if (!window.closeNotification) {
            window.closeNotification = (id) => this.removeNotification(id);
        }

        return notificationId;
    }

    removeNotification(notificationId) {
        const notification = document.getElementById(notificationId);
        if (notification) {
            notification.classList.add('hide');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }

    hideNotification() {
        
        const container = document.getElementById('notification-container');
        if (container) {
            const notifications = container.querySelectorAll('.notification');
            if (notifications.length > 0) {
                const lastNotification = notifications[notifications.length - 1];
                this.removeNotification(lastNotification.id);
            }
        }
    }

    clearAllNotifications() {
        const container = document.getElementById('notification-container');
        if (container) {
            const notifications = container.querySelectorAll('.notification');
            notifications.forEach(notification => {
                this.removeNotification(notification.id);
            });
        }
    }
}

function calculateTotal() {
    const pecaItem = this.closest('.peca-item');
    const quantidade = parseInt(pecaItem.querySelector('[name*="[quantidade]"]').value) || 0;
    const valor = parseFloat(this.value) || 0;
    const total = quantidade * valor;
    
    pecaItem.querySelector('.total-peca').value = total.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });

    if (window.ordemAjusteController) {
        window.ordemAjusteController.updateTotalGeral();
    }
}

// Não é necessário inicialização automática aqui
