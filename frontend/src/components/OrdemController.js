class OrdemController {
    constructor() {
        this.apiUrl = 'http://localhost:3000/api/ordens';
        this.tableBody = document.querySelector('#ordens-table tbody');
        this.filterText = document.getElementById('filter-text');
        this.filterStatus = document.getElementById('filter-status');
        this.filterData = document.getElementById('filter-data');
        this.clearFiltersBtn = document.getElementById('clear-filters');
        this.novoBtn = document.querySelector('.btn-primary[href="os-cadastro.html"]');
        this.ordens = [];
        this.currentUser = this.getCurrentUser(); 

        this.currentSort = {
            column: 'data',
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

    sortOrdens(ordens) {
        return [...ordens].sort((a, b) => {
            const column = this.currentSort.column;
            const direction = this.currentSort.direction;
            
            let valueA = a[column];
            let valueB = b[column];

            switch (column) {
                case 'cod':
                    valueA = parseInt(valueA) || 0;
                    valueB = parseInt(valueB) || 0;
                    break;
                    
                case 'data':
                    valueA = new Date(valueA || 0);
                    valueB = new Date(valueB || 0);
                    break;
                    
                case 'titulo':
                case 'cliente_nome':
                case 'motocicleta_placa':
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

    getCurrentUser() {

        const userType = localStorage.getItem('userType') || 'Mecânico'; 
        return {
            tipo: userType, 
            nome: localStorage.getItem('userName') || 'Usuário'
        };
    }

    escapeHtml(text) {
        if (!text) return 'N/A';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    init() {
        this.loadOrdens();
        this.initSortableHeaders();
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
        if (this.novoBtn) {
            this.novoBtn.addEventListener('click', () => {
                window.location.href = 'os-cadastro.html';
            });
        }
    }

    async loadOrdens() {
        try {
            console.log('Carregando ordens de serviço da API...');
            const res = await fetch(this.apiUrl);
            console.log('Response status:', res.status);
            
            if (!res.ok) {
                throw new Error(`Erro HTTP: ${res.status}`);
            }
            
            const json = await res.json();
            console.log('Dados recebidos:', json);
            
            this.ordens = json.data || [];
            this.updateSortIcons(); 
            this.renderTable();
        } catch (e) {
            console.error('Erro ao carregar ordens de serviço:', e);
            alert(`Erro ao carregar dados: ${e.message}`);
            if (this.tableBody) {
                this.tableBody.innerHTML = '<tr><td colspan="7">Erro ao carregar ordens de serviço</td></tr>';
            }
        }
    }

    renderTable() {
        if (!this.tableBody) return;

        const text = this.filterText ? this.filterText.value.toLowerCase() : '';
        const status = this.filterStatus ? this.filterStatus.value : '';
        const dataFiltro = this.filterData ? this.filterData.value : '';

        const filtered = this.ordens.filter(o => {
            let match = true;

            if (text) {
                const codigo = `OS-${String(o.cod).padStart(3, '0')}`.toLowerCase();
                const cliente = (o.cliente_nome || '').toLowerCase();
                const placa = (o.motocicleta_placa || '').toLowerCase();
                const titulo = (o.titulo || '').toLowerCase();
                match = codigo.includes(text) || cliente.includes(text) || placa.includes(text) || titulo.includes(text);
            }

            if (status && status !== '') {
                match = match && (o.status === status);
            }

            if (dataFiltro && dataFiltro !== '') {
                const dataOrdem = new Date(o.data);
                const dataFiltroObj = new Date(dataFiltro);

                const dataOrdemStr = dataOrdem.toISOString().split('T')[0];
                const dataFiltroStr = dataFiltroObj.toISOString().split('T')[0];
                
                match = match && (dataOrdemStr === dataFiltroStr);
            }
            
            return match;
        });

        if (filtered.length === 0) {
            this.tableBody.innerHTML = '<tr><td colspan="7">Nenhuma ordem de serviço encontrada</td></tr>';
            return;
        }

        const sorted = this.sortOrdens(filtered);

        this.tableBody.innerHTML = sorted.map(o => `
            <tr>
                <td><p>OS-${String(o.cod).padStart(3, '0')}</p></td>
                <td><p>${o.titulo || 'N/A'}</p></td>
                <td><p>${o.cliente_nome || 'N/A'}</p></td>
                <td><p>${o.motocicleta_placa || 'N/A'}</p></td>
                <td>${o.data ? new Date(o.data).toLocaleDateString('pt-BR') : 'N/A'}</td>
                <td><span class="status-${this.getStatusClass(o.status)}">${o.status}</span></td>
                <td>
                    ${this.getActionsForStatus(o)}
                </td>
            </tr>
        `).join('');

        this.addActionListeners();
    }

    getActionsForStatus(ordem) {
        const actions = [];
        const isMecanico = this.currentUser.tipo === 'Mecânico';
        const isSecretaria = this.currentUser.tipo === 'Atendente';

        switch(ordem.status) {
            case 'Em Andamento':
            case 'Ajuste Pendente':
                
                actions.push(`<a href="#" class="action-icon" data-id="${ordem.cod}" title="Visualizar"><i class='bx bx-show'></i></a>`);
                actions.push(`<a href="os-ajustar.html?id=${ordem.cod}" class="action-icon" title="Editar"><i class='bx bx-edit'></i></a>`);

                if (isMecanico) {
                    actions.push(`<a href="#" class="action-icon" data-id="${ordem.cod}" title="Enviar para Validação"><i class='bx bx-check-circle'></i></a>`);
                }
                break;
                
            case 'Validação Pendente':
            case 'ValidaÇão Pendente': 
                
                actions.push(`<a href="#" class="action-icon" data-id="${ordem.cod}" title="Visualizar"><i class='bx bx-show'></i></a>`);
                actions.push(`<a href="os-ajustar.html?id=${ordem.cod}" class="action-icon" title="Editar"><i class='bx bx-edit'></i></a>`);

                if (isSecretaria) {
                    actions.push(`<a href="#" class="action-icon" data-id="${ordem.cod}" title="Validar OS"><i class='bx bx-check-double'></i></a>`);
                    actions.push(`<a href="#" class="action-icon" data-id="${ordem.cod}" title="Rejeitar OS"><i class='bx bx-x-circle'></i></a>`);
                }
                break;
                
            case 'Validado':
            case 'Validada':
                
                actions.push(`<a href="#" class="action-icon" data-id="${ordem.cod}" title="Visualizar Completo"><i class='bx bx-show'></i></a>`);
                break;
                
            case 'Rejeitado':
            case 'Rejeitada':
                
                actions.push(`<a href="#" class="action-icon" data-id="${ordem.cod}" title="Visualizar Completo"><i class='bx bx-show'></i></a>`);
                break;
                
            default:
                
                actions.push(`<a href="#" class="action-icon" data-id="${ordem.cod}" title="Visualizar"><i class='bx bx-show'></i></a>`);
                break;
        }
        
        return `<div class="actions">${actions.join('')}</div>`;
    }

    getStatusClass(status) {
        const map = {
            'Em Andamento': 'progress',
            'Ajuste Pendente': 'pending',
            'Validado': 'completed',
            'Validada': 'completed',
            'Validação Pendente': 'validation-pending',
            'ValidaÇão Pendente': 'validation-pending', 
            'ValidaþÒo Pendente': 'validation-pending', 
            'Rejeitado': 'rejected',
            'Rejeitada': 'rejected'
        };
        return map[status] || 'pending';
    }

    clearFilters() {
        if (this.filterText) this.filterText.value = '';
        if (this.filterStatus) this.filterStatus.value = '';
        if (this.filterData) this.filterData.value = '';
        this.renderTable();
    }

    addActionListeners() {
        
        this.tableBody.querySelectorAll('.action-icon[title*="Visualizar"]').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                const id = btn.getAttribute('data-id');
                const isCompleto = btn.getAttribute('title').includes('Completo');
                if (isCompleto) {
                    await this.visualizarOrdemCompleta(id);
                } else {
                    await this.visualizarOrdem(id);
                }
            });
        });

        this.tableBody.querySelectorAll('.action-icon[title*="Enviar"]').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                const id = btn.getAttribute('data-id');
                if (confirm('Deseja enviar esta ordem para validação?')) {
                    await this.atualizarStatusOrdem(id, 'Validação Pendente');
                }
            });
        });

        this.tableBody.querySelectorAll('.action-icon[title*="Validar"]').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                const id = btn.getAttribute('data-id');
                if (confirm('Deseja validar esta ordem de serviço?')) {
                    await this.atualizarStatusOrdem(id, 'Validada');
                }
            });
        });

        this.tableBody.querySelectorAll('.action-icon[title*="Rejeitar"]').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                const id = btn.getAttribute('data-id');
                if (confirm('Deseja rejeitar esta ordem de serviço?')) {
                    await this.atualizarStatusOrdem(id, 'Rejeitada');
                }
            });
        });

        this.tableBody.querySelectorAll('.continuar-ordem').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                const id = btn.getAttribute('data-id');
                if (confirm('Deseja continuar esta ordem de serviço?')) {
                    await this.atualizarStatusOrdem(id, 'Em Andamento');
                }
            });
        });
    }

    async visualizarOrdem(id) {
        try {
            const res = await fetch(`${this.apiUrl}/${id}`);
            if (!res.ok) throw new Error('Erro ao buscar ordem de serviço');
            
            const json = await res.json();
            const ordem = json.data;

            this.mostrarModalVisualizacao(ordem);
            
        } catch (e) {
            console.error('Erro ao visualizar ordem de serviço:', e);
            alert('Erro ao visualizar ordem de serviço');
        }
    }

    mostrarModalVisualizacao(ordem) {
        const modalHtml = `
            <div id="modal-visualizar" class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Detalhes da Ordem de Serviço OS-${String(ordem.cod).padStart(3, '0')}</h3>
                        <button class="modal-close" onclick="document.getElementById('modal-visualizar').remove()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p><strong>Título:</strong> ${ordem.titulo || 'N/A'}</p>
                        <p><strong>Cliente:</strong> ${ordem.cliente_nome || 'N/A'}</p>
                        <p><strong>CPF:</strong> ${ordem.cliente_cpf || 'N/A'}</p>
                        <p><strong>Motocicleta:</strong> ${ordem.motocicleta_modelo || 'N/A'}</p>
                        <p><strong>Placa:</strong> ${ordem.motocicleta_placa || 'N/A'}</p>
                        <p><strong>Ano:</strong> ${ordem.motocicleta_ano || 'N/A'}</p>
                        <p><strong>Cor:</strong> ${ordem.motocicleta_cor || 'N/A'}</p>
                        <p><strong>Data:</strong> ${ordem.data ? new Date(ordem.data).toLocaleDateString('pt-BR') : 'N/A'}</p>
                        <p><strong>Status:</strong> <span class="status-${this.getStatusClass(ordem.status)}">${ordem.status}</span></p>
                        <p><strong>Validada:</strong> ${ordem.validada ? 'Sim' : 'Não'}</p>
                        <p><strong>Descrição:</strong></p>
                        <p style="background: #f5f5f5; padding: 10px; border-radius: 5px; margin-top: 5px;">${ordem.descricao || 'N/A'}</p>
                        ${ordem.observacao ? `
                            <p><strong>Observação:</strong></p>
                            <p style="background: #f5f5f5; padding: 10px; border-radius: 5px; margin-top: 5px;">${ordem.observacao}</p>
                        ` : ''}
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

    async visualizarOrdemCompleta(id) {
        try {
            
            const resOrdem = await fetch(`${this.apiUrl}/${id}`);
            if (!resOrdem.ok) throw new Error('Erro ao buscar ordem de serviço');
            
            const jsonOrdem = await resOrdem.json();
            const ordem = jsonOrdem.data;

            const resOrcamentos = await fetch(`http://localhost:3000/api/orcamentos?ordem=${id}`);
            let orcamentos = [];
            if (resOrcamentos.ok) {
                const jsonOrcamentos = await resOrcamentos.json();
                orcamentos = jsonOrcamentos.data || [];
            }

            this.mostrarModalVisualizacaoCompleta(ordem, orcamentos);
            
        } catch (e) {
            console.error('Erro ao visualizar ordem de serviço completa:', e);
            alert('Erro ao visualizar ordem de serviço');
        }
    }

    mostrarModalVisualizacaoCompleta(ordem, orcamentos) {
        const statusClass = this.getStatusClass(ordem.status);
        
        let orcamentosHtml = '';
        if (orcamentos.length > 0) {
            orcamentosHtml = `
                <div class="orcamentos-section">
                    <h4>Orçamentos Vinculados</h4>
                    <div class="orcamentos-list">
                        ${orcamentos.map(orc => `
                            <div class="orcamento-item">
                                <p><strong>Orçamento #${orc.id}</strong></p>
                                <p>Valor: R$ ${orc.valor?.toFixed(2) || '0.00'}</p>
                                <p>Validade: ${orc.validade ? new Date(orc.validade).toLocaleDateString('pt-BR') : 'N/A'}</p>
                                <p>Status: <span class="status-orcamento-${orc.status?.toLowerCase()}">${this.getStatusOrcamentoText(orc.status)}</span></p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        } else {
            orcamentosHtml = '<p><em>Nenhum orçamento vinculado a esta ordem de serviço.</em></p>';
        }

        const modalHtml = `
            <div id="modal-visualizar-completa" class="modal-overlay">
                <div class="modal-content modal-large">
                    <div class="modal-header">
                        <h3>Ordem de Serviço OS-${String(ordem.cod).padStart(3, '0')} - Visualização Completa</h3>
                        <button class="modal-close" onclick="document.getElementById('modal-visualizar-completa').remove()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="ordem-detalhes">
                            <div class="detalhes-grid">
                                <div class="detalhes-coluna">
                                    <h4>Informações Gerais</h4>
                                    <p><strong>Título:</strong> ${ordem.titulo || 'N/A'}</p>
                                    <p><strong>Data:</strong> ${ordem.data ? new Date(ordem.data).toLocaleDateString('pt-BR') : 'N/A'}</p>
                                    <p><strong>Status:</strong> <span class="status-${statusClass}">${ordem.status}</span></p>
                                    <p><strong>Validada:</strong> ${ordem.validada ? 'Sim' : 'Não'}</p>
                                    <p><strong>Usuário Responsável:</strong> ${ordem.usuario_nome || 'N/A'}</p>
                                </div>
                                <div class="detalhes-coluna">
                                    <h4>Cliente e Motocicleta</h4>
                                    <p><strong>Cliente:</strong> ${ordem.cliente_nome || 'N/A'}</p>
                                    <p><strong>CPF:</strong> ${ordem.cliente_cpf || 'N/A'}</p>
                                    <p><strong>Motocicleta:</strong> ${ordem.motocicleta_modelo || 'N/A'}</p>
                                    <p><strong>Placa:</strong> ${ordem.motocicleta_placa || 'N/A'}</p>
                                    <p><strong>Ano:</strong> ${ordem.motocicleta_ano || 'N/A'}</p>
                                    <p><strong>Cor:</strong> ${ordem.motocicleta_cor || 'N/A'}</p>
                                </div>
                            </div>
                            <div class="descricao-section">
                                <h4>Descrição dos Serviços</h4>
                                <div class="descricao-box">${ordem.descricao || 'N/A'}</div>
                            </div>
                            ${ordem.observacao ? `
                                <div class="observacao-section">
                                    <h4>Observações</h4>
                                    <div class="observacao-box">${ordem.observacao}</div>
                                </div>
                            ` : ''}
                            ${orcamentosHtml}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        document.getElementById('modal-visualizar-completa').addEventListener('click', function(e) {
            if (e.target === this) {
                this.remove();
            }
        });
    }

    getStatusOrcamentoText(status) {
        const map = {
            'V': 'Validado',
            'R': 'Rejeitado', 
            'P': 'Pendente'
        };
        return map[status] || status;
    }

    async atualizarStatusOrdem(id, novoStatus) {
        try {
            const res = await fetch(`${this.apiUrl}/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: novoStatus,
                    validada: novoStatus === 'Validada'
                })
            });
            
            if (!res.ok) throw new Error('Erro ao atualizar status da ordem de serviço');
            
            const statusMessage = {
                'Em Andamento': 'Ordem de serviço iniciada com sucesso!',
                'Ajuste Pendente': 'Ordem de serviço pendente para ajustes!',
                'Validado': 'Ordem de serviço finalizada com sucesso!',
                'Validada': 'Ordem de serviço validada com sucesso!',
                'Validação Pendente': 'Ordem de serviço enviada para validação!',
                'Rejeitado': 'Ordem de serviço rejeitada!',
                'Rejeitada': 'Ordem de serviço rejeitada!'
            };
            
            alert(statusMessage[novoStatus] || 'Status atualizado com sucesso!');
            this.loadOrdens();
        } catch (e) {
            console.error('Erro ao atualizar status da ordem de serviço:', e);
            alert('Erro ao atualizar status da ordem de serviço');
        }
    }
}
