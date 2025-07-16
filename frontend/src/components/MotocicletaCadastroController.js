/**
 * MOTOCICLETA CADASTRO CONTROLLER
 * Responsável pelo cadastro de novas motocicletas
 * Baseado no padrão OrdemCadastroController
 */

class MotocicletaCadastroController extends BasePageController {
    constructor() {
        super();
        this.apiUrl = `${this.baseURL}/motocicletas`;
        this.clientesApiUrl = `${this.baseURL}/clientes`;
        this.marcasApiUrl = `${this.baseURL}/marcas`;
        this.blockFurtherProcessing = false;
        this.form = document.getElementById('cadastroMotoForm');
        this.clienteSelect = document.getElementById('cliente_cpf');
        this.marcaSelect = document.getElementById('marca_id');
        this.init();
    }

    init() {
        // Sobrescrever init do BasePageController para evitar conflitos
        this.setupFormSubmission();
        this.setupFormValidation();
        this.setupFieldMasks();
        this.loadClientes();
        this.loadMarcas();
        
        // Garantir que o método de notificação correto seja usado
        this.ensureCorrectNotificationMethod();
        
        // Configurações específicas do formulário
        this.addFormEnhancements();
        
        console.log('✅ MotocicletaCadastroController inicializado');
    }

    ensureCorrectNotificationMethod() {
        // Garantir que usamos o método de notificação avançado, não o do BasePageController
        this.originalShowAdvancedNotification = this.showAdvancedNotification.bind(this);
        this.showNotification = (message, type, title, duration) => {
            if (this.blockFurtherProcessing && (type === 'error' || type === 'warning')) {
                console.log(`[${type.toUpperCase()}] Notificação bloqueada: "${message}"`);
                return;
            }
            console.log(`[${type.toUpperCase()}] Notificação: "${message}"`);
            return this.originalShowAdvancedNotification(message, type, title, duration);
        };
        
        // Verificar se o CSS de notificações está carregado
        this.ensureNotificationStyles();
    }

    ensureNotificationStyles() {
        // Verificar se o CSS de ajuste está carregado
        const ajusteCss = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
            .find(link => link.href.includes('ajuste.css'));
        
        if (!ajusteCss) {
            console.warn('⚠️ CSS de ajuste não encontrado, carregando dinamicamente...');
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = '../../assets/css/ajuste.css';
            document.head.appendChild(link);
        }
        
        // Limpar qualquer notificação do BasePageController que possa estar presente
        const oldNotifications = document.querySelectorAll('.notification:not([id^="notification-"])');
        oldNotifications.forEach(notification => notification.remove());
    }

    addFormEnhancements() {
        // Adicionar validação em tempo real aos campos obrigatórios
        const requiredFields = this.form?.querySelectorAll('input[required], select[required], textarea[required]');
        
        requiredFields?.forEach(field => {
            field.addEventListener('blur', () => {
                this.validateField(field);
            });
            
            field.addEventListener('input', () => {
                if (field.style.borderColor === 'rgb(244, 67, 54)') {
                    field.style.borderColor = '';
                }
            });
        });

        // Configurar ano (apenas anos válidos)
        const anoInput = document.getElementById('ano');
        if (anoInput) {
            const anoAtual = new Date().getFullYear();
            anoInput.setAttribute('min', '1950');
            anoInput.setAttribute('max', anoAtual.toString());
        }

        // Configurar quilometragem (apenas números)
        const kmInput = document.getElementById('quilometragem');
        if (kmInput) {
            kmInput.addEventListener('input', (e) => {
                // Remove caracteres não numéricos
                let value = e.target.value.replace(/\D/g, '');
                // Limita a 7 dígitos (9999999 km)
                if (value.length > 7) value = value.slice(0, 7);
                e.target.value = value;
            });
        }
    }

