class OrcamentoController {
    constructor() {
        this.apiUrl = 'http://localhost:3000/api/orcamentos';
        this.tableBody = document.querySelector('#orcamentos-table tbody');
        this.filterText = document.getElementById('filter-text');
        this.filterStatus = document.getElementById('filter-status');
        this.clearFiltersBtn = document.getElementById('clear-filters');
        this.novoBtn = document.querySelector('.btn-primary[href="orcamentos-cadastro.html"]');
        this.orcamentos = [];

        this.currentUser = {
            tipo: 'Atendente' 
        };

        this.currentSort = {
            column: 'id',
            direction: 'desc' 
        };
        
        this.init();
    }

    initSortableHeaders() {
        const sortableHeaders = document.querySelectorAll('.sortable');
        sortableHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const column = header.getAttribute('data-column');
                this.sortBy(column);
            });
        });
    }

    sortBy(column) {
        
        if (this.currentSort.column === column) {
            this.currentSort.direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            
            const header = document.querySelector(`[data-column="${column}"]`);
            const defaultSort = header.getAttribute('data-default-sort') || 'asc';
            this.currentSort.column = column;
            this.currentSort.direction = defaultSort;
        }

        this.updateSortIcons();
        this.renderTable();
    }

    updateSortIcons() {
        
        document.querySelectorAll('.sort-icon').forEach(icon => {
            icon.classList.remove('active');
            icon.className = 'bx bx-sort-alt-2 sort-icon';
        });
        
        document.querySelectorAll('.sortable').forEach(header => {
            header.classList.remove('sorted');
        });

        const currentHeader = document.querySelector(`[data-column="${this.currentSort.column}"]`);
        if (currentHeader) {
            const icon = currentHeader.querySelector('.sort-icon');
            if (icon) {
                icon.classList.add('active');
                currentHeader.classList.add('sorted');

                if (this.currentSort.direction === 'asc') {
                    icon.className = 'bx bx-sort-up sort-icon active';
                } else {
                    icon.className = 'bx bx-sort-down sort-icon active';
                }
            }
        }
    }

    sortOrcamentos(orcamentos) {
        return [...orcamentos].sort((a, b) => {
            const column = this.currentSort.column;
            const direction = this.currentSort.direction;
            
            let valueA = a[column];
            let valueB = b[column];

            switch (column) {
                case 'id':
                    valueA = parseInt(valueA) || 0;
                    valueB = parseInt(valueB) || 0;
                    break;
                    
                case 'validade':
                    valueA = new Date(valueA || 0);
                    valueB = new Date(valueB || 0);
                    break;
                    
                case 'valor':
                    valueA = parseFloat(valueA) || 0;
                    valueB = parseFloat(valueB) || 0;
                    break;
                    
                case 'cliente_nome':
                case 'placa':
                case 'status':
                    valueA = (valueA || '').toString().toLowerCase();
                    valueB = (valueB || '').toString().toLowerCase();
                    break;
                    
                default:
                    valueA = valueA || '';
                    valueB = valueB || '';
                    break;
            }

            let comparison = 0;
            if (valueA > valueB) {
                comparison = 1;
            } else if (valueA < valueB) {
                comparison = -1;
            }

            return direction === 'desc' ? comparison * -1 : comparison;
        });
    }

    init() {
        this.loadOrcamentos();
        this.initSortableHeaders();
        this.filterText.addEventListener('input', () => this.renderTable());
        this.filterStatus.addEventListener('change', () => this.renderTable());
        this.clearFiltersBtn.addEventListener('click', () => this.clearFilters());
        if (this.novoBtn) {
            this.novoBtn.addEventListener('click', () => {
                
                window.location.href = 'orcamentos-cadastro.html';
            });
        }
    }

    async loadOrcamentos() {
        try {
            console.log('Carregando orçamentos da API...');
            const res = await fetch(this.apiUrl);
            console.log('Response status:', res.status);
            
            if (!res.ok) {
                throw new Error(`Erro HTTP: ${res.status}`);
            }
            
            const json = await res.json();
            console.log('Dados recebidos:', json);
            
            this.orcamentos = json.data || [];
            this.renderTable();
        } catch (e) {
            console.error('Erro ao carregar orçamentos:', e);
            alert(`Erro ao carregar dados: ${e.message}`);
            this.tableBody.innerHTML = '<tr><td colspan="7">Erro ao carregar orçamentos</td></tr>';
        }
    }

    renderTable() {
        const text = this.filterText.value.toLowerCase();
        const status = this.filterStatus.value;

        let filtered = this.orcamentos.filter(o => {
            const codigo = o.id ? `orc-${String(o.id).padStart(3, '0')}` : '';
            const cliente = (o.cliente_nome || '').toLowerCase();
            const placa = (o.placa || '').toLowerCase();
            let match = true;
            if (text) {
                match = codigo.includes(text) || cliente.includes(text) || placa.includes(text);
            }
            if (status) {
                
                match = match && (o.status_descricao === status || this.getStatusLabel(o.status) === status);
            }
            return match;
        });
        
        if (filtered.length === 0) {
            this.tableBody.innerHTML = '<tr><td colspan="6">Nenhum orçamento encontrado</td></tr>';
            return;
        }

        const sorted = this.sortOrcamentos(filtered);
        
        this.tableBody.innerHTML = sorted.map(o => `
            <tr>
                <td><p>ORC-${String(o.id).padStart(3, '0')}</p></td>
                <td><p>${o.cliente_nome || 'N/A'}</p></td>
                <td><p>${o.placa || 'N/A'}</p></td>
                <td>R$ ${(parseFloat(o.valor) || 0).toLocaleString('pt-BR', {minimumFractionDigits:2})}</td>
                <td><span class="status-${this.getStatusClass(o.status)}">${o.status_descricao || this.getStatusLabel(o.status)}</span></td>
                <td>
                    ${this.getActionsForStatus(o)}
                </td>
            </tr>
        `).join('');
        this.addActionListeners();
    }

    getActionsForStatus(orcamento) {
        const actions = [];
        const isMecanico = this.currentUser.tipo === 'Mecânico';
        const isSecretaria = this.currentUser.tipo === 'Atendente';

        switch(orcamento.status) {
            case 'P': 
                
                actions.push(`<a href="#" class="action-icon visualizar-orcamento" data-id="${orcamento.id}" title="Visualizar"><i class='bx bx-show'></i></a>`);

                actions.push(`<a href="orcamentos-ajustar.html?id=${orcamento.id}" class="action-icon" title="Editar Orçamento"><i class='bx bx-edit'></i></a>`);

                if (isSecretaria) {
                    actions.push(`<a href="#" class="action-icon validar-orcamento" data-id="${orcamento.id}" title="Validar Orçamento (Gerar OS)"><i class='bx bx-check-shield'></i></a>`);
                    actions.push(`<a href="#" class="action-icon rejeitar-orcamento" data-id="${orcamento.id}" title="Rejeitar Orçamento"><i class='bx bx-x-circle'></i></a>`);
                }
                break;
                
            case 'A': 
            case 'R': 
                
                actions.push(`<a href="#" class="action-icon visualizar-orcamento" data-id="${orcamento.id}" title="Visualizar"><i class='bx bx-show'></i></a>`);
                break;
                
            default:
                
                actions.push(`<a href="#" class="action-icon visualizar-orcamento" data-id="${orcamento.id}" title="Visualizar"><i class='bx bx-show'></i></a>`);
                break;
        }
        
        return actions.join(' ');
    }

    getStatusLabel(status) {
        if (!status) return 'Pendente';
        const map = {
            'P': 'Pendente',
            'A': 'Aprovado', 
            'R': 'Rejeitado'
        };
        return map[status] || 'Pendente';
    }
    getStatusClass(status) {
        if (!status) return 'pending';
        const map = {
            'P': 'pending',
            'A': 'completed',
            'R': 'rejected'
        };
        return map[status] || 'pending';
    }
    getStatusBadge(status) {
        const statusMap = {
            'P': 'Pendente',
            'V': 'Validado',
            'R': 'Rejeitado',
            'E': 'Enviado'
        };
        return statusMap[status] || status;
    }

    clearFilters() {
        this.filterText.value = '';
        this.filterStatus.value = '';
        this.renderTable();
    }

    addActionListeners() {
        
        this.tableBody.querySelectorAll('.visualizar-orcamento').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                const id = btn.getAttribute('data-id');
                await this.visualizarOrcamento(id);
            });
        });

        this.tableBody.querySelectorAll('.validar-orcamento').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                const id = btn.getAttribute('data-id');
                
                const confirmar = confirm(
                    `🔍 VALIDAR ORÇAMENTO #${id}\n\n` +
                    `✅ Confirma a validação deste orçamento?\n\n` +
                    `• O orçamento será transformado em uma Ordem de Serviço\n` +
                    `• Status será alterado para VALIDADO\n` +
                    `• Uma nova OS será criada automaticamente\n` +
                    `• Todos os itens serão incluídos na descrição da OS\n\n` +
                    `⚠️ Esta ação não pode ser desfeita.`
                );
                
                if (confirmar) {
                    await this.validarOrcamento(id);
                }
            });
        });

        this.tableBody.querySelectorAll('.rejeitar-orcamento').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                const id = btn.getAttribute('data-id');
                await this.abrirModalRejeicao(id);
            });
        });
    }

    async visualizarOrcamento(id) {
        try {
            const res = await fetch(`${this.apiUrl}/${id}`);
            if (!res.ok) throw new Error('Erro ao buscar orçamento');
            
            const json = await res.json();
            const orcamento = json.data;

            this.mostrarModalVisualizacao(orcamento);
            
        } catch (e) {
            console.error('Erro ao visualizar orçamento:', e);
            alert('Erro ao visualizar orçamento');
        }
    }

    mostrarModalVisualizacao(orcamento) {
        // Processar descrição concatenada se existir
        let servicosHTML = '';
        let pecasHTML = '';
        
        if (orcamento.descricao) {
            const { servicos, pecas } = this.processarDescricaoConcatenada(orcamento.descricao);
            
            if (servicos.length > 0) {
                servicosHTML = `
                    <div class="section-divider">
                        <h4>Serviços</h4>
                        <div class="items-list">
                            ${servicos.map(servico => `
                                <div class="item-row">
                                    <span class="item-description">${servico.descricao}</span>
                                    <span class="item-value">R$ ${servico.valor.toFixed(2)}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
            
            if (pecas.length > 0) {
                pecasHTML = `
                    <div class="section-divider">
                        <h4>Peças</h4>
                        <div class="items-list">
                            ${pecas.map(peca => `
                                <div class="item-row">
                                    <span class="item-description">${peca.nome} (Qtd: ${peca.quantidade})</span>
                                    <span class="item-value">R$ ${peca.valor_total.toFixed(2)}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
        }

        // Calcular total geral
        let totalGeral = 0;
        if (orcamento.descricao) {
            const { servicos, pecas } = this.processarDescricaoConcatenada(orcamento.descricao);
            totalGeral = servicos.reduce((total, s) => total + s.valor, 0) + 
                        pecas.reduce((total, p) => total + p.valor_total, 0);
        }

        const modalHtml = `
            <div id="modal-visualizar" class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Detalhes do Orçamento ORC-${String(orcamento.id).padStart(3, '0')}</h3>
                        <button class="modal-close" onclick="document.getElementById('modal-visualizar').remove()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="basic-info">
                            <p><strong>Cliente:</strong> ${orcamento.cliente_nome || 'N/A'}</p>
                            <p><strong>CPF:</strong> ${orcamento.cliente_cpf || 'N/A'}</p>
                            <p><strong>Placa:</strong> ${orcamento.placa || 'N/A'}</p>
                            <p><strong>Valor Total:</strong> R$ ${(parseFloat(orcamento.valor) || 0).toLocaleString('pt-BR', {minimumFractionDigits:2})}</p>
                            <p><strong>Validade:</strong> ${orcamento.validade ? new Date(orcamento.validade).toLocaleDateString('pt-BR') : 'N/A'}</p>
                            <p><strong>Status:</strong> <span class="status-${this.getStatusClass(orcamento.status)}">${orcamento.status_descricao || this.getStatusLabel(orcamento.status)}</span></p>
                            ${orcamento.status === 'A' && orcamento.data ? `
                                <p><strong>Data de Aprovação:</strong> ${new Date(orcamento.data).toLocaleDateString('pt-BR')}</p>
                            ` : ''}
                            ${orcamento.ordem_servico_cod ? `
                                <p><strong>Ordem de Serviço:</strong> OS-${String(orcamento.ordem_servico_cod).padStart(3, '0')}</p>
                                <p><strong>Status da OS:</strong> ${orcamento.ordem_status || 'N/A'}</p>
                            ` : ''}
                        </div>
                        
                        ${servicosHTML}
                        ${pecasHTML}
                        
                        ${(servicosHTML || pecasHTML) ? `
                            <div class="total-geral">
                                <strong>Total Geral: R$ ${totalGeral.toFixed(2)}</strong>
                            </div>
                        ` : ''}
                        
                        <style>
                            .section-divider {
                                margin-top: 20px;
                                padding-top: 15px;
                                border-top: 1px solid #eee;
                            }
                            .section-divider h4 {
                                margin: 0 0 10px 0;
                                color: #333;
                                font-size: 16px;
                            }
                            .items-list {
                                background: #f8f9fa;
                                border-radius: 8px;
                                padding: 10px;
                                margin-bottom: 10px;
                            }
                            .item-row {
                                display: flex;
                                justify-content: space-between;
                                align-items: center;
                                padding: 8px 0;
                                border-bottom: 1px solid #e9ecef;
                            }
                            .item-row:last-child {
                                border-bottom: none;
                            }
                            .item-description {
                                flex: 1;
                                font-weight: 500;
                            }
                            .item-value {
                                font-weight: 600;
                                color: #dc3545;
                            }
                            .total-geral {
                                margin-top: 20px;
                                padding: 15px;
                                background: #f8f9fa;
                                border-radius: 8px;
                                text-align: center;
                                font-size: 18px;
                                color: #000;
                            }
                        </style>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        document.getElementById('modal-visualizar').addEventListener('click', function(e) {
            if (e.target === this) {
                this.remove();
            }
        });
    }

    // Função para processar descrição concatenada do orçamento
    processarDescricaoConcatenada(descricao) {
        const servicos = [];
        const pecas = [];
        
        if (!descricao) {
            return { servicos, pecas };
        }
        
        const itens = descricao.split(';');
        
        itens.forEach(item => {
            const itemTrimmed = item.trim();
            
            if (itemTrimmed.startsWith('SERVIÇO:')) {
                const match = itemTrimmed.match(/SERVIÇO:\s*(.+?)\s*-\s*R\$\s*([\d,]+\.?\d*)/);
                if (match) {
                    const descricaoServico = match[1].trim();
                    const valor = parseFloat(match[2].replace(',', '.'));
                    servicos.push({ descricao: descricaoServico, valor });
                }
            } else if (itemTrimmed.startsWith('PEÇA:')) {
                const match = itemTrimmed.match(/PEÇA:\s*(.+?)\s*-\s*Qtd:\s*(\d+)\s*-\s*Valor unit:\s*R\$\s*([\d,]+\.?\d*)/);
                if (match) {
                    const nome = match[1].trim();
                    const quantidade = parseInt(match[2]);
                    const valorUnitario = parseFloat(match[3].replace(',', '.'));
                    const valorTotal = quantidade * valorUnitario;
                    pecas.push({ nome, quantidade, valor_unitario: valorUnitario, valor_total: valorTotal });
                }
            }
        });
        
        return { servicos, pecas };
    }

    async validarOrcamento(id) {
        try {
            const response = await fetch(`${this.apiUrl}/${id}/validar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Erro ao validar orçamento');
            }
            
            const result = await response.json();

            if (result.success) {
                this.showNotification(
                    `✅ ${result.message}`,
                    'success'
                );
                
                // Perguntar se deseja visualizar a OS criada
                const visualizarOS = confirm(
                    `Orçamento validado com sucesso!\n\n` +
                    `📋 Ordem de Serviço #${result.data.ordem_servico_cod} criada\n\n` +
                    `🔄 Deseja visualizar as Ordens de Serviço agora?`
                );
                
                if (visualizarOS) {
                    window.location.href = '../os/os-consulta.html';
                } else {
                    this.loadOrcamentos(); // Recarregar lista
                }
            } else {
                throw new Error(result.message || 'Erro desconhecido');
            }
        } catch (error) {
            console.error('Erro ao validar orçamento:', error);
            this.showNotification(
                `❌ Erro ao validar orçamento: ${error.message}`,
                'error'
            );
        }
    }

    async rejeitarOrcamentoComMotivo(id, parametros) {
        try {
            const response = await fetch(`${this.apiUrl}/${id}/rejeitar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    motivo: parametros.motivo,
                    observacao: parametros.observacao
                })
            });
            
            if (!response.ok) {
                throw new Error('Erro ao rejeitar orçamento');
            }
            
            const result = await response.json();

            if (result.success) {
                this.showNotification(
                    `✅ ${result.message}`,
                    'success'
                );
                
                this.loadOrcamentos(); // Recarregar lista
            } else {
                throw new Error(result.message || 'Erro desconhecido');
            }
        } catch (error) {
            console.error('Erro ao rejeitar orçamento:', error);
            this.showNotification(
                `❌ Erro ao rejeitar orçamento: ${error.message}`,
                'error'
            );
            throw error;
        }
    }

    async rejeitarOrcamento(id) {
        // Método mantido para compatibilidade, mas redireciona para o modal
        await this.abrirModalRejeicao(id);
    }

    async abrirModalValidacao(orcamentoId) {
        try {
            // Buscar dados completos do orçamento
            const response = await fetch(`${this.apiUrl}/${orcamentoId}`);
            if (!response.ok) throw new Error('Erro ao buscar orçamento');
            
            const result = await response.json();
            const orcamento = result.data;

            // Buscar motocicletas disponíveis para o cliente
            const motocicletasResponse = await fetch(`/api/motocicletas?cliente_cpf=${orcamento.cliente_cpf}`);
            const motocicletasResult = await motocicletasResponse.json();
            const motocicletas = motocicletasResult.data || [];

            this.criarModalValidacao(orcamento, motocicletas);

        } catch (error) {
            console.error('Erro ao carregar dados do orçamento:', error);
            this.showNotification('Erro ao carregar dados do orçamento', 'error');
        }
    }

    criarModalValidacao(orcamento, motocicletas) {
        // Remover modal existente se houver
        const modalExistente = document.getElementById('modal-validacao-orcamento');
        if (modalExistente) {
            modalExistente.remove();
        }

        const modalHtml = `
            <div class="modal fade" id="modal-validacao-orcamento" tabindex="-1" data-bs-backdrop="static">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">
                                <i class='bx bx-check-shield me-2'></i>
                                Validar Orçamento #${orcamento.id}
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        
                        <div class="modal-body">
                            <!-- Informações do Orçamento -->
                            <div class="card mb-4">
                                <div class="card-header bg-light">
                                    <h6 class="mb-0"><i class='bx bx-file-blank me-2'></i>Detalhes do Orçamento</h6>
                                </div>
                                <div class="card-body">
                                    <div class="row">
                                        <div class="col-md-6">
                                            <p><strong>Cliente:</strong> ${orcamento.cliente_nome}</p>
                                            <p><strong>CPF:</strong> ${orcamento.cliente_cpf}</p>
                                            <p><strong>Status Atual:</strong> 
                                                <span class="badge bg-warning">${this.getStatusBadge(orcamento.status)}</span>
                                            </p>
                                        </div>
                                        <div class="col-md-6">
                                            <p><strong>Valor:</strong> R$ ${parseFloat(orcamento.valor).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                                            <p><strong>Validade:</strong> ${new Date(orcamento.validade).toLocaleDateString('pt-BR')}</p>
                                            <p><strong>Data Criação:</strong> ${new Date(orcamento.data_criacao).toLocaleDateString('pt-BR')}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Seleção de Motocicleta -->
                            <div class="card mb-4">
                                <div class="card-header bg-light">
                                    <h6 class="mb-0"><i class='bx bx-car me-2'></i>Selecionar Motocicleta para a OS</h6>
                                </div>
                                <div class="card-body">
                                    ${motocicletas.length > 0 ? `
                                        <div class="form-group mb-3">
                                            <label for="motocicleta-select" class="form-label">Motocicleta <span class="text-danger">*</span></label>
                                            <select class="form-select" id="motocicleta-select" required>
                                                <option value="">Selecione uma motocicleta...</option>
                                                ${motocicletas.map(moto => `
                                                    <option value="${moto.placa}" ${moto.placa === orcamento.motocicleta_placa ? 'selected' : ''}>
                                                        ${moto.placa} - ${moto.marca_nome || 'Sem marca'} ${moto.modelo} (${moto.ano})
                                                    </option>
                                                `).join('')}
                                            </select>
                                            <div class="form-text">A motocicleta selecionada será vinculada à nova Ordem de Serviço</div>
                                        </div>
                                    ` : `
                                        <div class="alert alert-warning">
                                            <i class='bx bx-exclamation-triangle me-2'></i>
                                            Nenhuma motocicleta encontrada para este cliente. É necessário cadastrar uma motocicleta antes de validar o orçamento.
                                            <div class="mt-2">
                                                <a href="../motos/motos-cadastro.html" class="btn btn-sm btn-warning" target="_blank">
                                                    <i class='bx bx-plus me-1'></i>Cadastrar Motocicleta
                                                </a>
                                            </div>
                                        </div>
                                    `}
                                </div>
                            </div>

                            <!-- Configurações da OS -->
                            <div class="card mb-4">
                                <div class="card-header bg-light">
                                    <h6 class="mb-0"><i class='bx bx-cog me-2'></i>Configurações da Ordem de Serviço</h6>
                                </div>
                                <div class="card-body">
                                    <div class="form-group mb-3">
                                        <label for="os-titulo" class="form-label">Título da OS</label>
                                        <input type="text" class="form-control" id="os-titulo" 
                                               value="Orçamento #${orcamento.id} - ${orcamento.cliente_nome}">
                                    </div>
                                    
                                    <div class="form-group mb-3">
                                        <label for="os-observacao" class="form-label">Observações</label>
                                        <textarea class="form-control" id="os-observacao" rows="3" 
                                                  placeholder="Observações adicionais para a OS...">OS criada automaticamente a partir da validação do orçamento #${orcamento.id}</textarea>
                                    </div>

                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" id="transferir-itens" checked>
                                        <label class="form-check-label" for="transferir-itens">
                                            Transferir itens do orçamento para a OS
                                        </label>
                                        <div class="form-text">Se marcado, os itens (peças/serviços) do orçamento serão transferidos para a nova OS</div>
                                    </div>
                                </div>
                            </div>

                            <!-- Resumo da Ação -->
                            <div class="alert alert-info">
                                <h6><i class='bx bx-info-circle me-2'></i>Resumo da Validação</h6>
                                <ul class="mb-0">
                                    <li>O orçamento será marcado como <strong>VALIDADO</strong></li>
                                    <li>Uma nova Ordem de Serviço será criada automaticamente</li>
                                    <li>A OS será iniciada com status <strong>"Em Andamento"</strong></li>
                                    <li>Os itens do orçamento serão transferidos para a OS (se selecionado)</li>
                                    <li><strong>Esta ação não pode ser desfeita</strong></li>
                                </ul>
                            </div>
                        </div>
                        
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class='bx bx-x me-1'></i>Cancelar
                            </button>
                            <button type="button" class="btn btn-success" id="confirmar-validacao" ${motocicletas.length === 0 ? 'disabled' : ''}>
                                <i class='bx bx-check me-1'></i>Validar Orçamento
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Adicionar modal ao DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Configurar eventos
        this.configurarEventosModalValidacao(orcamento.id);
        
        // Mostrar modal
        const modalElement = document.getElementById('modal-validacao-orcamento');
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
        
        // Armazenar referência do modal para uso posterior
        modalElement._bootstrapModal = modal;
    }

    configurarEventosModalValidacao(orcamentoId) {
        const modal = document.getElementById('modal-validacao-orcamento');
        const btnConfirmar = modal.querySelector('#confirmar-validacao');
        const selectMoto = modal.querySelector('#motocicleta-select');

        // Habilitar/desabilitar botão conforme seleção de motocicleta
        if (selectMoto) {
            selectMoto.addEventListener('change', () => {
                btnConfirmar.disabled = !selectMoto.value;
            });
        }

        // Confirmar validação
        btnConfirmar.addEventListener('click', async () => {
            const motocicletaPlaca = selectMoto?.value;
            const titulo = modal.querySelector('#os-titulo').value;
            const observacao = modal.querySelector('#os-observacao').value;
            const transferirItens = modal.querySelector('#transferir-itens').checked;

            if (!motocicletaPlaca) {
                this.showNotification('Selecione uma motocicleta para continuar', 'warning');
                return;
            }

            // Desabilitar botão durante processamento
            btnConfirmar.disabled = true;
            btnConfirmar.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Processando...';

            try {
                await this.validarOrcamentoComParametros(orcamentoId, {
                    motocicletaPlaca,
                    titulo,
                    observacao,
                    transferirItens
                });

                // Fechar modal
                const modalElement = document.getElementById('modal-validacao-orcamento');
                if (modalElement._bootstrapModal) {
                    modalElement._bootstrapModal.hide();
                } else {
                    modalElement.remove();
                }
                
            } catch (error) {
                // Reabilitar botão em caso de erro
                btnConfirmar.disabled = false;
                btnConfirmar.innerHTML = '<i class="bx bx-check me-1"></i>Validar Orçamento';
            }
        });
    }

    async abrirModalRejeicao(orcamentoId) {
        try {
            // Buscar dados do orçamento
            const response = await fetch(`${this.apiUrl}/${orcamentoId}`);
            if (!response.ok) throw new Error('Erro ao buscar orçamento');
            
            const result = await response.json();
            const orcamento = result.data;

            this.criarModalRejeicao(orcamento);

        } catch (error) {
            console.error('Erro ao carregar dados do orçamento:', error);
            this.showNotification('Erro ao carregar dados do orçamento', 'error');
        }
    }

    criarModalRejeicao(orcamento) {
        // Remover modal existente se houver
        const modalExistente = document.getElementById('modal-rejeicao-orcamento');
        if (modalExistente) {
            modalExistente.remove();
        }

        const modalHtml = `
            <div class="modal fade" id="modal-rejeicao-orcamento" tabindex="-1" data-bs-backdrop="static">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-danger text-white">
                            <h5 class="modal-title">
                                <i class='bx bx-x-circle me-2'></i>
                                Rejeitar Orçamento #${orcamento.id}
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        
                        <div class="modal-body">
                            <!-- Informações do Orçamento -->
                            <div class="card mb-4">
                                <div class="card-header bg-light">
                                    <h6 class="mb-0"><i class='bx bx-file-blank me-2'></i>Detalhes do Orçamento</h6>
                                </div>
                                <div class="card-body">
                                    <div class="row">
                                        <div class="col-md-6">
                                            <p><strong>Cliente:</strong> ${orcamento.cliente_nome}</p>
                                            <p><strong>CPF:</strong> ${orcamento.cliente_cpf}</p>
                                            <p><strong>Status Atual:</strong> 
                                                <span class="badge bg-warning">${this.getStatusBadge(orcamento.status)}</span>
                                            </p>
                                        </div>
                                        <div class="col-md-6">
                                            <p><strong>Valor:</strong> R$ ${parseFloat(orcamento.valor).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                                            <p><strong>Validade:</strong> ${new Date(orcamento.validade).toLocaleDateString('pt-BR')}</p>
                                            <p><strong>Data Criação:</strong> ${new Date(orcamento.data_criacao).toLocaleDateString('pt-BR')}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Motivo da Rejeição -->
                            <div class="card mb-4">
                                <div class="card-header bg-light">
                                    <h6 class="mb-0"><i class='bx bx-message-detail me-2'></i>Motivo da Rejeição</h6>
                                </div>
                                <div class="card-body">
                                    <div class="form-group mb-3">
                                        <label for="motivo-rejeicao" class="form-label">Motivo <span class="text-danger">*</span></label>
                                        <select class="form-select" id="motivo-rejeicao" required>
                                            <option value="">Selecione um motivo...</option>
                                            <option value="Valor muito alto">Valor muito alto</option>
                                            <option value="Peças não disponíveis">Peças não disponíveis</option>
                                            <option value="Cliente não aprovou">Cliente não aprovou</option>
                                            <option value="Prazo de validade vencido">Prazo de validade vencido</option>
                                            <option value="Erro no orçamento">Erro no orçamento</option>
                                            <option value="Outros">Outros</option>
                                        </select>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="observacao-rejeicao" class="form-label">Observações</label>
                                        <textarea class="form-control" id="observacao-rejeicao" rows="4" 
                                                  placeholder="Descreva detalhadamente o motivo da rejeição..."></textarea>
                                        <div class="form-text">Essas informações ficarão registradas no sistema</div>
                                    </div>
                                </div>
                            </div>

                            <!-- Aviso sobre a Ação -->
                            <div class="alert alert-danger">
                                <h6><i class='bx bx-error-circle me-2'></i>Atenção</h6>
                                <ul class="mb-0">
                                    <li>O orçamento será marcado como <strong>REJEITADO</strong></li>
                                    <li>Esta ação <strong>não pode ser desfeita</strong></li>
                                    <li>O cliente será notificado sobre a rejeição</li>
                                    <li>O orçamento não poderá mais ser validado</li>
                                </ul>
                            </div>
                        </div>
                        
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class='bx bx-x me-1'></i>Cancelar
                            </button>
                            <button type="button" class="btn btn-danger" id="confirmar-rejeicao" disabled>
                                <i class='bx bx-x-circle me-1'></i>Rejeitar Orçamento
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Adicionar modal ao DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Configurar eventos
        this.configurarEventosModalRejeicao(orcamento.id);
        
        // Mostrar modal
        const modalElement = document.getElementById('modal-rejeicao-orcamento');
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
        
        // Armazenar referência do modal para uso posterior
        modalElement._bootstrapModal = modal;
    }

    configurarEventosModalRejeicao(orcamentoId) {
        const modal = document.getElementById('modal-rejeicao-orcamento');
        const btnConfirmar = modal.querySelector('#confirmar-rejeicao');
        const selectMotivo = modal.querySelector('#motivo-rejeicao');

        // Habilitar/desabilitar botão conforme seleção de motivo
        selectMotivo.addEventListener('change', () => {
            btnConfirmar.disabled = !selectMotivo.value;
        });

        // Confirmar rejeição
        btnConfirmar.addEventListener('click', async () => {
            const motivo = selectMotivo.value;
            const observacao = modal.querySelector('#observacao-rejeicao').value;

            if (!motivo) {
                this.showNotification('Selecione um motivo para continuar', 'warning');
                return;
            }

            // Desabilitar botão durante processamento
            btnConfirmar.disabled = true;
            btnConfirmar.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Processando...';

            try {
                await this.rejeitarOrcamentoComMotivo(orcamentoId, {
                    motivo,
                    observacao
                });

                // Fechar modal
                const modalElement = document.getElementById('modal-rejeicao-orcamento');
                if (modalElement._bootstrapModal) {
                    modalElement._bootstrapModal.hide();
                } else {
                    modalElement.remove();
                }
                
            } catch (error) {
                // Reabilitar botão em caso de erro
                btnConfirmar.disabled = false;
                btnConfirmar.innerHTML = '<i class="bx bx-x-circle me-1"></i>Rejeitar Orçamento';
            }
        });
    }

    showNotification(message, type = 'info') {
        // Remove qualquer notificação existente
        const existingNotification = document.querySelector('.notification-toast');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Criar notificação
        const notification = document.createElement('div');
        notification.className = `notification-toast alert alert-${this.getBootstrapClass(type)} alert-dismissible fade show position-fixed`;
        notification.style.cssText = `
            top: 20px;
            right: 20px;
            z-index: 9999;
            min-width: 300px;
            max-width: 500px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        `;
        
        notification.innerHTML = `
            <div class="d-flex align-items-start">
                <div class="flex-grow-1">
                    ${message.replace(/\n/g, '<br>')}
                </div>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;

        // Adicionar ao DOM
        document.body.appendChild(notification);

        // Auto remover após 5 segundos
        setTimeout(() => {
            if (notification && notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    getBootstrapClass(type) {
        const classMap = {
            'success': 'success',
            'error': 'danger',
            'warning': 'warning',
            'info': 'info'
        };
        return classMap[type] || 'info';
    }

    getIconClass(type) {
        const iconMap = {
            'success': 'bx-check-circle',
            'error': 'bx-error-circle',
            'warning': 'bx-error',
            'info': 'bx-info-circle'
        };
        return iconMap[type] || 'bx-info-circle';
    }
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    window.orcamentoController = new OrcamentoController();
});
