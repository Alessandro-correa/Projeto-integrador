class UsuarioAjusteController {
    constructor() {
        this.form = document.getElementById('ajusteUsuarioForm');
        this.cancelBtn = document.getElementById('cancelBtn');
        this.apiUrl = 'http://localhost:3000/api/usuarios';
        this.isSubmitting = false;
        this.cpf = this.getCpfFromUrl();
        this.init();
    }

    getCpfFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get('id'); // mantém 'id' na URL para consistência, mas é o CPF
    }

    init() {
        if (this.form && this.cpf) {
            this.loadUsuario();
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
            
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
        }
        if (this.cancelBtn) {
            this.cancelBtn.addEventListener('click', () => {
                window.location.href = 'usuarios-consulta.html';
            });
        }
    }

    async loadUsuario() {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${this.apiUrl}/${this.cpf}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Erro ao buscar usuário');
            const json = await res.json();
            const u = json.data;
            this.form.nome.value = u.nome;
            this.form.cpf.value = u.cpf;
            this.form.email.value = u.email;
            this.form.telefone.value = u.telefone || '';
            this.form.funcao.value = u.funcao;
            this.form.status.value = u.status;
        } catch (e) {
            alert('Erro ao carregar usuário: ' + e.message);
            window.location.href = 'usuarios-consulta.html';
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        if (this.isSubmitting) return;
        this.isSubmitting = true;

        const nome = this.form.nome.value.trim();
        const email = this.form.email.value.trim();
        const telefone = this.form.telefone.value.trim();
        const funcao = this.form.funcao.value;
        const status = this.form.status.value;
        const senha = this.form.senha.value;

        if (!nome || !email || !funcao || !status) {
            alert('Preencha todos os campos obrigatórios!');
            this.isSubmitting = false;
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const userData = {
                nome,
                email,
                telefone,
                funcao,
                status
            };

            // Adiciona senha apenas se foi preenchida
            if (senha) {
                userData.senha = senha;
            }

            const res = await fetch(`${this.apiUrl}/${this.cpf}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(userData)
            });

            const json = await res.json();
            if (res.ok && json.success) {
                alert('Usuário atualizado com sucesso!');
                window.location.href = 'usuarios-consulta.html';
            } else {
                alert(json.message || 'Erro ao atualizar usuário');
            }
        } catch (e) {
            alert('Erro ao atualizar usuário: ' + e.message);
        } finally {
            this.isSubmitting = false;
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.usuarioAjusteController = new UsuarioAjusteController();
});
