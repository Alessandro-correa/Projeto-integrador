const API_BASE_URL = 'http://localhost:3000/api';

class FornecedorController {
    constructor() {
        this.apiUrl = `${API_BASE_URL}/fornecedores`;
        this.currentSort = {
            column: 'nome',
            direction: 'asc'
        };
        this.fornecedores = [];
        this.tableBody = document.querySelector('#fornecedores-table tbody');
        this.cardsContainer = document.querySelector('#fornecedores-cards');
        this.init();
    }

    init() {
        this.loadFornecedores();
        this.setupFilters();
        this.initSortableHeaders();
    }

    async loadFornecedores() {
        try {
            console.log('🔄 Carregando fornecedores...');
            
            const token = localStorage.getItem('token');
            const response = await fetch(this.apiUrl, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success && result.data) {
                this.fornecedores = result.data;
                this.renderFornecedores(this.fornecedores);
                console.log(`✅ ${result.data.length} fornecedores carregados`);
            } else {
                throw new Error(result.message || 'Erro ao carregar fornecedores');
            }
            
        } catch (error) {
            console.error('❌ Erro ao carregar fornecedores:', error);
            this.showNotification('Erro ao carregar fornecedores', 'error');
        }
    }

    renderFornecedores(fornecedores) {
        if (!this.tableBody || !this.cardsContainer) {
            console.error('❌ Elementos da tabela ou cards não encontrados');
            return;
        }

        if (fornecedores.length === 0) {
            this.tableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 20px;">
                        <i class='bx bx-info-circle'></i>
                        Nenhum fornecedor encontrado
                    </td>
                </tr>
            `;
            this.cardsContainer.innerHTML = `
                <div class="empty-state">
                    <i class='bx bx-info-circle'></i>
                    <p>Nenhum fornecedor encontrado</p>
                </div>
            `;
            return;
        }

        // Aplicar ordenação
        const sortedFornecedores = this.sortFornecedores(fornecedores);

        // Renderizar tabela
        this.tableBody.innerHTML = sortedFornecedores.map(fornecedor => `
            <tr data-id="${fornecedor.id}">
                <td>${fornecedor.nome}</td>
                <td>${fornecedor.cnpj}</td>
                <td>${fornecedor.email}</td>
                <td>${fornecedor.telefone}</td>
                <td>
                    <div class="actions">
                        <button class="action-btn" onclick="fornecedorController.editarFornecedor(${fornecedor.id})" title="Editar">
                            <i class='bx bx-edit'></i>
                        </button>
                        <button class="action-btn" onclick="fornecedorController.confirmarExclusao(${fornecedor.id}, '${fornecedor.nome}')" title="Excluir">
                            <i class='bx bx-trash'></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        // Renderizar cards
        this.cardsContainer.innerHTML = sortedFornecedores.map(fornecedor => `
            <div class="fornecedor-card" data-id="${fornecedor.id}">
                <div class="card-header">
                    <h3 class="fornecedor-nome">${fornecedor.nome}</h3>
                </div>
                <div class="fornecedor-info">
                    <p><i class='bx bx-id-card'></i> ${fornecedor.cnpj}</p>
                    <p><i class='bx bx-envelope'></i> ${fornecedor.email}</p>
                    <p><i class='bx bx-phone'></i> ${fornecedor.telefone}</p>
                </div>
                <div class="card-actions">
                    <button class="action-btn btn-editar" onclick="fornecedorController.editarFornecedor(${fornecedor.id})">
                        <i class='bx bx-edit'></i>
                    </button>
                    <button class="action-btn btn-excluir" onclick="fornecedorController.confirmarExclusao(${fornecedor.id}, '${fornecedor.nome}')">
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
        const rows = document.querySelectorAll('#fornecedores-table tbody tr');
        rows.forEach(row => {
            const nome = row.children[0]?.textContent.toLowerCase() || '';
            const cnpj = row.children[1]?.textContent.toLowerCase() || '';
            const email = row.children[2]?.textContent.toLowerCase() || '';
            const telefone = row.children[3]?.textContent.toLowerCase() || '';

            const matchText = nome.includes(filterText) || 
                            cnpj.includes(filterText) || 
                            email.includes(filterText) || 
                            telefone.includes(filterText);

            row.style.display = matchText ? '' : 'none';
        });

        // Filtrar cards
        const cards = document.querySelectorAll('.fornecedor-card');
        cards.forEach(card => {
            const nome = card.querySelector('.fornecedor-nome')?.textContent.toLowerCase() || '';
            const infos = Array.from(card.querySelectorAll('.fornecedor-info p')).map(p => p.textContent.toLowerCase());
            
            const matchText = nome.includes(filterText) || 
                            infos.some(info => info.includes(filterText));

            card.style.display = matchText ? '' : 'none';
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
        this.renderFornecedores(this.fornecedores);
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

    sortFornecedores(fornecedores) {
        return [...fornecedores].sort((a, b) => {
            const aValue = String(a[this.currentSort.column]).toLowerCase();
            const bValue = String(b[this.currentSort.column]).toLowerCase();
            
            if (this.currentSort.direction === 'asc') {
                return aValue.localeCompare(bValue);
            } else {
                return bValue.localeCompare(aValue);
            }
        });
    }

    async editarFornecedor(id) {
        window.location.href = `fornecedores-ajustar.html?id=${id}`;
    }

    async confirmarExclusao(id, nome) {
        const confirmar = confirm(`Deseja realmente excluir o fornecedor "${nome}"?`);
        if (confirmar) {
            await this.excluirFornecedor(id);
        }
    }

    async excluirFornecedor(id) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${this.apiUrl}/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Erro ao excluir fornecedor');

            const result = await response.json();
            if (result.success) {
                this.showNotification('Fornecedor excluído com sucesso!', 'success');
                this.loadFornecedores();
            } else {
                throw new Error(result.message || 'Erro ao excluir fornecedor');
            }
        } catch (error) {
            console.error('❌ Erro ao excluir fornecedor:', error);
            this.showNotification('Erro ao excluir fornecedor', 'error');
        }
    }

    showNotification(message, type = 'info') {
        const event = new CustomEvent('show-notification', {
            detail: { message, type }
        });
        document.dispatchEvent(event);
    }
}

window.addEventListener('DOMContentLoaded', () => {
  window.fornecedorController = new FornecedorController();
}); 