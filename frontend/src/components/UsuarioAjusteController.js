class UsuarioAjusteController extends BaseAjusteController {
    constructor() {
        super('Usuário', 'http://localhost:3000/api/usuarios');
        this.searchField = 'email';
    }

    applyMasks() {
        
        const cpfInput = document.getElementById('adjust-cpf');
        if (cpfInput) {
            BasePageController.applyMask(cpfInput, 'cpf');
        }

        const telefoneInput = document.getElementById('adjust-telefone');
        if (telefoneInput) {
            BasePageController.applyMask(telefoneInput, 'phone');
        }
    }

    formatSearchValue(value) {
        return value; 
    }

    async buscarItem() {
        const emailInput = document.getElementById('search-email');
        const email = emailInput.value.trim();

        if (!email || !email.includes('@')) {
            BasePageController.showNotification('Digite um e-mail válido', 'error');
            return;
        }

        try {
            const searchBtn = document.getElementById('btn-search');
            BasePageController.showLoading(searchBtn, true, '<i class="bx bx-search"></i> Buscar');
            
            const response = await fetch(`${this.baseURL}`);
            if (!response.ok) throw new Error('Erro ao buscar usuários');
            
            const usuarios = await response.json();
            const usuario = usuarios.find(u => u.email.toLowerCase() === email.toLowerCase());

            if (!usuario) {
                BasePageController.showNotification('Usuário não encontrado', 'error');
                return;
            }

            this.currentItem = usuario;
            this.originalData = { ...usuario };
            this.preencherFormulario(usuario);
            this.mostrarSecaoEdicao();
            BasePageController.showNotification('Usuário encontrado com sucesso!', 'success');

        } catch (error) {
            console.error('Erro ao buscar usuário:', error);
            BasePageController.showNotification('Erro ao buscar usuário', 'error');
        } finally {
            const searchBtn = document.getElementById('btn-search');
            BasePageController.showLoading(searchBtn, false, '<i class="bx bx-search"></i> Buscar');
        }
    }

    preencherFormulario(usuario) {
        
        const currentDataDiv = document.getElementById('current-user-data');
        currentDataDiv.innerHTML = `
            <div class="current-info-grid">
                <div class="info-row">
                    <span class="label">Nome:</span>
                    <span class="value">${usuario.nome}</span>
                </div>
                <div class="info-row">
                    <span class="label">E-mail:</span>
                    <span class="value">${usuario.email}</span>
                </div>
                <div class="info-row">
                    <span class="label">CPF:</span>
                    <span class="value">${BasePageController.formatCPF(usuario.cpf)}</span>
                </div>
                <div class="info-row">
                    <span class="label">Telefone:</span>
                    <span class="value">${usuario.telefone || 'Não informado'}</span>
                </div>
                <div class="info-row">
                    <span class="label">Tipo:</span>
                    <span class="badge badge-${usuario.tipo === 'admin' ? 'primary' : 'secondary'}">${usuario.tipo}</span>
                </div>
                <div class="info-row">
                    <span class="label">Status:</span>
                    <span class="badge badge-${usuario.status === 'Ativo' ? 'success' : 'error'}">${usuario.status || 'Ativo'}</span>
                </div>
            </div>
        `;

        document.getElementById('adjust-nome').value = usuario.nome || '';
        document.getElementById('adjust-email').value = usuario.email || '';
        document.getElementById('adjust-cpf').value = BasePageController.formatCPF(usuario.cpf) || '';
        document.getElementById('adjust-telefone').value = usuario.telefone || '';
        document.getElementById('adjust-tipo').value = usuario.tipo || 'funcionario';
        document.getElementById('adjust-status').value = usuario.status || 'Ativo';
    }

    extrairDadosFormulario(formData) {
        const dados = {
            nome: formData.get('nome'),
            email: formData.get('email'),
            cpf: formData.get('cpf'),
            telefone: formData.get('telefone'),
            tipo: formData.get('tipo'),
            status: formData.get('status')
        };

        const senha = formData.get('senha');
        if (senha && senha.trim()) {
            dados.senha = senha;
        }

        return dados;
    }

    verificarMudancas(dadosNovos) {
        const camposParaComparar = ['nome', 'email', 'cpf', 'telefone', 'tipo', 'status'];
        
        for (const campo of camposParaComparar) {
            const valorOriginal = this.originalData[campo] || '';
            const valorNovo = dadosNovos[campo] || '';
            
            if (valorOriginal !== valorNovo) {
                return true;
            }
        }

        if (dadosNovos.senha) {
            return true;
        }

        return false;
    }

    getItemDisplayName() {
        return this.currentItem.nome;
    }
}
