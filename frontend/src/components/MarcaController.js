const API_BASE_URL = 'http://localhost:3000/api';

class MarcaController {
    constructor() {
        this.apiUrl = `${API_BASE_URL}/marcas`;
        this.currentSort = {
            column: 'nome',
            direction: 'asc'
        };
        this.marcas = [];
        this.tableBody = document.querySelector('#marcas-table tbody');
        this.cardsContainer = document.querySelector('#marcas-cards');
        this.init();
    }

    init() {
        this.loadMarcas();
        this.setupFilters();
        this.initSortableHeaders();
    }

    async loadMarcas() {
        try {
            console.log('🔄 Carregando marcas...');
            
            const token = localStorage.getItem('token');
            const response = await fetch(this.apiUrl, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success && result.data) {
                this.marcas = result.data;
                this.renderMarcas(this.marcas);
                console.log(`✅ ${result.data.length} marcas carregadas`);
            } else {
                throw new Error(result.message || 'Erro ao carregar marcas');
            }
            
        } catch (error) {
            console.error('❌ Erro ao carregar marcas:', error);
            this.showNotification('Erro ao carregar marcas', 'error');
        }
    }

    renderMarcas(marcas) {
        if (!this.tableBody || !this.cardsContainer) {
            console.error('❌ Elementos da tabela ou cards não encontrados');
            return;
        }

        if (marcas.length === 0) {
            this.tableBody.innerHTML = `
                <tr>
                    <td colspan="2" style="text-align: center; padding: 20px;">
                        <i class='bx bx-info-circle'></i>
                        Nenhuma marca encontrada
                    </td>
                </tr>
            `;
            this.cardsContainer.innerHTML = `
                <div class="empty-state">
                    <i class='bx bx-info-circle'></i>
                    <p>Nenhuma marca encontrada</p>
                </div>
            `;
            return;
        }

        // Aplicar ordenação
        const sortedMarcas = this.sortMarcas(marcas);

        // Renderizar tabela
        this.tableBody.innerHTML = sortedMarcas.map(marca => `
            <tr data-id="${marca.id}">
                <td>${marca.nome}</td>
                <td>
                    <div class="actions">
                        <button class="action-btn" onclick="marcaController.editarMarca(${marca.id})" title="Editar">
                            <i class='bx bx-edit'></i>
                        </button>
                        <button class="action-btn" onclick="marcaController.confirmarExclusao(${marca.id}, '${marca.nome}')" title="Excluir">
                            <i class='bx bx-trash'></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        // Renderizar cards
        this.cardsContainer.innerHTML = sortedMarcas.map(marca => `
            <div class="marca-card" data-id="${marca.id}">
                <div class="card-header">
                    <h3 class="marca-nome">${marca.nome}</h3>
                </div>
                <div class="card-actions">
                    <button class="action-btn btn-editar" onclick="marcaController.editarMarca(${marca.id})">
                        <i class='bx bx-edit'></i>
                    </button>
                    <button class="action-btn btn-excluir" onclick="marcaController.confirmarExclusao(${marca.id}, '${marca.nome}')">
                        <i class='bx bx-trash'></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    setupFilters() {
        const filterText = document.getElementById('filter-text');
        const clearFilters = document.getElementById('clear-filters');

        if (filterText) {
            filterText.addEventListener('input', () => this.applyFilters());
        }

        if (clearFilters) {
            clearFilters.addEventListener('click', () => {
                if (filterText) filterText.value = '';
                this.applyFilters();
            });
        }
    }

    applyFilters() {
        const filterText = document.getElementById('filter-text')?.value.toLowerCase() || '';
        
        // Filtrar tabela
        const rows = document.querySelectorAll('#marcas-table tbody tr');
        rows.forEach(row => {
            const nome = row.children[0]?.textContent.toLowerCase() || '';
            row.style.display = nome.includes(filterText) ? '' : 'none';
        });

        // Filtrar cards
        const cards = document.querySelectorAll('.marca-card');
        cards.forEach(card => {
            const nome = card.querySelector('.marca-nome')?.textContent.toLowerCase() || '';
            card.style.display = nome.includes(filterText) ? '' : 'none';
        });
    }

    initSortableHeaders() {
        const headers = document.querySelectorAll('.sortable');
        headers.forEach(header => {
            header.addEventListener('click', () => {
                const column = header.dataset.column;
                this.sortBy(column);
            });
        });
    }

    sortBy(column) {
        if (this.currentSort.column === column) {
            this.currentSort.direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            this.currentSort.column = column;
            this.currentSort.direction = 'asc';
        }

        this.updateSortIcons();
        this.renderMarcas(this.marcas);
    }

    updateSortIcons() {
        const headers = document.querySelectorAll('.sortable');
        headers.forEach(header => {
            const icon = header.querySelector('.sort-icon');
            if (header.dataset.column === this.currentSort.column) {
                icon.classList.remove('bx-sort-alt-2');
                icon.classList.add(this.currentSort.direction === 'asc' ? 'bx-sort-up' : 'bx-sort-down');
            } else {
                icon.classList.remove('bx-sort-up', 'bx-sort-down');
                icon.classList.add('bx-sort-alt-2');
            }
        });
    }

    sortMarcas(marcas) {
        return [...marcas].sort((a, b) => {
            const aValue = String(a[this.currentSort.column]).toLowerCase();
            const bValue = String(b[this.currentSort.column]).toLowerCase();
            
            if (this.currentSort.direction === 'asc') {
                return aValue.localeCompare(bValue);
            } else {
                return bValue.localeCompare(aValue);
            }
        });
    }

    async editarMarca(id) {
        window.location.href = `marcas-ajustar.html?id=${id}`;
    }

    async confirmarExclusao(id, nome) {
        const confirmar = confirm(`Deseja realmente excluir a marca "${nome}"?`);
        if (confirmar) {
            await this.excluirMarca(id);
        }
    }

    async excluirMarca(id) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${this.apiUrl}/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Erro ao excluir marca');

            const result = await response.json();
            if (result.success) {
                this.showNotification('Marca excluída com sucesso!', 'success');
                this.loadMarcas();
            } else {
                throw new Error(result.message || 'Erro ao excluir marca');
            }
        } catch (error) {
            console.error('❌ Erro ao excluir marca:', error);
            this.showNotification('Erro ao excluir marca', 'error');
        }
    }

    showNotification(message, type = 'info') {
        const event = new CustomEvent('show-notification', {
            detail: { message, type }
        });
        document.dispatchEvent(event);
    }
}

let marcaController;
document.addEventListener('DOMContentLoaded', () => {
    marcaController = new MarcaController();
}); 