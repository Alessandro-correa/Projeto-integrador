class ClienteAjusteController {
    constructor() {
        this.baseURL = 'http://localhost:3000/api/clientes';
        this.currentItem = null;
        this.originalData = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupMasks();
        
        // Carregar cliente se CPF estiver na URL
        setTimeout(() => this.loadClienteFromURL(), 100);
    }

    setupEventListeners() {
        const form = document.getElementById('ajusteForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        const cancelBtn = document.getElementById('cancelBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.handleCancel());
            // Aplicar cores padrão ao botão cancelar
            cancelBtn.style.backgroundColor = '#9ca3af';
            cancelBtn.style.borderColor = '#9ca3af';
            cancelBtn.style.color = '#ffffff';
        }

        const saveBtn = document.getElementById('saveBtn');
        if (saveBtn) {
            // Aplicar cores padrão ao botão principal de salvar
            saveBtn.style.backgroundColor = '#FC3B56';
            saveBtn.style.borderColor = '#FC3B56';
            saveBtn.style.color = '#ffffff';
        }
    }

    setupMasks() {
        // Máscara para telefone
        const telefoneInput = document.getElementById('telefone');
        if (telefoneInput) {
            telefoneInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                value = value.replace(/(\d{2})(\d)/, '($1) $2');
                value = value.replace(/(\d{4,5})(\d{4})$/, '$1-$2');
                e.target.value = value;
            });
        }

        // Máscara para CPF (somente leitura, mas mantém formatação)
        const cpfInput = document.getElementById('cpf');
        if (cpfInput) {
            cpfInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                value = value.replace(/(\d{3})(\d)/, '$1.$2');
                value = value.replace(/(\d{3})(\d)/, '$1.$2');
                value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
                e.target.value = value;
            });
        }
    }

    async loadClienteFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const cpf = urlParams.get('cpf');
        
        console.log(`🔗 URL atual: ${window.location.href}`);
        console.log(`📋 Parâmetros da URL:`, urlParams.toString());
        console.log(`👤 CPF extraído da URL: "${cpf}"`);
        
        if (cpf) {
            try {
                await this.loadCliente(cpf);
            } catch (error) {
                console.error('❌ Erro ao carregar cliente da URL:', error);
                this.showNotification('Erro ao carregar dados do cliente. Verifique se o CPF é válido.', 'error', 'Erro!', 5000);
                setTimeout(() => {
                    window.location.href = 'clientes-consulta.html';
                }, 3000);
            }
        } else {
            console.error('❌ CPF não encontrado na URL');
            this.showNotification('CPF não informado na URL.', 'error', 'Erro!', 5000);
            setTimeout(() => {
                window.location.href = 'clientes-consulta.html';
            }, 3000);
        }
    }

    async loadCliente(cpf) {
        try {
            this.showLoading(true);
            
            // Formatar CPF para busca
            const cpfFormatted = cpf.replace(/\D/g, '');
            
            console.log(`🔍 Buscando cliente com CPF: ${cpf} (formatado: ${cpfFormatted})`);
            
            const response = await fetch(`${this.baseURL}/${cpfFormatted}`);
            
            console.log(`📡 Resposta da API:`, response.status, response.statusText);
            
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Cliente não encontrado. Verifique se o CPF está correto.');
                }
                throw new Error(`Erro HTTP: ${response.status}`);
            }
            
            const result = await response.json();
            console.log(`📦 Dados recebidos:`, result);
            
            if (result.success && result.data) {
                this.currentItem = result.data;
                this.originalData = { ...result.data };
                this.preencherFormulario(result.data);
                this.showFormSection();
                this.showNotification('Cliente carregado com sucesso!', 'success', 'Sucesso!', 3000);
            } else {
                throw new Error(result.message || 'Erro ao carregar dados do cliente');
            }
            
        } catch (error) {
            console.error('❌ Erro ao carregar cliente:', error);
            this.showNotification(error.message || 'Erro ao carregar dados do cliente', 'error', 'Erro!', 5000);
            throw error;
        } finally {
            this.showLoading(false);
        }
    }

    preencherFormulario(cliente) {
        // Preencher campos do formulário
        document.getElementById('cpf').value = this.formatCPF(cliente.cpf) || '';
        document.getElementById('nome').value = cliente.nome || '';
        document.getElementById('email').value = cliente.email || '';
        document.getElementById('telefone').value = cliente.telefone || '';
        document.getElementById('sexo').value = cliente.sexo || '';
        document.getElementById('profissao').value = cliente.profissao || '';
        document.getElementById('endereco').value = cliente.endereco || '';

        // Formatar data de nascimento
        if (cliente.data_de_nascimento) {
            const date = new Date(cliente.data_de_nascimento);
            const formattedDate = date.toISOString().split('T')[0];
            document.getElementById('data_nascimento').value = formattedDate;
        }
    }

    formatCPF(cpf) {
        if (!cpf) return '';
        const cleaned = cpf.replace(/\D/g, '');
        return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }

    showFormSection() {
        const formSection = document.getElementById('adjustment-form-section');
        if (formSection) {
            formSection.style.display = 'block';
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        try {
            const formData = new FormData(e.target);
            const dadosNovos = this.extrairDadosFormulario(formData);
            
            if (!this.validarFormulario(dadosNovos)) {
                return;
            }
            
            if (!this.verificarMudancas(dadosNovos)) {
                this.showNotification('Nenhuma alteração foi detectada.', 'info', 'Informação', 3000);
                return;
            }
            
            await this.salvarAlteracoes(dadosNovos);
            
        } catch (error) {
            console.error('Erro ao salvar alterações:', error);
            this.showNotification(error.message || 'Erro ao salvar alterações', 'error', 'Erro!', 5000);
        }
    }

    extrairDadosFormulario(formData) {
        return {
            nome: formData.get('nome')?.trim() || '',
            email: formData.get('email')?.trim() || '',
            telefone: formData.get('telefone')?.trim() || '',
            sexo: formData.get('sexo') || '',
            profissao: formData.get('profissao')?.trim() || '',
            endereco: formData.get('endereco')?.trim() || '',
            data_de_nascimento: formData.get('data_nascimento') || ''
        };
    }

    validarFormulario(dados) {
        const camposObrigatorios = ['nome', 'email', 'telefone', 'sexo', 'profissao', 'endereco', 'data_de_nascimento'];
        
        for (const campo of camposObrigatorios) {
            if (!dados[campo]) {
                this.showNotification(`O campo ${this.getFieldLabel(campo)} é obrigatório`, 'error', 'Campo obrigatório!', 5000);
                return false;
            }
        }

        // Validar email
        if (!this.validarEmail(dados.email)) {
            this.showNotification('Email inválido', 'error', 'Email inválido!', 5000);
            return false;
        }

        // Validar data de nascimento
        if (!this.validarDataNascimento(dados.data_de_nascimento)) {
            this.showNotification('Data de nascimento inválida', 'error', 'Data inválida!', 5000);
            return false;
        }

        return true;
    }

    getFieldLabel(campo) {
        const labels = {
            nome: 'Nome',
            email: 'Email',
            telefone: 'Telefone',
            sexo: 'Sexo',
            profissao: 'Profissão',
            endereco: 'Endereço',
            data_de_nascimento: 'Data de Nascimento'
        };
        return labels[campo] || campo;
    }

    validarEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    validarDataNascimento(data) {
        if (!data) return false;
        
        const hoje = new Date();
        const nascimento = new Date(data);

        if (isNaN(nascimento.getTime())) return false;
        if (nascimento > hoje) return false;

        const idade = hoje.getFullYear() - nascimento.getFullYear();
        return idade >= 16 && idade <= 120;
    }

    verificarMudancas(dadosNovos) {
        if (!this.originalData) return true;

        const camposParaComparar = ['nome', 'email', 'telefone', 'sexo', 'profissao', 'endereco'];
        
        for (const campo of camposParaComparar) {
            const valorOriginal = this.originalData[campo] || '';
            const valorNovo = dadosNovos[campo] || '';
            
            if (valorOriginal !== valorNovo) {
                return true;
            }
        }

        // Comparar data de nascimento
        const dataOriginal = this.originalData.data_de_nascimento ? 
            new Date(this.originalData.data_de_nascimento).toISOString().split('T')[0] : '';
        const dataNova = dadosNovos.data_de_nascimento || '';
        
        return dataOriginal !== dataNova;
    }

    async salvarAlteracoes(dados) {
        try {
            const saveBtn = document.getElementById('saveBtn');
            
            // Mostrar loading no botão
            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Salvando...';
            }
            
            this.showLoading(true, 'Salvando alterações...');
            
            const cpf = this.currentItem.cpf.replace(/\D/g, '');
            
            const response = await fetch(`${this.baseURL}/${cpf}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dados)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                this.showNotification('Cliente atualizado com sucesso!', 'success', 'Sucesso!', 3000);
                
                // Atualizar dados originais
                this.originalData = { ...dados, cpf: this.currentItem.cpf };
                
                setTimeout(() => {
                    window.location.href = 'clientes-consulta.html';
                }, 2000);
            } else {
                throw new Error(result.message || 'Erro ao atualizar cliente');
            }

        } catch (error) {
            console.error('Erro ao salvar alterações:', error);
            this.showNotification(error.message || 'Erro ao salvar alterações', 'error', 'Erro!', 5000);
        } finally {
            this.showLoading(false);
            
            // Restaurar botão
            const saveBtn = document.getElementById('saveBtn');
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = '<i class="bx bx-check"></i> Salvar Alterações';
            }
        }
    }

    handleCancel() {
        if (this.verificarMudancas(this.extrairDadosFormulario(new FormData(document.getElementById('ajusteForm'))))) {
            if (confirm('Existem alterações não salvas. Deseja realmente cancelar?')) {
                window.location.href = 'clientes-consulta.html';
            }
        } else {
            window.location.href = 'clientes-consulta.html';
        }
    }

    showLoading(show, message = 'Carregando...') {
        const loading = document.getElementById('loading');
        if (loading) {
            if (show) {
                loading.style.display = 'flex';
                const span = loading.querySelector('span');
                if (span) span.textContent = message;
            } else {
                loading.style.display = 'none';
            }
        }
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showInfo(message) {
        this.showNotification(message, 'info');
    }

    showAlert(message, type = 'info', title = null, duration = 5000) {
        this.showNotification(message, type, title, duration);
    }

    showNotification(message, type = 'info', title = null, duration = 5000) {
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.className = 'notification-container';
            document.body.appendChild(container);
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
                success: 'Sucesso',
                error: 'Erro',
                warning: 'Atenção',
                info: 'Informação'
            };
            title = titles[type] || 'Notificação';
        }

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;

        const notificationId = 'notification-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        notification.id = notificationId;

        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-title">${title}</div>
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

// Inicializar controller quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    if (!window.clienteAjusteController) {
        window.clienteAjusteController = new ClienteAjusteController();
    }
});
