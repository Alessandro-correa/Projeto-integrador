class FormController {
    constructor() {
        this.osForm = document.querySelector('.os-form');
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
        this.osForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });
    }

    handleFormSubmit() {
        alert('Formulário salvo com sucesso! (simulação)');

        const path = window.location.pathname;
        const pageName = path.substring(path.lastIndexOf('/') + 1);
        
        if (pageName.startsWith('os-')) {
            window.location.href = 'os-consulta.html';
            return;
        }
        
        const entity = pageName.split('-')[0];
        if (entity && pageName.includes('-cadastro')) {
            window.location.href = `${entity}-consulta.html`;
        } else if (pageName.includes('orcamentos-cadastro')) { 
            window.location.href = 'orcamentos-consulta.html';
        }
    }
}

export default FormController; 