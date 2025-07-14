const API_BASE_URL = 'http://localhost:3000/api';

class UsuarioController {
    constructor() {
        this.apiUrl = `${API_BASE_URL}/usuarios`;
        this.init();
    }

    init() {
        
        const currentPage = window.location.pathname;
        
        if (currentPage.includes('usuarios-consulta.html')) {
            this.initConsultaPage();
        } else if (currentPage.includes('usuarios-cadastro.html')) {
            this.initCadastroPage();
        }
    }

    initConsultaPage() {
        this.loadUsuarios();
        this.setupFilters();
    }

    async loadUsuarios() {
        try {
            console.log('🔄 Carregando usuários...');
            
            const response = await fetch(this.apiUrl);
            
            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success && result.data) {
                this.renderUsuarios(result.data);
                console.log(`✅ ${result.data.length} usuários carregados`);
            } else {
                throw new Error(result.message || 'Erro ao carregar usuários');
            }
            
        } catch (error) {
            console.error('❌ Erro ao carregar usuários:', error);
            this.showError('Erro ao carregar usuários. Verifique se o servidor está funcionando.');
        }
    }

    renderUsuarios(usuarios) {
        const tbody = document.querySelector('#usuarios-table tbody');
        
        if (!tbody) {
            console.error('❌ Tabela não encontrada');
            return;
        }

        if (usuarios.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 20px;">
                        <i class='bx bx-info-circle'></i>
                        Nenhum usuário encontrado
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = usuarios.map(usuario => `
            <tr data-cpf="${usuario.cpf}">
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
                        <button class="btn-edit" onclick="usuarioController.editarUsuario('${usuario.cpf}')" title="Editar">
                            <i class='bx bx-edit'></i>
                        </button>
                        <button class="btn-adjust" onclick="usuarioController.ajustarUsuario('${usuario.email}')" title="Ajustar">
                            <i class='bx bx-cog'></i>
                        </button>
                        <button class="btn-delete" onclick="usuarioController.confirmarExclusao('${usuario.cpf}', '${usuario.nome}')" title="Excluir">
                            <i class='bx bx-trash'></i>
                        </button>
                        <button class="btn-view" onclick="usuarioController.visualizarUsuario('${usuario.cpf}')" title="Visualizar">
                            <i class='bx bx-show'></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    getFuncaoBadgeClass(funcao) {
        const classes = {
            'Administrador': 'admin',
            'Mecânico': 'mechanic',
            'Atendente': 'attendant'
        };
        return classes[funcao] || 'default';
    }

    setupFilters() {
        const filterText = document.getElementById('filter-text');
        const filterStatus = document.getElementById('filter-status');
        const clearFilters = document.getElementById('clear-filters');

        if (filterText) {
            filterText.addEventListener('input', () => this.applyFilters());
        }

        if (filterStatus) {
            filterStatus.addEventListener('change', () => this.applyFilters());
        }

        if (clearFilters) {
            clearFilters.addEventListener('click', () => {
                filterText.value = '';
                filterStatus.value = '';
                this.applyFilters();
            });
        }
    }

    applyFilters() {
        const filterText = document.getElementById('filter-text')?.value.toLowerCase() || '';
        const filterStatus = document.getElementById('filter-status')?.value || '';
        const rows = document.querySelectorAll('#usuarios-table tbody tr');

        rows.forEach(row => {
            const nome = row.children[0]?.textContent.toLowerCase() || '';
            const email = row.children[1]?.textContent.toLowerCase() || '';
            const funcao = row.children[2]?.textContent || '';

            const matchText = nome.includes(filterText) || email.includes(filterText);
            const matchStatus = !filterStatus || funcao.includes(filterStatus);

            row.style.display = (matchText && matchStatus) ? '' : 'none';
        });
    }

    initCadastroPage() {
        this.setupFormSubmission();
        this.generateCodigo();
        this.setupFormValidation();
    }

    setupFormSubmission() {
        const form = document.querySelector('.os-form');
        
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleFormSubmit();
            });
        }
    }

    async handleFormSubmit() {
        try {
            const formData = this.getFormData();
            
            if (!this.validateForm(formData)) {
                return;
            }

            console.log('📤 Enviando dados do usuário:', formData);

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                this.showSuccess('Usuário cadastrado com sucesso!');
                setTimeout(() => {
                    window.location.href = 'usuarios-consulta.html';
                }, 2000);
            } else {
                throw new Error(result.message || 'Erro ao cadastrar usuário');
            }

        } catch (error) {
            console.error('❌ Erro ao cadastrar usuário:', error);
            this.showError(error.message || 'Erro ao cadastrar usuário');
        }
    }

    getFormData() {
        return {
            nome: document.getElementById('nome')?.value.trim() || '',
            email: document.getElementById('email')?.value.trim() || '',
            cpf: document.getElementById('cpf')?.value.trim() || '',
            telefone: document.getElementById('telefone')?.value.trim() || '',
            funcao: document.getElementById('funcao')?.value || '',
            senha: document.getElementById('senha')?.value || '',
            codigo: document.getElementById('codigo')?.value || ''
        };
    }

    validateForm(data) {
        
        const requiredFields = ['nome', 'email', 'cpf', 'telefone', 'funcao', 'senha', 'codigo'];
        
        for (const field of requiredFields) {
            if (!data[field]) {
                this.showError(`O campo ${field} é obrigatório`);
                return false;
            }
        }

        if (!this.validateCPF(data.cpf)) {
            this.showError('CPF inválido');
            return false;
        }

        if (!this.validateEmail(data.email)) {
            this.showError('Email inválido');
            return false;
        }

        return true;
    }

    validateCPF(cpf) {
        const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
        return cpfRegex.test(cpf);
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    generateCodigo() {
        const codigo = 'USR' + Date.now().toString().slice(-6);
        const codigoInput = document.getElementById('codigo');
        if (codigoInput) {
            codigoInput.value = codigo;
        }
    }

    setupFormValidation() {
        
        const cpfInput = document.getElementById('cpf');
        if (cpfInput) {
            cpfInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                value = value.replace(/(\d{3})(\d)/, '$1.$2');
                value = value.replace(/(\d{3})(\d)/, '$1.$2');
                value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
                e.target.value = value;
            });
        }

        const telefoneInput = document.getElementById('telefone');
        if (telefoneInput) {
            telefoneInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                value = value.replace(/(\d{2})(\d)/, '($1) $2');
                value = value.replace(/(\d{4,5})(\d{4})$/, '$1-$2');
                e.target.value = value;
            });
        }
    }

    async editarUsuario(cpf) {
        try {
            console.log(`✏️ Editando usuário: ${cpf}`);

            const response = await fetch(`${this.apiUrl}/${cpf}`);
            
            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const result = await response.json();

            if (result.success && result.data) {
                this.showEditModal(result.data);
            } else {
                throw new Error(result.message || 'Usuário não encontrado');
            }

        } catch (error) {
            console.error('❌ Erro ao buscar dados do usuário para edição:', error);
            this.showError(error.message || 'Erro ao carregar dados do usuário');
        }
    }

    showEditModal(usuario) {
        const modalHtml = `
            <div class="modal-overlay" id="editUsuarioModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Editar Usuário</h3>
                        <button class="modal-close" onclick="usuarioController.closeEditModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="editUsuarioForm" class="edit-form">
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="edit-nome">Nome Completo</label>
                                    <input type="text" id="edit-nome" name="nome" value="${usuario.nome}" required>
                                </div>
                                <div class="form-group">
                                    <label for="edit-email">E-mail</label>
                                    <input type="email" id="edit-email" name="email" value="${usuario.email}" required>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="edit-cpf">CPF</label>
                                    <input type="text" id="edit-cpf" name="cpf" value="${usuario.cpf}" readonly>
                                </div>
                                <div class="form-group">
                                    <label for="edit-telefone">Telefone</label>
                                    <input type="text" id="edit-telefone" name="telefone" value="${usuario.telefone}" required>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="edit-funcao">Função</label>
                                    <select id="edit-funcao" name="funcao" required>
                                        <option value="">Selecione...</option>
                                        <option value="Administrador" ${usuario.funcao === 'Administrador' ? 'selected' : ''}>Administrador</option>
                                        <option value="Mecânico" ${usuario.funcao === 'Mecânico' ? 'selected' : ''}>Mecânico</option>
                                        <option value="Atendente" ${usuario.funcao === 'Atendente' ? 'selected' : ''}>Atendente</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="edit-senha">Nova Senha (deixe em branco para manter atual)</label>
                                    <input type="password" id="edit-senha" name="senha" placeholder="Digite nova senha se desejar alterar">
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="edit-codigo">Código</label>
                                <input type="text" id="edit-codigo" name="codigo" value="${usuario.codigo}" readonly>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-secondary" onclick="usuarioController.closeEditModal()">Cancelar</button>
                        <button class="btn-primary" onclick="usuarioController.salvarEdicao('${usuario.cpf}')">Salvar Alterações</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        this.setupEditFormMasks();
    }

    setupEditFormMasks() {
        
        const telefoneInput = document.getElementById('edit-telefone');
        if (telefoneInput) {
            telefoneInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                value = value.replace(/(\d{2})(\d)/, '($1) $2');
                value = value.replace(/(\d{4,5})(\d{4})$/, '$1-$2');
                e.target.value = value;
            });
        }
    }

    async salvarEdicao(cpf) {
        try {
            const formData = this.getEditFormData();
            
            if (!this.validateEditForm(formData)) {
                return;
            }

            console.log('📤 Atualizando usuário:', cpf, formData);

            const response = await fetch(`${this.apiUrl}/${cpf}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                this.showSuccess('Usuário atualizado com sucesso!');
                this.closeEditModal();
                this.loadUsuarios(); 
            } else {
                throw new Error(result.message || 'Erro ao atualizar usuário');
            }

        } catch (error) {
            console.error('❌ Erro ao atualizar usuário:', error);
            this.showError(error.message || 'Erro ao atualizar usuário');
        }
    }

    getEditFormData() {
        const dados = {
            nome: document.getElementById('edit-nome')?.value.trim() || '',
            email: document.getElementById('edit-email')?.value.trim() || '',
            telefone: document.getElementById('edit-telefone')?.value.trim() || '',
            funcao: document.getElementById('edit-funcao')?.value || '',
            codigo: document.getElementById('edit-codigo')?.value || ''
        };

        const senha = document.getElementById('edit-senha')?.value.trim();
        if (senha) {
            dados.senha = senha;
        } else {
            
            dados.senha = 'manter_atual'; 
        }

        return dados;
    }

    validateEditForm(data) {
        
        const requiredFields = ['nome', 'email', 'telefone', 'funcao', 'codigo'];
        
        for (const field of requiredFields) {
            if (!data[field]) {
                this.showError(`O campo ${field} é obrigatório`);
                return false;
            }
        }

        if (!this.validateEmail(data.email)) {
            this.showError('Email inválido');
            return false;
        }

        return true;
    }

    closeEditModal() {
        const modal = document.getElementById('editUsuarioModal');
        if (modal) {
            modal.remove();
        }
    }

    async confirmarExclusao(cpf, nome) {
        if (confirm(`Tem certeza que deseja excluir o usuário "${nome}"?\n\nEsta ação não pode ser desfeita.`)) {
            await this.excluirUsuario(cpf);
        }
    }

    async excluirUsuario(cpf) {
        try {
            console.log(`🗑️ Excluindo usuário: ${cpf}`);

            const response = await fetch(`${this.apiUrl}/${cpf}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (response.ok && result.success) {
                this.showSuccess('Usuário excluído com sucesso!');
                this.loadUsuarios(); 
            } else {
                throw new Error(result.message || 'Erro ao excluir usuário');
            }

        } catch (error) {
            console.error('❌ Erro ao excluir usuário:', error);
            this.showError(error.message || 'Erro ao excluir usuário');
        }
    }

    async visualizarUsuario(cpf) {
        try {
            console.log(`👁️ Visualizando usuário: ${cpf}`);

            const response = await fetch(`${this.apiUrl}/${cpf}`);
            
            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const result = await response.json();

            if (result.success && result.data) {
                this.showUsuarioModal(result.data);
            } else {
                throw new Error(result.message || 'Usuário não encontrado');
            }

        } catch (error) {
            console.error('❌ Erro ao visualizar usuário:', error);
            this.showError(error.message || 'Erro ao carregar dados do usuário');
        }
    }

    showUsuarioModal(usuario) {
        const modalHtml = `
            <div class="modal-overlay" id="usuarioModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Detalhes do Usuário</h3>
                        <button class="modal-close" onclick="usuarioController.closeModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="user-details">
                            <div class="detail-row">
                                <label>Nome:</label>
                                <span>${usuario.nome}</span>
                            </div>
                            <div class="detail-row">
                                <label>Email:</label>
                                <span>${usuario.email}</span>
                            </div>
                            <div class="detail-row">
                                <label>CPF:</label>
                                <span>${usuario.cpf}</span>
                            </div>
                            <div class="detail-row">
                                <label>Telefone:</label>
                                <span>${usuario.telefone}</span>
                            </div>
                            <div class="detail-row">
                                <label>Função:</label>
                                <span class="badge ${this.getFuncaoBadgeClass(usuario.funcao)}">${usuario.funcao}</span>
                            </div>
                            <div class="detail-row">
                                <label>Código:</label>
                                <span>${usuario.codigo}</span>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-secondary" onclick="usuarioController.closeModal()">Fechar</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    closeModal() {
        const modal = document.getElementById('usuarioModal');
        if (modal) {
            modal.remove();
        }
    }

    showSuccess(message) {
        BasePageController.showNotification(message, 'success');
    }

    showError(message) {
        BasePageController.showNotification(message, 'error');
    }

    showInfo(message) {
        BasePageController.showNotification(message, 'info');
    }

    showNotification(message, type = 'info') {
        BasePageController.showNotification(message, type);
    }

    getNotificationIcon(type) {
        
        return '';
    }

    ajustarUsuario(email) {
        
        window.location.href = `usuarios-ajustar.html?email=${encodeURIComponent(email)}`;
    }
}

let usuarioController;
document.addEventListener('DOMContentLoaded', () => {
    usuarioController = new UsuarioController();
});

window.usuarioController = usuarioController;
