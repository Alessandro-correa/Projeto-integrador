class MotocicletaController {
    constructor() {
        console.log('[MotocicletaController] Controller carregado');
        this.baseURL = 'http://localhost:3000/api/motocicletas';
        this.marcasURL = 'http://localhost:3000/api/marcas';
        this.motocicletas = [];
        this.marcas = [];
        this.init();
        this.sortColumn = 'modelo';
        this.sortDirection = 'asc';
    }

    init() {
        this.bindEvents();
        this.loadMotocicletas();
        this.loadMarcas();
        this.setupSortEvents();
    }

    setupSortEvents() {
        const table = document.getElementById('motocicletas-table');
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
        const table = document.getElementById('motocicletas-table');
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
        const filterMarca = document.getElementById('filter-marca');
        if (filterMarca) filterMarca.addEventListener('change', () => this.aplicarFiltros());
        const filterAno = document.getElementById('filter-ano');
        if (filterAno) filterAno.addEventListener('input', () => this.aplicarFiltros());
        const clearFilters = document.getElementById('clear-filters');
        if (clearFilters) clearFilters.addEventListener('click', () => this.limparFiltros());
        // Só adiciona eventos de edição se os elementos existirem (para evitar erro na página de consulta)
        const editModal = document.getElementById('editMotocicletaModal');
        if (editModal) {
            editModal.addEventListener('click', (e) => {
                if (e.target.id === 'editMotocicletaModal') {
                    this.fecharModal();
                }
            });
        }
        const closeModal = document.getElementById('close-modal');
        if (closeModal) closeModal.addEventListener('click', () => this.fecharModal());
        const cancelEdit = document.getElementById('cancel-edit');
        if (cancelEdit) cancelEdit.addEventListener('click', () => this.fecharModal());
        const saveMotocicleta = document.getElementById('save-motocicleta');
        if (saveMotocicleta) saveMotocicleta.addEventListener('click', () => this.salvarEdicao());
    }

    async loadMotocicletas() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(this.baseURL, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Erro ao carregar motocicletas');
            const result = await response.json();
            console.log('[MotocicletaController] Dados recebidos da API:', result);
            this.motocicletas = result.data || [];
            this.renderTable();
            this.showNotification('Motocicletas carregadas com sucesso!', 'success');
        } catch (error) {
            console.error('[MotocicletaController] Erro ao carregar motocicletas:', error);
            this.showNotification('Erro ao carregar motocicletas', 'error');
        }
    }

    async loadMarcas() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(this.marcasURL, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Erro ao carregar marcas');
            
            this.marcas = await response.json();
            this.populateSelectMarcas();
        } catch (error) {
            console.error('Erro ao carregar marcas:', error);
        }
    }

    populateSelectMarcas() {
        const filterSelect = document.getElementById('filter-marca');
        const editSelect = document.getElementById('edit-marca');

        [filterSelect, editSelect].forEach(select => {
            if (select) {
                select.innerHTML = '<option value="">Todas as marcas</option>';
                this.marcas.forEach(marca => {
                    const option = document.createElement('option');
                    option.value = marca.id;
                    option.textContent = marca.nome;
                    select.appendChild(option);
                });
            }
        });
    }

    renderTable() {
        const tbody = document.querySelector('#motocicletas-table tbody');
        if (!tbody) {
            console.error('[MotocicletaController] Tabela de motocicletas não encontrada');
            return;
        }
        if (this.motocicletas.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 20px;">
                        <i class='bx bx-info-circle'></i>
                        Nenhuma motocicleta encontrada
                    </td>
                </tr>
            `;
            return;
        }
        // Ordenação dinâmica
        const motosOrdenadas = [...this.motocicletas].sort((a, b) => {
            let valA = a[this.sortColumn] || '';
            let valB = b[this.sortColumn] || '';
            // Para ano, ordenar como número
            if (this.sortColumn === 'ano') {
                valA = parseInt(valA) || 0;
                valB = parseInt(valB) || 0;
            } else {
                valA = valA.toString().toLowerCase();
                valB = valB.toString().toLowerCase();
            }
            if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
        tbody.innerHTML = motosOrdenadas.map(moto => `
            <tr data-id="${moto.placa}">
                <td>${moto.modelo}</td>
                <td>${moto.placa}</td>
                <td>${moto.marca_nome || 'Não informado'}</td>
                <td>${moto.ano}</td>
                <td>${moto.cor}</td>
                <td>${moto.cliente_nome || ''}</td>
                <td>
                    <div class="actions">
                        <button class="action-btn" title="Visualizar" onclick="motocicletaController.visualizarMotocicleta('${moto.placa}')">
                            <i class='bx bx-show'></i>
                        </button>
                        <button class="action-btn" title="Editar" onclick="motocicletaController.ajustarMotocicleta('${moto.placa}')">
                            <i class='bx bx-edit'></i>
                        </button>
                        <button class="action-btn" title="Excluir" onclick="motocicletaController.confirmarExclusao('${moto.placa}', '${moto.modelo}')">
                            <i class='bx bx-trash'></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
        this.updateSortIcons();
    }

    getMarcaNome(marcaId) {
        const marca = this.marcas.find(m => m.id === marcaId);
        return marca ? marca.nome : 'Não informado';
    }

    getStatusBadgeClass(status) {
        const statusClasses = {
            'Ativo': 'success',
            'Inativo': 'error',
            'Manutenção': 'warning'
        };
        return statusClasses[status] || 'secondary';
    }

    aplicarFiltros() {
        const texto = document.getElementById('filter-text').value.toLowerCase();
        const marca = document.getElementById('filter-marca').value;
        const ano = document.getElementById('filter-ano').value;
        // Filtro único de texto: modelo, placa ou cor
        const motocicletasFiltradas = this.motocicletas.filter(moto => {
            const textoMatch = !texto ||
                (moto.modelo && moto.modelo.toLowerCase().includes(texto)) ||
                (moto.placa && moto.placa.toLowerCase().includes(texto)) ||
                (moto.cor && moto.cor.toLowerCase().includes(texto));
            const marcaMatch = !marca || (moto.marca_nome && moto.marca_nome === marca);
            const anoMatch = !ano || (moto.ano && moto.ano.toString().includes(ano));
            return textoMatch && marcaMatch && anoMatch;
        });
        this.renderFilteredTable(motocicletasFiltradas);
    }

    renderFilteredTable(motocicletas) {
        const tbody = document.querySelector('#motocicletas-table tbody');
        if (motocicletas.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 20px;">
                        <i class='bx bx-search'></i>
                        Nenhuma motocicleta encontrada com os filtros aplicados
                    </td>
                </tr>
            `;
            return;
        }
        tbody.innerHTML = motocicletas.map(moto => `
            <tr data-id="${moto.placa}">
                <td>${moto.modelo}</td>
                <td>${moto.placa}</td>
                <td>${moto.marca_nome || 'Não informado'}</td>
                <td>${moto.ano}</td>
                <td>${moto.cor}</td>
                <td>${moto.cilindrada || ''}</td>
                <td>${moto.cliente_cpf || ''}</td>
                <td>
                    <div class="actions">
                        <button class="action-btn" title="Visualizar" onclick="motocicletaController.visualizarMotocicleta('${moto.placa}')">
                            <i class='bx bx-show'></i>
                        </button>
                        <button class="action-btn" title="Editar" onclick="motocicletaController.ajustarMotocicleta('${moto.placa}')">
                            <i class='bx bx-edit'></i>
                        </button>
                        <button class="action-btn" title="Excluir" onclick="motocicletaController.confirmarExclusao('${moto.placa}', '${moto.modelo}')">
                            <i class='bx bx-trash'></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    limparFiltros() {
        document.getElementById('filter-modelo').value = '';
        document.getElementById('filter-marca').value = '';
        document.getElementById('filter-ano').value = '';
        document.getElementById('filter-status').value = '';
        this.renderTable();
    }

    editarMotocicleta(id) {
        const motocicleta = this.motocicletas.find(m => m.id === id);
        if (!motocicleta) {
            this.showNotification('Motocicleta não encontrada', 'error');
            return;
        }

        document.getElementById('edit-modelo').value = motocicleta.modelo;
        document.getElementById('edit-placa').value = motocicleta.placa;
        document.getElementById('edit-marca').value = motocicleta.marca_id;
        document.getElementById('edit-cor').value = motocicleta.cor;
        document.getElementById('edit-ano').value = motocicleta.ano;
        document.getElementById('edit-quilometragem').value = motocicleta.quilometragem || '';
        document.getElementById('edit-status').value = motocicleta.status || 'Ativo';

        document.getElementById('editMotocicletaModal').dataset.editId = id;

        document.getElementById('editMotocicletaModal').style.display = 'block';
    }

    async salvarEdicao() {
        const modal = document.getElementById('editMotocicletaModal');
        const id = modal.dataset.editId;

        const dadosAtualizados = {
            modelo: document.getElementById('edit-modelo').value,
            placa: document.getElementById('edit-placa').value,
            marca_id: parseInt(document.getElementById('edit-marca').value),
            cor: document.getElementById('edit-cor').value,
            ano: parseInt(document.getElementById('edit-ano').value),
            quilometragem: parseInt(document.getElementById('edit-quilometragem').value) || null,
            status: document.getElementById('edit-status').value
        };

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${this.baseURL}/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(dadosAtualizados)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao atualizar motocicleta');
            }

            this.showNotification('Motocicleta atualizada com sucesso!', 'success');
            this.fecharModal();
            this.loadMotocicletas();

        } catch (error) {
            console.error('Erro ao salvar motocicleta:', error);
            this.showNotification(error.message || 'Erro ao salvar motocicleta', 'error');
        }
    }

    async confirmarExclusao(id, modelo) {
        if (confirm(`Deseja realmente excluir a motocicleta "${modelo}"?`)) {
            await this.excluirMotocicleta(id);
        }
    }

    async excluirMotocicleta(id) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${this.baseURL}/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success) {
                this.showNotification('Motocicleta excluída com sucesso!', 'success');
                this.loadMotocicletas();
            } else {
                // Verifica se é erro de FK
                if (result.error && result.error.includes('ordem_de_servico_motocicleta_placa_fkey')) {
                    this.showNotification('Não é possível excluir uma motocicleta vinculada a uma ordem de serviço.', 'error');
                } else {
                    this.showNotification(result.message || 'Erro ao excluir motocicleta', 'error');
                }
            }
        } catch (error) {
            if (error.message && error.message.includes('ordem_de_servico_motocicleta_placa_fkey')) {
                this.showNotification('Não é possível excluir uma motocicleta vinculada a uma ordem de serviço.', 'error');
            } else {
                this.showNotification('Erro ao excluir motocicleta', 'error');
            }
        }
    }

    visualizarMotocicleta(placa) {
        const motocicleta = this.motocicletas.find(m => m.placa === placa);
        if (!motocicleta) {
            this.showNotification('Motocicleta não encontrada', 'error');
            return;
        }
        this.mostrarModalVisualizacao(motocicleta);
    }

    mostrarModalVisualizacao(motocicleta) {
        // Remove modal anterior se existir
        const modalExistente = document.getElementById('modal-visualizar-moto');
        if (modalExistente) modalExistente.remove();

        const modalHtml = `
            <div id="modal-visualizar-moto" class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Detalhes da Motocicleta</h3>
                        <button class="modal-close" onclick="document.getElementById('modal-visualizar-moto').remove()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="basic-info">
                            <p><strong>Modelo:</strong> ${motocicleta.modelo || 'N/A'}</p>
                            <p><strong>Placa:</strong> ${motocicleta.placa || 'N/A'}</p>
                            <p><strong>Marca:</strong> ${motocicleta.marca_nome || this.getMarcaNome(motocicleta.marca_id) || 'N/A'}</p>
                            <p><strong>Ano:</strong> ${motocicleta.ano || 'N/A'}</p>
                            <p><strong>Cor:</strong> ${motocicleta.cor || 'N/A'}</p>
                            <p><strong>Cilindrada:</strong> ${motocicleta.cilindrada || 'N/A'}</p>
                            <p><strong>Cliente:</strong> ${motocicleta.cliente_nome || 'N/A'}</p>
                            <p><strong>CPF do Cliente:</strong> ${motocicleta.cliente_cpf || 'N/A'}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        // Fechar ao clicar fora do modal
        document.getElementById('modal-visualizar-moto').addEventListener('click', function(e) {
            if (e.target === this) this.remove();
        });
    }

    ajustarMotocicleta(placa) {
        
        const placaFormatted = placa.replace(/[^A-Za-z0-9]/g, '');
        window.location.href = `motos-ajustar.html?placa=${placaFormatted}`;
    }

    fecharModal() {
        document.getElementById('editMotocicletaModal').style.display = 'none';
        document.getElementById('editMotocicletaModal').dataset.editId = '';
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

let motocicletaController;
document.addEventListener('DOMContentLoaded', () => {
    motocicletaController = new MotocicletaController();
});
