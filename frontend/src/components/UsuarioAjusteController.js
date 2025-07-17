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
            console.log('🔍 Carregando usuário com CPF:', this.cpf);
            
            const token = localStorage.getItem('token');
            console.log('🔑 Token encontrado:', token ? 'Sim' : 'Não');
            if (token) {
                console.log('🔑 Token (primeiros 50 chars):', token.substring(0, 50) + '...');
            }
            
            const res = await fetch(`${this.apiUrl}/${this.cpf}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            console.log('📡 Resposta da API:', res.status, res.statusText);
            console.log('📡 Headers da resposta:', Object.fromEntries(res.headers.entries()));
            
            if (!res.ok) {
                if (res.status === 404) {
                    throw new Error('Usuário não encontrado. Verifique se o CPF está correto.');
                } else if (res.status === 401) {
                    throw new Error('Token de autenticação inválido ou expirado.');
                }
                throw new Error(`Erro HTTP: ${res.status}`);
            }
            
            const json = await res.json();
            console.log('📦 Dados recebidos:', json);
            
            if (json.success && json.data) {
                const u = json.data;
                this.form.nome.value = u.nome;
                this.form.cpf.value = u.cpf;
                this.form.email.value = u.email;
                this.form.telefone.value = u.telefone || '';
                this.form.funcao.value = u.funcao;
                this.form.codigo.value = u.codigo || '';
                
                console.log('✅ Usuário carregado com sucesso');
            } else {
                throw new Error(json.message || 'Erro ao carregar dados do usuário');
            }
        } catch (e) {
            console.error('❌ Erro ao carregar usuário:', e);
            alert('Erro ao carregar usuário: ' + e.message);
            setTimeout(() => {
                window.location.href = 'usuarios-consulta.html';
            }, 2000);
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
        const codigo = this.form.codigo.value.trim();
        const senha = this.form.senha.value;

        if (!nome || !email || !funcao || !codigo) {
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
                codigo
            };

            // Adiciona senha apenas se foi preenchida
            if (senha && senha.trim() !== '') {
                userData.senha = senha;
            }

            console.log('📤 Enviando dados para atualização:', userData);

            const res = await fetch(`${this.apiUrl}/${this.cpf}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(userData)
            });

            const json = await res.json();
            console.log('📡 Resposta da atualização:', json);
            
            if (res.ok && json.success) {
                alert('Usuário atualizado com sucesso!');
                setTimeout(() => {
                    window.location.href = 'usuarios-consulta.html';
                }, 1000);
            } else {
                throw new Error(json.message || 'Erro ao atualizar usuário');
            }
        } catch (e) {
            console.error('❌ Erro ao atualizar usuário:', e);
            alert('Erro ao atualizar usuário: ' + e.message);
        } finally {
            this.isSubmitting = false;
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.usuarioAjusteController = new UsuarioAjusteController();
});
