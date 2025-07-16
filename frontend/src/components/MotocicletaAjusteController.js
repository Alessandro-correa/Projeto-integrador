/**
 * MOTOCICLETA AJUSTE CONTROLLER
 * Responsável pela edição de motocicletas
 * Baseado no padrão OrdemAjusteController para padronização
 */

console.log('[MotocicletaAjusteController.js] Script carregado!');

class MotocicletaAjusteController extends BasePageController {
    constructor() {
        super();
        this.baseURL = 'http://localhost:3000/api';
        this.apiUrl = `${this.baseURL}/motocicletas`;
        this.clientesApiUrl = `${this.baseURL}/clientes`;
        this.marcasApiUrl = `${this.baseURL}/marcas`;
        this.currentItem = null;
        this.originalData = null;
        this.blockFurtherProcessing = false;
        this.form = document.getElementById('ajusteForm');
        this.clienteSelect = document.getElementById('cliente_cpf');
        this.marcaSelect = document.getElementById('marca_id');
        // Flags de carregamento
        this._clientesLoaded = false;
        this._marcasLoaded = false;
        this._motoLoaded = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupFormValidation();
        this.setupFieldMasks();
        this.loadClientes();
        this.loadMarcas();
        this.ensureCorrectNotificationMethod();
        
        // Carregar dados da motocicleta da URL
        setTimeout(() => this.loadMotocicletaFromURL(), 100);
        
        console.log('✅ MotocicletaAjusteController inicializado');
    }

    ensureCorrectNotificationMethod() {
        // Garantir que usamos o método de notificação avançado
        this.originalShowAdvancedNotification = this.showAdvancedNotification.bind(this);
        this.showNotification = (message, type, title, duration) => {
            if (this.blockFurtherProcessing && (type === 'error' || type === 'warning')) {
                console.log(`[${type.toUpperCase()}] Notificação bloqueada: "${message}"`);
                return;
            }
            console.log(`[${type.toUpperCase()}] Notificação: "${message}"`);
            return this.originalShowAdvancedNotification(message, type, title, duration);
        };
        
        this.ensureNotificationStyles();
    }

    ensureNotificationStyles() {
        const ajusteCss = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
            .find(link => link.href.includes('ajuste.css'));
        
        if (!ajusteCss) {
            console.warn('⚠️ CSS de ajuste não encontrado, carregando dinamicamente...');
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = '../../assets/css/ajuste.css';
            document.head.appendChild(link);
        }
        
        const oldNotifications = document.querySelectorAll('.notification:not([id^="notification-"])');
        oldNotifications.forEach(notification => notification.remove());
    }

    setupEventListeners() {
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        const cancelBtn = document.getElementById('cancelBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.handleCancel());
            cancelBtn.style.backgroundColor = '#9ca3af';
            cancelBtn.style.borderColor = '#9ca3af';
            cancelBtn.style.color = '#ffffff';
        }

        const saveBtn = document.getElementById('saveBtn');
        if (saveBtn) {
            saveBtn.style.backgroundColor = '#10b981';
            saveBtn.style.borderColor = '#10b981';
            saveBtn.style.color = '#ffffff';
        }
    }

    async loadMotocicletaFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const placa = urlParams.get('placa');
        
        if (!placa) {
            this.showNotification('Parâmetro placa não encontrado na URL', 'error', 'Erro!', 8000);
            setTimeout(() => {
                window.location.href = 'motos-consulta.html';
            }, 2000);
            return;
        }

