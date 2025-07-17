class OrdemController {
    constructor() {
        this.baseURL = 'http://localhost:3000/api';
        this.apiUrl = this.baseURL + '/ordens';
        this.currentSort = { column: 'cod', direction: 'desc' }; // Initialize default sort
        this.setupEventListeners();
        this.loadOrdens();
    }

    setupEventListeners() {
        // Filter elements
        this.filterText = document.getElementById('filter-text');
        this.filterStatus = document.getElementById('filter-status');
        this.filterData = document.getElementById('filter-data');
        this.clearFiltersBtn = document.getElementById('clear-filters');

        // Add event listeners
        if (this.filterText) {
            this.filterText.addEventListener('input', () => this.renderTable());
        }
        if (this.filterStatus) {
            this.filterStatus.addEventListener('change', () => this.renderTable());
        }
        if (this.filterData) {
            this.filterData.addEventListener('change', () => this.renderTable());
        }
        if (this.clearFiltersBtn) {
            this.clearFiltersBtn.addEventListener('click', () => this.clearFilters());
        }

        // Setup sortable headers
        const sortableHeaders = document.querySelectorAll('.sortable');
        sortableHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const column = header.getAttribute('data-column');
                this.sortBy(column);
            });
        });

        // Setup action listeners
        document.addEventListener('click', async (e) => {
            const deleteButton = e.target.closest('.excluir-ordem');
            if (deleteButton) {
                e.preventDefault();
                e.stopPropagation(); // Prevent event bubbling
                const id = deleteButton.dataset.id;
                await this.confirmarExclusao(id);
            }
        });
    }

    async loadOrdens() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(this.apiUrl, {
                headers: { Authorization: 'Bearer ' + token }
            });
            
            if (!response.ok) throw new Error('Erro ao carregar ordens de serviço');
            
            const result = await response.json();
            if (!result.success) throw new Error(result.message || 'Erro desconhecido');
            
            this.ordens = result.data;
            this.renderTable();
        } catch (error) {
            console.error('Erro ao carregar ordens:', error);
            alert('Erro ao carregar ordens de serviço');
            this.showError('Erro ao carregar ordens de serviço');
        }
    }

    showError(message) {
        const tbody = document.querySelector('#ordens-table tbody');
        const mobileCards = document.querySelector('#mobile-cards');
        
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="7">' + message + '</td></tr>';
        }
        
        if (mobileCards) {
            const errorCard = document.createElement('div');
            errorCard.className = 'mobile-card';
            const errorRow = document.createElement('div');
            errorRow.className = 'mobile-card-row';
            const errorSpan = document.createElement('span');
            errorSpan.textContent = message;
            errorRow.appendChild(errorSpan);
            errorCard.appendChild(errorRow);
            mobileCards.innerHTML = '';
            mobileCards.appendChild(errorCard);
        }
    }

    renderTable() {
        if (!this.ordens) return;

        const filtered = this.filterOrdens(this.ordens);
        const sorted = this.sortOrdens(filtered);
        this.renderOrdens(sorted);
    }

    filterOrdens(ordens) {
        const text = this.filterText ? this.filterText.value.toLowerCase() : '';
        const status = this.filterStatus ? this.filterStatus.value : '';
        const dataFiltro = this.filterData ? this.filterData.value : '';

        return ordens.filter(ordem => {
            let match = true;

            if (text) {
                const searchableFields = [
                    'OS-' + String(ordem.cod).padStart(3, '0'),
                    ordem.titulo || '',
                    ordem.cliente_nome || '',
                    ordem.motocicleta_placa || ''
                ].map(field => field.toLowerCase());

                match = searchableFields.some(field => field.includes(text));
            }

            if (status) {
                match = match && ordem.status === status;
            }

            if (dataFiltro) {
                const dataOrdem = new Date(ordem.data);
                const dataFiltroObj = new Date(dataFiltro);
                match = match && (
                    dataOrdem.getFullYear() === dataFiltroObj.getFullYear() &&
                    dataOrdem.getMonth() === dataFiltroObj.getMonth() &&
                    dataOrdem.getDate() === dataFiltroObj.getDate()
                );
            }
            
            return match;
        });
    }

    sortOrdens(ordens) {
        return [...ordens].sort((a, b) => {
            const aValue = this.getSortValue(a);
            const bValue = this.getSortValue(b);
            return this.currentSort.direction === 'asc' ? aValue - bValue : bValue - aValue;
        });
    }

    getSortValue(ordem) {
        switch (this.currentSort.column) {
            case 'cod':
                return parseInt(ordem.cod) || 0;
            case 'data':
                return new Date(ordem.data || 0).getTime();
            default:
                return (ordem[this.currentSort.column] || '').toString().toLowerCase();
        }
    }

    renderOrdens(ordens) {
        const tbody = document.querySelector('#ordens-table tbody');
        const mobileCards = document.querySelector('#mobile-cards');
        
        if (!tbody || !mobileCards) return;
        
        tbody.innerHTML = '';
        mobileCards.innerHTML = '';
        
        if (ordens.length === 0) {
            this.showError('Nenhuma ordem de serviço encontrada');
            return;
        }

        ordens.forEach(ordem => {
            tbody.appendChild(this.createTableRow(ordem));
            mobileCards.appendChild(this.createMobileCard(ordem));
        });
    }

    createTableRow(ordem) {
        const tr = document.createElement('tr');
        const cells = [
            { text: 'OS-' + ordem.cod.toString().padStart(3, '0'), wrap: true },
            { text: ordem.titulo, wrap: true },
            { text: ordem.cliente_nome, wrap: true },
            { text: ordem.motocicleta_placa, wrap: true },
            { text: this.formatDate(ordem.data), wrap: false },
            { 
                html: '<span class="status-' + this.getStatusClass(ordem.status) + '">' + 
                      this.getStatusText(ordem.status) + '</span>',
                wrap: false
            },
            { html: '<div class="actions">' + this.getActionsForStatus(ordem) + '</div>', wrap: false }
        ];

        cells.forEach(cell => {
            const td = document.createElement('td');
            if (cell.wrap) {
                const p = document.createElement('p');
                p.textContent = cell.text;
                td.appendChild(p);
            } else if (cell.html) {
                td.innerHTML = cell.html;
            } else {
                td.textContent = cell.text;
            }
            tr.appendChild(td);
        });

        return tr;
    }

    createMobileCard(ordem) {
        const card = document.createElement('div');
        card.className = 'mobile-card';

        const fields = [
            { label: 'Código', value: 'OS-' + ordem.cod.toString().padStart(3, '0') },
            { label: 'Título', value: ordem.titulo },
            { label: 'Cliente', value: ordem.cliente_nome },
            { label: 'Placa', value: ordem.motocicleta_placa },
            { label: 'Data', value: this.formatDate(ordem.data) }
        ];

        fields.forEach(field => {
            const row = document.createElement('div');
            row.className = 'mobile-card-row';

            const label = document.createElement('span');
            label.className = 'mobile-card-label';
            label.textContent = field.label + ':';

            const value = document.createElement('span');
            value.className = 'mobile-card-value';
            value.textContent = field.value;

            row.appendChild(label);
            row.appendChild(value);
            card.appendChild(row);
        });

        // Add status
        const statusRow = document.createElement('div');
        statusRow.className = 'mobile-card-row';
        
        const statusLabel = document.createElement('span');
        statusLabel.className = 'mobile-card-label';
        statusLabel.textContent = 'Status:';
        
        const statusValue = document.createElement('span');
        statusValue.className = 'status-' + this.getStatusClass(ordem.status);
        statusValue.textContent = this.getStatusText(ordem.status);
        
        statusRow.appendChild(statusLabel);
        statusRow.appendChild(statusValue);
        card.appendChild(statusRow);

        // Add actions
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'card-actions';
        
        // Visualizar é sempre permitido
        actionsDiv.innerHTML = `
            <button class="action-btn" onclick="ordemController.visualizarOrdem('${ordem.cod}')" title="Visualizar">
                <i class='bx bx-show'></i>
            </button>
        `;
        
        // Editar e excluir só são permitidos se não estiver validada ou rejeitada
        if (!['Validada', 'Rejeitada'].includes(ordem.status)) {
            actionsDiv.innerHTML += `
                <button class="action-btn" onclick="window.location.href='os-ajustar.html?cod=${ordem.cod}'" title="Editar">
                    <i class='bx bx-edit'></i>
                </button>
                <button class="action-btn excluir-ordem" data-id="${ordem.cod}" title="Excluir">
                    <i class='bx bx-trash'></i>
                </button>
            `;
        }
        
        card.appendChild(actionsDiv);

        return card;
    }

    formatDate(date) {
        return date ? new Date(date).toLocaleDateString('pt-BR') : 'N/A';
    }

    getStatusText(status) {
        const map = {
            'Em Andamento': 'Em Andamento',
            'Ajuste Pendente': 'Ajuste Pendente',
            'Validação Pendente': 'Validação Pendente',
            'Validada': 'Validada',
            'Rejeitada': 'Rejeitada'
        };
        return map[status] || status;
    }

    getStatusClass(status) {
        const map = {
            'Em Andamento': 'progress',
            'Ajuste Pendente': 'pending',
            'Validação Pendente': 'validation-pending',
            'Validada': 'completed',
            'Rejeitada': 'rejected'
        };
        return map[status] || 'default';
    }

    getActionsForStatus(ordem) {
        const actions = [];
        
        // Visualizar é sempre permitido
        actions.push(`
            <button class="action-btn" onclick="ordemController.visualizarOrdem('${ordem.cod}')" title="Visualizar">
                <i class='bx bx-show'></i>
            </button>
        `);
        
        // Editar e excluir só são permitidos se não estiver validada ou rejeitada
        if (!['Validada', 'Rejeitada'].includes(ordem.status)) {
            actions.push(`
                <button class="action-btn" onclick="window.location.href='os-ajustar.html?cod=${ordem.cod}'" title="Editar">
                    <i class='bx bx-edit'></i>
                </button>
                <button class="action-btn excluir-ordem" data-id="${ordem.cod}" title="Excluir">
                    <i class='bx bx-trash'></i>
                </button>
            `);
        }
        
        return actions.join('');
    }

    async visualizarOrdem(id) {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${this.apiUrl}/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Erro ao buscar ordem de serviço');
            
            const json = await res.json();
            const ordem = json.data;

            this.mostrarModalVisualizacao(ordem);
            
        } catch (e) {
            console.error('Erro ao visualizar ordem:', e);
            alert('Erro ao visualizar ordem de serviço');
        }
    }

    mostrarModalVisualizacao(ordem) {
        // Processar peças se existirem
        let pecasHTML = '';
        if (ordem.pecas && ordem.pecas.length > 0) {
            pecasHTML = `
                <div class="section-divider">
                    <h4>Peças Utilizadas</h4>
                    <div class="items-list">
                        ${ordem.pecas.map(peca => `
                            <div class="item-row">
                                <span class="item-description">${peca.nome} (Qtd: ${peca.qtd_pecas})</span>
                                <span class="item-value">R$ ${parseFloat(peca.valor_total || 0).toFixed(2)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // Garantir que os valores sejam números
        const valorPecas = parseFloat(ordem.valor_total_pecas || 0);
        const valorMaoDeObra = parseFloat(ordem.valor_mao_de_obra || 0);
        const valorTotal = parseFloat(ordem.valor_total_os || 0);

        const modalHtml = `
            <div id="modal-visualizar" class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Detalhes da Ordem de Serviço OS-${String(ordem.cod).padStart(3, '0')}</h3>
                        <button class="modal-close" onclick="document.getElementById('modal-visualizar').remove()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="basic-info">
                            <p><strong>Título:</strong> ${ordem.titulo || 'N/A'}</p>
                            <p><strong>Cliente:</strong> ${ordem.cliente_nome || 'N/A'}</p>
                            <p><strong>CPF:</strong> ${ordem.cliente_cpf || 'N/A'}</p>
                            <p><strong>Motocicleta:</strong> ${ordem.motocicleta_modelo || 'N/A'}</p>
                            <p><strong>Placa:</strong> ${ordem.motocicleta_placa || 'N/A'}</p>
                            <p><strong>Data:</strong> ${ordem.data ? new Date(ordem.data).toLocaleDateString('pt-BR') : 'N/A'}</p>
                            <p><strong>Status:</strong> <span class="status-${this.getStatusClass(ordem.status)}">${this.getStatusText(ordem.status)}</span></p>
                        </div>

                        <div class="section-divider">
                            <h4>Descrição do Serviço</h4>
                            <div class="items-list">
                                <p>${ordem.descricao || 'Nenhuma descrição disponível'}</p>
                            </div>
                        </div>
                        
                        ${pecasHTML}
                        
                        <div class="section-divider">
                            <h4>Valores</h4>
                            <div class="items-list">
                                <div class="item-row">
                                    <span class="item-description">Valor das Peças</span>
                                    <span class="item-value">R$ ${valorPecas.toFixed(2)}</span>
                                </div>
                                <div class="item-row">
                                    <span class="item-description">Valor Mão de Obra</span>
                                    <span class="item-value">R$ ${valorMaoDeObra.toFixed(2)}</span>
                                </div>
                            </div>
                            <div class="total-geral">
                                <strong>Total Geral: R$ ${valorTotal.toFixed(2)}</strong>
                            </div>
                        </div>

                        ${ordem.observacao ? `
                            <div class="section-divider">
                                <h4>Observações</h4>
                                <div class="items-list">
                                    <p>${ordem.observacao}</p>
                                </div>
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

    async confirmarExclusao(id) {
        // Remover modal existente se houver
        const existingModal = document.getElementById('modal-confirm-delete');
        if (existingModal) existingModal.remove();

        // Criar e mostrar o modal de confirmação
        const modalHtml = `
            <div id="modal-confirm-delete" class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Confirmar Exclusão</h3>
                        <button class="modal-close" onclick="document.getElementById('modal-confirm-delete').remove()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p>Tem certeza que deseja excluir esta ordem de serviço? Esta ação não pode ser desfeita.</p>
                        <div style="margin-top: 24px; display: flex; gap: 16px; justify-content: flex-end;">
                            <button id="btn-cancel-delete" class="btn btn-secondary">Cancelar</button>
                            <button id="btn-confirm-delete" class="btn btn-danger">Excluir</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Configurar eventos do modal
        const modal = document.getElementById('modal-confirm-delete');
        const btnCancel = document.getElementById('btn-cancel-delete');
        const btnConfirm = document.getElementById('btn-confirm-delete');

        // Fechar modal ao clicar no botão Cancelar
        btnCancel.onclick = () => modal.remove();

        // Fechar modal ao clicar fora dele
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };

        // Configurar ação de exclusão
        btnConfirm.onclick = async () => {
            try {
                btnConfirm.disabled = true;
                btnConfirm.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Excluindo...';
                
            const token = localStorage.getItem('token');
            const response = await fetch(this.apiUrl + '/' + id, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer ' + token
                }
            });
            
            const result = await response.json();
                
                if (!response.ok || !result.success) {
                    throw new Error(result.message || 'Erro ao excluir ordem de serviço');
                }

                // Remover o modal
                modal.remove();

                // Mostrar notificação de sucesso
                this.showNotification('Ordem de serviço excluída com sucesso!', 'success');
                
                // Remover a ordem excluída da lista local
                this.ordens = this.ordens.filter(ordem => ordem.cod !== parseInt(id));
                
                // Atualizar a tabela sem fazer nova chamada à API
                this.renderTable();
                
        } catch (error) {
            console.error('Erro ao excluir ordem:', error);
                this.showNotification(error.message || 'Erro ao excluir ordem de serviço', 'error');
            } finally {
                if (modal) modal.remove();
        }
        };
    }

    clearFilters() {
        if (this.filterText) this.filterText.value = '';
        if (this.filterStatus) this.filterStatus.value = '';
        if (this.filterData) this.filterData.value = '';
        this.renderTable();
    }

    sortBy(column) {
        if (this.currentSort.column === column) {
            // If clicking the same column, toggle direction
            this.currentSort.direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            // If clicking a new column, set it with default descending direction
            this.currentSort.column = column;
            this.currentSort.direction = 'desc';
        }

        // Update sort indicators in the UI
        document.querySelectorAll('.sortable').forEach(header => {
            header.classList.remove('asc', 'desc');
            if (header.getAttribute('data-column') === column) {
                header.classList.add(this.currentSort.direction);
            }
        });

        this.renderTable();
    }
}