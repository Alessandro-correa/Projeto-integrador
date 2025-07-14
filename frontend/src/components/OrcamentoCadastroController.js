class OrcamentoCadastroController {
    constructor() {
        this.cpfInput = document.getElementById('cpf');
        this.nomeInput = document.getElementById('nome');
        this.enderecoInput = document.getElementById('endereco');
        this.motocicletaSelect = document.getElementById('motocicleta-select');
        this.tipoItemSelect = document.getElementById('tipo-item');
        this.pecaSelectGroup = document.getElementById('peca-select-group');
        this.pecaSelect = document.getElementById('peca-select');
        this.descricaoGroup = document.getElementById('descricao-group');
        this.descricaoItemInput = document.getElementById('descricao-item');
        this.quantidadeInput = document.getElementById('quantidade');
        this.valorUnitarioInput = document.getElementById('valor-unitario');
        this.addItemBtn = document.getElementById('add-item');
        this.itensTable = document.getElementById('itens-orcamento').querySelector('tbody');
        
        this.apiClientes = 'http://localhost:3000/api/clientes';
        this.apiMotocicletas = 'http://localhost:3000/api/motocicletas';
        this.apiPecas = 'http://localhost:3000/api/pecas';
        
        this.itensOrcamento = [];
        this.motocicletasSelecionadas = [];
        
        this.init();
    }

    init() {
        
        this.loadPecas();
        
        if (this.cpfInput) {
            this.cpfInput.addEventListener('blur', () => this.buscarClientePorCPF());
        }
        
        if (this.addItemBtn) {
            this.addItemBtn.addEventListener('click', () => this.adicionarItem());
        }

        if (this.tipoItemSelect) {
            this.tipoItemSelect.addEventListener('change', () => this.toggleTipoItem());
        }

        if (this.pecaSelect) {
            this.pecaSelect.addEventListener('change', () => this.preencherDadosPeca());
        }

        const form = document.querySelector('.os-form');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        this.toggleTipoItem();
    }

    async loadPecas() {
        try {
            
            this.pecaSelect.innerHTML = '<option value="">Carregando peças...</option>';
            
            const res = await fetch(this.apiPecas);
            if (!res.ok) throw new Error('Erro ao buscar peças');
            
            const result = await res.json();
            const pecas = result.data || result;

            this.pecaSelect.innerHTML = '<option value="">Selecione uma peça</option>';
            
            if (pecas.length === 0) {
                this.pecaSelect.innerHTML = '<option value="">Nenhuma peça cadastrada</option>';
                return;
            }
            
            pecas.forEach(peca => {
                const option = document.createElement('option');
                option.value = peca.id;
                option.dataset.nome = peca.nome;
                option.dataset.descricao = peca.descricao;
                option.dataset.valor = peca.valor || 0;

                option.textContent = peca.nome;
                
                this.pecaSelect.appendChild(option);
            });
            
            console.log(`${pecas.length} peças carregadas com sucesso`);
            
        } catch (e) {
            console.error('Erro ao carregar peças:', e);
            this.pecaSelect.innerHTML = '<option value="">Erro ao carregar peças</option>';
        }
    }

    async loadMotocicletasCliente(cpf) {
        try {
            const res = await fetch(`${this.apiMotocicletas}/cliente/${cpf}`);
            if (!res.ok) {
                if (res.status === 404) {
                    this.motocicletaSelect.innerHTML = '<option value="">Nenhuma motocicleta encontrada para este cliente</option>';
                    return;
                }
                throw new Error('Erro ao buscar motocicletas');
            }
            
            const result = await res.json();
            const motocicletas = result.data || [];
            
            this.motocicletaSelect.innerHTML = '<option value="">Selecione uma motocicleta</option>';
            
            if (motocicletas.length === 0) {
                this.motocicletaSelect.innerHTML = '<option value="">Nenhuma motocicleta encontrada para este cliente</option>';
                return;
            }
            
            motocicletas.forEach(moto => {
                const option = document.createElement('option');
                option.value = moto.placa;
                option.dataset.modelo = moto.modelo;
                option.dataset.ano = moto.ano;
                option.dataset.placa = moto.placa;
                option.textContent = `${moto.modelo} ${moto.ano} - ${moto.placa}`;
                this.motocicletaSelect.appendChild(option);
            });
        } catch (e) {
            console.error('Erro ao carregar motocicletas:', e);
            this.motocicletaSelect.innerHTML = '<option value="">Erro ao carregar motocicletas</option>';
        }
    }

    toggleTipoItem() {
        const tipo = this.tipoItemSelect.value;
        
        if (tipo === 'peca') {
            
            this.pecaSelectGroup.style.display = 'block';
            this.descricaoGroup.style.display = 'none';

            this.descricaoItemInput.value = '';
            this.valorUnitarioInput.value = '';
            this.pecaSelect.value = '';
            
        } else { 
            
            this.pecaSelectGroup.style.display = 'none';
            this.descricaoGroup.style.display = 'block';

            this.pecaSelect.value = '';
            this.descricaoItemInput.value = '';
            this.valorUnitarioInput.value = '';

            setTimeout(() => this.descricaoItemInput.focus(), 100);
        }
    }

    preencherDadosPeca() {
        const selectedOption = this.pecaSelect.options[this.pecaSelect.selectedIndex];
        if (selectedOption && selectedOption.value) {
            
            this.descricaoItemInput.value = selectedOption.dataset.nome || '';

            const valor = parseFloat(selectedOption.dataset.valor || 0);
            this.valorUnitarioInput.value = valor.toFixed(2);

            console.log('Peça selecionada:', {
                id: selectedOption.value,
                nome: selectedOption.dataset.nome,
                valor: valor
            });
        } else {
            
            this.descricaoItemInput.value = '';
            this.valorUnitarioInput.value = '';
        }
    }

    adicionarItem() {
        const tipo = this.tipoItemSelect.value;
        const quantidade = parseInt(this.quantidadeInput.value) || 1;
        const valorUnitario = parseFloat(this.valorUnitarioInput.value) || 0;
        
        console.log('=== ADICIONAR ITEM ===');
        console.log('Tipo:', tipo);
        console.log('Quantidade:', quantidade);
        console.log('Valor unitário:', valorUnitario);
        
        let descricao = '';
        let pecaId = null;
        
        if (tipo === 'peca') {
            
            const pecaSelecionada = this.pecaSelect.value;
            console.log('Peça selecionada (value):', pecaSelecionada);
            
            if (!pecaSelecionada) {
                alert('Por favor, selecione uma peça!');
                this.pecaSelect.focus();
                return;
            }

            const selectedOption = this.pecaSelect.options[this.pecaSelect.selectedIndex];
            console.log('Option selecionada:', selectedOption);
            console.log('Dataset da option:', selectedOption.dataset);
            
            descricao = selectedOption.dataset.nome;
            pecaId = pecaSelecionada;
            
            console.log('Descrição da peça:', descricao);
            console.log('ID da peça:', pecaId);
            
        } else {
            
            descricao = this.descricaoItemInput.value.trim();
            console.log('Descrição do serviço:', descricao);
            
            if (!descricao) {
                alert('Por favor, preencha a descrição do serviço!');
                this.descricaoItemInput.focus();
                return;
            }
        }

        if (valorUnitario <= 0) {
            alert('Por favor, informe um valor unitário maior que zero!');
            this.valorUnitarioInput.focus();
            return;
        }

        if (quantidade <= 0) {
            alert('A quantidade deve ser maior que zero!');
            this.quantidadeInput.focus();
            return;
        }
        
        const valorTotal = quantidade * valorUnitario;
        
        const item = {
            id: Date.now(), 
            tipo,
            descricao,
            quantidade,
            valorUnitario,
            valorTotal,
            pecaId: pecaId 
        };
        
        console.log('Item criado:', item);
        
        this.itensOrcamento.push(item);
        console.log('Itens do orçamento após adição:', this.itensOrcamento);
        this.renderItens();

        if (tipo === 'peca') {
            this.pecaSelect.value = '';
        }
        this.descricaoItemInput.value = '';
        this.quantidadeInput.value = 1;
        this.valorUnitarioInput.value = '';

        console.log(`${tipo === 'peca' ? 'Peça' : 'Serviço'} adicionado: ${descricao} - R$ ${valorTotal.toFixed(2)}`);

        if (tipo === 'peca') {
            this.pecaSelect.focus();
        } else {
            this.descricaoItemInput.focus();
        }
    }

    removerItem(id) {
        this.itensOrcamento = this.itensOrcamento.filter(item => item.id !== id);
        this.renderItens();
    }

    renderItens() {
        this.itensTable.innerHTML = '';
        
        if (this.itensOrcamento.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="6" style="text-align: center; color: #666; font-style: italic;">
                    Nenhum item adicionado
                </td>
            `;
            this.itensTable.appendChild(row);
            return;
        }
        
        this.itensOrcamento.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.tipo === 'peca' ? 'Peça' : 'Serviço'}</td>
                <td>${item.descricao}</td>
                <td>${item.quantidade}</td>
                <td>R$ ${item.valorUnitario.toFixed(2)}</td>
                <td>R$ ${item.valorTotal.toFixed(2)}</td>
                <td>
                    <button type="button" onclick="orcamentoCadastroController.removerItem(${item.id})" 
                            class="btn-danger" style="padding: 5px 10px;" title="Remover item">
                        <i class='bx bx-trash'></i>
                    </button>
                </td>
            `;
            this.itensTable.appendChild(row);
        });

        if (this.itensOrcamento.length > 0) {
            const totalRow = document.createElement('tr');
            totalRow.style.fontWeight = 'bold';
            totalRow.style.borderTop = '2px solid #ddd';
            totalRow.innerHTML = `
                <td colspan="4" style="text-align: right;">TOTAL GERAL:</td>
                <td>R$ ${this.calcularValorTotal().toFixed(2)}</td>
                <td></td>
            `;
            this.itensTable.appendChild(totalRow);
        }
    }

    async buscarClientePorCPF() {
        const cpf = this.cpfInput.value.replace(/\D/g, '');
        if (cpf.length !== 11) {
            this.motocicletaSelect.innerHTML = '<option value="">Digite um CPF válido primeiro</option>';
            return;
        }
        
        try {
            const res = await fetch(this.apiClientes);
            if (!res.ok) throw new Error('Erro ao buscar clientes');
            const clientes = await res.json();
            const cliente = (clientes.data || clientes).find(c => c.cpf.replace(/\D/g, '') === cpf);
            
            if (cliente) {
                this.nomeInput.value = cliente.nome || '';
                this.enderecoInput.value = cliente.endereco || '';

                await this.loadMotocicletasCliente(cliente.cpf);
            } else {
                this.motocicletaSelect.innerHTML = '<option value="">Cliente não encontrado</option>';
            }
        } catch (e) {
            console.error('Erro ao buscar cliente:', e);
            this.motocicletaSelect.innerHTML = '<option value="">Erro ao buscar cliente</option>';
        }
    }

    calcularValorTotal() {
        return this.itensOrcamento.reduce((total, item) => total + item.valorTotal, 0);
    }

    limparFormulario() {
        
        document.getElementById('cpf').value = '';
        document.getElementById('nome').value = '';
        document.getElementById('endereco').value = '';
        document.getElementById('validade').value = '';
        document.getElementById('observacoes').value = '';

        this.motocicletaSelect.innerHTML = '<option value="">Primeiro digite o CPF do cliente</option>';

        this.tipoItemSelect.value = 'peca';
        this.pecaSelect.value = '';
        this.descricaoItemInput.value = '';
        this.quantidadeInput.value = '1';
        this.valorUnitarioInput.value = '';

        this.toggleTipoItem();

        this.itensOrcamento = [];
        this.renderItens();
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        try {
            
            if (this.itensOrcamento.length === 0) {
                alert('Erro: Você deve adicionar pelo menos uma peça ou serviço ao orçamento antes de gerar!');
                return;
            }

            const motocicletaSelecionada = this.motocicletaSelect.options[this.motocicletaSelect.selectedIndex];
            
            if (!motocicletaSelecionada || !motocicletaSelecionada.value) {
                alert('Selecione uma motocicleta!');
                this.motocicletaSelect.focus();
                return;
            }

            const formData = {
                cpf: document.getElementById('cpf').value.trim(),
                nome: document.getElementById('nome').value.trim(),
                endereco: document.getElementById('endereco').value.trim(),
                placa: motocicletaSelecionada.dataset.placa,
                modelo: motocicletaSelecionada.dataset.modelo,
                ano: motocicletaSelecionada.dataset.ano,
                validade: document.getElementById('validade').value,
                observacoes: document.getElementById('observacoes').value.trim(),
                itens: this.itensOrcamento
            };

            const requiredFields = [
                { field: 'cpf', name: 'CPF' },
                { field: 'nome', name: 'Nome' },
                { field: 'placa', name: 'Motocicleta' },
                { field: 'validade', name: 'Data de Validade' }
            ];

            for (const { field, name } of requiredFields) {
                if (!formData[field]) {
                    alert(`Campo "${name}" é obrigatório!`);
                    document.getElementById(field)?.focus();
                    return;
                }
            }

            if (formData.cpf.replace(/\D/g, '').length !== 11) {
                alert('CPF deve ter 11 dígitos!');
                document.getElementById('cpf')?.focus();
                return;
            }

            const currentYear = new Date().getFullYear();
            const anoMoto = parseInt(formData.ano);
            if (anoMoto < 1980 || anoMoto > currentYear + 1) {
                alert(`Ano da motocicleta deve estar entre 1980 e ${currentYear + 1}!`);
                document.getElementById('ano')?.focus();
                return;
            }

            const validadeDate = new Date(formData.validade);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (validadeDate <= today) {
                alert('Data de validade deve ser maior que hoje!');
                document.getElementById('validade')?.focus();
                return;
            }

            console.log('Dados do orçamento validados:', formData);

            await this.enviarOrcamento(formData);
            
        } catch (error) {
            console.error('Erro ao gerar orçamento:', error);
            alert('Erro ao gerar orçamento: ' + error.message);
        }
    }

    async enviarOrcamento(formData) {
        try {
            
            await this.garantirCliente(formData);

            await this.criarOrcamentoIndependente(formData);

        } catch (error) {
            console.error('Erro no processo:', error);
            throw error;
        }
    }

    async garantirCliente(formData) {
        try {
            
            const response = await fetch(`http://localhost:3000/api/clientes/${formData.cpf}`);
            
            if (response.status === 404) {
                
                const clienteData = {
                    cpf: formData.cpf,
                    nome: formData.nome,
                    endereco: formData.endereco,
                    sexo: 'Não informado', 
                    telefone: '(00) 00000-0000', 
                    email: 'nao.informado@email.com', 
                    profissao: 'Não informado', 
                    dataDeNascimento: '1990-01-01' 
                };

                const createResponse = await fetch('http://localhost:3000/api/clientes', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(clienteData)
                });

                if (!createResponse.ok) {
                    const error = await createResponse.json();
                    throw new Error(error.message || 'Erro ao criar cliente');
                }
            }
        } catch (error) {
            if (error.message.includes('Erro ao criar cliente')) {
                throw error;
            }
            
        }
    }

    async criarOrcamentoIndependente(formData) {
        const orcamentoData = {
            valor: this.calcularValorTotal(),
            validade: formData.validade,
            clienteCpf: formData.cpf,
            motocicletaPlaca: formData.placa,
            status: 'P',
            itens: this.itensOrcamento 
        };

        const response = await fetch('http://localhost:3000/api/orcamentos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orcamentoData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Erro ao criar orçamento');
        }

        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message || 'Erro ao criar orçamento');
        }

        alert(`Orçamento criado com sucesso!\n\nNúmero: ${result.data.id}\nItens: ${this.itensOrcamento.length}\nValor total: R$ ${this.calcularValorTotal().toFixed(2)}\n\nO orçamento foi salvo e aguarda validação.`);

        this.limparFormulario();

        window.location.href = 'orcamentos-consulta.html';
    }

    async criarOrdemServico(formData) {
        const ordemData = {
            titulo: `OS - ${formData.modelo} ${formData.placa}`,
            descricao: `Ordem de serviço para ${formData.modelo} - Placa: ${formData.placa}`,
            status: 'Em Andamento',
            data: new Date().toISOString().split('T')[0],
            clienteCpf: formData.cpf,
            motocicletaPlaca: formData.placa,
            observacao: formData.observacoes || ''
        };

        const response = await fetch('http://localhost:3000/api/ordens', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(ordemData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Erro ao criar ordem de serviço');
        }

        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message || 'Erro ao criar ordem de serviço');
        }

        return result.data.cod;
    }

    async salvarPecasOrdem(ordemCod) {
        try {
            console.log('Salvando peças para ordem:', ordemCod);
            console.log('Itens do orçamento:', this.itensOrcamento);

            for (const item of this.itensOrcamento) {
                console.log('Processando item:', item);

                if (item.tipo === 'peca' && item.pecaId) {
                    const pecaData = {
                        ordemDeServicoCod: ordemCod,
                        pecaId: item.pecaId, 
                        qtdPecas: item.quantidade
                    };

                    console.log('Enviando dados da peça:', pecaData);

                    const response = await fetch('http://localhost:3000/api/ordens/pecas', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(pecaData)
                    });

                    if (!response.ok) {
                        const error = await response.json();
                        console.error(`Erro ao salvar peça ${item.descricao}:`, error);
                        throw new Error(`Erro ao salvar peça ${item.descricao}: ${error.message}`);
                    }
                } else {
                    console.log('Item ignorado (serviço ou sem pecaId):', item);
                }
            }
        } catch (error) {
            console.error('Erro ao salvar peças da ordem:', error);
            throw error;
        }
    }

    async criarOrcamento(formData, ordemCod) {
        const orcamentoData = {
            valor: this.calcularValorTotal(),
            validade: formData.validade,
            ordemServicoCod: ordemCod,
            clienteCpf: formData.cpf,
            status: 'P'
        };

        const response = await fetch('http://localhost:3000/api/orcamentos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orcamentoData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Erro ao criar orçamento');
        }

        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message || 'Erro ao criar orçamento');
        }

        alert(`Orçamento gerado com sucesso!\n\nNúmero: ${result.data.id}\nItens: ${this.itensOrcamento.length}\nValor total: R$ ${this.calcularValorTotal().toFixed(2)}`);

        this.limparFormulario();

        window.location.href = 'orcamentos-consulta.html';
    }
}

let orcamentoCadastroController;
window.addEventListener('DOMContentLoaded', () => {
    orcamentoCadastroController = new OrcamentoCadastroController();
});
