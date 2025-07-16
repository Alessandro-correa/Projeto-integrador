class FilterController {
    constructor(tableId) {
        this.table = document.getElementById(tableId);
        this.tableId = tableId;
        this.baseURL = 'http://localhost:3000/api';
        this.filterText = document.getElementById('filter-text');
        this.filterStatus = document.getElementById('filter-status');
        this.filterData = document.getElementById('filter-data');
        this.filterMarca = document.getElementById('filter-marca');
        this.filterFornecedor = document.getElementById('filter-fornecedor');
        this.clearFiltersBtn = document.getElementById('clear-filters');
        this.entity = this.identifyEntity();
        this.init();
    }

    identifyEntity() {
        const path = window.location.pathname;
        if (path.includes('usuarios-consulta')) return 'usuarios';
        if (path.includes('clientes-consulta')) return 'clientes';
        if (path.includes('fornecedores-consulta')) return 'fornecedores';
        if (path.includes('marcas-consulta')) return 'marcas';
        if (path.includes('motos-consulta')) return 'motocicletas';
        if (path.includes('pecas-consulta')) return 'pecas';
        if (path.includes('orcamentos-consulta')) return 'orcamentos';
        if (path.includes('os-consulta')) return 'ordens';
        if (path.includes('aquisicoes-consulta')) return 'aquisicoes';
        return null;
    }

    async init() {
        if (this.table) {
            this.setupEventListeners();
            await this.loadData();
            this.setupSortEvents();
        }
    }

    setupEventListeners() {
        if (this.filterText) this.filterText.addEventListener('keyup', () => this.filterTable());
        if (this.filterStatus) this.filterStatus.addEventListener('change', () => this.filterTable());
        if (this.filterData) this.filterData.addEventListener('change', () => this.filterTable());
        if (this.filterMarca) this.filterMarca.addEventListener('change', () => this.filterTable());
        if (this.filterFornecedor) this.filterFornecedor.addEventListener('change', () => this.filterTable());
        if (this.clearFiltersBtn) this.clearFiltersBtn.addEventListener('click', () => this.clearAllFilters());
    }

    setupSortEvents() {
        const headers = this.table.querySelectorAll('th.sortable');
        headers.forEach(header => {
            header.addEventListener('click', () => {
                const column = header.getAttribute('data-column');
                const currentSort = header.getAttribute('data-sort') || header.getAttribute('data-default-sort') || 'asc';
                const newSort = currentSort === 'asc' ? 'desc' : 'asc';
                headers.forEach(h => h.removeAttribute('data-sort'));
                header.setAttribute('data-sort', newSort);
                this.sortTableByColumn(column, newSort);
                this.updateSortIcons(headers, header, newSort);
            });
        });
    }

    sortTableByColumn(column, order) {
        const tbody = this.table.querySelector('tbody');
        const rows = Array.from(tbody.querySelectorAll('tr'));
        const colIndex = Array.from(this.table.querySelectorAll('th')).findIndex(th => th.getAttribute('data-column') === column);
        rows.sort((a, b) => {
            const aText = a.cells[colIndex]?.textContent.trim().toLowerCase() || '';
            const bText = b.cells[colIndex]?.textContent.trim().toLowerCase() || '';
            if (aText < bText) return order === 'asc' ? -1 : 1;
            if (aText > bText) return order === 'asc' ? 1 : -1;
            return 0;
        });
        rows.forEach(row => tbody.appendChild(row));
    }

    updateSortIcons(headers, activeHeader, order) {
        headers.forEach(header => {
            const icon = header.querySelector('.sort-icon');
            if (icon) {
                icon.className = 'bx bx-sort-alt-2 sort-icon';
            }
        });
        const activeIcon = activeHeader.querySelector('.sort-icon');
        if (activeIcon) {
            activeIcon.className = order === 'asc' ? 'bx bx-sort-up sort-icon active' : 'bx bx-sort-down sort-icon active';
        }
    }

    filterTable() {
        const tableBody = this.table.querySelector('tbody');
        const tableRows = tableBody.querySelectorAll('tr');

        const textF = this.filterText ? this.filterText.value.toLowerCase() : '';
        const statusF = this.filterStatus ? this.filterStatus.value.toLowerCase() : '';
        const dataF = this.filterData ? this.filterData.value : '';
        const marcaF = this.filterMarca ? this.filterMarca.value.toLowerCase() : '';
        const fornecedorF = this.filterFornecedor ? this.filterFornecedor.value.toLowerCase() : '';

        tableRows.forEach(row => {
            const rowText = row.textContent.toLowerCase();
            const showRow = this.shouldShowRow(row, rowText, textF, statusF, dataF, marcaF, fornecedorF);
            row.style.display = showRow ? "" : "none";
        });
    }

    shouldShowRow(row, rowText, textF, statusF, dataF, marcaF, fornecedorF) {
        
        if (textF && !rowText.includes(textF)) return false;

        if (statusF) {
            const statusCell = row.querySelector('span[class^="status-"]');
            if (statusCell) {
                const status = statusCell.textContent.toLowerCase();
                if (!status.includes(statusF)) return false;
            }
        }

        if (dataF) {
            const dataCell = row.cells[4];
            if (dataCell) {
                const dataRaw = dataCell.textContent;
                const parts = dataRaw.split('/');
                const dataFormatted = `${parts[2]}-${parts[1]}-${parts[0]}`;
                if (dataFormatted !== dataF) return false;
            }
        }

        if (marcaF) {
            const marcaCell = row.cells[2]; 
            if (marcaCell) {
                const marca = marcaCell.textContent.toLowerCase();
                if (!marca.includes(marcaF)) return false;
            }
        }

        if (fornecedorF) {
            const fornecedorCell = row.cells[3];
            if (fornecedorCell) {
                const fornecedor = fornecedorCell.textContent.toLowerCase();
                if (!fornecedor.includes(fornecedorF)) return false;
            }
        }

        return true;
    }

    clearAllFilters() {
        if (this.filterText) this.filterText.value = "";
        if (this.filterStatus) this.filterStatus.value = "";
        if (this.filterData) this.filterData.value = "";
        if (this.filterMarca) this.filterMarca.value = "";
        if (this.filterFornecedor) this.filterFornecedor.value = "";
        this.filterTable();
    }

    async loadData() {
        if (!this.entity) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${this.baseURL}/${this.entity}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const result = await response.json();

            if (result.success) {
                this.populateTable(result.data);
            } else {
                this.showError('Erro ao carregar dados: ' + result.message);
            }
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            this.showError('Erro ao carregar dados do servidor');
        }
    }

    populateTable(data) {
        const tbody = this.table.querySelector('tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        data.forEach(item => {
            const row = this.createTableRow(item);
            tbody.appendChild(row);
        });
    }

    createTableRow(item) {
        const row = document.createElement('tr');

        const cells = this.getEntityCells(item);
        cells.forEach(cellContent => {
            const cell = document.createElement('td');
            cell.innerHTML = cellContent;
            row.appendChild(cell);
        });

        const actionsCell = document.createElement('td');
        actionsCell.innerHTML = this.createActionButtons(item);
        row.appendChild(actionsCell);

        return row;
    }

    getEntityCells(item) {
        switch (this.entity) {
            case 'usuarios':
                return [
                    item.nome || '',
                    item.email || '',
                    item.funcao || '',
                    item.telefone || '',
                    item.cpf || ''
                ];
            case 'clientes':
                return [
                    item.nome || '',
                    item.email || '',
                    this.formatarTelefone(item.telefone),
                    item.cpf || '',
                    item.endereco || ''
                ];
            case 'fornecedores':
                return [
                    item.id || '',
                    item.nome || '',
                    item.cnpj || '',
                    item.email || '',
                    item.endereco || ''
                ];
            case 'marcas':
                return [
                    item.nome || ''
                ];
            case 'motocicletas':
                return [
                    item.modelo || '',
                    item.placa || '',
                    item.marca_nome || '',
                    item.ano || '',
                    item.cor || '',
                    item.cliente_nome || ''
                ];
            case 'pecas':
                return [
                    item.id || '',
                    item.nome || '',
                    item.descricao || '',
                    item.fornecedor || '',
                    item.valor || ''
                ];
            case 'orcamentos':
                return [
                    item.codigo || '',
                    item.cliente || '',
                    item.valor_total || '',
                    item.status || '',
                    item.data || ''
                ];
            case 'ordens':
                return [
                    item.cod || '',
                    item.titulo || '',
                    item.cliente || '',
                    item.motocicleta || '',
                    item.data ? item.data.split('T')[0].split('-').reverse().join('/') : '',
                    item.status || ''
                ];
            default:
                return Object.values(item);
        }
    }

    createActionButtons(item) {
        const editUrl = this.getEditUrl(item);
        const deleteId = this.getDeleteId(item);
        let visualizarBtn = '';
        if (this.entity === 'marcas') {
            visualizarBtn = `<button class="action-btn" onclick="filterController.visualizarMarca('${item.id || item.motocicleta_placa || ''}', '${item.nome || ''}')" title="Visualizar"><i class='bx bx-show'></i></button>`;
        }
        // Passa o nome ao chamar deleteItem
        return `
            <div class="actions">
                ${visualizarBtn}
                <a href="${editUrl}" class="action-btn" title="Editar">
                    <i class='bx bx-edit'></i>
                </a>
                <button class="action-btn" onclick="filterController.deleteItem('${deleteId}', '${item.nome || ''}')" title="Excluir">
                    <i class='bx bxs-trash'></i>
                </button>
            </div>
        `;
    }

    async visualizarMarca(id, nome) {
        // Buscar motocicletas associadas à marca via API
        let motos = [];
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${this.baseURL}/motocicletas?marca_id=${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success && Array.isArray(result.data)) {
                motos = result.data.filter(m => String(m.marca_id) === String(id));
            }
        } catch (e) {
            // Se der erro, mostra vazio
        }
        this.mostrarModalVisualizacaoMarca({ id, nome, motos });
    }

    mostrarModalVisualizacaoMarca(marca) {
        // Remove modal anterior se existir
        const modalExistente = document.getElementById('modal-visualizar-marca');
        if (modalExistente) modalExistente.remove();

        const motosHtml = marca.motos && marca.motos.length > 0
            ? `<ul class="motos-list">
                    ${marca.motos.map(m => `<li><strong>${m.modelo}</strong> - Placa: ${m.placa}</li>`).join('')}
               </ul>`
            : '<p style="margin-top: 16px;">Nenhuma motocicleta cadastrada para esta marca.</p>';

        const modalHtml = `
            <div id="modal-visualizar-marca" class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Detalhes da Marca</h3>
                        <button class="modal-close" id="close-modal-marca">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="basic-info">
                            <p><strong>Nome da Marca:</strong> ${marca.nome || 'N/A'}</p>
                            <hr/>
                            <h4>Motocicletas vinculadas:</h4>
                            ${motosHtml}
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        // Fechar ao clicar fora do modal ou no botão de fechar
        document.getElementById('modal-visualizar-marca').addEventListener('click', function(e) {
            if (e.target === this) this.remove();
        });
        document.getElementById('close-modal-marca').onclick = function() {
            document.getElementById('modal-visualizar-marca').remove();
        };
    }

    getEditUrl(item) {
        const path = window.location.pathname;
        const basePath = path.substring(0, path.lastIndexOf('/'));
        
        switch (this.entity) {
            case 'ordens':
                return `${basePath}/os-ajustar.html?cod=${item.codigo}`;
            case 'motocicletas':
                return `${basePath}/motos-ajustar.html?id=${item.id}`;
            default:
                return `${basePath}/${this.entity}-ajustar.html?id=${item.id || item.codigo || item.cpf}`;
        }
    }

    getDeleteId(item) {
        if (this.entity === 'motocicletas') {
            return item.placa;
        }
        return item.id || item.codigo || item.cpf || item.cnpj;
    }

    async deleteItem(id, nome = '') {
        // Modal de confirmação customizado
        const existingModal = document.getElementById('modal-confirm-delete');
        if (existingModal) existingModal.remove();
        const modalHtml = `
            <div id="modal-confirm-delete" class="modal-overlay">
                <div class="modal-content" style="max-width: 400px;">
                    <div class="modal-header">
                        <h3>Confirmar Exclusão</h3>
                        <button class="modal-close" onclick="document.getElementById('modal-confirm-delete').remove()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p>Tem certeza que deseja excluir ${nome ? 'a marca <b>\"' + nome + '\"</b>' : 'este item'}? Esta ação não poderá ser desfeita.</p>
                        <div style="margin-top: 24px; display: flex; gap: 16px; justify-content: flex-end;">
                            <button id="btn-cancel-delete" class="btn-secondary">Cancelar</button>
                            <button id="btn-confirm-delete" class="btn-primary">Excluir</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        document.getElementById('btn-cancel-delete').onclick = function() {
            document.getElementById('modal-confirm-delete').remove();
        };
        document.getElementById('btn-confirm-delete').onclick = async (e) => {
            const btn = e.target;
            btn.disabled = true;
            btn.textContent = 'Excluindo...';
            document.getElementById('modal-confirm-delete').remove();
            try {
                const url = `${this.baseURL}/${this.entity}/${id}`;
                const token = localStorage.getItem('token');
                const response = await fetch(url, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` }
                });
                const result = await response.json();
            if (result.success) {
                    this.showNotification(`${this.entity === 'marcas' && nome ? 'Marca "' + nome + '" excluída com sucesso!' : 'Item excluído com sucesso!'}`, 'success');
                await this.loadData(); 
            } else {
                    if (result.message && result.message.includes('motocicletas vinculadas')) {
                        this.showNotification('Não é possível excluir uma marca que possui motocicletas vinculadas.', 'error');
                    } else {
                        this.showNotification(result.message || 'Erro ao excluir.', 'error');
                    }
            }
        } catch (error) {
                this.showNotification('Erro ao excluir item.', 'error');
            } finally {
                btn.disabled = false;
                btn.textContent = 'Excluir';
            }
        };
    }

    showNotification(message, type = 'info') {
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed !important;
            top: 32px !important;
            right: 32px !important;
            left: auto !important;
            transform: none !important;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'} !important;
            color: white !important;
            border-radius: 8px !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
            z-index: 99999 !important;
            max-width: 400px !important;
            display: flex !important;
            align-items: center !important;
            gap: 10px !important;
            font-size: 1.1rem !important;
            opacity: 1 !important;
            visibility: visible !important;
            padding: 15px 24px !important;
        `;
        const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'x-circle' : 'info-circle';
        notification.innerHTML = `
            <i class='bx bx-${icon}'></i>
            <span>${message}</span>
        `;
        document.body.appendChild(notification);
        setTimeout(() => {
            if (notification && notification.parentElement) {
                notification.remove();
        }
        }, 5000);
    }

    showSuccess(message) {
        alert(message);
    }

    showError(message) {
        alert('Erro: ' + message);
    }

    formatarTelefone(telefone) {
        telefone = (telefone || '').replace(/\D/g, '');
        if (telefone.length === 11) {
            
            return `(${telefone.substr(0,2)}) ${telefone.substr(2,5)}-${telefone.substr(7,4)}`;
        }
        
        return telefone;
    }
}

export default FilterController;
