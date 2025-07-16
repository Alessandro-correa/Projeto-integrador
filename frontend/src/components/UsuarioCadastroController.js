class UsuarioCadastroController extends BasePageController {
    constructor() {
        super();
        this.baseURL = 'http://localhost:3000/api/usuarios';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.applyMasks();
        // this.generateUserCode(); // Código agora só no backend
    }

    setupEventListeners() {
        const form = document.getElementById('register-form');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        const clearBtn = document.getElementById('btn-clear');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearForm());
        }

        const generateCodeBtn = document.getElementById('btn-generate-code');
        if (generateCodeBtn) {
            generateCodeBtn.addEventListener('click', () => this.generateUserCode());
        }

        // Validação de senha em tempo real
        const senhaInput = document.getElementById('register-senha');
        const confirmSenhaInput = document.getElementById('register-confirm-senha');
        
        if (confirmSenhaInput) {
            confirmSenhaInput.addEventListener('input', () => this.validatePasswordMatch());
        }
        
        if (senhaInput) {
            senhaInput.addEventListener('input', () => this.validatePasswordMatch());
        }
    }

    applyMasks() {
        const cpfInput = document.getElementById('register-cpf');
        if (cpfInput) {
            BasePageController.applyMask(cpfInput, 'cpf');
        }

        const telefoneInput = document.getElementById('register-telefone');
        if (telefoneInput) {
            BasePageController.applyMask(telefoneInput, 'phone');
        }
    }

    generateUserCode() {
        // Gerar código único para o usuário (timestamp + random)
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const codigo = `USR${timestamp}${random}`;
        
        const codigoInput = document.getElementById('register-codigo');
        if (codigoInput) {
            codigoInput.value = codigo;
        }
    }

    validatePasswordMatch() {
        const senha = document.getElementById('register-senha').value;
        const confirmSenha = document.getElementById('register-confirm-senha').value;
        const confirmInput = document.getElementById('register-confirm-senha');
        
        if (confirmSenha && senha !== confirmSenha) {
            confirmInput.setCustomValidity('As senhas não coincidem');
            confirmInput.style.borderColor = '#e74c3c';
        } else {
            confirmInput.setCustomValidity('');
            confirmInput.style.borderColor = '';
        }
    }

    showLoading(button, isLoading, text) {
        if (!button) return;
        if (isLoading) {
            button.disabled = true;
            button.dataset.originalText = button.innerHTML;
            button.innerHTML = text || 'Salvando...';
        } else {
            button.disabled = false;
            if (button.dataset.originalText) {
                button.innerHTML = button.dataset.originalText;
                delete button.dataset.originalText;
            }
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        try {
            const formData = this.getFormData();
            
            if (!this.validateForm(formData)) {
                return;
            }

            const submitBtn = e.target.querySelector('button[type="submit"]');
            this.showLoading(submitBtn, true, 'Salvando...');

            console.log('📤 Enviando dados do usuário:', formData);

            const token = localStorage.getItem('token');
            const response = await fetch(this.baseURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                BasePageController.showNotification('Usuário cadastrado com sucesso!', 'success');
                setTimeout(() => {
                    window.location.href = 'usuarios-consulta.html';
                }, 2000);
            } else {
                throw new Error(result.message || 'Erro ao cadastrar usuário');
            }

        } catch (error) {
            console.error('❌ Erro ao cadastrar usuário:', error);
            BasePageController.showNotification(error.message || 'Erro ao cadastrar usuário', 'error');
        } finally {
            const submitBtn = document.querySelector('button[type="submit"]');
            if (submitBtn) {
                this.showLoading(submitBtn, false, 'Salvar Usuário');
            }
        }
    }

    getFormData() {
        return {
            nome: document.getElementById('register-nome')?.value.trim() || '',
            email: document.getElementById('register-email')?.value.trim() || '',
            cpf: document.getElementById('register-cpf')?.value.trim() || '',
            telefone: document.getElementById('register-telefone')?.value.trim() || '',
            funcao: document.getElementById('register-funcao')?.value || '',
            senha: document.getElementById('register-senha')?.value || '',
            // código não é enviado, backend gera
            observacoes: document.getElementById('register-observacoes')?.value.trim() || ''
        };
    }

    validateForm(data) {
        const requiredFields = ['nome', 'email', 'cpf', 'telefone', 'funcao', 'senha'];
        
        for (const field of requiredFields) {
            if (!data[field]) {
                BasePageController.showNotification(`O campo ${this.getFieldLabel(field)} é obrigatório`, 'error');
                return false;
            }
        }

        // Validar CPF
        if (!this.validateCPF(data.cpf)) {
            BasePageController.showNotification('CPF inválido', 'error');
            return false;
        }

        // Validar email
        if (!this.validateEmail(data.email)) {
            BasePageController.showNotification('E-mail inválido', 'error');
            return false;
        }

        // Validar senha
        if (data.senha.length < 6) {
            BasePageController.showNotification('A senha deve ter pelo menos 6 caracteres', 'error');
            return false;
        }

        // Validar confirmação de senha
        const confirmSenha = document.getElementById('register-confirm-senha')?.value || '';
        if (data.senha !== confirmSenha) {
            BasePageController.showNotification('As senhas não coincidem', 'error');
            return false;
        }

        return true;
    }

    getFieldLabel(field) {
        const labels = {
            nome: 'Nome',
            email: 'E-mail',
            cpf: 'CPF',
            telefone: 'Telefone',
            funcao: 'Função',
            senha: 'Senha',
            codigo: 'Código'
        };
        return labels[field] || field;
    }

    validateCPF(cpf) {
        const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
        return cpfRegex.test(cpf);
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    clearForm() {
        const form = document.getElementById('register-form');
        if (form) {
            form.reset();
            // this.generateUserCode(); // Código agora só no backend
            
            // Limpar validações customizadas
            const confirmInput = document.getElementById('register-confirm-senha');
            if (confirmInput) {
                confirmInput.setCustomValidity('');
                confirmInput.style.borderColor = '';
            }
            
            BasePageController.showNotification('Formulário limpo', 'info');
        }
    }
}

// Inicializar o controller quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    new UsuarioCadastroController();
});
