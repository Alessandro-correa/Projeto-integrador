class FilterController {
    constructor(tableId) {
        this.table = document.getElementById(tableId);
        this.filterText = document.getElementById('filter-text');
        this.filterStatus = document.getElementById('filter-status');
        this.filterData = document.getElementById('filter-data');
        this.filterMarca = document.getElementById('filter-marca');
        this.filterFornecedor = document.getElementById('filter-fornecedor');
        this.clearFiltersBtn = document.getElementById('clear-filters');
        this.init();
    }

    init() {
        if (this.table) {
            this.setupEventListeners();
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
}

export default FilterController; 