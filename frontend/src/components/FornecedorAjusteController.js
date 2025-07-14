class FornecedorAjusteController extends BaseAjusteController {
    constructor() {
        super('Fornecedor', 'http://localhost:3000/api/fornecedores');
        this.searchField = 'cnpj';
    }

    applyMasks() {
        
        const cnpjInput = document.getElementById('search-cnpj');
        Controller.applyMask(cnpjInput, 'cnpj');

        const telefoneInput = document.getElementById('adjust-telefone');
        Controller.applyMask(telefoneInput, 'phone');

        const cnpjFormInput = document.getElementById('adjust-cnpj');
        Controller.applyMask(cnpjFormInput, 'cnpj');
    }

    formatSearchValue(value) {
        return Controller.formatCNPJ(value);
    }

    async buscarItem() {
        const cnpjInput = document.getElementById('search-cnpj');
        const cnpj = cnpjInput.value.replace(/\D/g, '');

        if (cnpj.length !== 14) {
            Controller.showNotification('CNPJ deve ter 14 dígitos', 'error');
            return;
        }

        try {
            const searchBtn = document.getElementById('btn-search');
            Controller.showLoading(searchBtn, true, '<i class="bx bx-search"></i> Buscar');
            
            const response = await fetch(`${this.baseURL}`);
            if (!response.ok) throw new Error('Erro ao buscar fornecedores');
            
            const fornecedores = await response.json();
            const fornecedor = fornecedores.find(f => f.cnpj.replace(/\D/g, '') === cnpj);

            if (!fornecedor) {
                Controller.showNotification('Fornecedor não encontrado', 'error');
                return;
            }

            this.currentItem = fornecedor;
            this.originalData = { ...fornecedor };
            this.preencherFormulario(fornecedor);
            this.mostrarSecaoEdicao();
            Controller.showNotification('Fornecedor encontrado com sucesso!', 'success');

        } catch (error) {
            console.error('Erro ao buscar fornecedor:', error);
            Controller.showNotification('Erro ao buscar fornecedor', 'error');
        } finally {
            const searchBtn = document.getElementById('btn-search');
            Controller.showLoading(searchBtn, false, '<i class="bx bx-search"></i> Buscar');
        }
    }

    preencherFormulario(fornecedor) {
        
        const currentDataDiv = document.getElementById('current-fornecedor-data');
        currentDataDiv.innerHTML = `
            <div class="current-info-grid">
                <div class="info-row">
                    <span class="label">Razão Social:</span>
                    <span class="value">${fornecedor.razaoSocial}</span>
                </div>
                <div class="info-row">
                    <span class="label">Nome Fantasia:</span>
                    <span class="value">${fornecedor.nomeFantasia || 'Não informado'}</span>
                </div>
                <div class="info-row">
                    <span class="label">CNPJ:</span>
                    <span class="value">${Controller.formatCNPJ(fornecedor.cnpj)}</span>
                </div>
                <div class="info-row">
                    <span class="label">E-mail:</span>
                    <span class="value">${fornecedor.email}</span>
                </div>
                <div class="info-row">
                    <span class="label">Telefone:</span>
                    <span class="value">${fornecedor.telefone}</span>
                </div>
                <div class="info-row">
                    <span class="label">Status:</span>
                    <span class="badge badge-${fornecedor.status === 'Ativo' ? 'success' : 'error'}">${fornecedor.status || 'Ativo'}</span>
                </div>
            </div>
        `;

        document.getElementById('adjust-razao-social').value = fornecedor.razaoSocial || '';
        document.getElementById('adjust-nome-fantasia').value = fornecedor.nomeFantasia || '';
        document.getElementById('adjust-cnpj').value = Controller.formatCNPJ(fornecedor.cnpj) || '';
        document.getElementById('adjust-email').value = fornecedor.email || '';
        document.getElementById('adjust-telefone').value = fornecedor.telefone || '';
        document.getElementById('adjust-endereco').value = fornecedor.endereco || '';
        document.getElementById('adjust-status').value = fornecedor.status || 'Ativo';
    }

    extrairDadosFormulario(formData) {
        return {
            razaoSocial: formData.get('razaoSocial'),
            nomeFantasia: formData.get('nomeFantasia'),
            cnpj: formData.get('cnpj'),
            email: formData.get('email'),
            telefone: formData.get('telefone'),
            endereco: formData.get('endereco'),
            status: formData.get('status')
        };
    }

    verificarMudancas(dadosNovos) {
        const camposParaComparar = ['razaoSocial', 'nomeFantasia', 'cnpj', 'email', 'telefone', 'endereco', 'status'];
        
        for (const campo of camposParaComparar) {
            const valorOriginal = this.originalData[campo] || '';
            const valorNovo = dadosNovos[campo] || '';
            
            if (valorOriginal !== valorNovo) {
                return true;
            }
        }

        return false;
    }

    getItemDisplayName() {
        return this.currentItem.razaoSocial || this.currentItem.nomeFantasia;
    }
}
