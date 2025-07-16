const API_BASE_URL = 'http://localhost:3000/api';

class UsuarioController {
    constructor() {
        this.apiUrl = `${API_BASE_URL}/usuarios`;
        this.currentSort = {
            column: 'nome',
            direction: 'asc'
        };
        this.usuarios = [];
        this.tableBody = document.querySelector('#usuarios-table tbody');
        this.cardsContainer = document.querySelector('#usuarios-cards');
        this.init();
    }

    init() {
        this.loadUsuarios();
        this.setupFilters();
        this.initSortableHeaders();
    }

    async loadUsuarios() {
        try {
            console.log('🔄 Carregando usuários...');
            
            const token = localStorage.getItem('token');
            const response = await fetch(this.apiUrl, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success && result.data) {
                this.usuarios = result.data;
                this.renderUsuarios(this.usuarios);
                console.log(`✅ ${result.data.length} usuários carregados`);
            } else {
                throw new Error(result.message || 'Erro ao carregar usuários');
            }
            
        } catch (error) {
            console.error('❌ Erro ao carregar usuários:', error);
            this.showNotification('Erro ao carregar usuários', 'error');
        }
    }

    renderUsuarios(usuarios) {
        if (!this.tableBody || !this.cardsContainer) {
            console.error('❌ Elementos da tabela ou cards não encontrados');
            return;
        }

        if (usuarios.length === 0) {
            this.tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 20px;">
                        <i class='bx bx-info-circle'></i>
                        Nenhum usuário encontrado
                    </td>
                </tr>
            `;
            this.cardsContainer.innerHTML = `
                <div class="empty-state">
                    <i class='bx bx-info-circle'></i>
                    <p>Nenhum usuário encontrado</p>
                </div>
            `;
            return;
        }

        // Aplicar ordenação
        const sortedUsuarios = this.sortUsuarios(usuarios);

        // Renderizar tabela
        this.tableBody.innerHTML = sortedUsuarios.map(usuario => `
            <tr data-id="${usuario.cpf}">
                <td>${usuario.nome}</td>
                <td>${usuario.email}</td>
                <td>
                    <span class="badge ${this.getFuncaoBadgeClass(usuario.funcao)}">
                        ${usuario.funcao}
                    </span>
                </td>
                <td>${usuario.telefone}</td>
                <td>${usuario.cpf}</td>
                <td>
                    <div class="actions">
                        <button class="action-btn" onclick="usuarioController.visualizarUsuario('${usuario.cpf}')" title="Visualizar">
                            <i class='bx bx-show'></i>
                        </button>
                        <button class="action-btn" onclick="usuarioController.editarUsuario('${usuario.cpf}')" title="Editar">
                            <i class='bx bx-edit'></i>
                        </button>
                        <button class="action-btn" onclick="usuarioController.confirmarExclusao('${usuario.cpf}', '${usuario.nome}')" title="Excluir">
                            <i class='bx bx-trash'></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        // Renderizar cards
        this.cardsContainer.innerHTML = sortedUsuarios.map(usuario => `
            <div class="usuario-card" data-id="${usuario.cpf}">
                <div class="card-header">
                    <h3 class="usuario-nome">${usuario.nome}</h3>
                    <span class="badge ${this.getFuncaoBadgeClass(usuario.funcao)}">${usuario.funcao}</span>
                </div>
                <div class="usuario-info">
                    <p><i class='bx bx-envelope'></i> ${usuario.email}</p>
                    <p><i class='bx bx-phone'></i> ${usuario.telefone}</p>
                    <p><i class='bx bx-id-card'></i> ${usuario.cpf}</p>
                </div>
                <div class="card-actions">
                    <button class="action-btn" onclick="usuarioController.visualizarUsuario('${usuario.cpf}')" title="Visualizar">
                        <i class='bx bx-show'></i>
                    </button>
                    <button class="action-btn" onclick="usuarioController.editarUsuario('${usuario.cpf}')" title="Editar">
                        <i class='bx bx-edit'></i>
                    </button>
                    <button class="action-btn" onclick="usuarioController.confirmarExclusao('${usuario.cpf}', '${usuario.nome}')" title="Excluir">
                        <i class='bx bx-trash'></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    getFuncaoBadgeClass(funcao) {
        const classes = {
            'Administrador': 'badge-primary',
            'Mecânico': 'badge-success',
            'Atendente': 'badge-warning'
        };
        return classes[funcao] || 'badge-secondary';
    }

    setupFilters() {
        const filterText = document.getElementById('filter-text');
        const filterFuncao = document.getElementById('filter-funcao');
        const clearFilters = document.getElementById('clear-filters');

        if (filterText) {
            filterText.addEventListener('input', () => this.applyFilters());
        }

        if (filterFuncao) {
            filterFuncao.addEventListener('change', () => this.applyFilters());
        }

        if (clearFilters) {
            clearFilters.addEventListener('click', () => {
                if (filterText) filterText.value = '';
                if (filterFuncao) filterFuncao.value = '';
                this.applyFilters();
            });
        }
    }

    applyFilters() {
        const filterText = document.getElementById('filter-text')?.value.toLowerCase() || '';
        const filterFuncao = document.getElementById('filter-funcao')?.value || '';
        
        // Filtrar tabela
        const rows = document.querySelectorAll('#usuarios-table tbody tr');
        rows.forEach(row => {
            const nome = row.children[0]?.textContent.toLowerCase() || '';
            const email = row.children[1]?.textContent.toLowerCase() || '';
            const funcao = row.children[2]?.textContent.toLowerCase() || '';
            const telefone = row.children[3]?.textContent.toLowerCase() || '';
            const cpf = row.children[4]?.textContent.toLowerCase() || '';

            const matchText = nome.includes(filterText) || 
                            email.includes(filterText) || 
                            telefone.includes(filterText) || 
                            cpf.includes(filterText);
            const matchFuncao = !filterFuncao || funcao.includes(filterFuncao.toLowerCase());

            row.style.display = matchText && matchFuncao ? '' : 'none';
        });

        // Filtrar cards
        const cards = document.querySelectorAll('.usuario-card');
        cards.forEach(card => {
            const nome = card.querySelector('.usuario-nome')?.textContent.toLowerCase() || '';
            const funcao = card.querySelector('.badge')?.textContent.toLowerCase() || '';
            const infos = Array.from(card.querySelectorAll('.usuario-info p')).map(p => p.textContent.toLowerCase());
            
            const matchText = nome.includes(filterText) || 
                            infos.some(info => info.includes(filterText));
            const matchFuncao = !filterFuncao || funcao.includes(filterFuncao.toLowerCase());

            card.style.display = matchText && matchFuncao ? '' : 'none';
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
        this.renderUsuarios(this.usuarios);
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

    sortUsuarios(usuarios) {
        return [...usuarios].sort((a, b) => {
            const aValue = String(a[this.currentSort.column]).toLowerCase();
            const bValue = String(b[this.currentSort.column]).toLowerCase();
            
            if (this.currentSort.direction === 'asc') {
                return aValue.localeCompare(bValue);
            } else {
                return bValue.localeCompare(aValue);
            }
        });
    }

    async editarUsuario(cpf) {
        window.location.href = `usuarios-ajustar.html?id=${cpf}`;
    }

    async confirmarExclusao(cpf, nome) {
        const confirmar = confirm(`Deseja realmente excluir o usuário "${nome}"?`);
        if (confirmar) {
            await this.excluirUsuario(cpf);
        }
    }

    async excluirUsuario(cpf) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${this.apiUrl}/${cpf}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Erro ao excluir usuário');

            const result = await response.json();
            if (result.success) {
                this.showNotification('Usuário excluído com sucesso!', 'success');
                this.loadUsuarios();
            } else {
                throw new Error(result.message || 'Erro ao excluir usuário');
            }
        } catch (error) {
            console.error('❌ Erro ao excluir usuário:', error);
            this.showNotification('Erro ao excluir usuário', 'error');
        }
    }

    async visualizarUsuario(cpf) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${this.apiUrl}/${cpf}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Erro ao buscar usuário');

            const result = await response.json();
            if (result.success && result.data) {
                const usuario = result.data;

                // Remove modal anterior se existir
                const modalExistente = document.getElementById('modal-visualizar-usuario');
                if (modalExistente) {
                    modalExistente.remove();
                }

                const modalHtml = `
                    <div id="modal-visualizar-usuario" class="modal-overlay">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h3>Detalhes do Usuário</h3>
                                <button class="modal-close" id="close-modal-usuario">&times;</button>
                            </div>
                            <div class="modal-body">
                                <div class="basic-info">
                                    <p><strong>Nome:</strong> ${usuario.nome}</p>
                                    <p><strong>Email:</strong> ${usuario.email}</p>
                                    <p><strong>CPF:</strong> ${usuario.cpf}</p>
                                    <p><strong>Telefone:</strong> ${usuario.telefone}</p>
                                    <p><strong>Função:</strong> <span class="badge ${this.getFuncaoBadgeClass(usuario.funcao)}">${usuario.funcao}</span></p>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                document.body.insertAdjacentHTML('beforeend', modalHtml);

                // Fechar ao clicar fora do modal ou no botão de fechar
                document.getElementById('modal-visualizar-usuario').addEventListener('click', function(e) {
                    if (e.target === this) {
                        this.remove();
                    }
                });

                document.getElementById('close-modal-usuario').onclick = function() {
                    document.getElementById('modal-visualizar-usuario').remove();
                };

            } else {
                throw new Error(result.message || 'Erro ao buscar usuário');
            }
        } catch (error) {
            console.error('❌ Erro ao visualizar usuário:', error);
            this.showNotification('Erro ao visualizar usuário', 'error');
        }
    }

    showNotification(message, type = 'info') {
        const event = new CustomEvent('showNotification', {
            detail: { message, type }
        });
        document.dispatchEvent(event);
    }
}

let usuarioController;
document.addEventListener('DOMContentLoaded', () => {
    usuarioController = new UsuarioController();
});

window.usuarioController = usuarioController;
