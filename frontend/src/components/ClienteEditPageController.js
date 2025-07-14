class ClienteEditPageController extends BaseAjusteController {
    constructor() {
        super('Cliente', 'http://localhost:3000/api/clientes');
        this.searchField = 'cpf';
    }

    applyMasks() {
        
        const cpfInput = document.getElementById('search-cpf');
        BasePageController.applyMask(cpfInput, 'cpf');

        const telefoneInput = document.getElementById('adjust-telefone');
        BasePageController.applyMask(telefoneInput, 'phone');
    }

    formatSearchValue(value) {
        return BasePageController.formatCPF(value);
    }

    async buscarItem() {
        const cpfInput = document.getElementById('search-cpf');
        const cpf = cpfInput.value.replace(/\D/g, '');

        if (cpf.length !== 11) {
            BasePageController.showNotification('CPF deve ter 11 dígitos', 'error');
            return;
        }

        try {
            const searchBtn = document.getElementById('btn-search');
            BasePageController.showLoading(searchBtn, true, '<i class="bx bx-search"></i> Buscar');
            
            const response = await fetch(`${this.baseURL}`);
            if (!response.ok) throw new Error('Erro ao buscar clientes');
            
            const clientes = await response.json();
            const cliente = clientes.find(c => c.cpf.replace(/\D/g, '') === cpf);

            if (!cliente) {
                BasePageController.showNotification('Cliente não encontrado', 'error');
                return;
            }

            this.currentItem = cliente;
            this.originalData = { ...cliente };
            this.preencherFormulario(cliente);
            this.mostrarSecaoEdicao();
            BasePageController.showNotification('Cliente encontrado com sucesso!', 'success');

        } catch (error) {
            console.error('Erro ao buscar cliente:', error);
            BasePageController.showNotification('Erro ao buscar cliente', 'error');
        } finally {
            const searchBtn = document.getElementById('btn-search');
            BasePageController.showLoading(searchBtn, false, '<i class="bx bx-search"></i> Buscar');
        }
    }

    preencherFormulario(cliente) {
        
        const currentDataDiv = document.getElementById('current-client-data');
        currentDataDiv.innerHTML = `
            <div class="current-info-grid">
                <div class="info-row">
                    <span class="label">Nome:</span>
                    <span class="value">${cliente.nome}</span>
                </div>
                <div class="info-row">
                    <span class="label">CPF:</span>
                    <span class="value">${BasePageController.formatCPF(cliente.cpf)}</span>
                </div>
                <div class="info-row">
                    <span class="label">E-mail:</span>
                    <span class="value">${cliente.email}</span>
                </div>
                <div class="info-row">
                    <span class="label">Telefone:</span>
                    <span class="value">${cliente.telefone}</span>
                </div>
                <div class="info-row">
                    <span class="label">Status:</span>
                    <span class="badge badge-${cliente.status === 'Ativo' ? 'success' : 'error'}">${cliente.status || 'Ativo'}</span>
                </div>
            </div>
        `;

        document.getElementById('adjust-nome').value = cliente.nome || '';
        document.getElementById('adjust-email').value = cliente.email || '';
        document.getElementById('adjust-cpf').value = BasePageController.formatCPF(cliente.cpf) || '';
        document.getElementById('adjust-telefone').value = cliente.telefone || '';
        document.getElementById('adjust-sexo').value = cliente.sexo || '';
        document.getElementById('adjust-profissao').value = cliente.profissao || '';
        document.getElementById('adjust-endereco').value = cliente.endereco || '';
        document.getElementById('adjust-status').value = cliente.status || 'Ativo';

        if (cliente.data_de_nascimento) {
            const date = new Date(cliente.data_de_nascimento);
            const formattedDate = date.toISOString().split('T')[0];
            document.getElementById('adjust-data-nascimento').value = formattedDate;
        }
    }

    extrairDadosFormulario(formData) {
        return {
            nome: formData.get('nome'),
            email: formData.get('email'),
            telefone: formData.get('telefone'),
            sexo: formData.get('sexo'),
            profissao: formData.get('profissao'),
            endereco: formData.get('endereco'),
            dataDeNascimento: formData.get('dataDeNascimento'),
            status: formData.get('status')
        };
    }

    verificarMudancas(dadosNovos) {
        const camposParaComparar = ['nome', 'email', 'telefone', 'sexo', 'profissao', 'endereco', 'status'];
        
        for (const campo of camposParaComparar) {
            const valorOriginal = this.originalData[campo] || '';
            const valorNovo = dadosNovos[campo] || '';
            
            if (valorOriginal !== valorNovo) {
                return true;
            }
        }

        const dataOriginal = this.originalData.data_de_nascimento ? 
            new Date(this.originalData.data_de_nascimento).toISOString().split('T')[0] : '';
        const dataNova = dadosNovos.dataDeNascimento || '';
        
        return dataOriginal !== dataNova;
    }

    getItemDisplayName() {
        return this.currentItem.nome;
    }
}
