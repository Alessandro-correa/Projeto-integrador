class OrdemCadastroController {
    constructor() {
        this.apiUrl = 'http://localhost:3000/api/ordens';
        this.clientesApiUrl = 'http://localhost:3000/api/clientes';
        this.motocicletasApiUrl = 'http://localhost:3000/api/motocicletas';
        this.pecasApiUrl = 'http://localhost:3000/api/pecas';
        // Remover referência a usuários
        // this.usuariosApiUrl = 'http://localhost:3000/api/usuarios';
        this.form = document.getElementById('cadastroForm');
        this.clienteSelect = document.getElementById('cliente_id');
        this.motocicletaSelect = document.getElementById('motocicleta_id');
        this.dataInput = document.getElementById('data_abertura');
        this.pecasContainer = document.getElementById('pecas-container');
        this.addPecaBtn = document.getElementById('addPecaBtn');
        this.pecasSelecionadas = [];
        this.formOverlay = document.getElementById('form-overlay');
        // this.mecanicoResponsavel = null; // Não é mais necessário
        this.isSubmitting = false;
        this.init();
    }

    init() {
        
        if (this.dataInput) {
            const hoje = new Date().toISOString().split('T')[0];
            this.dataInput.value = hoje;
        }

        if (this.motocicletaSelect) {
            this.motocicletaSelect.disabled = true;
        }

        this.loadClientes();
        // Remover chamada de loadMecanico()
        // this.loadMecanico(); 
        
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        }
        
        if (this.clienteSelect) {
            this.clienteSelect.addEventListener('change', () => this.loadMotocicletasByCliente());
        }

        if (this.dataInput) {
            this.dataInput.addEventListener('change', () => this.validateDate());
            
            const hoje = new Date().toISOString().split('T')[0];
            this.dataInput.setAttribute('max', hoje);
        }

        if (this.addPecaBtn) {
            this.addPecaBtn.addEventListener('click', () => this.abrirModalPecas());
        }

        this.addFormEnhancements();
        // Padronizar status
        const statusSelect = document.getElementById('status');
        if (statusSelect) {
            statusSelect.innerHTML = `
                <option value="Ajuste Pendente">Ajuste Pendente</option>
                <option value="Validação Pendente">Validação Pendente</option>
                <option value="Em Andamento">Em Andamento</option>
                <option value="Validada">Validada</option>
            `;
        }
    }

    addFormEnhancements() {
        
        const requiredFields = this.form.querySelectorAll('input[required], select[required], textarea[required]');
        requiredFields.forEach(field => {
            field.addEventListener('blur', () => {
                
                if (field.disabled) return;
                
                if (field.value.trim() === '') {
                    field.classList.add('field-error');
                } else {
                    field.classList.remove('field-error');
                }
            });

            field.addEventListener('input', () => {
                
                if (field.disabled) return;
                
                if (field.value.trim() !== '') {
                    field.classList.remove('field-error');
                }
            });
        });
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notification-container');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close">&times;</button>
            </div>
            <div class="notification-progress"></div>
        `;

        container.appendChild(notification);

        const timeout = setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);

        notification.querySelector('.notification-close').addEventListener('click', () => {
            clearTimeout(timeout);
            notification.remove();
        });

        return notification;
    }

    async loadClientes() {
        if (!this.clienteSelect) return;
        this.clienteSelect.innerHTML = '<option value="">Carregando clientes...</option>';
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(this.clientesApiUrl, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Erro ao buscar clientes');
            const json = await res.json();
            const clientes = json.data || [];
            if (clientes.length === 0) {
                this.clienteSelect.innerHTML = '<option value="">Nenhum cliente encontrado</option>';
                this.showNotification('Nenhum cliente cadastrado.', 'warning');
            } else {
                this.clienteSelect.innerHTML = '<option value="">Selecione o cliente...</option>';
                clientes.forEach(cliente => {
                    this.clienteSelect.innerHTML += `<option value="${cliente.cpf}">${cliente.nome} - ${cliente.cpf}</option>`;
                });
            }
        } catch (e) {
            this.clienteSelect.innerHTML = '<option value="">Erro ao carregar clientes</option>';
            this.showNotification('Erro ao carregar clientes.', 'error');
        }
    }

    // Remover função loadMecanico

    async loadMotocicletasByCliente() {
        if (!this.clienteSelect || !this.clienteSelect.value) {
            if (this.motocicletaSelect) {
                this.motocicletaSelect.innerHTML = '<option value="">Selecione primeiro um cliente</option>';
                this.motocicletaSelect.disabled = true;
            }
            return;
        }

        if (this.motocicletaSelect) {
            this.motocicletaSelect.innerHTML = '<option value="">Carregando motocicletas...</option>';
            this.motocicletaSelect.disabled = true;
        }

        try {
            console.log('Carregando motocicletas para cliente:', this.clienteSelect.value);
            const token = localStorage.getItem('token');
            const res = await fetch(`${this.motocicletasApiUrl}/cliente/${this.clienteSelect.value}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (!res.ok) {
                throw new Error(`Erro ${res.status}: ${res.statusText}`);
            }
            
            const json = await res.json();
            console.log('Resposta da API:', json);
            
            const motocicletas = json.data || [];
            
            if (this.motocicletaSelect) {
                this.motocicletaSelect.disabled = false;
                
                if (motocicletas.length === 0) {
                    this.motocicletaSelect.innerHTML = '<option value="">Cliente não possui motocicletas cadastradas</option>';
                    this.showNotification('Este cliente não possui motocicletas cadastradas. Cadastre uma motocicleta primeiro.', 'warning');
                } else {
                    this.motocicletaSelect.innerHTML = '<option value="">Selecione a motocicleta...</option>';
                    motocicletas.forEach(moto => {
                        this.motocicletaSelect.innerHTML += `<option value="${moto.placa}">${moto.modelo} - ${moto.placa} (${moto.ano})</option>`;
                    });
                    this.showNotification(`${motocicletas.length} motocicleta(s) encontrada(s) para este cliente.`, 'success');
                }
            }
            
        } catch (e) {
            console.error('Erro ao carregar motocicletas:', e);
            if (this.motocicletaSelect) {
                this.motocicletaSelect.innerHTML = '<option value="">Erro ao carregar motocicletas</option>';
                this.motocicletaSelect.disabled = false;
            }
            this.showNotification('Erro ao carregar motocicletas do cliente. Tente novamente.', 'error');
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        if (this.isSubmitting) return;
        this.isSubmitting = true;
        
        const submitButton = this.form.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;

        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="bx bx-loader bx-spin"></i> Salvando...';
        
        const formData = new FormData(this.form);
        // Calcular valor total das peças
        const valorTotalPecas = this.pecasSelecionadas.reduce((acc, p) => acc + (p.valor * p.quantidade), 0);
        // Pegar valor de mão de obra do formulário (se existir campo)
        const valorMaoDeObra = parseFloat(formData.get('valor_mao_de_obra')) || 0;
        const data = {
            titulo: formData.get('titulo')?.trim(),
            data: formData.get('data_abertura'),
            descricao: formData.get('descricao')?.trim(),
            status: formData.get('status'),
            valor: valorTotalPecas,
            valor_mao_de_obra: valorMaoDeObra,
            validada: false,
            clienteCpf: formData.get('cliente_id'), 
            motocicletaPlaca: formData.get('motocicleta_id'),
            pecas: this.pecasSelecionadas // Enviar peças selecionadas
        };

        const errors = [];

        if (!data.data) errors.push('Data é obrigatória');
        if (!data.titulo) errors.push('Título do serviço é obrigatório');
        if (!data.descricao) errors.push('Descrição dos serviços é obrigatória');
        if (!data.clienteCpf) errors.push('Cliente deve ser selecionado');
        // Remover usuárioCpf
        // if (!data.usuarioCpf) errors.push('Erro interno: mecânico responsável não foi definido');
        if (!data.motocicletaPlaca) errors.push('Motocicleta deve ser selecionada');
        
        if (data.titulo && data.titulo.length < 5) {
            errors.push('Título deve ter pelo menos 5 caracteres');
        }
        
        if (data.descricao && data.descricao.length < 10) {
            errors.push('Descrição deve ter pelo menos 10 caracteres');
        }

        if (errors.length > 0) {
            errors.forEach(msg => this.showNotification(msg, 'error'));
            submitButton.disabled = false;
            submitButton.innerHTML = originalText;
            this.isSubmitting = false;
            return;
        }

        try {
            console.log('Enviando dados:', data);
            
            const token = localStorage.getItem('token');
            const res = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            const result = await res.json();
            console.log('Resposta do servidor:', result);

            if (!res.ok) {
                throw new Error(result.message || `Erro ${res.status}: ${res.statusText}`);
            }

            this.showNotification('Ordem de serviço criada com sucesso!', 'success');

            setTimeout(() => {
                window.location.href = 'os-consulta.html';
            }, 1500);

        } catch (e) {
            console.error('Erro ao criar ordem de serviço:', e);
            this.showNotification(`Erro ao criar ordem de serviço: ${e.message}`, 'error');
            
            submitButton.disabled = false;
            submitButton.innerHTML = originalText;
        } finally {
            this.isSubmitting = false;
        }
    }

    showNotification(message, type = 'info', duration = 5000) {
        
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.className = 'notification-container';
            document.body.appendChild(container);
        }

        const existingNotifications = container.querySelectorAll('.notification');
        for (let notification of existingNotifications) {
            const existingMessage = notification.querySelector('.notification-message')?.textContent;
            if (existingMessage === message.replace(/<br>/g, '\n')) {
                
                notification.style.transform = 'scale(1.02)';
                setTimeout(() => {
                    notification.style.transform = 'scale(1)';
                }, 200);
                return;
            }
        }

        const icons = {
            success: 'bx-check-circle',
            error: 'bx-error-circle',
            warning: 'bx-error',
            info: 'bx-info-circle'
        };

        const notificationId = 'notification-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.id = notificationId;

        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-title">${this.getNotificationTitle(type)}</div>
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close" onclick="window.closeNotification('${notificationId}')">X</button>
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

    getNotificationTitle(type) {
        const titles = {
            success: 'Sucesso',
            error: 'Erro',
            warning: 'Atenção',
            info: 'Informação'
        };
        return titles[type] || 'Notificação';
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

    clearAllNotifications() {
        const container = document.getElementById('notification-container');
        if (container) {
            const notifications = container.querySelectorAll('.notification');
            notifications.forEach(notification => {
                this.removeNotification(notification.id);
            });
        }
    }

    validateDate() {
        if (!this.dataInput || !this.formOverlay) return;

        const selectedDate = new Date(this.dataInput.value);
        const today = new Date();

        today.setHours(23, 59, 59, 999); 
        
        if (selectedDate > today) {
            
            this.formOverlay.classList.add('active');
            this.showNotification('Data inválida! Não é possível criar ordem de serviço para data futura.', 'error');
        } else {
            
            this.formOverlay.classList.remove('active');
        }
    }

    async abrirModalPecas() {
        // Cria modal se não existir
        let modal = document.getElementById('selectPecaModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'selectPecaModal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Selecionar Peça</h3>
                        <span class="close">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div class="search-box">
                            <input type="text" id="searchPeca" placeholder="Buscar peça..." class="form-control">
                        </div>
                        <div id="pecasDisponiveis" class="pecas-disponiveis">
                            <div class="loading">Carregando peças...</div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" id="cancelSelectPeca">Cancelar</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        modal.style.display = 'flex';
        // Fechar modal
        modal.querySelector('.close').onclick = () => modal.style.display = 'none';
        modal.querySelector('#cancelSelectPeca').onclick = () => modal.style.display = 'none';
        // Buscar peças disponíveis
        this.carregarPecasDisponiveis();
        // Filtro de busca
        modal.querySelector('#searchPeca').oninput = (e) => this.filtrarPecasDisponiveis(e.target.value);
        // Fechar ao clicar fora
        modal.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
    }

    async carregarPecasDisponiveis() {
        const pecasDiv = document.getElementById('pecasDisponiveis');
        if (!pecasDiv) return;
        pecasDiv.innerHTML = '<div class="loading">Carregando peças...</div>';
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(this.pecasApiUrl, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Erro ao buscar peças');
            const json = await res.json();
            const pecas = json.data || [];
            if (pecas.length === 0) {
                pecasDiv.innerHTML = '<div>Nenhuma peça disponível.</div>';
            } else {
                pecasDiv.innerHTML = '';
                pecas.forEach((peca, idx) => {
                    const pecaDiv = document.createElement('div');
                    pecaDiv.className = 'peca-option';
                    pecaDiv.innerHTML = `
                        <div class="peca-info">
                            <div>
                                <div class="peca-nome">${peca.nome}</div>
                                <div class="peca-descricao">${peca.descricao || ''}</div>
                            </div>
                            <div class="peca-valor">R$ ${parseFloat(peca.valor).toFixed(2)}</div>
                        </div>
                    `;
                    pecaDiv.onclick = () => this.selectPecaCadastro(peca);
                    pecasDiv.appendChild(pecaDiv);
                });
            }
        } catch (e) {
            pecasDiv.innerHTML = '<div>Erro ao carregar peças.</div>';
        }
    }

    filtrarPecasDisponiveis(filtro) {
        const pecasDiv = document.getElementById('pecasDisponiveis');
        if (!pecasDiv) return;
        const pecas = pecasDiv.querySelectorAll('.peca-option');
        pecas.forEach(div => {
            const nome = div.querySelector('.peca-nome').textContent.toLowerCase();
            if (nome.includes(filtro.toLowerCase())) {
                div.style.display = '';
            } else {
                div.style.display = 'none';
            }
        });
    }

    selectPecaCadastro(peca) {
        // Verificar se a peça já foi adicionada
        if (this.pecasSelecionadas.some(p => p.id == peca.id)) {
            this.showNotification('Esta peça já foi adicionada à ordem de serviço', 'warning');
            return;
        }
        // Adicionar peça com quantidade 1
        this.pecasSelecionadas.push({ ...peca, quantidade: 1 });
        this.atualizarPecasNoFormulario();
        // Fecha modal
        const modal = document.getElementById('selectPecaModal');
        if (modal) modal.style.display = 'none';
        this.showNotification('Peça adicionada com sucesso', 'success');
    }

    atualizarPecasNoFormulario() {
        if (!this.pecasContainer) return;
        this.pecasContainer.innerHTML = '';
        this.pecasSelecionadas.forEach((peca, idx) => {
            const pecaDiv = document.createElement('div');
            pecaDiv.className = 'peca-item row mb-3';
            pecaDiv.dataset.pecaId = peca.id || '';
            const qtd = peca.quantidade || 1;
            const valor = peca.valor || 0;
            const total = qtd * valor;
            pecaDiv.innerHTML = `
                <div class="col-md-4">
                    <label class="form-label">Nome da Peça</label>
                    <input type="text" class="form-control" name="pecas[${idx}][nome]" value="${peca.nome}" readonly>
                    <input type="hidden" name="pecas[${idx}][id]" value="${peca.id}">
                </div>
                <div class="col-md-2">
                    <label class="form-label">Quantidade</label>
                    <input type="number" class="form-control peca-quantidade" name="pecas[${idx}][quantidade]" value="${qtd}" min="1" readonly>
                </div>
                <div class="col-md-2">
                    <label class="form-label">Valor Unitário</label>
                    <input type="number" class="form-control peca-valor" name="pecas[${idx}][valor]" value="${valor}" step="0.01" min="0" readonly>
                </div>
                <div class="col-md-2">
                    <label class="form-label">Total</label>
                    <input type="text" class="form-control total-peca" value="R$ ${(qtd * valor).toLocaleString('pt-BR', {minimumFractionDigits:2})}" readonly>
                </div>
                <div class="col-md-2">
                    <label class="form-label">&nbsp;</label>
                    <div class="btn-group d-block">
                        <button type="button" class="btn btn-primary btn-sm edit-peca-btn"><i class="bx bx-edit"></i> Editar</button>
                        <button type="button" class="btn btn-success btn-sm save-peca-btn" style="display: none;"><i class="bx bx-check"></i> Salvar</button>
                        <button type="button" class="btn btn-secondary btn-sm cancel-peca-btn" style="display: none;"><i class="bx bx-x"></i> Cancelar</button>
                        <button type="button" class="btn btn-danger btn-sm remove-peca-btn"><i class="bx bx-trash"></i></button>
                    </div>
                </div>
            `;
            this.setupPecaEventListenersCadastro(pecaDiv, idx);
            this.pecasContainer.appendChild(pecaDiv);
        });
        this.atualizarValorTotalPecas();
    }

    setupPecaEventListenersCadastro(pecaDiv, idx) {
        const editBtn = pecaDiv.querySelector('.edit-peca-btn');
        const saveBtn = pecaDiv.querySelector('.save-peca-btn');
        const cancelBtn = pecaDiv.querySelector('.cancel-peca-btn');
        const removeBtn = pecaDiv.querySelector('.remove-peca-btn');
        const quantidadeInput = pecaDiv.querySelector('.peca-quantidade');
        const valorInput = pecaDiv.querySelector('.peca-valor');
        let originalValues = {};
        editBtn.addEventListener('click', () => {
            originalValues = {
                quantidade: quantidadeInput.value,
                valor: valorInput.value
            };
            quantidadeInput.removeAttribute('readonly');
            valorInput.removeAttribute('readonly');
            quantidadeInput.focus();
            editBtn.style.display = 'none';
            saveBtn.style.display = 'inline-block';
            cancelBtn.style.display = 'inline-block';
            removeBtn.style.display = 'none';
        });
        saveBtn.addEventListener('click', () => {
            const quantidade = parseInt(quantidadeInput.value) || 0;
            const valor = parseFloat(valorInput.value) || 0;
            if (quantidade <= 0) {
                this.showNotification('Quantidade deve ser maior que zero', 'warning');
                quantidadeInput.focus();
                return;
            }
            if (valor < 0) {
                this.showNotification('Valor não pode ser negativo', 'warning');
                valorInput.focus();
                return;
            }
            quantidadeInput.setAttribute('readonly', true);
            valorInput.setAttribute('readonly', true);
            this.pecasSelecionadas[idx].quantidade = quantidade;
            this.pecasSelecionadas[idx].valor = valor;
            this.atualizarPecasNoFormulario();
            editBtn.style.display = 'inline-block';
            saveBtn.style.display = 'none';
            cancelBtn.style.display = 'none';
            removeBtn.style.display = 'inline-block';
        });
        cancelBtn.addEventListener('click', () => {
            quantidadeInput.value = originalValues.quantidade;
            valorInput.value = originalValues.valor;
            quantidadeInput.setAttribute('readonly', true);
            valorInput.setAttribute('readonly', true);
            this.atualizarPecasNoFormulario();
            editBtn.style.display = 'inline-block';
            saveBtn.style.display = 'none';
            cancelBtn.style.display = 'none';
            removeBtn.style.display = 'inline-block';
        });
        removeBtn.addEventListener('click', () => {
            this.pecasSelecionadas.splice(idx, 1);
            this.atualizarPecasNoFormulario();
        });
        quantidadeInput.addEventListener('input', () => {
            if (!quantidadeInput.hasAttribute('readonly')) {
                pecaDiv.querySelector('.total-peca').value = `R$ ${(quantidadeInput.value * valorInput.value).toLocaleString('pt-BR', {minimumFractionDigits:2})}`;
            }
        });
        valorInput.addEventListener('input', () => {
            if (!valorInput.hasAttribute('readonly')) {
                pecaDiv.querySelector('.total-peca').value = `R$ ${(quantidadeInput.value * valorInput.value).toLocaleString('pt-BR', {minimumFractionDigits:2})}`;
            }
        });
    }

    atualizarValorTotalPecas() {
        const valorTotalInput = document.getElementById('valor_total');
        const total = this.pecasSelecionadas.reduce((acc, p) => acc + (p.quantidade * p.valor), 0);
        if (valorTotalInput) valorTotalInput.value = total.toFixed(2);
    }
}

// Corrigir validação do formulário para os campos corretos
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('cadastroForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            const data = document.getElementById('data_abertura').value;
            const cliente = document.getElementById('cliente_id').value;
            const moto = document.getElementById('motocicleta_id').value;
            let erro = false;
            if (!data) {
                window.ordemCadastroController.showNotification('Data é obrigatória', 'error');
                erro = true;
            }
            if (!cliente) {
                window.ordemCadastroController.showNotification('Cliente deve ser selecionado', 'error');
                erro = true;
            }
            if (!moto) {
                window.ordemCadastroController.showNotification('Motocicleta deve ser selecionada', 'error');
                erro = true;
            }
            if (erro) e.preventDefault();
        });
    }
});