        await this.loadMotocicleta(placa);
    }

    async loadMotocicleta(placa) {
        try {
            console.log('[MotocicletaAjusteController] Iniciando carregamento da motocicleta:', placa);
            this.showLoading('Carregando dados da motocicleta...');

            const token = localStorage.getItem('token');
            const response = await fetch(`${this.apiUrl}/${placa}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Motocicleta não encontrada');
                }
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.success && result.data) {
                this.currentItem = result.data;
                this.originalData = { ...result.data };
                this._motoLoaded = true;
                // Se já carregou os clientes, setar o cliente no select
                if (this._clientesLoaded && this.clienteSelect && result.data.cliente_cpf) {
                    this.clienteSelect.value = result.data.cliente_cpf;
                }
                console.log('[MotocicletaAjusteController] Motocicleta carregada:', result.data);
                this.tryShowForm();
                this.showNotification('Dados carregados com sucesso', 'success', 'Sucesso!', 3000);
            } else {
                throw new Error(result.message || 'Falha ao carregar motocicleta');
            }

        } catch (error) {
            console.error('❌ Erro ao carregar motocicleta:', error);
            this.showNotification(error.message || 'Erro ao carregar motocicleta', 'error', 'Erro!', 8000);
            
            setTimeout(() => {
                window.location.href = 'motos-consulta.html';
            }, 2000);
        } finally {
            this.hideLoading();
        }
    }

    populateForm(data) {
        // Preencher campos do formulário
        const fields = ['placa', 'ano', 'cor', 'cilindrada'];
        fields.forEach(field => {
            const element = document.getElementById(field);
            if (element) {
                element.value = data[field] || '';
            }
        });
        // Preencher modelo apenas com o modelo puro (remover marca se vier junto)
        const modeloInput = document.getElementById('modelo');
        if (modeloInput) {
            let modelo = data.modelo || '';
            // Se modelo vier no formato 'Marca Modelo', remover a marca se possível
            if (data.marca_nome && modelo.toLowerCase().startsWith(data.marca_nome.toLowerCase())) {
                modelo = modelo.substring(data.marca_nome.length).trim();
            }
            modeloInput.value = modelo;
        }

        // Aguardar carregamento dos selects
        setTimeout(() => {
            if (this.clienteSelect && data.cliente_cpf) {
                this.clienteSelect.value = data.cliente_cpf;
            }
            // Selecionar marca pelo id
            if (this.marcaSelect && data.marca_id) {
                this.marcaSelect.value = data.marca_id;
            }
        }, 500);

        // Campo placa deve ser readonly para edição
        const placaInput = document.getElementById('placa');
        if (placaInput) {
            placaInput.readOnly = true;
            placaInput.style.backgroundColor = '#f3f4f6';
        }
    }

    async handleSubmit(event) {
        event.preventDefault();
        
        try {
            console.log('🚀 INICIANDO PROCESSO DE ATUALIZAÇÃO');
            this.clearAllNotifications();
            this.removeOldNotifications();
            
            const formData = this.getFormData();
            
            if (!this.validateFormBasic(formData)) {
                return;
            }

            // Verificar se houve mudanças
            if (!this.hasChanges(formData)) {
                this.showNotification('Nenhuma alteração foi feita', 'warning', 'Aviso!', 5000);
                return;
            }

            this.showLoading('Atualizando motocicleta...');

            console.log('📤 Enviando dados atualizados:', formData);

            const token = localStorage.getItem('token');
            const response = await fetch(`${this.apiUrl}/${this.currentItem.placa}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();
            
            this.clearAllNotifications();
            this.removeOldNotifications();
            
            console.log('📡 Resposta da API:');
            console.log('Status:', response.status);
            console.log('Result:', result);

            if (response.ok && result.success) {
                console.log('✅ SUCESSO: Motocicleta atualizada!');
                this.showNotification('Motocicleta atualizada com sucesso!', 'success', 'Sucesso!', 8000);
                
                this.blockFurtherProcessing = true;
                
                setTimeout(() => {
                    window.location.href = 'motos-consulta.html';
                }, 2000);
                
                return;
                
            } else {
                console.log('❌ ERRO: Falha na atualização');
                
                const errorMessage = result.message || 'Erro ao atualizar motocicleta';
                console.log('❌ Mensagem processada:', errorMessage);
                
                this.showNotification(errorMessage, 'error', 'Erro!', 8000);
            }

        } catch (error) {
            console.error('Erro ao atualizar motocicleta:', error);
            if (error.message.includes('Failed to fetch')) {
                this.showNotification('Erro de conexão. Verifique se o servidor está funcionando.', 'error', 'Conexão Falhou!', 8000);
            } else {
                this.showNotification(`${error.message || 'Erro inesperado ao atualizar motocicleta'}`, 'error', 'Erro!', 8000);
            }
        } finally {
            this.hideLoading();
        }
    }

    getFormData() {
        return {
            placa: document.getElementById('placa')?.value.trim().toUpperCase() || '',
            modelo: document.getElementById('modelo')?.value.trim() || '', // modelo puro
            marca_id: document.getElementById('marca_id')?.value || '',
            ano: document.getElementById('ano')?.value || '',
            cor: document.getElementById('cor')?.value.trim() || '',
            cilindrada: document.getElementById('cilindrada')?.value || '',
            clienteCpf: document.getElementById('cliente_cpf')?.value || ''
        };
    }

    hasChanges(formData) {
        if (!this.originalData) return true;
        
        const fieldsToCheck = ['modelo', 'marca_id', 'ano', 'cor', 'cilindrada', 'cliente_cpf'];
        
        return fieldsToCheck.some(field => {
            const originalValue = this.originalData[field]?.toString() || '';
            const currentValue = formData[field]?.toString() || '';
            return originalValue !== currentValue;
        });
    }

    validateFormBasic(data) {
        console.log('🔍 Validação básica de formulário de motocicleta');
        
        const requiredFields = ['placa', 'modelo', 'marca_id', 'ano', 'cor', 'cilindrada', 'clienteCpf'];
        
        for (const field of requiredFields) {
            if (!data[field]) {
                this.showNotification(`O campo ${this.getFieldLabel(field)} é obrigatório`, 'warning', 'Campo Obrigatório!', 8000);
                this.focusField(field === 'clienteCpf' ? 'cliente_cpf' : field);
                return false;
            }
        }
        // Verificação extra para clienteCpf
        if (!data.clienteCpf) {
            this.showNotification('Selecione um cliente válido.', 'error', 'Cliente obrigatório!', 8000);
            this.focusField('cliente_cpf');
            return false;
        }

        if (!this.validateAno(data.ano)) {
            this.showNotification('Ano inválido. Use um ano entre 1950 e o ano atual', 'error', 'Ano Inválido!', 8000);
            this.focusField('ano');
            return false;
        }

        if (!this.validateCilindrada(data.cilindrada)) {
            this.showNotification('Cilindrada inválida. Deve ser um número maior que zero', 'error', 'Cilindrada Inválida!', 8000);
            this.focusField('cilindrada');
            return false;
        }

        console.log('✅ Validação básica concluída com sucesso');
        return true;
    }

    validateAno(ano) {
        if (!ano) return false;
        
        const anoNum = parseInt(ano);
        const anoAtual = new Date().getFullYear();
        
        return anoNum >= 1950 && anoNum <= anoAtual;
    }

    validateCilindrada(cilindrada) {
        if (cilindrada === '' || cilindrada === null || cilindrada === undefined) return false;
        const cilNum = parseInt(cilindrada);
        return !isNaN(cilNum) && cilNum > 0;
    }

    validateQuilometragem(km) {
        if (km === '' || km === null || km === undefined) return true;
        
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
            cilindrada: 'Cilindrada',
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

    setupFieldMasks() {
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
                let value = e.target.value.replace(/\D/g, '');
                if (value.length > 7) value = value.slice(0, 7);
                e.target.value = value;
            });
        }
    }

    setupFormValidation() {
        const inputs = document.querySelectorAll('#ajusteForm input, #ajusteForm select');
        
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

    validateField(field) {
        const value = field.value.trim();
        const isRequired = field.hasAttribute('required');
        
        if (isRequired && !value) {
            field.style.borderColor = '#f44336';
            return false;
        }
        
        switch (field.id) {
            case 'ano':
                if (value && !this.validateAno(value)) {
                    field.style.borderColor = '#f44336';
                    return false;
                }
                break;
            case 'cilindrada':
                if (value && !this.validateCilindrada(value)) {
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

    async loadClientes() {
        try {
            console.log('[MotocicletaAjusteController] Carregando clientes...');
            const token = localStorage.getItem('token');
            const response = await fetch(this.clientesApiUrl, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const result = await response.json();
            
            if (result.success && result.data) {
                this.populateClienteSelect(result.data);
                this._clientesLoaded = true;
                // Se já carregou a moto, setar o cliente no select
                if (this._motoLoaded && this.currentItem && this.currentItem.cliente_cpf) {
                    this.clienteSelect.value = this.currentItem.cliente_cpf;
                }
                console.log('[MotocicletaAjusteController] Clientes carregados:', result.data.length);
                this.tryShowForm();
            }
        } catch (error) {
            console.error('[MotocicletaAjusteController] Erro ao carregar clientes:', error);
        }
    }

    async loadMarcas() {
        try {
            console.log('[MotocicletaAjusteController] Carregando marcas...');
            const token = localStorage.getItem('token');
            const response = await fetch(this.marcasApiUrl, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const result = await response.json();
            
            if (result.success && result.data) {
                this.populateMarcaSelect(result.data);
                this._marcasLoaded = true;
                // Se já carregou a moto, setar a marca no select
                if (this._motoLoaded && this.currentItem && this.currentItem.marca_id) {
                    const marcaIdStr = String(this.currentItem.marca_id);
                    console.log('[MotocicletaAjusteController] Tentando selecionar marca_id:', marcaIdStr, 'Options:', Array.from(this.marcaSelect.options).map(o => o.value));
                    this.marcaSelect.value = marcaIdStr;
                }
                console.log('[MotocicletaAjusteController] Marcas carregadas:', result.data.length);
                this.tryShowForm();
            }
        } catch (error) {
            console.error('[MotocicletaAjusteController] Erro ao carregar marcas:', error);
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
        console.log('[MotocicletaAjusteController] populateMarcaSelect - currentItem:', this.currentItem, 'marca_id:', this.currentItem ? this.currentItem.marca_id : undefined);
        if (this.marcaSelect) {
            this.marcaSelect.innerHTML = '<option value="">Selecione uma marca</option>';
            // Filtrar marcas únicas pelo nome, mantendo o menor id
            const marcasUnicasMap = {};
            marcas.forEach(marca => {
                if (!marcasUnicasMap[marca.nome] || marca.id < marcasUnicasMap[marca.nome].id) {
                    marcasUnicasMap[marca.nome] = marca;
                }
            });
            const marcasUnicas = Object.values(marcasUnicasMap);
            marcasUnicas.forEach(marca => {
                const option = document.createElement('option');
                option.value = marca.id;
                option.textContent = marca.nome;
                this.marcaSelect.appendChild(option);
            });
            // Selecionar marca automaticamente se já houver currentItem
            if (this.currentItem && this.currentItem.marca_id) {
                const marcaIdStr = String(this.currentItem.marca_id);
                console.log('[MotocicletaAjusteController] Tentando selecionar marca_id:', marcaIdStr, 'Options:', Array.from(this.marcaSelect.options).map(o => o.value));
                this.marcaSelect.value = marcaIdStr;
            }
        }
    }

    handleCancel() {
        if (this.hasChanges(this.getFormData())) {
            if (confirm('Existem alterações não salvas. Deseja realmente cancelar?')) {
                window.location.href = 'motos-consulta.html';
            }
        } else {
            window.location.href = 'motos-consulta.html';
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

    tryShowForm() {
        console.log('[MotocicletaAjusteController] Flags:', {
            clientes: this._clientesLoaded,
            marcas: this._marcasLoaded,
            moto: this._motoLoaded
        });
        if (this._clientesLoaded && this._marcasLoaded && this._motoLoaded) {
            this.populateForm(this.currentItem);
            const section = document.getElementById('adjustment-form-section');
            if (section) section.style.display = 'block';
            console.log('[MotocicletaAjusteController] Formulário exibido!');
        }
    }
}

// Inicializar controller quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    if (typeof BasePageController !== 'undefined') {
        window.motocicletaAjusteController = new MotocicletaAjusteController();
    } else {
        console.error('❌ BasePageController não encontrado');
    }
});
