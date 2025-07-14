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
        this.setupPecaModal();
        
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

        const valorTotalInput = document.getElementById('valor_total');
        const valorMaoDeObraInput = document.getElementById('valor_mao_de_obra');
        
        if (valorTotalInput) {
            valorTotalInput.addEventListener('input', () => {
                // Limpar indicações visuais quando usuário digitar manualmente
                valorTotalInput.style.borderColor = '';
                valorTotalInput.style.backgroundColor = '';
                valorTotalInput.title = '';
            });
            
            // Adicionar dica sobre recálculo automático
            valorTotalInput.addEventListener('focus', () => {
                if (!valorTotalInput.title) {
                    valorTotalInput.title = 'O valor é calculado automaticamente baseado nas peças. Somente leitura.';
                }
            });
        }

        if (valorMaoDeObraInput) {
            valorMaoDeObraInput.addEventListener('input', () => {
                // Limpar indicações visuais quando usuário digitar
                valorMaoDeObraInput.style.borderColor = '';
                valorMaoDeObraInput.style.backgroundColor = '';
            });
            
            valorMaoDeObraInput.addEventListener('focus', () => {
                if (!valorMaoDeObraInput.title) {
                    valorMaoDeObraInput.title = 'Valor da mão de obra dos serviços executados. Valor editável.';
                }
            });
        }
    }

    setupPecaModal() {
        // Modal elements
        this.modal = document.getElementById('selectPecaModal');
        this.searchInput = document.getElementById('searchPeca');
        this.pecasContainer = document.getElementById('pecasDisponiveis');
        this.addPecaBtn = document.getElementById('addPecaBtn');
        
        if (!this.modal || !this.addPecaBtn) return;
        
        this.closeModal = this.modal.querySelector('.close');
        this.cancelSelect = document.getElementById('cancelSelectPeca');

        // Event listeners para o modal
        this.addPecaBtn.addEventListener('click', () => this.showPecaModal());
        this.closeModal.addEventListener('click', () => this.hidePecaModal());
        this.cancelSelect.addEventListener('click', () => this.hidePecaModal());
        
        // Fechar modal clicando fora
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hidePecaModal();
            }
        });

        // Busca dinâmica
        this.searchInput.addEventListener('input', () => this.filterPecas());
    }

    async showPecaModal() {
        this.modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        await this.loadPecasDisponiveis();
        this.searchInput.focus();
    }

    hidePecaModal() {
        this.modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        this.searchInput.value = '';
    }

    async loadPecasDisponiveis() {
        this.pecasContainer.innerHTML = '<div class="loading">Carregando peças...</div>';
        
        try {
            const response = await fetch('http://localhost:3000/api/pecas');
            const result = await response.json();
            
            if (result.success) {
                this.allPecas = result.data;
                this.renderPecas(this.allPecas);
            } else {
                this.pecasContainer.innerHTML = '<div class="no-results">Erro ao carregar peças</div>';
            }
        } catch (error) {
            console.error('Erro ao carregar peças:', error);
            this.pecasContainer.innerHTML = '<div class="no-results">Erro ao carregar peças</div>';
        }
    }

    renderPecas(pecas) {
        if (!pecas || pecas.length === 0) {
            this.pecasContainer.innerHTML = '<div class="no-results">Nenhuma peça encontrada</div>';
            return;
        }

        const html = pecas.map(peca => `
            <div class="peca-option" data-peca-id="${peca.id}">
                <div class="peca-info">
                    <div>
                        <div class="peca-nome">${peca.nome}</div>
                        <div class="peca-descricao">${peca.descricao || ''}</div>
                    </div>
                    <div class="peca-valor">R$ ${parseFloat(peca.valor).toFixed(2)}</div>
                </div>
            </div>
        `).join('');

        this.pecasContainer.innerHTML = html;

        // Adicionar event listeners para cada peça
        this.pecasContainer.querySelectorAll('.peca-option').forEach(option => {
            option.addEventListener('click', () => this.selectPeca(option));
        });
    }

    filterPecas() {
        const searchTerm = this.searchInput.value.toLowerCase();
        if (!this.allPecas) return;

        const filteredPecas = this.allPecas.filter(peca => 
            peca.nome.toLowerCase().includes(searchTerm) ||
            (peca.descricao && peca.descricao.toLowerCase().includes(searchTerm))
        );

        this.renderPecas(filteredPecas);
    }

    selectPeca(option) {
        const pecaId = option.dataset.pecaId;
        const peca = this.allPecas.find(p => p.id == pecaId);
        
        if (peca) {
            // Verificar se a peça já está adicionada
            const existingPecas = document.querySelectorAll('.peca-item');
            const alreadyExists = Array.from(existingPecas).some(item => 
                item.dataset.pecaId == pecaId
            );

            if (alreadyExists) {
                this.showNotification('Esta peça já foi adicionada à ordem de serviço', 'warning', null, 3000);
                return;
            }

            // Adicionar peça com quantidade 1 inicial
            const pecaData = {
                id: peca.id,
                nome: peca.nome,
                valor: peca.valor,
                quantidade: 1
            };

            this.addPecaItemReadonly(pecaData);
            this.hidePecaModal();
            this.showNotification('Peça adicionada com sucesso', 'success', null, 3000);
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

            // Carregar peças primeiro para poder calcular o valor
            this.carregarPecas(ordem.pecas || []);
            
            // Lógica para valor de peças: sempre calculado automaticamente
            const valorTotalInput = document.getElementById('valor_total');
            const valorCalculadoPecas = this.calcularTotalPecas();
            valorTotalInput.value = parseFloat(valorCalculadoPecas).toFixed(2);
            
            // Campo de valor de mão de obra
            const valorMaoDeObraInput = document.getElementById('valor_mao_de_obra');
            let valorMaoDeObra = 0;
            
            // Se há orçamento aprovado, usar valor dos serviços e adicionar descrição formatada
            if (ordem.orcamento && ordem.orcamento.status === 'A' && ordem.servicos_orcamento) {
                valorMaoDeObra = ordem.valor_total_servicos || 0;
                
                // Se a descrição atual não contém os serviços do orçamento, adicionar
                const descricaoAtual = document.getElementById('descricao').value;
                if (ordem.descricao_orcamento_formatada && !descricaoAtual.includes('SERVIÇOS DO ORÇAMENTO:')) {
                    const novaDescricao = descricaoAtual + 
                        (descricaoAtual ? '\n\n' : '') + 
                        ordem.descricao_orcamento_formatada;
                    document.getElementById('descricao').value = novaDescricao;
                }
            } else {
                // Usar valor existente da mão de obra
                valorMaoDeObra = ordem.valor_mao_de_obra || 0;
            }
            
            valorMaoDeObraInput.value = parseFloat(valorMaoDeObra).toFixed(2);
            
            // Indicações visuais para os campos
            if (valorCalculadoPecas > 0) {
                valorTotalInput.style.borderColor = '#28a745';
                valorTotalInput.style.backgroundColor = '#f8fff9';
                valorTotalInput.title = 'Valor calculado automaticamente das peças (somente leitura)';
            }
            
            if (valorMaoDeObra > 0) {
                valorMaoDeObraInput.style.borderColor = '#007bff';
                valorMaoDeObraInput.style.backgroundColor = '#f0f8ff';
                valorMaoDeObraInput.title = ordem.orcamento ? 'Valor dos serviços do orçamento (editável)' : 'Valor da mão de obra (editável)';
            }

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

    getStatusClass(status) {
        const map = {
            'Em Andamento': 'progress',
            'Ajuste Pendente': 'pending',     // Classe azul
            'Validado': 'completed',
            'Validada': 'completed',
            'Validação Pendente': 'validation-pending',
            'ValidaÇão Pendente': 'validation-pending', 
            'ValidaþÒo Pendente': 'validation-pending', 
            'Rejeitado': 'rejected',
            'Rejeitada': 'rejected'
        };
        return map[status] || 'secondary';
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
            valor: parseFloat(formData.get('valor_total')) || 0,
            valor_mao_de_obra: parseFloat(formData.get('valor_mao_de_obra')) || 0
        };

        const pecas = this.getPecasFromForm();
        if (pecas && pecas.length > 0) {
            data.pecas = pecas;
        }

        return data;
    }

    hasChanges(updateData) {
        if (!this.originalData) return true;

        const fieldsToCompare = ['descricao', 'status', 'observacao', 'valor', 'valor_mao_de_obra'];
        
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

    calcularTotalPecas() {
        // Calcular valor total das peças carregadas
        if (!this.currentItem || !this.currentItem.pecas) {
            return 0;
        }
        
        return this.currentItem.pecas.reduce((total, peca) => {
            const quantidade = peca.quantidade || peca.qtd_pecas || 0;
            const valor = parseFloat(peca.valor) || 0;
            return total + (quantidade * valor);
        }, 0);
    }

    carregarPecas(pecas) {
        const container = document.getElementById('pecas-container');
        if (!container) return;

        // Limpar container mas manter o header
        const existingItems = container.querySelectorAll('.peca-item');
        existingItems.forEach(item => item.remove());

        // Carregar peças existentes da OS
        if (pecas && pecas.length > 0) {
            pecas.forEach(peca => {
                this.addPecaItemReadonly(peca);
            });
        }
    }

    addPecaItemReadonly(peca) {
        const container = document.getElementById('pecas-container');
        if (!container) return;

        const index = container.querySelectorAll('.peca-item').length;
        const pecaDiv = document.createElement('div');
        pecaDiv.className = 'peca-item row mb-3';
        pecaDiv.dataset.pecaId = peca.id || '';
        
        const qtd = peca.quantidade || peca.qtd_pecas || 1;
        const valor = peca.valor || 0;
        const total = qtd * valor;
        
        pecaDiv.innerHTML = `
            <div class="col-md-4">
                <label class="form-label">Nome da Peça</label>
                <input type="text" class="form-control" name="pecas[${index}][nome]" 
                       value="${peca.nome || ''}" readonly>
                <input type="hidden" name="pecas[${index}][id]" value="${peca.id || ''}">
            </div>
            <div class="col-md-2">
                <label class="form-label">Quantidade</label>
                <input type="number" class="form-control peca-quantidade" name="pecas[${index}][quantidade]" 
                       value="${qtd}" min="1" readonly>
            </div>
            <div class="col-md-2">
                <label class="form-label">Valor Unitário</label>
                <input type="number" class="form-control peca-valor" name="pecas[${index}][valor]" 
                       value="${valor}" step="0.01" min="0" readonly>
            </div>
            <div class="col-md-2">
                <label class="form-label">Total</label>
                <input type="text" class="form-control total-peca" value="${this.formatMoney(total)}" readonly>
            </div>
            <div class="col-md-2">
                <label class="form-label">&nbsp;</label>
                <div class="btn-group d-block">
                    <button type="button" class="btn btn-primary btn-sm edit-peca-btn">
                        <i class="bx bx-edit"></i> Editar
                    </button>
                    <button type="button" class="btn btn-success btn-sm save-peca-btn" style="display: none;">
                        <i class="bx bx-check"></i> Salvar
                    </button>
                    <button type="button" class="btn btn-secondary btn-sm cancel-peca-btn" style="display: none;">
                        <i class="bx bx-x"></i> Cancelar
                    </button>
                    <button type="button" class="btn btn-danger btn-sm remove-peca-btn">
                        <i class="bx bx-trash"></i>
                    </button>
                </div>
            </div>
        `;

        container.appendChild(pecaDiv);
        this.setupPecaEventListeners(pecaDiv);
        this.updateTotalGeral();
    }

    setupPecaEventListeners(pecaDiv) {
        const editBtn = pecaDiv.querySelector('.edit-peca-btn');
        const saveBtn = pecaDiv.querySelector('.save-peca-btn');
        const cancelBtn = pecaDiv.querySelector('.cancel-peca-btn');
        const removeBtn = pecaDiv.querySelector('.remove-peca-btn');
        const quantidadeInput = pecaDiv.querySelector('.peca-quantidade');
        const valorInput = pecaDiv.querySelector('.peca-valor');

        let originalValues = {};

        // Botão Editar
        editBtn.addEventListener('click', () => {
            // Salvar valores originais
            originalValues = {
                quantidade: quantidadeInput.value,
                valor: valorInput.value
            };

            // Habilitar edição
            quantidadeInput.removeAttribute('readonly');
            valorInput.removeAttribute('readonly');
            quantidadeInput.focus();

            // Mostrar/ocultar botões
            editBtn.style.display = 'none';
            saveBtn.style.display = 'inline-block';
            cancelBtn.style.display = 'inline-block';
            removeBtn.style.display = 'none';
        });

        // Botão Salvar
        saveBtn.addEventListener('click', () => {
            // Validar valores
            const quantidade = parseInt(quantidadeInput.value) || 0;
            const valor = parseFloat(valorInput.value) || 0;

            if (quantidade <= 0) {
                this.showNotification('Quantidade deve ser maior que zero', 'warning', null, 3000);
                quantidadeInput.focus();
                return;
            }

            if (valor < 0) {
                this.showNotification('Valor não pode ser negativo', 'warning', null, 3000);
                valorInput.focus();
                return;
            }

            // Desabilitar edição
            quantidadeInput.setAttribute('readonly', true);
            valorInput.setAttribute('readonly', true);

            // Recalcular total
            this.calculateItemTotal(pecaDiv);

            // Mostrar/ocultar botões
            editBtn.style.display = 'inline-block';
            saveBtn.style.display = 'none';
            cancelBtn.style.display = 'none';
            removeBtn.style.display = 'inline-block';

            this.updateTotalGeral();
        });

        // Botão Cancelar
        cancelBtn.addEventListener('click', () => {
            // Restaurar valores originais
            quantidadeInput.value = originalValues.quantidade;
            valorInput.value = originalValues.valor;

            // Desabilitar edição
            quantidadeInput.setAttribute('readonly', true);
            valorInput.setAttribute('readonly', true);

            // Recalcular total
            this.calculateItemTotal(pecaDiv);

            // Mostrar/ocultar botões
            editBtn.style.display = 'inline-block';
            saveBtn.style.display = 'none';
            cancelBtn.style.display = 'none';
            removeBtn.style.display = 'inline-block';

            this.updateTotalGeral();
        });

        // Botão Remover
        removeBtn.addEventListener('click', () => {
            if (confirm('Deseja remover esta peça da ordem de serviço?')) {
                pecaDiv.remove();
                this.updateTotalGeral();
            }
        });

        // Event listeners para recálculo durante edição
        quantidadeInput.addEventListener('input', () => {
            if (!quantidadeInput.hasAttribute('readonly')) {
                this.calculateItemTotal(pecaDiv);
                this.updateTotalGeral();
            }
        });

        valorInput.addEventListener('input', () => {
            if (!valorInput.hasAttribute('readonly')) {
                this.calculateItemTotal(pecaDiv);
                this.updateTotalGeral();
            }
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
                <input type="number" class="form-control peca-quantidade" name="pecas[${index}][quantidade]" 
                       value="${peca ? peca.quantidade || peca.qtd_pecas || 1 : 1}" 
                       min="1">
            </div>
            <div class="col-md-3">
                <label class="form-label">Valor Unitário</label>
                <input type="number" class="form-control peca-valor" name="pecas[${index}][valor]" 
                       value="${peca ? peca.valor || 0 : 0}" step="0.01" min="0" 
                       placeholder="0.00">
            </div>
            <div class="col-md-2">
                <label class="form-label">Total</label>
                <input type="text" class="form-control total-peca" readonly>
            </div>
            <div class="col-md-1">
                <label class="form-label">&nbsp;</label>
                <button type="button" class="btn btn-danger btn-sm d-block remove-peca-btn">
                    <i class="bx bx-trash"></i>
                </button>
            </div>
        `;

        container.appendChild(pecaDiv);

        // Adicionar event listeners para os campos
        const quantidadeInput = pecaDiv.querySelector('.peca-quantidade');
        const valorInput = pecaDiv.querySelector('.peca-valor');
        const nomeInput = pecaDiv.querySelector('[name*="[nome]"]');
        const removeBtn = pecaDiv.querySelector('.remove-peca-btn');

        // Event listener para o nome da peça - adicionar nova linha quando começar a digitar
        nomeInput.addEventListener('input', () => {
            // Se este é o último item e tem conteúdo, adicionar nova linha vazia
            const allItems = container.querySelectorAll('.peca-item');
            const isLastItem = pecaDiv === allItems[allItems.length - 1];
            const hasContent = nomeInput.value.trim() !== '';
            
            if (isLastItem && hasContent) {
                this.addPecaItem();
            }
        });

        // Event listener para quantidade
        quantidadeInput.addEventListener('input', () => {
            this.calculateItemTotal(pecaDiv);
            this.updateTotalGeral();
        });

        // Event listener para valor
        valorInput.addEventListener('input', () => {
            this.calculateItemTotal(pecaDiv);
            this.updateTotalGeral();
        });

        // Event listener para remover
        removeBtn.addEventListener('click', () => {
            const allItems = container.querySelectorAll('.peca-item');
            
            // Não permitir remover se é o único item ou se é o último item vazio
            if (allItems.length <= 1) {
                this.showNotification('Deve haver pelo menos uma linha para adicionar peças', 'warning', null, 3000);
                return;
            }
            
            const isLastItem = pecaDiv === allItems[allItems.length - 1];
            const isEmpty = !nomeInput.value.trim() && !quantidadeInput.value.trim() && !valorInput.value.trim();
            
            if (isLastItem && isEmpty) {
                this.showNotification('Não é possível remover a linha vazia para adição de peças', 'warning', null, 3000);
                return;
            }
            
            pecaDiv.remove();
            this.updateTotalGeral();
        });

        // Calcular total inicial se há dados
        if (peca && peca.valor) {
            this.calculateItemTotal(pecaDiv);
        }

        this.updateTotalGeral();
    }

    calculateItemTotal(pecaDiv) {
        const quantidadeInput = pecaDiv.querySelector('.peca-quantidade');
        const valorInput = pecaDiv.querySelector('.peca-valor');
        const totalInput = pecaDiv.querySelector('.total-peca');

        const quantidade = parseInt(quantidadeInput.value) || 0;
        const valor = parseFloat(valorInput.value) || 0;
        const total = quantidade * valor;

        totalInput.value = this.formatMoney(total);
        return total;
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
        const totalPecas = pecas.reduce((sum, peca) => sum + (peca.valor * peca.quantidade), 0);

        const valorTotalInput = document.getElementById('valor_total');
        
        // Sempre atualizar o valor total baseado apenas nas peças
        valorTotalInput.value = totalPecas.toFixed(2);
        
        if (totalPecas > 0) {
            valorTotalInput.style.borderColor = '#28a745';
            valorTotalInput.style.backgroundColor = '#f8fff9';
            valorTotalInput.title = 'Valor calculado automaticamente das peças (somente leitura)';
        } else {
            valorTotalInput.style.borderColor = '';
            valorTotalInput.style.backgroundColor = '';
            valorTotalInput.title = 'Nenhuma peça adicionada';
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

// Não é necessário inicialização automática aqui
// OrdemAjusteController será inicializado manualmente

// Instanciar controlador quando o documento estiver pronto
window.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('ajusteForm')) {
        window.ordemAjusteController = new OrdemAjusteController();
    }
});
