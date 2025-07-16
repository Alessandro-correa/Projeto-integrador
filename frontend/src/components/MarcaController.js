class MarcaController {
    constructor() {
        console.log('[MarcaController] Controller carregado');
        this.baseURL = 'http://localhost:3000/api/marcas';
        this.marcas = [];
        this.init();
        this.sortColumn = 'nome';
        this.sortDirection = 'asc';
    }

    init() {
        this.bindEvents();
        this.loadMarcas();
        this.setupSortEvents();
    }

    setupSortEvents() {
        const table = document.getElementById('marcas-table');
        if (!table) return;
        const headers = table.querySelectorAll('th.sortable');
        headers.forEach(th => {
            th.addEventListener('click', () => {
                const column = th.getAttribute('data-column');
                if (this.sortColumn === column) {
                    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    this.sortColumn = column;
                    this.sortDirection = 'asc';
                }
                this.renderTable();
                this.updateSortIcons();
            });
        });
    }

    updateSortIcons() {
        const table = document.getElementById('marcas-table');
        if (!table) return;
        const headers = table.querySelectorAll('th.sortable');
        headers.forEach(th => {
            const icon = th.querySelector('.sort-icon');
            const column = th.getAttribute('data-column');
            if (!icon) return;
            icon.classList.remove('active');
            icon.classList.remove('bx-sort-up', 'bx-sort-down', 'bx-sort-alt-2');
            if (this.sortColumn === column) {
                icon.classList.add('active');
                icon.classList.add(this.sortDirection === 'asc' ? 'bx-sort-up' : 'bx-sort-down');
            } else {
                icon.classList.add('bx-sort-alt-2');
            }
        });
    }

    bindEvents() {
        const filterText = document.getElementById('filter-text');
        if (filterText) filterText.addEventListener('input', () => this.aplicarFiltros());
        const clearFilters = document.getElementById('clear-filters');
        if (clearFilters) clearFilters.addEventListener('click', () => this.limparFiltros());
    }

    async loadMarcas() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(this.baseURL, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Erro ao carregar marcas');
            const result = await response.json();
            console.log('[MarcaController] Dados recebidos da API:', result);
            this.marcas = result.data || [];
            this.renderTable();
            this.showNotification('Marcas carregadas com sucesso!', 'success');
        } catch (error) {
            console.error('[MarcaController] Erro ao carregar marcas:', error);
            this.showNotification('Erro ao carregar marcas', 'error');
        }
    }

    renderTable() {
        const tbody = document.querySelector('#marcas-table tbody');
        if (!tbody) {
            console.error('[MarcaController] Tabela de marcas não encontrada');
            return;
        }
        if (this.marcas.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="2" style="text-align: center; padding: 20px;">
                        <i class='bx bx-info-circle'></i>
                        Nenhuma marca encontrada
                    </td>
                </tr>
            `;
            return;
        }
        // Ordenação dinâmica
        const marcasOrdenadas = [...this.marcas].sort((a, b) => {
            let valA = a[this.sortColumn] || '';
            let valB = b[this.sortColumn] || '';
            valA = valA.toString().toLowerCase();
            valB = valB.toString().toLowerCase();
            if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
        tbody.innerHTML = marcasOrdenadas.map(marca => `
            <tr data-id="${marca.id}">
                <td>${marca.nome}</td>
                <td>
                    <div class="actions">
                        <button class="action-btn" title="Visualizar" onclick="marcaController.visualizarMarca(${marca.id})">
                            <i class='bx bx-show'></i>
                        </button>
                        <button class="action-btn" title="Editar" onclick="marcaController.ajustarMarca(${marca.id})">
                            <i class='bx bx-edit'></i>
                        </button>
                        <button class="action-btn" title="Excluir" onclick="marcaController.confirmarExclusao(${marca.id}, '${marca.nome}')">
                            <i class='bx bx-trash'></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
        this.updateSortIcons();
    }

    aplicarFiltros() {
        const texto = document.getElementById('filter-text').value.toLowerCase();
        const marcasFiltradas = this.marcas.filter(marca => {
            return !texto || marca.nome.toLowerCase().includes(texto);
        });
        this.renderFilteredTable(marcasFiltradas);
    }

    renderFilteredTable(marcas) {
        const tbody = document.querySelector('#marcas-table tbody');
        if (marcas.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="2" style="text-align: center; padding: 20px;">
                        <i class='bx bx-search'></i>
                        Nenhuma marca encontrada com os filtros aplicados
                    </td>
                </tr>
            `;
            return;
        }
        tbody.innerHTML = marcas.map(marca => `
            <tr data-id="${marca.id}">
                <td>${marca.nome}</td>
                <td>
                    <div class="actions">
                        <button class="action-btn" title="Visualizar" onclick="marcaController.visualizarMarca(${marca.id})">
                            <i class='bx bx-show'></i>
                        </button>
                        <button class="action-btn" title="Editar" onclick="marcaController.ajustarMarca(${marca.id})">
                            <i class='bx bx-edit'></i>
                        </button>
                        <button class="action-btn" title="Excluir" onclick="marcaController.confirmarExclusao(${marca.id}, '${marca.nome}')">
                            <i class='bx bx-trash'></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    limparFiltros() {
        document.getElementById('filter-text').value = '';
        this.renderTable();
    }

    async confirmarExclusao(id, nome) {
        if (confirm(`Deseja realmente excluir a marca "${nome}"?`)) {
            await this.excluirMarca(id);
        }
    }

    async excluirMarca(id) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${this.baseURL}/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success) {
                this.showNotification('Marca excluída com sucesso!', 'success');
                this.loadMarcas();
            } else {
                // Verifica se é erro de FK
                if (result.error && result.error.includes('motocicleta_marca_id_fkey')) {
                    this.showNotification('Não é possível excluir uma marca que possui motocicletas vinculadas.', 'error');
                } else {
                    this.showNotification(result.message || 'Erro ao excluir marca', 'error');
                }
            }
        } catch (error) {
            if (error.message && error.message.includes('motocicleta_marca_id_fkey')) {
                this.showNotification('Não é possível excluir uma marca que possui motocicletas vinculadas.', 'error');
            } else {
                this.showNotification('Erro ao excluir marca', 'error');
            }
        }
    }

    visualizarMarca(id) {
        const marca = this.marcas.find(m => m.id === id);
        if (!marca) {
            this.showNotification('Marca não encontrada', 'error');
            return;
        }
        this.mostrarModalVisualizacao(marca);
    }

    mostrarModalVisualizacao(marca) {
        // Remove modal anterior se existir
        const modalExistente = document.getElementById('modal-visualizar-marca');
        if (modalExistente) modalExistente.remove();

        const modalHtml = `
            <div id="modal-visualizar-marca" class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Detalhes da Marca</h3>
                        <button class="modal-close" onclick="document.getElementById('modal-visualizar-marca').remove()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="basic-info">
                            <p><strong>ID:</strong> ${marca.id || 'N/A'}</p>
                            <p><strong>Nome:</strong> ${marca.nome || 'N/A'}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        // Fechar ao clicar fora do modal
        document.getElementById('modal-visualizar-marca').addEventListener('click', function(e) {
            if (e.target === this) this.remove();
        });
    }

    ajustarMarca(id) {
        window.location.href = `marcas-ajustar.html?id=${id}`;
    }

    showNotification(message, type = 'info') {
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 9999;
            max-width: 400px;
            display: flex;
            align-items: center;
            gap: 10px;
        `;

        const icon = type === 'success' ? 'check-circle' : 
                    type === 'error' ? 'x-circle' : 'info-circle';

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
}

let marcaController;
document.addEventListener('DOMContentLoaded', () => {
    marcaController = new MarcaController();
}); 