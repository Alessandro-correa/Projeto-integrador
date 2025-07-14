class MotocicletaController {
    constructor() {
        this.baseURL = 'http://localhost:3000/api/motocicletas';
        this.marcasURL = 'http://localhost:3000/api/marcas';
        this.motocicletas = [];
        this.marcas = [];
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadMotocicletas();
        this.loadMarcas();
    }

    bindEvents() {
        
        document.getElementById('filter-modelo').addEventListener('input', () => this.aplicarFiltros());
        document.getElementById('filter-marca').addEventListener('change', () => this.aplicarFiltros());
        document.getElementById('filter-ano').addEventListener('input', () => this.aplicarFiltros());
        document.getElementById('filter-status').addEventListener('change', () => this.aplicarFiltros());
        document.getElementById('clear-filters').addEventListener('click', () => this.limparFiltros());

        document.getElementById('editMotocicletaModal').addEventListener('click', (e) => {
            if (e.target.id === 'editMotocicletaModal') {
                this.fecharModal();
            }
        });

        document.getElementById('close-modal').addEventListener('click', () => this.fecharModal());
        document.getElementById('cancel-edit').addEventListener('click', () => this.fecharModal());
        document.getElementById('save-motocicleta').addEventListener('click', () => this.salvarEdicao());
    }

    async loadMotocicletas() {
        try {
            const response = await fetch(this.baseURL);
            if (!response.ok) throw new Error('Erro ao carregar motocicletas');
            
            this.motocicletas = await response.json();
            this.renderTable();
            this.showNotification('Motocicletas carregadas com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao carregar motocicletas:', error);
            this.showNotification('Erro ao carregar motocicletas', 'error');
        }
    }

    async loadMarcas() {
        try {
            const response = await fetch(this.marcasURL);
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
            console.error('Tabela de motocicletas não encontrada');
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

        tbody.innerHTML = this.motocicletas.map(moto => `
            <tr data-id="${moto.id}">
                <td>${moto.modelo}</td>
                <td>${moto.placa}</td>
                <td>${this.getMarcaNome(moto.marca_id)}</td>
                <td>${moto.cor}</td>
                <td>${moto.ano}</td>
                <td>
                    <span class="badge ${this.getStatusBadgeClass(moto.status)}">
                        ${moto.status || 'Ativo'}
                    </span>
                </td>
                <td>
                    <div class="actions">
                        <button class="btn-edit" onclick="motocicletaController.editarMotocicleta(${moto.id})" title="Editar">
                            <i class='bx bx-edit'></i>
                        </button>
                        <button class="btn-adjust" onclick="motocicletaController.ajustarMotocicleta('${moto.placa}')" title="Ajustar">
                            <i class='bx bx-cog'></i>
                        </button>
                        <button class="btn-delete" onclick="motocicletaController.confirmarExclusao(${moto.id}, '${moto.modelo}')" title="Excluir">
                            <i class='bx bx-trash'></i>
                        </button>
                        <button class="btn-view" onclick="motocicletaController.visualizarMotocicleta(${moto.id})" title="Visualizar">
                            <i class='bx bx-show'></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
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
        const filtros = {
            modelo: document.getElementById('filter-modelo').value.toLowerCase(),
            marca: document.getElementById('filter-marca').value,
            ano: document.getElementById('filter-ano').value,
            status: document.getElementById('filter-status').value
        };

        const motocicletasFiltradas = this.motocicletas.filter(moto => {
            return (!filtros.modelo || moto.modelo.toLowerCase().includes(filtros.modelo)) &&
                   (!filtros.marca || moto.marca_id.toString() === filtros.marca) &&
                   (!filtros.ano || moto.ano.toString().includes(filtros.ano)) &&
                   (!filtros.status || (moto.status || 'Ativo') === filtros.status);
        });

        this.renderFilteredTable(motocicletasFiltradas);
    }

    renderFilteredTable(motocicletas) {
        const tbody = document.querySelector('#motocicletas-table tbody');
        
        if (motocicletas.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 20px;">
                        <i class='bx bx-search'></i>
                        Nenhuma motocicleta encontrada com os filtros aplicados
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = motocicletas.map(moto => `
            <tr data-id="${moto.id}">
                <td>${moto.modelo}</td>
                <td>${moto.placa}</td>
                <td>${this.getMarcaNome(moto.marca_id)}</td>
                <td>${moto.cor}</td>
                <td>${moto.ano}</td>
                <td>
                    <span class="badge ${this.getStatusBadgeClass(moto.status)}">
                        ${moto.status || 'Ativo'}
                    </span>
                </td>
                <td>
                    <div class="actions">
                        <button class="btn-edit" onclick="motocicletaController.editarMotocicleta(${moto.id})" title="Editar">
                            <i class='bx bx-edit'></i>
                        </button>
                        <button class="btn-adjust" onclick="motocicletaController.ajustarMotocicleta('${moto.placa}')" title="Ajustar">
                            <i class='bx bx-cog'></i>
                        </button>
                        <button class="btn-delete" onclick="motocicletaController.confirmarExclusao(${moto.id}, '${moto.modelo}')" title="Excluir">
                            <i class='bx bx-trash'></i>
                        </button>
                        <button class="btn-view" onclick="motocicletaController.visualizarMotocicleta(${moto.id})" title="Visualizar">
                            <i class='bx bx-show'></i>
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
            const response = await fetch(`${this.baseURL}/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
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
            const response = await fetch(`${this.baseURL}/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao excluir motocicleta');
            }

            this.showNotification('Motocicleta excluída com sucesso!', 'success');
            this.loadMotocicletas();

        } catch (error) {
            console.error('Erro ao excluir motocicleta:', error);
            this.showNotification(error.message || 'Erro ao excluir motocicleta', 'error');
        }
    }

    visualizarMotocicleta(id) {
        const motocicleta = this.motocicletas.find(m => m.id === id);
        if (!motocicleta) {
            this.showNotification('Motocicleta não encontrada', 'error');
            return;
        }

        const detalhes = `
            Modelo: ${motocicleta.modelo}
            Placa: ${motocicleta.placa}
            Marca: ${this.getMarcaNome(motocicleta.marca_id)}
            Cor: ${motocicleta.cor}
            Ano: ${motocicleta.ano}
            Quilometragem: ${motocicleta.quilometragem || 'Não informado'} km
            Status: ${motocicleta.status || 'Ativo'}
        `;

        alert(detalhes);
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
