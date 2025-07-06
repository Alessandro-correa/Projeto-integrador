class FormController {
    constructor() {
        this.osForm = document.querySelector('.os-form');
        this.baseURL = 'http://localhost:3000/api';
        this.init();
    }

    init() {
        if (this.osForm) {
            this.setDefaultValues();
            this.setupFormSubmission();
        }
    }

    setDefaultValues() {
        // Definir data atual por padrão em formulários de cadastro
        const dataInput = document.getElementById('data');
        if (dataInput && !dataInput.value && (window.location.pathname.includes('-cadastro.html') || window.location.pathname.includes('os-efetivar'))) {
            const hoje = new Date().toISOString().split('T')[0];
            dataInput.value = hoje;
        }

        // Gerar código 
        const codigoInput = document.getElementById('codigo');
        if (codigoInput && !codigoInput.value && window.location.pathname.includes('-cadastro.html')) {
            const timestamp = Date.now();
            const prefix = window.location.pathname.split('-')[0].replace('/', '').toUpperCase();
            const codigo = `${prefix}-${String(timestamp).slice(-4)}`;
            codigoInput.value = codigo;
        }
    }

    setupFormSubmission() {
        this.osForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleFormSubmit();
        });
    }

    async handleFormSubmit() {
        try {
            const path = window.location.pathname;
            const pageName = path.substring(path.lastIndexOf('/') + 1);
            
            // Identificar qual entidade está sendo cadastrada
            const entity = this.identifyEntity(pageName);
            
            if (!entity) {
                this.showError('Não foi possível identificar o tipo de formulário');
                return;
            }

            // Capturar dados do formulário
            const formData = this.captureFormData();
            
            // Enviar dados para o backend
            const response = await this.sendToBackend(entity, formData);
            
            if (response.success) {
                this.showSuccess(response.message || 'Dados salvos com sucesso!');
                this.redirectToConsulta(entity);
            } else {
                this.showError(response.message || 'Erro ao salvar dados');
            }
            
        } catch (error) {
            console.error('Erro ao processar formulário:', error);
            this.showError('Erro ao processar formulário: ' + error.message);
        }
    }

    identifyEntity(pageName) {
        if (pageName.includes('usuarios-cadastro')) return 'usuarios';
        if (pageName.includes('clientes-cadastro')) return 'clientes';
        if (pageName.includes('fornecedores-cadastro')) return 'fornecedores';
        if (pageName.includes('marcas-cadastro')) return 'marcas';
        if (pageName.includes('motos-cadastro')) return 'motocicletas';
        if (pageName.includes('pecas-cadastro')) return 'pecas';
        if (pageName.includes('orcamentos-cadastro')) return 'orcamentos';
        if (pageName.includes('os-cadastro')) return 'ordens';
        if (pageName.includes('aquisicoes-cadastro')) return 'aquisicoes';
        
        return null;
    }

    captureFormData() {
        const formData = {};
        const inputs = this.osForm.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            if (input.name || input.id) {
                const key = input.name || input.id;
                formData[key] = input.value;
            }
        });
        
        return formData;
    }

    async sendToBackend(entity, data) {
        const url = `${this.baseURL}/${entity}`;
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || `Erro ${response.status}`);
            }
            
            return result;
        } catch (error) {
            throw error;
        }
    }

    redirectToConsulta(entity) {
        const path = window.location.pathname;
        const basePath = path.substring(0, path.lastIndexOf('/'));
        
        if (entity === 'ordens') {
            window.location.href = `${basePath}/os-consulta.html`;
        } else if (entity === 'motocicletas') {
            window.location.href = `${basePath}/motos-consulta.html`;
        } else {
            window.location.href = `${basePath}/${entity}-consulta.html`;
        }
    }

    showSuccess(message) {
        alert(message);
    }

    showError(message) {
        alert('Erro: ' + message);
    }
}

export default FormController; 