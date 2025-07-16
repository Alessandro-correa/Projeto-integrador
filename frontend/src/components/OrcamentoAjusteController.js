class OrcamentoAjusteController {
    constructor() {
        this.baseURL = 'http://localhost:3000/api/orcamentos';
        this.allowedStatuses = ['P']; 
        this.currentItem = null;
        this.originalData = null;
        this.itemsModified = false; // Flag para detectar modificações em itens
        console.log('OrcamentoAjusteController inicializado');
        this.init();
    }

    init() {
        console.log('Inicializando controlador...');
        this.setupEventListeners();
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => this.loadOrcamentoFromURL(), 500);
            });
        } else {
            setTimeout(() => this.loadOrcamentoFromURL(), 500);
        }
    }

    setupEventListeners() {
        console.log('Configurando event listeners...');

        const form = document.getElementById('ajusteForm');
        if (form) {
            // Remover listeners anteriores se existirem
            form.removeEventListener('submit', this.handleSubmit);
            
            // Adicionar novo listener
            form.addEventListener('submit', (e) => this.handleSubmit(e));
            console.log('✅ Form listener adicionado');
            
            // Teste adicional - verificar se o botão existe
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                console.log('✅ Botão submit encontrado:', submitBtn);
            } else {
                console.log('❌ Botão submit não encontrado');
            }
        } else {
            console.log('❌ Form não encontrado');
        }

        const cancelBtn = document.getElementById('cancelBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.handleCancel());
            console.log('✅ Cancel button listener adicionado');
        }

        const valorInput = document.getElementById('valor');
        if (valorInput) {
            // Remover formatação de dinheiro para campos number
            // valorInput.addEventListener('input', (e) => {
            //     this.formatMoney(e.target);
            // });
            console.log('✅ Valor input encontrado (sem formatação automática)');
        }
    }

    async loadOrcamentoFromURL() {
        console.log('Carregando orçamento da URL...');
        const urlParams = new URLSearchParams(window.location.search);
        const orcamentoId = urlParams.get('id');
        
        console.log('ID do orçamento:', orcamentoId);
        
        if (!orcamentoId) {
            this.showNotification('Nenhum orçamento especificado na URL. Redirecionando...', 'warning', null, 3000);
            setTimeout(() => this.redirectToList(), 2000);
            return;
        }

        await this.carregarOrcamento(orcamentoId);
    }

    async carregarOrcamento(id) {
        console.log('Carregando orçamento ID:', id);
        
        try {
            this.showLoading(true);
            this.showNotification('Carregando dados do orçamento...', 'info', null, 0);
            
            const token = localStorage.getItem('token');
            const response = await fetch(`${this.baseURL}/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`Erro ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log('Resultado da API:', result);
            
            if (!result.success) {
                throw new Error(result.message || 'Erro ao buscar orçamento');
            }

            const orcamento = result.data;
            console.log('Dados do orçamento:', orcamento);

            this.clearAllNotifications();

            if (!this.allowedStatuses.includes(orcamento.status)) {
                console.log('Status não permitido:', orcamento.status);
                this.showStatusError();
                return;
            }

            this.currentItem = orcamento;
            this.originalData = { ...orcamento };
            this.itemsModified = false; // Resetar flag ao carregar orçamento
            
            await this.populateOrcamentoData(orcamento);
            this.showForm();
            this.showNotification('Orçamento carregado com sucesso!', 'success', null, 2000);

        } catch (error) {
            console.error('Erro ao carregar orçamento:', error);
            this.hideElements();
            this.clearAllNotifications();
            this.showNotification('Erro ao carregar orçamento: ' + error.message, 'error', null, 5000);
        } finally {
            this.showLoading(false);
        }
    }

    async populateOrcamentoData(orcamento) {
        console.log('Populando dados do formulário...');
        console.log('Dados do orçamento completo:', orcamento);
        
        try {
            
            this.setInputValue('numero', orcamento.id);
            this.setInputValue('valor', orcamento.valor); // Usar valor direto sem formatação
            
            // Formatação de data mais simples para evitar erros
            let validadeFormatada = orcamento.validade;
            if (orcamento.validade) {
                try {
                    validadeFormatada = BasePageController.formatDateForInput(orcamento.validade);
                } catch (e) {
                    console.warn('Erro ao formatar data:', e);
                    // Tentar formato simples
                    validadeFormatada = orcamento.validade.split('T')[0];
                }
            }
            this.setInputValue('validade', validadeFormatada);
            this.setInputValue('status', orcamento.status);

            // Armazenar dados originais de forma mais simples
            this.originalData = {
                id: orcamento.id,
                valor: orcamento.valor,
                validade: validadeFormatada,
                status: orcamento.status
            };
            
            console.log('✅ Dados originais armazenados:', this.originalData);

            if (orcamento.cliente_cpf) {
                console.log('Carregando cliente CPF:', orcamento.cliente_cpf);
                await this.loadClienteData(orcamento.cliente_cpf);
            }

            // Verificar diferentes possibilidades de campo para a placa da motocicleta
            const placaMotocicleta = orcamento.motocicleta_placa || orcamento.placa_motocicleta || orcamento.placa;
            console.log('🔍 Dados do orçamento para motocicleta:', {
                motocicleta_placa: orcamento.motocicleta_placa,
                placa_motocicleta: orcamento.placa_motocicleta,
                placa: orcamento.placa,
                modelo: orcamento.modelo,
                ano: orcamento.ano,
                cor: orcamento.cor,
                marca_nome: orcamento.marca_nome,
                placaFinal: placaMotocicleta
            });
            
            if (placaMotocicleta) {
                console.log('✅ Carregando motocicleta automaticamente:', placaMotocicleta);
                await this.loadMotocicletaData(placaMotocicleta);
            } else {
                console.log('❌ Nenhuma placa de motocicleta encontrada no orçamento');
            }

            // Carregar itens estruturados do orçamento
            if (orcamento.itens_estruturados) {
                this.populateItensFromEstruturados(orcamento.itens_estruturados);
                // Event listeners são configurados automaticamente no populateItensFromEstruturados
            }

        } catch (error) {
            console.error('Erro ao popular dados:', error);
            this.showNotification('Erro ao carregar dados relacionados: ' + error.message, 'warning', null, 4000);
        }
    }

    async loadClienteData(cpf) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3000/api/clientes/${cpf}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    this.populateClienteSelect(result.data);
                }
            }
        } catch (error) {
            console.error('Erro ao carregar cliente:', error);
        }
    }

    async loadMotocicletaData(placa) {
        try {
            console.log('Carregando dados da motocicleta:', placa);
            const token2 = localStorage.getItem('token');
            const response2 = await fetch(`http://localhost:3000/api/motocicletas/${placa}`, {
                headers: { Authorization: `Bearer ${token2}` }
            });
            console.log('Response motocicleta status:', response2.status);
            
            if (response2.ok) {
                const result = await response2.json();
                console.log('Resultado da API motocicleta:', result);
                
                if (result.success) {
                    this.populateMotocicletaSelect(result.data);
                } else {
                    console.error('Erro na resposta da API:', result.message);
                }
            } else {
                console.error('Erro HTTP ao buscar motocicleta:', response2.status);
            }
        } catch (error) {
            console.error('Erro ao carregar motocicleta:', error);
        }
    }

    async loadItensOrcamento(codOrdem) {
        try {
            const token3 = localStorage.getItem('token');
            const response3 = await fetch(`http://localhost:3000/api/ordens/${codOrdem}/pecas`, {
                headers: { Authorization: `Bearer ${token3}` }
            });
            if (response3.ok) {
                const result = await response3.json();
                if (result.success && result.data) {
                    this.populateItensContainer(result.data);
                }
            }

            await this.carregarValorTotal(codOrdem);
        } catch (error) {
            console.error('Erro ao carregar itens:', error);
        }
    }

    async carregarValorTotal(codOrdem) {
        try {
            const token4 = localStorage.getItem('token');
            const response4 = await fetch(`http://localhost:3000/api/ordens/${codOrdem}/valor-total`, {
                headers: { Authorization: `Bearer ${token4}` }
            });
            if (response4.ok) {
                const result = await response4.json();
                if (result.success) {
                    const valorTotal = result.data.valor_total;
                    this.atualizarValorOrcamento(valorTotal);
                    console.log(`Valor total calculado: ${result.data.valor_formatado} (${result.data.total_itens} itens)`);
                }
            }
        } catch (error) {
            console.error('Erro ao carregar valor total:', error);
        }
    }

    populateClienteSelect(cliente) {
        const select = document.getElementById('cliente_id');
        if (select && cliente) {
            select.innerHTML = `<option value="${cliente.cpf}" selected>${cliente.nome}</option>`;
        }
    }

    populateMotocicletaSelect(motocicleta) {
        console.log('Populando select de motocicleta:', motocicleta);
        const select = document.getElementById('motocicleta_id');
        if (select && motocicleta) {
            // Verificar se temos os dados da marca ou apenas dados básicos
            let displayText;
            if (motocicleta.marca_nome) {
                displayText = `${motocicleta.marca_nome} ${motocicleta.modelo} - ${motocicleta.placa}`;
            } else {
                // Fallback se não tiver marca_nome
                displayText = `${motocicleta.modelo} - ${motocicleta.placa}`;
            }
            
            select.innerHTML = `<option value="${motocicleta.placa}" selected>${displayText}</option>`;
            console.log('Select de motocicleta populado com:', displayText);
        } else {
            console.error('Select motocicleta_id não encontrado ou dados inválidos');
        }
    }

    populateItensContainer(itens) {
        const container = document.getElementById('itens-list');
        if (!container) {
            console.log('Container de itens não encontrado');
            return;
        }

        if (!itens || itens.length === 0) {
            container.innerHTML = '<p class="no-items">Nenhum item encontrado na ordem de serviço relacionada.</p>';
            return;
        }

        const html = itens.map(item => {
            const quantidade = item.quantidade || item.qtd_pecas || 1;
            const valorUnitario = parseFloat(item.valor || 0);
            const valorTotalItem = quantidade * valorUnitario;
            
            return `
                <div class="item-row">
                    <div class="item-info">
                        <strong>${item.nome}</strong>
                        <span class="item-desc">${item.descricao}</span>
                    </div>
                    <div class="item-details">
                        <span class="item-qty">Qtd: ${quantidade}</span>
                        <span class="item-unit-value">Unit: R$ ${valorUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        <span class="item-value">Total: R$ ${valorTotalItem.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
    }

    populateItensFromEstruturados(itensEstruturados) {
        console.log('Populando itens do orçamento estruturado:', itensEstruturados);
        
        const container = document.getElementById('itens-list');
        if (!container) {
            console.log('Container de itens não encontrado');
            return;
        }

        const servicos = itensEstruturados.servicos || [];
        const pecas = itensEstruturados.pecas || [];
        
        // Limpar container mas manter o header se existir
        container.innerHTML = '';
        
        // Adicionar botão de adicionar no topo esquerdo
        const addButtonDiv = document.createElement('div');
        addButtonDiv.className = 'add-items-section-top mb-3';
        addButtonDiv.innerHTML = `
            <button type="button" class="btn btn-primary btn-sm" id="addItemBtn">
                <i class='bx bx-plus'></i> Adicionar
            </button>
        `;
        container.appendChild(addButtonDiv);
        
        // Criar container para os itens
        const itemsContainer = document.createElement('div');
        itemsContainer.id = 'items-container';
        container.appendChild(itemsContainer);
        
        // Configurar event listener para o botão de adicionar
        document.getElementById('addItemBtn').addEventListener('click', () => this.addNewItem());
        
        // Adicionar serviços primeiro
        servicos.forEach((servico, index) => {
            const itemData = {
                id: `servico_${index}`,
                nome: servico.descricao || 'Serviço',
                quantidade: 1, // Serviços sempre têm quantidade 1
                valor: servico.valor || 0, // Usar valor diretamente para serviços
                tipo: 'servico'
            };
            this.addItemRowReadonly(itemData);
        });
        
        // Adicionar peças
        pecas.forEach((peca, index) => {
            const itemData = {
                id: `peca_${index}`,
                nome: peca.nome || 'Peça',
                quantidade: peca.quantidade || 1,
                valor: peca.valor_unitario || 0, // Usar valor_unitario para peças
                tipo: 'peca'
            };
            this.addItemRowReadonly(itemData);
        });

        if (servicos.length === 0 && pecas.length === 0) {
            // Manter o botão adicionar mas mostrar mensagem no container de itens
            const itemsContainer = document.getElementById('items-container');
            const noItemsMsg = document.createElement('p');
            noItemsMsg.className = 'no-items';
            noItemsMsg.textContent = 'Nenhum item encontrado neste orçamento.';
            itemsContainer.appendChild(noItemsMsg);
            return;
        }
        
        console.log('Itens editáveis populados no container');
        this.updateTotalGeral();
    }

    addItemRowReadonly(item) {
        const itemsContainer = document.getElementById('items-container');
        if (!itemsContainer) {
            console.error('Container de itens não encontrado');
            return;
        }

        const itemDiv = document.createElement('div');
        itemDiv.className = 'item-row mb-4 p-3 border rounded';
        itemDiv.dataset.tipo = item.tipo;
        itemDiv.dataset.itemId = item.id;
        
        const valorTotalItem = item.quantidade * item.valor;
        
        itemDiv.innerHTML = `
            <div class="item-fields">
                <div class="field-group">
                    <label>Tipo:</label>
                    <select class="form-control item-tipo" disabled>
                        <option value="servico" ${item.tipo === 'servico' ? 'selected' : ''}>Serviço</option>
                        <option value="peca" ${item.tipo === 'peca' ? 'selected' : ''}>Peça</option>
                    </select>
                </div>
                <div class="field-group">
                    <label>Nome/Descrição:</label>
                    <input type="text" class="form-control item-nome" value="${item.nome}" placeholder="Nome do item" readonly>
                </div>
                <div class="field-group">
                    <label>Qtd:</label>
                    <input type="number" class="form-control item-quantidade" value="${item.quantidade}" min="1" step="1" readonly>
                </div>
                <div class="field-group">
                    <label>Valor ${item.tipo === 'servico' ? 'Total' : 'Unit.'} (R$):</label>
                    <input type="number" class="form-control item-valor" value="${item.valor.toFixed(2)}" min="0" step="0.01" placeholder="0.00" readonly>
                </div>
                <div class="field-group">
                    <label>Total:</label>
                    <div class="form-control bg-light item-total">R$ ${valorTotalItem.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                </div>
            </div>
            <div class="item-buttons mt-3">
                <button type="button" class="btn btn-primary btn-sm edit-item-btn me-2">
                    <i class='bx bx-edit'></i> Editar
                </button>
                <button type="button" class="btn btn-danger btn-sm remove-item-btn">
                    <i class='bx bx-trash'></i> Remover
                </button>
            </div>
            <div class="item-actions mt-3" style="display: none;">
                <button type="button" class="btn btn-success btn-sm save-item-btn me-2" style="background-color: #FC3B56 !important; border-color: #FC3B56 !important; color: #ffffff !important;">
                    <i class='bx bx-check'></i> Salvar
                </button>
                <button type="button" class="btn btn-secondary btn-sm cancel-item-btn" style="background-color: #9ca3af !important; border-color: #9ca3af !important; color: #ffffff !important;">
                    <i class='bx bx-x'></i> Cancelar
                </button>
            </div>
        `;

        // Adicionar o novo item no início do container (topo da lista)
        itemsContainer.insertBefore(itemDiv, itemsContainer.firstChild);
        this.setupItemEventListeners(itemDiv);
    }

    setupItemEventListeners(itemDiv) {
        if (!itemDiv) {
            // Configurar para todos os itens se nenhum específico foi passado
            const allItems = document.querySelectorAll('.item-row');
            allItems.forEach(item => this.setupItemEventListeners(item));
            return;
        }

        const editBtn = itemDiv.querySelector('.edit-item-btn');
        const saveBtn = itemDiv.querySelector('.save-item-btn');
        const cancelBtn = itemDiv.querySelector('.cancel-item-btn');
        const removeBtn = itemDiv.querySelector('.remove-item-btn');
        const tipoSelect = itemDiv.querySelector('.item-tipo');
        const nomeInput = itemDiv.querySelector('.item-nome');
        const quantidadeInput = itemDiv.querySelector('.item-quantidade');
        const valorInput = itemDiv.querySelector('.item-valor');

        let originalValues = {};

        // Botão Editar
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                // Salvar valores originais
                originalValues = {
                    tipo: tipoSelect.value,
                    nome: nomeInput.value,
                    quantidade: quantidadeInput.value,
                    valor: valorInput.value
                };

                // Habilitar edição
                tipoSelect.removeAttribute('disabled');
                nomeInput.removeAttribute('readonly');
                quantidadeInput.removeAttribute('readonly');
                valorInput.removeAttribute('readonly');
                tipoSelect.focus();

                // Mostrar/ocultar botões - esconder botões normais e mostrar save/cancel
                editBtn.style.display = 'none';
                removeBtn.style.display = 'none';
                const actionsDiv = itemDiv.querySelector('.item-actions');
                actionsDiv.style.display = 'block';
            });
        }

        // Botão Salvar
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                // Validar valores
                const tipo = tipoSelect.value;
                const nome = nomeInput.value.trim();
                const quantidade = parseInt(quantidadeInput.value) || 0;
                const valor = parseFloat(valorInput.value) || 0;

                if (!tipo) {
                    this.showNotification('Selecione o tipo do item', 'warning', null, 3000);
                    tipoSelect.focus();
                    return;
                }

                if (!nome) {
                    this.showNotification('Nome/descrição é obrigatório', 'warning', null, 3000);
                    nomeInput.focus();
                    return;
                }

                if (quantidade <= 0) {
                    this.showNotification('Quantidade deve ser maior que zero', 'warning', null, 3000);
                    quantidadeInput.focus();
                    return;
                }

                if (valor < 0) {
                    this.showNotification('Valor não pode ser negativo', 'warning', null, 3000);
                    valorInput.focus();
                    return;
                }

                // Marcar que item foi editado
                itemDiv.dataset.wasEdited = 'true';
                this.itemsModified = true;
                console.log('🔄 Item marcado como editado');

                // Atualizar dataset com o novo tipo
                itemDiv.dataset.tipo = tipo;

                // Atualizar label do valor baseado no tipo
                const valorLabel = itemDiv.querySelector('.col-md-2:nth-child(4) label');
                if (valorLabel) {
                    valorLabel.textContent = `Valor ${tipo === 'servico' ? 'Total' : 'Unit.'} (R$):`;
                }

                // Desabilitar edição
                tipoSelect.setAttribute('disabled', true);
                nomeInput.setAttribute('readonly', true);
                quantidadeInput.setAttribute('readonly', true);
                valorInput.setAttribute('readonly', true);

                // Recalcular total
                this.updateItemTotal(itemDiv);

                // Mostrar/ocultar botões - mostrar botões normais e esconder save/cancel
                editBtn.style.display = 'block';
                removeBtn.style.display = 'block';
                const actionsDiv = itemDiv.querySelector('.item-actions');
                actionsDiv.style.display = 'none';

                this.updateTotalGeral();
            });
        }

        // Botão Cancelar
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                // Restaurar valores originais
                tipoSelect.value = originalValues.tipo;
                nomeInput.value = originalValues.nome;
                quantidadeInput.value = originalValues.quantidade;
                valorInput.value = originalValues.valor;

                // Restaurar dataset
                itemDiv.dataset.tipo = originalValues.tipo;

                // Restaurar label do valor
                const valorLabel = itemDiv.querySelector('.col-md-2:nth-child(4) label');
                if (valorLabel) {
                    valorLabel.textContent = `Valor ${originalValues.tipo === 'servico' ? 'Total' : 'Unit.'} (R$):`;
                }

                // Desabilitar edição
                tipoSelect.setAttribute('disabled', true);
                nomeInput.setAttribute('readonly', true);
                quantidadeInput.setAttribute('readonly', true);
                valorInput.setAttribute('readonly', true);

                // Recalcular total
                this.updateItemTotal(itemDiv);

                // Mostrar/ocultar botões - mostrar botões normais e esconder save/cancel
                editBtn.style.display = 'block';
                removeBtn.style.display = 'block';
                const actionsDiv = itemDiv.querySelector('.item-actions');
                actionsDiv.style.display = 'none';

                this.updateTotalGeral();
            });
        }

        // Botão Remover
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                if (confirm('Deseja remover este item do orçamento?')) {
                    this.itemsModified = true;
                    console.log('🗑️ Item removido, itens marcados como modificados');
                    itemDiv.remove();
                    this.updateTotalGeral();
                }
            });
        }

        // Event listener para mudança de tipo
        tipoSelect.addEventListener('change', () => {
            if (!tipoSelect.hasAttribute('disabled')) {
                const valorLabel = itemDiv.querySelector('.field-group:nth-child(4) label');
                if (valorLabel) {
                    valorLabel.textContent = `Valor ${tipoSelect.value === 'servico' ? 'Total' : 'Unit.'} (R$):`;
                }
                
                // Para serviços, quantidade sempre 1
                if (tipoSelect.value === 'servico') {
                    quantidadeInput.value = 1;
                }
                
                this.updateItemTotal(itemDiv);
                this.updateTotalGeral();
            }
        });

        // Event listeners para recálculo durante edição
        quantidadeInput.addEventListener('input', () => {
            if (!quantidadeInput.hasAttribute('readonly')) {
                this.updateItemTotal(itemDiv);
                this.updateTotalGeral();
            }
        });

        valorInput.addEventListener('input', () => {
            if (!valorInput.hasAttribute('readonly')) {
                this.updateItemTotal(itemDiv);
                this.updateTotalGeral();
            }
        });
        
        // Aplicar estilos corretos aos botões após criação
        const saveBtnStyle = itemDiv.querySelector('.save-item-btn');
        const cancelBtnStyle = itemDiv.querySelector('.cancel-item-btn');
        
        if (saveBtnStyle) {
            // Aplicar estilo vermelho ao botão salvar (igual ao editar)
            saveBtnStyle.style.backgroundColor = '#FC3B56';
            saveBtnStyle.style.borderColor = '#FC3B56';
            saveBtnStyle.style.color = '#ffffff';
            
            saveBtnStyle.addEventListener('mouseenter', () => {
                saveBtnStyle.style.backgroundColor = '#D72D44'; // Vermelho escuro no hover
                saveBtnStyle.style.borderColor = '#D72D44';
            });
            
            saveBtnStyle.addEventListener('mouseleave', () => {
                saveBtnStyle.style.backgroundColor = '#FC3B56'; // Volta para vermelho normal
                saveBtnStyle.style.borderColor = '#FC3B56';
            });
        }
        
        if (cancelBtnStyle) {
            // Aplicar estilo cinza claro ao botão cancelar
            cancelBtnStyle.style.backgroundColor = '#9ca3af';
            cancelBtnStyle.style.borderColor = '#9ca3af';
            cancelBtnStyle.style.color = '#ffffff';
            
            cancelBtnStyle.addEventListener('mouseenter', () => {
                cancelBtnStyle.style.backgroundColor = '#6b7280';
                cancelBtnStyle.style.borderColor = '#6b7280';
            });
            
            cancelBtnStyle.addEventListener('mouseleave', () => {
                cancelBtnStyle.style.backgroundColor = '#9ca3af';
                cancelBtnStyle.style.borderColor = '#9ca3af';
            });
        }
    }

    updateItemTotal(itemDiv) {
        const quantidadeInput = itemDiv.querySelector('.item-quantidade');
        const valorInput = itemDiv.querySelector('.item-valor');
        const totalDiv = itemDiv.querySelector('.item-total');

        const quantidade = parseInt(quantidadeInput.value) || 0;
        const valor = parseFloat(valorInput.value) || 0;
        const total = quantidade * valor;

        totalDiv.textContent = `R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        return total;
    }

    addNewItem() {
        const container = document.getElementById('itens-list');
        if (!container) return;

        // Verificar se o botão adicionar existe, se não criar
        let addBtn = document.getElementById('addItemBtn');
        if (!addBtn) {
            const addButtonDiv = document.createElement('div');
            addButtonDiv.className = 'add-items-section-top mb-3';
            addButtonDiv.innerHTML = `
                <button type="button" class="btn btn-primary btn-sm" id="addItemBtn">
                    <i class='bx bx-plus'></i> Adicionar
                </button>
            `;
            container.insertBefore(addButtonDiv, container.firstChild);
            
            // Criar container para os itens se não existir
            let itemsContainer = document.getElementById('items-container');
            if (!itemsContainer) {
                itemsContainer = document.createElement('div');
                itemsContainer.id = 'items-container';
                container.appendChild(itemsContainer);
            }
            
            // Configurar event listener para o novo botão
            document.getElementById('addItemBtn').addEventListener('click', () => this.addNewItem());
        }

        const itemsContainer = document.getElementById('items-container');
        const index = itemsContainer.querySelectorAll('.item-row').length;
        const itemData = {
            id: `item_${index}_new`,
            nome: '',
            quantidade: 1,
            valor: 0,
            tipo: 'peca' // Tipo padrão
        };

        this.addItemRowReadonly(itemData);
        
        // Automaticamente entrar em modo de edição para o novo item
        const newItem = itemsContainer.querySelector(`[data-item-id="${itemData.id}"]`);
        if (newItem) {
            const editBtn = newItem.querySelector('.edit-item-btn');
            if (editBtn) {
                editBtn.click();
            }
        }
    }

    updateTotalGeral() {
        const itemsContainer = document.getElementById('items-container');
        if (!itemsContainer) return;
        
        const allItems = itemsContainer.querySelectorAll('.item-row');
        let totalGeral = 0;

        allItems.forEach(item => {
            const quantidadeInput = item.querySelector('.item-quantidade');
            const valorInput = item.querySelector('.item-valor');
            
            if (quantidadeInput && valorInput) {
                const quantidade = parseInt(quantidadeInput.value) || 0;
                const valor = parseFloat(valorInput.value) || 0;
                totalGeral += quantidade * valor;
            }
        });

        // Atualizar o campo valor do orçamento
        const valorInput = document.getElementById('valor');
        if (valorInput) {
            valorInput.value = totalGeral.toFixed(2);
        }

        console.log(`Total geral atualizado: R$ ${totalGeral.toFixed(2)}`);
    }

    atualizarValorOrcamento(valorTotal) {
        const valorInput = document.getElementById('valor');
        if (valorInput) {
            valorInput.value = valorTotal.toFixed(2);
            console.log(`Valor do orçamento atualizado: R$ ${valorTotal.toFixed(2)}`);
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        console.log('🚀 Form submetido');
        
        try {
            const formData = new FormData(e.target);
            const updateData = this.extractFormData(formData);
            
            console.log('📋 Dados extraídos:', updateData);
            
            if (!this.validateData(updateData)) {
                console.log('❌ Validação falhou');
                return;
            }

            if (!this.hasChanges(updateData)) {
                this.showNotification('Nenhuma alteração detectada', 'info', null, 3000);
                return;
            }

            await this.confirmChanges(updateData);

        } catch (error) {
            console.error('Erro no submit:', error);
            this.showNotification('Erro ao processar formulário: ' + error.message, 'error', null, 5000);
        }
    }

    extractFormData(formData) {
        // Coletar dados básicos
        const basicData = {
            valor: this.parseCurrency(formData.get('valor')),
            validade: formData.get('validade'),
            status: formData.get('status')
        };

        // Só coletar itens se houver itens editáveis na interface
        const itensContainer = document.getElementById('items-container');
        let itens = null;
        
        if (itensContainer && itensContainer.querySelectorAll('.item-row').length > 0) {
            // Verificar se algum item foi realmente editado/modificado
            if (this.hasItemChanges()) {
                itens = this.collectItensFromInterface();
                console.log('📋 Itens foram modificados, coletando:', itens);
            } else {
                console.log('📋 Itens não foram modificados, não enviando');
            }
        }
        
        console.log('📋 Dados básicos extraídos:', basicData);
        console.log('📋 Enviando itens?', !!itens);

        const result = { ...basicData };
        if (itens && itens.length > 0) {
            result.itens = itens;
        }
        
        return result;
    }

    collectItensFromInterface() {
        const itensContainer = document.getElementById('items-container');
        if (!itensContainer) {
            console.log('⚠️ Container de itens não encontrado');
            return [];
        }

        const itensElements = itensContainer.querySelectorAll('.item-row');
        const itens = [];

        itensElements.forEach((itemElement, index) => {
            try {
                const tipo = itemElement.querySelector('.item-tipo')?.value;
                const nome = itemElement.querySelector('.item-nome')?.value;
                const quantidade = itemElement.querySelector('.item-quantidade')?.value;
                const valorInput = itemElement.querySelector('.item-valor')?.value;

                if (tipo && nome && quantidade && valorInput) {
                    const item = {
                        tipo: tipo,
                        nome: nome,
                        quantidade: parseFloat(quantidade) || 1
                    };
                    
                    // Para serviços, usar 'valor' (valor total)
                    // Para peças, usar 'valor_unitario' (valor por unidade)
                    if (tipo === 'servico') {
                        item.valor = parseFloat(valorInput) || 0;
                        item.descricao = nome; // Para compatibilidade com backend
                    } else {
                        item.valor_unitario = parseFloat(valorInput) || 0;
                    }
                    
                    itens.push(item);
                    console.log(`📦 Item ${index + 1} coletado:`, item);
                }
            } catch (error) {
                console.error(`❌ Erro ao coletar item ${index + 1}:`, error);
            }
        });

        console.log(`✅ Total de ${itens.length} itens coletados`);
        return itens;
    }

    hasChanges(newData) {
        if (!this.originalData) return true;
        
        const valorChanged = newData.valor !== parseFloat(this.originalData.valor);
        const validadeChanged = newData.validade !== this.originalData.validade;
        const statusChanged = newData.status !== this.originalData.status;
        
        // Verificar se há itens sendo enviados E se foram realmente modificados
        const itensChanged = newData.itens && this.hasItemChanges();
        
        console.log('🔍 Verificação de mudanças:', {
            valorChanged,
            validadeChanged, 
            statusChanged,
            itensChanged,
            novoValor: newData.valor,
            valorOriginal: parseFloat(this.originalData.valor),
            novaValidade: newData.validade,
            validadeOriginal: this.originalData.validade,
            novoStatus: newData.status,
            statusOriginal: this.originalData.status,
            temItens: !!newData.itens,
            quantidadeItens: newData.itens?.length || 0,
            itemsModifiedFlag: this.itemsModified
        });
        
        return valorChanged || validadeChanged || statusChanged || itensChanged;
    }

    validateData(data) {
        if (!data.valor || data.valor <= 0) {
            this.showNotification('Valor deve ser maior que zero', 'error', null, 4000);
            return false;
        }

        if (!data.validade) {
            this.showNotification('Data de validade é obrigatória', 'error', null, 4000);
            return false;
        }

        if (!data.status) {
            this.showNotification('Status é obrigatório', 'error', null, 4000);
            return false;
        }

        return true;
    }

    async confirmChanges(updateData) {
        console.log('🔔 Mostrando confirmação para o usuário...');
        const confirmed = confirm('Confirma as alterações no orçamento?');
        console.log('🔔 Resposta da confirmação:', confirmed);
        
        if (confirmed) {
            console.log('✅ Usuário confirmou, prosseguindo com atualização');
            await this.updateOrcamento(updateData);
        } else {
            console.log('❌ Usuário cancelou a operação');
        }
    }

    async updateOrcamento(updateData) {
        console.log('🚀 INICIANDO updateOrcamento');
        console.log('🚀 URL de destino:', `${this.baseURL}/${this.currentItem.id}`);
        console.log('🚀 Dados a serem enviados:', updateData);
        
        try {
            this.showNotification('Salvando alterações...', 'info', null, 0);
            
            console.log('📡 Fazendo requisição PUT...');
            
            const token = localStorage.getItem('token');
            const response = await fetch(`${this.baseURL}/${this.currentItem.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(updateData)
            });

            console.log('📡 Resposta recebida. Status:', response.status);

            if (!response.ok) {
                throw new Error(`Erro ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            console.log('📡 Resposta do servidor:', result);
            
            if (!result.success) {
                throw new Error(result.message || 'Erro ao atualizar orçamento');
            }

            this.clearAllNotifications();
            this.showNotification('Orçamento atualizado com sucesso!', 'success', null, 3000);
            
            // Atualizar dados locais com a resposta do servidor
            if (result.data) {
                console.log('📦 Atualizando dados locais com resposta do servidor:', result.data);
                this.currentItem = result.data;
                this.originalData = { 
                    id: result.data.id,
                    valor: result.data.valor,
                    validade: result.data.validade,
                    status: result.data.status
                };
                console.log('📦 Novos dados originais:', this.originalData);
                // NÃO recarregar os campos para manter os valores atuais visíveis
                // this.populateOrcamentoData(result.data);
            }
            
            setTimeout(() => {
                this.redirectToList();
            }, 2000);

        } catch (error) {
            console.error('❌ Erro ao atualizar:', error);
            this.clearAllNotifications();
            this.showNotification('Erro ao salvar: ' + error.message, 'error', null, 5000);
        }
    }

    handleCancel() {
        this.redirectToList();
    }

    redirectToList() {
        window.location.href = 'orcamentos-consulta.html';
    }

    setInputValue(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.value = value || '';
            console.log(`Campo ${id} preenchido com:`, value);
        } else {
            console.log(`Campo ${id} não encontrado`);
        }
    }

    formatCurrency(value) {
        return parseFloat(value || 0).toLocaleString('pt-BR', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        });
    }

    parseCurrency(value) {
        console.log('💰 Convertendo valor:', { input: value, type: typeof value });
        if (!value || value === '') {
            console.log('💰 Valor vazio, retornando 0');
            return 0;
        }
        
        // Se já é um número, retornar diretamente
        if (typeof value === 'number') {
            console.log('💰 Já é número:', value);
            return value;
        }
        
        // Se é string, tentar converter
        const numericValue = parseFloat(value);
        if (!isNaN(numericValue)) {
            console.log('💰 Conversão direta bem-sucedida:', numericValue);
            return numericValue;
        }
        
        // Fallback para formato brasileiro
        const processed = value.toString().replace(/[^\d,]/g, '').replace(',', '.');
        const result = parseFloat(processed);
        console.log('💰 Conversão com processamento:', { processed, result });
        return isNaN(result) ? 0 : result;
    }

    formatMoney(input) {
        let value = input.value.replace(/\D/g, '');
        value = (value / 100).toFixed(2) + '';
        value = value.replace('.', ',');
        value = value.replace(/(\d)(\d{3})(\d{3}),/g, '$1.$2.$3,');
        value = value.replace(/(\d)(\d{3}),/g, '$1.$2,');
        input.value = value;
    }

    showLoading(show) {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = show ? 'block' : 'none';
        }
    }

    showForm() {
        const formSection = document.getElementById('adjustment-form-section');
        if (formSection) {
            formSection.style.display = 'block';
            console.log('Formulário exibido');
        } else {
            console.log('Seção do formulário não encontrada');
        }
    }

    hideElements() {
        const formSection = document.getElementById('adjustment-form-section');
        if (formSection) {
            formSection.style.display = 'none';
        }
    }

    showStatusError() {
        const statusError = document.getElementById('status-validation');
        if (statusError) {
            statusError.style.display = 'block';
        }
        this.hideElements();
    }

    showNotification(message, type = 'info', title = null, duration = 5000) {
        const container = document.getElementById('notification-container');
        if (!container) {
            console.error('Container de notificações não encontrado');
            return;
        }

        const existingNotifications = container.querySelectorAll('.notification');
        for (let existing of existingNotifications) {
            const existingMessage = existing.querySelector('.notification-message')?.textContent;
            const existingType = existing.classList.contains(`notification-${type}`);
            if (existingMessage === message && existingType) {
                return existing.id;
            }
        }

        if (!title) {
            const titles = {
                success: 'Sucesso',
                error: 'Erro',
                warning: 'Atenção',
                info: 'Informação'
            };
            title = titles[type] || 'Notificação';
        }

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;

        const notificationId = 'notification-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        notification.id = notificationId;

        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-title">${title}</div>
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close" onclick="window.closeNotification('${notificationId}')">X</button>
            <div class="notification-progress" style="width: 100%;"></div>
        `;

        container.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        if (duration > 0) {
            const progressBar = notification.querySelector('.notification-progress');

            setTimeout(() => {
                progressBar.style.transition = `width ${duration}ms linear`;
                progressBar.style.width = '0%';
            }, 200);

            setTimeout(() => {
                this.removeNotification(notificationId);
            }, duration + 200);
        }

        if (!window.closeNotification) {
            window.closeNotification = (id) => this.removeNotification(id);
        }

        return notificationId;
    }

    removeNotification(notificationId) {
        const notification = document.getElementById(notificationId);
        if (notification) {
            notification.classList.add('hide');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }

    clearAllNotifications() {
        const container = document.getElementById('notification-container');
        if (container) {
            const notifications = container.querySelectorAll('.notification');
            notifications.forEach(notification => {
                this.removeNotification(notification.id);
            });
        }
    }

    hasItemChanges() {
        // Verificar se há alguma flag indicando que itens foram modificados
        if (this.itemsModified) {
            console.log('🔍 Itens foram explicitamente modificados');
            return true;
        }
        
        // Verificar se há itens novos (com ID contendo '_new')
        const itemsContainer = document.getElementById('items-container');
        if (itemsContainer) {
            const newItems = itemsContainer.querySelectorAll('[data-item-id*="_new"]');
            if (newItems.length > 0) {
                console.log('🔍 Encontrados itens novos:', newItems.length);
                return true;
            }
            
            // Verificar se algum item foi editado (tem valores diferentes dos originais)
            const allItems = itemsContainer.querySelectorAll('.item-row');
            for (let item of allItems) {
                if (item.dataset.wasEdited === 'true') {
                    console.log('🔍 Item foi marcado como editado');
                    return true;
                }
            }
        }
        
        console.log('🔍 Nenhuma mudança detectada nos itens');
        return false;
    }

}

// Inicialização única do controlador
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('ajusteForm') && !window.orcamentoAjusteController) {
        console.log('Inicializando OrcamentoAjusteController via DOMContentLoaded');
        window.orcamentoAjusteController = new OrcamentoAjusteController();
    }
});

// Backup para quando o DOM já está carregado
if (document.readyState !== 'loading' && !window.orcamentoAjusteController) {
    console.log('DOM já carregado, inicializando controlador...');
    if (document.getElementById('ajusteForm')) {
        window.orcamentoAjusteController = new OrcamentoAjusteController();
    }
}