    setupFormSubmission() {
        if (this.form) {
            this.form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleFormSubmit();
            });
        }
    }

    async handleFormSubmit() {
        try {
            console.log('🚀 INICIANDO PROCESSO DE CADASTRO DE MOTOCICLETA');
            console.log('🧹 Limpando notificações anteriores...');
            
            // Limpar TODAS as notificações antes de começar
            this.clearAllNotifications();
            this.removeOldNotifications();
            
            const formData = this.getFormData();
            
            // Validação básica
            if (!this.validateFormBasic(formData)) {
                return;
            }

            // Mostrar loading
            this.showLoading('Cadastrando motocicleta...');

            console.log('📤 Enviando dados da motocicleta:', formData);

            const token = localStorage.getItem('token');
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();
            
            // Limpar todas as notificações anteriores antes de processar a resposta
            this.clearAllNotifications();
            this.removeOldNotifications();
            
            console.log('📡 Resposta da API:');
            console.log('Status:', response.status);
            console.log('OK:', response.ok);
            console.log('Result:', result);

            // Processar resultado
            if (response.ok && result.success) {
                console.log('✅ SUCESSO: Motocicleta cadastrada corretamente!');
                this.showNotification('Motocicleta cadastrada com sucesso!', 'success', 'Sucesso!', 8000);
                
                // Bloquear qualquer processamento adicional
                this.blockFurtherProcessing = true;
                
                this.clearForm();
                setTimeout(() => {
                    window.location.href = 'motos-consulta.html';
                }, 2000);
                
                return;
                
            } else {
                console.log('❌ ERRO: Falha no cadastro');
                
                // Tratar erros específicos do servidor
                const errorMessage = result.message || 'Erro ao cadastrar motocicleta';
                console.log('❌ Mensagem processada:', errorMessage);
                
                if (errorMessage.toLowerCase().includes('placa') && errorMessage.toLowerCase().includes('já')) {
                    console.log('❌ DETECTADO: Erro de placa duplicada');
                    this.showNotification('Esta placa já está cadastrada no sistema', 'error', 'Placa Duplicada!', 8000);
                    this.focusField('placa');
                } else if (errorMessage.toLowerCase().includes('placa') && errorMessage.toLowerCase().includes('inválida')) {
                    console.log('❌ DETECTADO: Erro de placa inválida');
                    this.showNotification('Placa inválida. Use o formato ABC-1234 ou ABC1234', 'error', 'Placa Inválida!', 8000);
                    this.focusField('placa');
                } else {
                    console.log('❌ DETECTADO: Erro genérico');
                    this.showNotification(errorMessage, 'error', 'Erro!', 8000);
                }
            }

        } catch (error) {
            console.error('Erro ao cadastrar motocicleta:', error);
            if (error.message.includes('Failed to fetch')) {
                this.showNotification('Erro de conexão. Verifique se o servidor está funcionando.', 'error', 'Conexão Falhou!', 8000);
            } else {
                this.showNotification(`${error.message || 'Erro inesperado ao cadastrar motocicleta'}`, 'error', 'Erro!', 8000);
            }
        } finally {
            this.hideLoading();
        }
    }

    getFormData() {
        return {
            placa: document.getElementById('placa')?.value.trim().toUpperCase() || '',
            modelo: document.getElementById('modelo')?.value.trim() || '',
            marca_id: document.getElementById('marca_id')?.value || '',
            ano: document.getElementById('ano')?.value || '',
            cor: document.getElementById('cor')?.value.trim() || '',
            cilindrada: document.getElementById('cilindrada')?.value || '',
            clienteCpf: document.getElementById('cliente_cpf')?.value || ''
        };
    }

    validateFormBasic(data) {
        console.log('🔍 Validação básica de formulário de motocicleta');
        
        // Validar campos obrigatórios
        const requiredFields = ['placa', 'modelo', 'marca_id', 'ano', 'cor', 'clienteCpf'];
        
        for (const field of requiredFields) {
            if (!data[field]) {
                this.showNotification(`O campo ${this.getFieldLabel(field)} é obrigatório`, 'warning', 'Campo Obrigatório!', 8000);
                this.focusField(field);
                return false;
            }
        }

        // Validar placa
        if (!this.validatePlaca(data.placa)) {
            this.showNotification('Placa inválida. Use o formato ABC-1234 ou ABC1234', 'error', 'Placa Inválida!', 8000);
            this.focusField('placa');
            return false;
        }

        // Validar ano
        if (!this.validateAno(data.ano)) {
            this.showNotification('Ano inválido. Use um ano entre 1950 e o ano atual', 'error', 'Ano Inválido!', 8000);
            this.focusField('ano');
            return false;
        }

        // Validar quilometragem
        if (!this.validateQuilometragem(data.quilometragem)) {
            this.showNotification('Quilometragem inválida. Deve ser um número', 'error', 'Quilometragem Inválida!', 8000);
            this.focusField('quilometragem');
            return false;
        }

        console.log('✅ Validação básica concluída com sucesso');
        return true;
    }

    validatePlaca(placa) {
        if (!placa) return false;
        
        // Remove espaços e converte para maiúsculo
        const cleanPlaca = placa.replace(/\s/g, '').toUpperCase();
        
        // Formatos aceitos: ABC1234 ou ABC-1234
        const placaRegex = /^[A-Z]{3}-?\d{4}$/;
        return placaRegex.test(cleanPlaca);
    }

    validateAno(ano) {
        if (!ano) return false;
        
        const anoNum = parseInt(ano);
        const anoAtual = new Date().getFullYear();
        
        return anoNum >= 1950 && anoNum <= anoAtual;
    }

    validateQuilometragem(km) {
        if (km === '' || km === null || km === undefined) return true; // Campo opcional
        
        const kmNum = parseInt(km);
        return !isNaN(kmNum) && kmNum >= 0;
    }

    getFieldLabel(field) {
        const labels = {
            placa: 'Placa',
            modelo: 'Modelo',
            marca_id: 'Marca',
            ano: 'Ano',
            cor: 'Cor',
            quilometragem: 'Quilometragem',
            clienteCpf: 'Cliente'
        };
        return labels[field] || field;
    }

    focusField(fieldName) {
        const field = document.getElementById(fieldName);
        if (field) {
            field.focus();
            field.style.borderColor = '#f44336';
        }
    }

    validateField(field) {
        const value = field.value.trim();
        const isRequired = field.hasAttribute('required');
        
        if (isRequired && !value) {
            field.style.borderColor = '#f44336';
            return false;
        }
        
        // Validações específicas
        switch (field.id) {
            case 'placa':
                if (value && !this.validatePlaca(value)) {
                    field.style.borderColor = '#f44336';
                    return false;
                }
                break;
            case 'ano':
                if (value && !this.validateAno(value)) {
                    field.style.borderColor = '#f44336';
                    return false;
                }
                break;
            case 'quilometragem':
                if (value && !this.validateQuilometragem(value)) {
                    field.style.borderColor = '#f44336';
                    return false;
                }
                break;
        }
        
        field.style.borderColor = '';
        return true;
    }

    setupFieldMasks() {
        // Máscara para placa
        const placaInput = document.getElementById('placa');
        if (placaInput) {
            placaInput.addEventListener('input', (e) => {
                let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                
                // Limita a 7 caracteres (3 letras + 4 números)
                if (value.length > 7) value = value.slice(0, 7);
                
                // Aplica formatação ABC-1234
                if (value.length > 3) {
                    value = value.replace(/^([A-Z]{3})(\d{1,4})/, '$1-$2');
                }
                
                e.target.value = value;
            });
        }
    }

    setupFormValidation() {
        // Validação em tempo real
        const inputs = document.querySelectorAll('#motocicletaForm input, #motocicletaForm select');
        
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateField(input);
            });
            
            input.addEventListener('input', () => {
                if (input.style.borderColor === 'rgb(244, 67, 54)') {
                    input.style.borderColor = '';
                }
            });
        });
    }

    async loadClientes() {
        this._clientesRequestId = (this._clientesRequestId || 0) + 1;
        const currentRequestId = this._clientesRequestId;
        try {
            console.log('🔄 Carregando clientes...');
            const token = localStorage.getItem('token');
            const response = await fetch(this.clientesApiUrl, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const result = await response.json();
            console.log('🔎 Resultado clientes:', result);
            if (currentRequestId !== this._clientesRequestId) return; // Ignora respostas antigas
            if (result.success && Array.isArray(result.data)) {
                this.populateClienteSelect(result.data);
                if (result.data.length === 0) {
                    this.showNotification('Nenhum cliente cadastrado.', 'warning', 'Atenção!', 8000);
                } else {
                console.log('✅ Clientes carregados com sucesso');
                }
            } else {
                throw new Error('Falha ao carregar clientes');
            }
        } catch (error) {
            if (currentRequestId !== this._clientesRequestId) return; // Ignora respostas antigas
            console.error('❌ Erro ao carregar clientes:', error);
            this.showNotification('Erro ao carregar lista de clientes', 'error', 'Erro!', 8000);
        }
    }

    async loadMarcas() {
        this._marcasRequestId = (this._marcasRequestId || 0) + 1;
        const currentRequestId = this._marcasRequestId;
        try {
            console.log('🔄 Carregando marcas...');
            const token = localStorage.getItem('token');
            const response = await fetch(this.marcasApiUrl, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const result = await response.json();
            console.log('🔎 Resultado marcas:', result);
            if (currentRequestId !== this._marcasRequestId) return; // Ignora respostas antigas
            if (result.success && Array.isArray(result.data)) {
                this.populateMarcaSelect(result.data);
                if (result.data.length === 0) {
                    this.showNotification('Nenhuma marca cadastrada.', 'warning', 'Atenção!', 8000);
                } else {
                console.log('✅ Marcas carregadas com sucesso');
                }
            } else {
                throw new Error('Falha ao carregar marcas');
            }
        } catch (error) {
            if (currentRequestId !== this._marcasRequestId) return; // Ignora respostas antigas
            console.error('❌ Erro ao carregar marcas:', error);
            this.showNotification('Erro ao carregar lista de marcas', 'error', 'Erro!', 8000);
        }
    }

    populateClienteSelect(clientes) {
        if (this.clienteSelect) {
            this.clienteSelect.innerHTML = '<option value="">Selecione um cliente</option>';
            
            clientes.forEach(cliente => {
                const option = document.createElement('option');
                option.value = cliente.cpf;
                option.textContent = `${cliente.nome} - ${cliente.cpf}`;
                this.clienteSelect.appendChild(option);
            });
        }
    }

    populateMarcaSelect(marcas) {
        if (this.marcaSelect) {
            this.marcaSelect.innerHTML = '<option value="">Selecione uma marca</option>';
            
            marcas.forEach(marca => {
                const option = document.createElement('option');
                option.value = marca.id;
                option.textContent = marca.nome;
                this.marcaSelect.appendChild(option);
            });
        }
    }

    clearForm() {
        if (this.form) {
            this.form.reset();
            // Remover estilos de erro
            const inputs = this.form.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                input.style.borderColor = '';
            });
        }
    }

    showLoading(message = 'Carregando...') {
        let loadingOverlay = document.getElementById('loading-overlay');
        if (!loadingOverlay) {
            loadingOverlay = document.createElement('div');
            loadingOverlay.id = 'loading-overlay';
            loadingOverlay.innerHTML = `
                <div class="loading-content">
                    <div class="spinner"></div>
                    <p>${message}</p>
                </div>
            `;
            loadingOverlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
                color: white;
                font-size: 16px;
            `;
            document.body.appendChild(loadingOverlay);
        }
        loadingOverlay.style.display = 'flex';
        console.log('🔄', message);
    }

    hideLoading() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
        console.log('✅ Loading removido');
    }

    // === SISTEMA DE NOTIFICAÇÃO PERSONALIZADO ===
    showNotification(message, type = 'info', title = null, duration = 8000) {
        return this.showAdvancedNotification(message, type, title, duration);
    }

    showAdvancedNotification(message, type = 'info', title = null, duration = 8000) {
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

    clearAllNotifications() {
        const container = document.getElementById('notification-container');
        if (container) {
            const notifications = container.querySelectorAll('.notification');
            notifications.forEach(notification => {
                this.removeNotification(notification.id);
            });
        }
    }

    removeOldNotifications() {
        const oldNotifications = document.querySelectorAll('.notification:not([id^="notification-"])');
        oldNotifications.forEach(notification => notification.remove());
    }

    showSuccess(message) {
        return this.showAdvancedNotification(message, 'success');
    }

    showError(message) {
        return this.showAdvancedNotification(message, 'error');
    }

    showInfo(message) {
        return this.showAdvancedNotification(message, 'info');
    }
}

// Inicializar controller quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    if (typeof BasePageController !== 'undefined') {
        if (window.motocicletaCadastroControllerInstance) {
            // Já existe uma instância, não crie outra
            console.warn('MotocicletaCadastroController já instanciado, abortando nova criação.');
            return;
        }
        window.motocicletaCadastroControllerInstance = true;
        console.log('MotocicletaCadastroController carregando...');
        window.motocicletaCadastroController = new MotocicletaCadastroController();
    } else {
        console.error('❌ BasePageController não encontrado');
    }
});
