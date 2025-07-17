class UsuarioCadastroController {
    constructor() {
        this.form = document.getElementById('cadastroUsuarioForm');
        this.cancelBtn = document.getElementById('cancelBtn');
        this.apiUrl = 'http://localhost:3000/api/usuarios';
        this.isSubmitting = false;
        this.init();
    }

    init() {
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
            this.setupValidations();
        }
        if (this.cancelBtn) {
            this.cancelBtn.addEventListener('click', () => {
                window.location.href = 'usuarios-consulta.html';
            });
        }
    }

    setupValidations() {
        // Máscara e validação de CPF
        const cpfInput = this.form.cpf;
        if (cpfInput) {
            cpfInput.addEventListener('input', (e) => {
                let v = e.target.value.replace(/\D/g, '');
                v = v.replace(/(\d{3})(\d)/, '$1.$2');
                v = v.replace(/(\d{3})(\d)/, '$1.$2');
                v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
                e.target.value = v;
            });

            cpfInput.addEventListener('blur', async () => {
                const cpf = cpfInput.value.replace(/\D/g, '');
                if (cpf.length === 11) {
                    if (!this.validarCPF(cpf)) {
                        alert('CPF inválido!');
                        cpfInput.value = '';
                        cpfInput.focus();
                    }
                }
            });
        }

        // Máscara para telefone
        const telInput = this.form.telefone;
        if (telInput) {
            telInput.addEventListener('input', (e) => {
                let v = e.target.value.replace(/\D/g, '').slice(0, 11);
                if (v.length <= 10) {
                    v = v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
                } else {
                    v = v.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
                }
                e.target.value = v.trim();
            });
        }

        // Validação de senha
        const senhaInput = this.form.senha;
        const confirmarSenhaInput = this.form.confirmarSenha;
        if (senhaInput && confirmarSenhaInput) {
            confirmarSenhaInput.addEventListener('input', () => {
                if (senhaInput.value !== confirmarSenhaInput.value) {
                    confirmarSenhaInput.setCustomValidity('As senhas não coincidem');
                } else {
                    confirmarSenhaInput.setCustomValidity('');
                }
            });
        }
    }

    validarCPF(cpf) {
        cpf = cpf.replace(/\D/g, '');
        
        if (cpf.length !== 11) return false;
        
        // Verifica se todos os dígitos são iguais
        if (/^(\d)\1+$/.test(cpf)) return false;
        
        // Validação do primeiro dígito verificador
        let soma = 0;
        for (let i = 0; i < 9; i++) {
            soma += parseInt(cpf.charAt(i)) * (10 - i);
        }
        let resto = 11 - (soma % 11);
        let dv1 = resto > 9 ? 0 : resto;
        
        if (dv1 !== parseInt(cpf.charAt(9))) return false;
        
        // Validação do segundo dígito verificador
        soma = 0;
        for (let i = 0; i < 10; i++) {
            soma += parseInt(cpf.charAt(i)) * (11 - i);
        }
        resto = 11 - (soma % 11);
        let dv2 = resto > 9 ? 0 : resto;
        
        if (dv2 !== parseInt(cpf.charAt(10))) return false;
        
        return true;
    }

    async handleSubmit(e) {
        e.preventDefault();
        if (this.isSubmitting) return;
        
        const submitButton = this.form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        this.isSubmitting = true;

        try {
            const formData = this.getFormData();
            
            if (!this.validateForm(formData)) {
                this.isSubmitting = false;
                submitButton.disabled = false;
                return;
            }

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

            if (response.ok && result.success) {
                alert('Usuário cadastrado com sucesso!');
                setTimeout(() => {
                    window.location.href = 'usuarios-consulta.html';
                }, 100);
                return;
            } 
            
            // Se chegou aqui, houve erro no servidor
            console.error('Erro do servidor:', result);
            throw new Error(result.message || result.error || 'Erro ao cadastrar usuário');
        } catch (error) {
            console.error('Erro no cadastro:', error);
            
            // Tratar erros específicos
            if (error.message.includes('Failed to fetch')) {
                alert('Erro de conexão. Verifique se o servidor está funcionando.');
            } else {
                alert(error.message || 'Erro ao cadastrar usuário');
            }
            
            submitButton.disabled = false;
        } finally {
            this.isSubmitting = false;
        }
    }

    getFormData() {
        return {
            nome: this.form.nome.value.trim(),
            email: this.form.email.value.trim(),
            cpf: this.form.cpf.value.trim(),
            telefone: this.form.telefone.value.trim(),
            funcao: this.form.funcao.value,
            senha: this.form.senha.value
        };
    }

    validateForm(data) {
        if (!data.nome || !data.email || !data.cpf || !data.telefone || !data.funcao || !data.senha) {
            alert('Preencha todos os campos obrigatórios!');
            return false;
        }

        if (!this.validarCPF(data.cpf)) {
            alert('CPF inválido!');
            return false;
        }

        if (data.senha.length < 6) {
            alert('A senha deve ter no mínimo 6 caracteres!');
            return false;
        }

        if (data.senha !== this.form.confirmarSenha.value) {
            alert('As senhas não coincidem!');
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            alert('Email inválido!');
            return false;
        }

        return true;
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.usuarioCadastroController = new UsuarioCadastroController();
});
