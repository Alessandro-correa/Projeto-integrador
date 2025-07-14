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
                    
                case 'data':
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
                
                match = match && (o.status && this.getStatusLabel(o.status) === status);
            }
            return match;
        });
        
        if (filtered.length === 0) {
            this.tableBody.innerHTML = '<tr><td colspan="7">Nenhum orçamento encontrado</td></tr>';
            return;
        }

        const sorted = this.sortOrcamentos(filtered);
        
        this.tableBody.innerHTML = sorted.map(o => `
            <tr>
                <td><p>ORC-${String(o.id).padStart(3, '0')}</p></td>
                <td><p>${o.cliente_nome || 'N/A'}</p></td>
                <td><p>${o.placa || 'N/A'}</p></td>
                <td>${o.data ? new Date(o.data).toLocaleDateString('pt-BR') : 'N/A'}</td>
                <td>R$ ${(parseFloat(o.valor) || 0).toLocaleString('pt-BR', {minimumFractionDigits:2})}</td>
                <td><span class="status-${this.getStatusClass(o.status)}">${this.getStatusLabel(o.status)}</span></td>
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
                
            case 'V': 
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
            'V': 'Aprovado', 
            'R': 'Rejeitado'
        };
        return map[status] || 'Pendente';
    }
    getStatusClass(status) {
        if (!status) return 'pending';
        const map = {
            'P': 'pending',
            'V': 'completed',
            'R': 'rejected'
        };
        return map[status] || 'pending';
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
                const mensagemConfirmacao = `🔍 VALIDAR ORÇAMENTO #${id}\n\n` +
                    `✅ Ao confirmar, o orçamento será aprovado e uma nova Ordem de Serviço será criada automaticamente.\n\n` +
                    `📋 A OS será gerada com:\n` +
                    `• Status: "Em Andamento"\n` +
                    `• Dados do cliente e motocicleta do orçamento\n` +
                    `• Descrição incluindo detalhes do orçamento\n\n` +
                    `⚠️ Esta ação não pode ser desfeita.\n\n` +
                    `Deseja continuar?`;
                    
                if (confirm(mensagemConfirmacao)) {
                    await this.validarOrcamento(id);
                }
            });
        });

        this.tableBody.querySelectorAll('.rejeitar-orcamento').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                const id = btn.getAttribute('data-id');
                if (confirm('Deseja rejeitar este orçamento? Esta ação não pode ser desfeita.')) {
                    await this.rejeitarOrcamento(id);
                }
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
        const modalHtml = `
            <div id="modal-visualizar" class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Detalhes do Orçamento ORC-${String(orcamento.id).padStart(3, '0')}</h3>
                        <button class="modal-close" onclick="document.getElementById('modal-visualizar').remove()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p><strong>Cliente:</strong> ${orcamento.cliente_nome || 'N/A'}</p>
                        <p><strong>CPF:</strong> ${orcamento.cliente_cpf || 'N/A'}</p>
                        <p><strong>Placa:</strong> ${orcamento.placa || 'N/A'}</p>
                        <p><strong>Valor:</strong> R$ ${(parseFloat(orcamento.valor) || 0).toLocaleString('pt-BR', {minimumFractionDigits:2})}</p>
                        <p><strong>Validade:</strong> ${orcamento.validade ? new Date(orcamento.validade).toLocaleDateString('pt-BR') : 'N/A'}</p>
                        <p><strong>Data:</strong> ${orcamento.data ? new Date(orcamento.data).toLocaleDateString('pt-BR') : 'N/A'}</p>
                        <p><strong>Status:</strong> <span class="status-${this.getStatusClass(orcamento.status)}">${this.getStatusLabel(orcamento.status)}</span></p>
                        <p><strong>Ordem de Serviço:</strong> ${orcamento.ordem_servico_cod ? 'OS-' + String(orcamento.ordem_servico_cod).padStart(3, '0') : 'N/A'}</p>
                        <p><strong>Status da OS:</strong> ${orcamento.ordem_status || 'N/A'}</p>
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

    async validarOrcamento(id) {
        try {
            const res = await fetch(`${this.apiUrl}/${id}/validar`, { method: 'POST' });
            if (!res.ok) throw new Error('Erro ao validar orçamento');
            
            const json = await res.json();

            if (json.success) {
                const mensagem = `✅ ${json.message}\n\n📋 ${json.data.message || 'Nova Ordem de Serviço criada automaticamente'}\n\n🔄 Deseja visualizar as Ordens de Serviço agora?`;
                
                if (confirm(mensagem)) {
                    
                    window.location.href = '../os/os-consulta.html';
                } else {
                    
                    this.loadOrcamentos();
                }
            } else {
                alert('Erro: ' + json.message);
            }
        } catch (e) {
            console.error('Erro ao validar orçamento:', e);
            alert('Erro ao validar orçamento: ' + e.message);
        }
    }

    async rejeitarOrcamento(id) {
        try {
            const res = await fetch(`${this.apiUrl}/${id}/rejeitar`, { method: 'POST' });
            if (!res.ok) throw new Error('Erro ao rejeitar orçamento');
            
            const json = await res.json();
            alert('Orçamento rejeitado com sucesso!');
            this.loadOrcamentos();
        } catch (e) {
            console.error('Erro ao rejeitar orçamento:', e);
            alert('Erro ao rejeitar orçamento');
        }
    }
}
