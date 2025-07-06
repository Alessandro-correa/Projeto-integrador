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
        // Filtro de texto geral
        if (textF && !rowText.includes(textF)) return false;

        // Filtro de status
        if (statusF) {
            const statusCell = row.querySelector('span[class^="status-"]');
            if (statusCell) {
                const status = statusCell.textContent.toLowerCase();
                if (!status.includes(statusF)) return false;
            }
        }

        // Filtro de data
        if (dataF) {
            const dataCell = row.cells[4];
            if (dataCell) {
                const dataRaw = dataCell.textContent;
                const parts = dataRaw.split('/');
                const dataFormatted = `${parts[2]}-${parts[1]}-${parts[0]}`;
                if (dataFormatted !== dataF) return false;
            }
        }

        // Filtro de marca
        if (marcaF) {
            const marcaCell = row.cells[2]; 
            if (marcaCell) {
                const marca = marcaCell.textContent.toLowerCase();
                if (!marca.includes(marcaF)) return false;
            }
        }

        // Filtro de fornecedor
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
            const response = await fetch(`${this.baseURL}/${this.entity}`);
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
        
        // Criar células baseadas na entidade
        const cells = this.getEntityCells(item);
        cells.forEach(cellContent => {
            const cell = document.createElement('td');
            cell.innerHTML = cellContent;
            row.appendChild(cell);
        });

        // Adicionar botões de ação
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
                    item.telefone || '',
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
                    item.motocicleta_placa || '',
                    item.nome || ''
                ];
            case 'motocicletas':
                return [
                    item.placa || '',
                    item.modelo || '',
                    item.marca || '',
                    item.ano || '',
                    item.cliente || ''
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
        
        return `
            <div class="action-buttons">
                <a href="${editUrl}" class="btn-edit" title="Editar">
                    <i class='bx bxs-edit-alt'></i>
                </a>
                <button class="btn-delete" onclick="filterController.deleteItem('${deleteId}')" title="Excluir">
                    <i class='bx bxs-trash'></i>
                </button>
            </div>
        `;
    }

    getEditUrl(item) {
        const path = window.location.pathname;
        const basePath = path.substring(0, path.lastIndexOf('/'));
        
        switch (this.entity) {
            case 'ordens':
                return `${basePath}/os-ajustar.html?id=${item.codigo}`;
            case 'motocicletas':
                return `${basePath}/motos-ajustar.html?id=${item.id}`;
            default:
                return `${basePath}/${this.entity}-ajustar.html?id=${item.id || item.codigo || item.cpf}`;
        }
    }

    getDeleteId(item) {
        return item.id || item.codigo || item.cpf || item.cnpj;
    }

    async deleteItem(id) {
        if (!confirm('Tem certeza que deseja excluir este item?')) return;

        try {
            const response = await fetch(`${this.baseURL}/${this.entity}/${id}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess('Item excluído com sucesso!');
                await this.loadData(); // Recarregar dados
            } else {
                this.showError('Erro ao excluir: ' + result.message);
            }
        } catch (error) {
            console.error('Erro ao excluir:', error);
            this.showError('Erro ao excluir item');
        }
    }

    showSuccess(message) {
        alert(message);
    }

    showError(message) {
        alert('Erro: ' + message);
    }
}

export default FilterController; 