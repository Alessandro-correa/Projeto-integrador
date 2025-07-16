class OrcamentoCadastroController {
    constructor() {
        this.cpfInput = document.getElementById('cpf');
        this.nomeInput = document.getElementById('nome');
        this.enderecoInput = document.getElementById('endereco');
        this.apiClientes = 'http://localhost:3000/api/clientes';
        this.apiMotocicletas = 'http://localhost:3000/api/motocicletas';
        this.apiPecas = 'http://localhost:3000/api/pecas';
        this.itensOrcamento = [];
        this.motocicletasSelecionadas = [];
        this.clienteSelect = document.getElementById('cliente_id');
        this.motocicletaSelect = document.getElementById('motocicleta_id');
        this.addItemBtn = document.getElementById('addItemBtn');
        this.itensContainer = document.getElementById('itens-container');
        this.isSubmitting = false;
        this.init();
    }

    init() {
        this.loadClientes();
        if (this.cpfInput) {
            this.cpfInput.addEventListener('blur', () => this.buscarClientePorCPF());
        }
        if (this.addItemBtn) {
            this.addItemBtn.addEventListener('click', () => this.abrirModalItem());
        }
        if (this.clienteSelect) {
            this.clienteSelect.addEventListener('change', () => this.loadMotocicletasCliente(this.clienteSelect.value));
        }
        const form = document.getElementById('cadastroForm');
        if (form) {
            // Remover listeners duplicados
            form.onsubmit = null;
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }
        // Atualizar valor total sempre que itens mudarem
        const observer = new MutationObserver(() => this.updateTotalGeral());
        const itensContainer = document.getElementById('itens-container');
        if (itensContainer) {
            observer.observe(itensContainer, { childList: true, subtree: true });
        }
    }

    async loadClientes() {
        if (!this.clienteSelect) return;
        this.clienteSelect.innerHTML = '<option value="">Carregando clientes...</option>';
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(this.apiClientes, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Erro ao buscar clientes');
            const json = await res.json();
            const clientes = json.data || [];
            if (clientes.length === 0) {
                this.clienteSelect.innerHTML = '<option value="">Nenhum cliente encontrado</option>';
            } else {
                this.clienteSelect.innerHTML = '<option value="">Selecione o cliente...</option>';
                clientes.forEach(cliente => {
                    this.clienteSelect.innerHTML += `<option value="${cliente.cpf}">${cliente.nome} - ${cliente.cpf}</option>`;
                });
            }
        } catch (e) {
            this.clienteSelect.innerHTML = '<option value="">Erro ao carregar clientes</option>';
        }
    }

    async loadMotocicletasCliente(cpf) {
        if (!this.motocicletaSelect) return;
        this.motocicletaSelect.innerHTML = '<option value="">Carregando motocicletas...</option>';
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${this.apiMotocicletas}/cliente/${cpf}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Erro ao buscar motocicletas');
            const json = await res.json();
            const motocicletas = json.data || [];
            if (motocicletas.length === 0) {
                this.motocicletaSelect.innerHTML = '<option value="">Nenhuma motocicleta encontrada</option>';
            } else {
                this.motocicletaSelect.innerHTML = '<option value="">Selecione a motocicleta...</option>';
                motocicletas.forEach(moto => {
                    this.motocicletaSelect.innerHTML += `<option value="${moto.placa}">${moto.modelo} - ${moto.placa} (${moto.ano})</option>`;
                });
            }
        } catch (e) {
            this.motocicletaSelect.innerHTML = '<option value="">Erro ao carregar motocicletas</option>';
        }
    }

    // Remover métodos relacionados a loadPecas, toggleTipoItem, preencherDadosPeca e campos fixos

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
        this.updateTotalGeral();

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
        this.updateTotalGeral();
    }

    renderItens() {
        const container = document.getElementById('itens-container');
        if (!container) return;
        container.innerHTML = '';
        
        if (this.itensOrcamento.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="6" style="text-align: center; color: #666; font-style: italic;">
                    Nenhum item adicionado
                </td>
            `;
            this.itensContainer.appendChild(row);
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
            this.itensContainer.appendChild(row);
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
            this.itensContainer.appendChild(totalRow);
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
        this.updateTotalGeral();
    }

    // Função para coletar itens do DOM (igual ajuste)
    collectItensFromInterface() {
        const itensContainer = document.getElementById('itens-container');
        if (!itensContainer) return [];
        const itensElements = itensContainer.querySelectorAll('.item-row');
        const itens = [];
        itensElements.forEach(itemElement => {
            // Ignorar linhas em modo de edição
            if (itemElement.classList.contains('editing')) return;
            const tipo = itemElement.querySelector('.item-tipo')?.value;
            const nome = itemElement.querySelector('.item-nome')?.value;
            const quantidade = itemElement.querySelector('.item-quantidade')?.value;
            const valorInput = itemElement.querySelector('.item-valor')?.value;
            if (
                tipo && nome && nome.trim() !== '' && quantidade && valorInput &&
                (parseFloat(valorInput) > 0)
            ) {
                if (tipo === 'peca') {
                    itens.push({
                        tipo: 'peca',
                        nome: nome,
                        quantidade: parseInt(quantidade) || 1,
                        valorUnitario: parseFloat(valorInput) || 0
                    });
                } else if (tipo === 'servico') {
                    itens.push({
                        tipo: 'servico',
                        nome: nome,
                        quantidade: 1,
                        valorUnitario: parseFloat(valorInput) || 0
                    });
                }
            }
        });
        return itens;
    }

    // Sobrescrever handleSubmit para usar a coleta correta e validação robusta
    handleSubmit(e) {
        console.log('Submit capturado!');
        e.preventDefault();
        if (this.isSubmitting) return;
        this.isSubmitting = true;
        // Coletar campos obrigatórios com validação
        const cpfInput = document.getElementById('cliente_id');
        const validadeInput = document.getElementById('validade');
        const motocicletaInput = document.getElementById('motocicleta_id');
        if (!cpfInput || !validadeInput) {
            this.showNotification('Preencha todos os campos obrigatórios!', 'error', 4000);
            this.isSubmitting = false;
                return;
            }
        const cpf = cpfInput.value;
        const validade = validadeInput.value;
        const placa = motocicletaInput ? motocicletaInput.value : null;
        // Coletar itens do DOM
        const itens = this.collectItensFromInterface();
        console.log('Itens coletados no submit:', itens);
        if (!itens || itens.length === 0) {
            this.showNotification('Você deve adicionar pelo menos uma peça ou serviço ao orçamento antes de gerar!', 'error', 4000);
            this.isSubmitting = false;
                return;
        }
        // Montar formData para envio
        const formData = {
            cpf,
            validade,
            placa
        };
        this.itensOrcamento = itens; // Atualizar para uso no envio
        this.criarOrcamentoIndependente(formData);
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
        // Separar itens em pecas e servicos
        const pecas = [];
        const servicos = [];
        this.itensOrcamento.forEach(item => {
            if (item.tipo === 'peca') {
                pecas.push({
                    nome: item.nome, // Usar a descrição do item
                    quantidade: parseInt(item.quantidade) || 1,
                    valor_unitario: parseFloat(item.valorUnitario) || 0,
                    valor_total: (parseInt(item.quantidade) || 1) * (parseFloat(item.valorUnitario) || 0)
                });
            } else if (item.tipo === 'servico') {
                servicos.push({
                    descricao: item.nome, // Usar a descrição do item
                    valor: parseFloat(item.valorUnitario) || 0
                });
            }
        });
        // Obter observações e placa
        const observacoes = document.getElementById('observacoes')?.value?.trim() || '';
        const motocicleta_placa = this.motocicletaSelect?.value || formData.placa || null;
        // Montar JSON estruturado
        const descricaoEstruturada = {
            pecas,
            servicos,
            observacoes,
            motocicleta_placa
        };
        // Calcular valor total
        const valorTotal = pecas.reduce((acc, p) => acc + p.valor_total, 0) + servicos.reduce((acc, s) => acc + s.valor, 0);
        console.log('Descrição estruturada a ser enviada:', descricaoEstruturada);
        console.log('Valor total calculado:', valorTotal);
        // Montar objeto para envio
        const orcamentoData = {
            valor: valorTotal,
            validade: formData.validade,
            clienteCpf: formData.cpf,
            motocicletaPlaca: motocicleta_placa,
            status: 'P',
            descricao: JSON.stringify(descricaoEstruturada)
        };
        try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/orcamentos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(orcamentoData)
        });
        if (!response.ok) {
                const err = await response.json();
                this.showNotification('Erro ao criar orçamento: ' + (err.message || response.statusText), 'error', 3000);
                return;
        }
        const result = await response.json();
            if (result.success) {
                this.showNotification('Orçamento criado com sucesso! Nº ' + result.data.id, 'success', 6000);
                setTimeout(() => {
                    window.location.href = 'orcamentos-consulta.html';
                }, 8000);
            } else {
                this.showNotification('Erro ao criar orçamento: ' + (result.message || 'Erro desconhecido'), 'error', 4000);
            }
        } catch (error) {
            this.showNotification('Erro ao criar orçamento: ' + error.message, 'error', 4000);
        } finally {
            this.isSubmitting = false;
        }
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
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
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

    abrirModalItem() {
        // Ao invés de abrir modal, adicionar linha editável inline igual ao ajuste
        this.adicionarItemInline();
    }

    fecharModalItem() {
        if (this.addItemModal) this.addItemModal.style.display = 'none';
    }

    atualizarTotalModal() {
        const qtd = parseInt(this.itemQuantidadeModal.value) || 1;
        const valor = parseFloat(this.itemValorModal.value) || 0;
        const total = qtd * valor;
        this.itemTotalModal.value = `R$ ${total.toLocaleString('pt-BR', {minimumFractionDigits:2})}`;
    }

    salvarItemModal() {
        const tipo = this.itemTipoModal.value;
        const descricao = this.itemDescricaoModal.value.trim();
        const quantidade = parseInt(this.itemQuantidadeModal.value) || 1;
        const valorUnitario = parseFloat(this.itemValorModal.value) || 0;
        if (!descricao) {
            alert('Preencha o nome/descrição do item!');
            this.itemDescricaoModal.focus();
            return;
        }
        if (quantidade <= 0) {
            alert('A quantidade deve ser maior que zero!');
            this.itemQuantidadeModal.focus();
            return;
        }
        if (valorUnitario < 0) {
            alert('O valor unitário não pode ser negativo!');
            this.itemValorModal.focus();
            return;
        }
        const item = {
            id: Date.now(),
            tipo,
            descricao,
            quantidade,
            valorUnitario,
            valorTotal: quantidade * valorUnitario
        };
        this.itensOrcamento.push(item);
        this.renderItens();
        this.fecharModalItem();
        this.updateTotalGeral();
    }

    editarItemModal(idx) {
        const item = this.itensOrcamento[idx];
        if (!item) return;
        this.itemTipoModal.value = item.tipo;
        this.itemDescricaoModal.value = item.descricao;
        this.itemQuantidadeModal.value = item.quantidade;
        this.itemValorModal.value = item.valorUnitario;
        this.atualizarTotalModal();
        this.addItemModal.style.display = 'flex';
        // Ao salvar, substituir o item
        this.saveItemModalBtn.onclick = () => {
            const tipo = this.itemTipoModal.value;
            const descricao = this.itemDescricaoModal.value.trim();
            const quantidade = parseInt(this.itemQuantidadeModal.value) || 1;
            const valorUnitario = parseFloat(this.itemValorModal.value) || 0;
            if (!descricao) {
                alert('Preencha o nome/descrição do item!');
                this.itemDescricaoModal.focus();
                return;
            }
            if (quantidade <= 0) {
                alert('A quantidade deve ser maior que zero!');
                this.itemQuantidadeModal.focus();
                return;
            }
            if (valorUnitario < 0) {
                alert('O valor unitário não pode ser negativo!');
                this.itemValorModal.focus();
                return;
            }
            this.itensOrcamento[idx] = {
                ...item,
                tipo,
                descricao,
                quantidade,
                valorUnitario,
                valorTotal: quantidade * valorUnitario
            };
            this.renderItens();
            this.fecharModalItem();
            this.updateTotalGeral();
            // Restaurar evento padrão do botão salvar
            this.saveItemModalBtn.onclick = () => this.salvarItemModal();
        };
    }

    adicionarItemInline() {
        const container = document.getElementById('itens-container');
        if (!container) return;
        // Remover qualquer linha editável já existente
        const existingEditable = container.querySelector('.item-row.editing');
        if (existingEditable) existingEditable.remove();
        // Criar linha já em modo de edição
        const idx = this.itensOrcamento.length;
        const itemId = `item_${Date.now()}`;
        const itemDiv = document.createElement('div');
        itemDiv.className = 'item-row mb-4 p-3 border rounded editing';
        itemDiv.dataset.itemId = itemId;
        itemDiv.innerHTML = `
            <div class="item-fields">
                <div class="field-group">
                    <label>Tipo:</label>
                    <select class="form-control item-tipo">
                        <option value="peca">Peça</option>
                        <option value="servico">Serviço</option>
                    </select>
                </div>
                <div class="field-group">
                    <label>Nome/Descrição:</label>
                    <input type="text" class="form-control item-nome" placeholder="Nome do item ou serviço">
                </div>
                <div class="field-group">
                    <label>Qtd:</label>
                    <input type="number" class="form-control item-quantidade" value="1" min="1">
                </div>
                <div class="field-group">
                    <label>Valor Unit. (R$):</label>
                    <input type="number" class="form-control item-valor" value="0.00" min="0" step="0.01">
                </div>
                <div class="field-group">
                    <label>Total:</label>
                    <input type="text" class="form-control item-total" value="R$ 0,00" readonly>
                </div>
            </div>
            <div class="item-actions mt-3">
                <button type="button" class="btn btn-success btn-sm save-item-btn"><i class="bx bx-check"></i> Salvar</button>
                <button type="button" class="btn btn-secondary btn-sm cancel-item-btn"><i class="bx bx-x"></i> Cancelar</button>
            </div>
        `;
        container.insertBefore(itemDiv, container.firstChild);
        // Forçar aplicação das cores dos botões imediatamente
        const saveBtnInline = itemDiv.querySelector('.save-item-btn');
        const cancelBtnInline = itemDiv.querySelector('.cancel-item-btn');
        if (saveBtnInline) {
            saveBtnInline.style.backgroundColor = '#FC3B56';
            saveBtnInline.style.borderColor = '#FC3B56';
            saveBtnInline.style.color = '#ffffff';
        }
        if (cancelBtnInline) {
            cancelBtnInline.style.backgroundColor = '#9ca3af';
            cancelBtnInline.style.borderColor = '#9ca3af';
            cancelBtnInline.style.color = '#ffffff';
        }
        // Eventos
        const tipoSelect = itemDiv.querySelector('.item-tipo');
        const nomeInput = itemDiv.querySelector('.item-nome');
        const quantidadeInput = itemDiv.querySelector('.item-quantidade');
        const valorInput = itemDiv.querySelector('.item-valor');
        const totalInput = itemDiv.querySelector('.item-total');
        const saveBtn = itemDiv.querySelector('.save-item-btn');
        const cancelBtn = itemDiv.querySelector('.cancel-item-btn');
        // Atualizar total
        const atualizarTotal = () => {
            const qtd = parseInt(quantidadeInput.value) || 1;
            const valor = parseFloat(valorInput.value) || 0;
            totalInput.value = `R$ ${(qtd * valor).toLocaleString('pt-BR', {minimumFractionDigits:2})}`;
        };
        quantidadeInput.oninput = atualizarTotal;
        valorInput.oninput = atualizarTotal;
        tipoSelect.onchange = () => {
            if (tipoSelect.value === 'servico') quantidadeInput.value = 1;
            atualizarTotal();
        };
        atualizarTotal();
        // Salvar
        saveBtn.onclick = () => {
            const tipo = tipoSelect.value;
            const descricao = nomeInput.value.trim();
            const quantidade = parseInt(quantidadeInput.value) || 1;
            const valorUnitario = parseFloat(valorInput.value) || 0;
            if (!descricao) {
                alert('Preencha o nome/descrição do item!');
                nomeInput.focus();
                return;
            }
            if (quantidade <= 0) {
                alert('A quantidade deve ser maior que zero!');
                quantidadeInput.focus();
                return;
            }
            if (valorUnitario < 0) {
                alert('O valor unitário não pode ser negativo!');
                valorInput.focus();
                return;
            }
            const item = {
                id: itemId,
                tipo,
                descricao,
                quantidade,
                valorUnitario,
                valorTotal: quantidade * valorUnitario
            };
            this.itensOrcamento.unshift(item);
            this.renderItens();
            this.updateTotalGeral();
        };
        // Cancelar
        cancelBtn.onclick = () => {
            itemDiv.remove();
        };
    }

    renderItens() {
        const container = document.getElementById('itens-container');
        if (!container) return;
        container.innerHTML = '';
        this.itensOrcamento.forEach((item, idx) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'item-row mb-4 p-3 border rounded';
            itemDiv.dataset.itemId = item.id;
            itemDiv.innerHTML = `
                <div class="item-fields">
                    <div class="field-group">
                        <label>Tipo:</label>
                        <select class="form-control item-tipo" disabled>
                            <option value="peca" ${item.tipo === 'peca' ? 'selected' : ''}>Peça</option>
                            <option value="servico" ${item.tipo === 'servico' ? 'selected' : ''}>Serviço</option>
                        </select>
                    </div>
                    <div class="field-group">
                        <label>Nome/Descrição:</label>
                        <input type="text" class="form-control item-nome" value="${item.descricao}" readonly>
                    </div>
                    <div class="field-group">
                        <label>Qtd:</label>
                        <input type="number" class="form-control item-quantidade" value="${item.quantidade}" min="1" step="1" readonly>
                    </div>
                    <div class="field-group">
                        <label>Valor Unit. (R$):</label>
                        <input type="number" class="form-control item-valor" value="${item.valorUnitario.toFixed(2)}" min="0" step="0.01" readonly>
                    </div>
                    <div class="field-group">
                        <label>Total:</label>
                        <div class="form-control bg-light item-total">R$ ${(item.quantidade * item.valorUnitario).toLocaleString('pt-BR', {minimumFractionDigits:2})}</div>
                    </div>
                </div>
                <div class="item-buttons mt-3">
                    <button type="button" class="btn btn-primary btn-sm edit-item-btn me-2"><i class="bx bx-edit"></i> Editar</button>
                    <button type="button" class="btn btn-danger btn-sm remove-item-btn"><i class="bx bx-trash"></i> Remover</button>
                </div>
                <div class="item-actions mt-3" style="display: none;">
                    <button type="button" class="btn btn-success btn-sm save-item-btn me-2" style="background-color: #FC3B56; border-color: #FC3B56; color: #fff;"><i class="bx bx-check"></i> Salvar</button>
                    <button type="button" class="btn btn-secondary btn-sm cancel-item-btn" style="background-color: #9ca3af; border-color: #9ca3af; color: #fff;"><i class="bx bx-x"></i> Cancelar</button>
                </div>
            `;
            // Editar
            itemDiv.querySelector('.edit-item-btn').onclick = () => this.editarItemInline(idx, itemDiv);
            // Remover
            itemDiv.querySelector('.remove-item-btn').onclick = () => {
                this.itensOrcamento.splice(idx, 1);
                this.renderItens();
                this.updateTotalGeral();
            };
            container.appendChild(itemDiv);
        });
    }
    editarItemInline(idx, itemDiv) {
        const item = this.itensOrcamento[idx];
        if (!item) return;
        // Habilitar edição
        const tipoSelect = itemDiv.querySelector('.item-tipo');
        const nomeInput = itemDiv.querySelector('.item-nome');
        const quantidadeInput = itemDiv.querySelector('.item-quantidade');
        const valorInput = itemDiv.querySelector('.item-valor');
        const totalDiv = itemDiv.querySelector('.item-total');
        tipoSelect.removeAttribute('disabled');
        nomeInput.removeAttribute('readonly');
        quantidadeInput.removeAttribute('readonly');
        valorInput.removeAttribute('readonly');
        // Mostrar botões de salvar/cancelar
        itemDiv.querySelector('.item-buttons').style.display = 'none';
        itemDiv.querySelector('.item-actions').style.display = 'block';
        // Atualizar total ao editar
        const atualizarTotal = () => {
            const qtd = parseInt(quantidadeInput.value) || 1;
            const valor = parseFloat(valorInput.value) || 0;
            totalDiv.textContent = `R$ ${(qtd * valor).toLocaleString('pt-BR', {minimumFractionDigits:2})}`;
        };
        quantidadeInput.oninput = atualizarTotal;
        valorInput.oninput = atualizarTotal;
        tipoSelect.onchange = () => {
            if (tipoSelect.value === 'servico') quantidadeInput.value = 1;
            atualizarTotal();
        };
        // Salvar
        itemDiv.querySelector('.save-item-btn').onclick = () => {
            const tipo = tipoSelect.value;
            const descricao = nomeInput.value.trim();
            const quantidade = parseInt(quantidadeInput.value) || 1;
            const valorUnitario = parseFloat(valorInput.value) || 0;
            if (!descricao) {
                alert('Preencha o nome/descrição do item!');
                nomeInput.focus();
                return;
            }
            if (quantidade <= 0) {
                alert('A quantidade deve ser maior que zero!');
                quantidadeInput.focus();
                return;
            }
            if (valorUnitario < 0) {
                alert('O valor unitário não pode ser negativo!');
                valorInput.focus();
                return;
            }
            this.itensOrcamento[idx] = {
                ...item,
                tipo,
                descricao,
                quantidade,
                valorUnitario,
                valorTotal: quantidade * valorUnitario
            };
            this.renderItens();
            this.updateTotalGeral();
        };
        // Cancelar
        itemDiv.querySelector('.cancel-item-btn').onclick = () => {
            this.renderItens();
        };
    }

    updateTotalGeral() {
        const itens = this.collectItensFromInterface();
        let totalGeral = 0;
        itens.forEach(item => {
            totalGeral += (parseInt(item.quantidade) || 0) * (parseFloat(item.valorUnitario) || 0);
        });
        const valorInput = document.getElementById('valor');
        if (valorInput) {
            valorInput.value = totalGeral.toFixed(2);
        }
    }

    showNotification(message, type = 'success', duration = 3000) {
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.style.position = 'fixed';
            container.style.top = '24px';
            container.style.right = '24px';
            container.style.zIndex = '9999';
            document.body.appendChild(container);
        }
        const notif = document.createElement('div');
        notif.className = `notification ${type}`;
        notif.style.background = type === 'success' ? '#28a745' : '#dc3545';
        notif.style.color = '#fff';
        notif.style.padding = '16px 24px';
        notif.style.marginBottom = '12px';
        notif.style.borderRadius = '8px';
        notif.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)';
        notif.style.fontSize = '16px';
        notif.textContent = message;
        container.appendChild(notif);
        setTimeout(() => {
            notif.remove();
        }, duration);
    }
}

let orcamentoCadastroController;
let submitListenerAdded = false;
window.addEventListener('DOMContentLoaded', () => {
    orcamentoCadastroController = new OrcamentoCadastroController();
});
