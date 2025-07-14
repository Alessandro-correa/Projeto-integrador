/**
 * CLIENTE PAGE CONTROLLER
 * Responsável pela interface e interações da página de clientes
 */

const API_BASE_URL = 'http://localhost:3000/api';

class ClienteController {
    constructor() {
        this.apiUrl = `${API_BASE_URL}/clientes`;
        this.init();
    }

    init() {
        
        const currentPage = window.location.pathname;
        
        if (currentPage.includes('clientes-consulta.html')) {
            this.initConsultaPage();
        } else if (currentPage.includes('clientes-cadastro.html')) {
            this.initCadastroPage();
        }
    }

    initConsultaPage() {
        this.loadClientes();
        this.setupFilters();
    }

    async loadClientes() {
        try {
            console.log('🔄 Carregando clientes...');
            
            const response = await fetch(this.apiUrl);
            
            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success && result.data) {
                this.renderClientes(result.data);
                console.log(`✅ ${result.data.length} clientes carregados`);
            } else {
                throw new Error(result.message || 'Erro ao carregar clientes');
            }
            
        } catch (error) {
            console.error('❌ Erro ao carregar clientes:', error);
            this.showError('Erro ao carregar clientes. Verifique se o servidor está funcionando.');
        }
    }

    renderClientes(clientes) {
        const tbody = document.querySelector('#clientes-table tbody');
        
        if (!tbody) {
            console.error('❌ Tabela não encontrada');
            return;
        }

        if (clientes.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 20px;">
                        <i class='bx bx-info-circle'></i>
                        Nenhum cliente encontrado
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = clientes.map(cliente => `
            <tr data-cpf="${cliente.cpf}">
                <td>${cliente.nome}</td>
                <td>${cliente.email}</td>
                <td>${cliente.telefone}</td>
                <td>${cliente.cpf}</td>
                <td>
                    <span class="badge ${this.getSexoBadgeClass(cliente.sexo)}">
                        ${cliente.sexo}
                    </span>
                </td>
                <td>${cliente.profissao}</td>
                <td>
                    <div class="actions">
                        <button class="action-btn" onclick="clienteController.visualizarCliente('${cliente.cpf}')" title="Visualizar">
                            <i class='bx bx-show'></i>
                        </button>
                        <button class="action-btn" onclick="clienteController.editarCliente('${cliente.cpf}')" title="Editar">
                            <i class='bx bx-edit'></i>
                        </button>
                        <button class="action-btn" onclick="clienteController.ajustarCliente('${cliente.cpf}')" title="Ajustar">
                            <i class='bx bx-cog'></i>
                        </button>
                        <button class="action-btn" onclick="clienteController.confirmarExclusao('${cliente.cpf}', '${cliente.nome}')" title="Excluir">
                            <i class='bx bx-trash'></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    getSexoBadgeClass(sexo) {
        const classes = {
            'Masculino': 'male',
            'Feminino': 'female'
        };
        return classes[sexo] || 'default';
    }

    setupFilters() {
        const filterText = document.getElementById('filter-text');
        const filterSexo = document.getElementById('filter-sexo');
        const clearFilters = document.getElementById('clear-filters');

        if (filterText) {
            filterText.addEventListener('input', () => this.applyFilters());
        }

        if (filterSexo) {
            filterSexo.addEventListener('change', () => this.applyFilters());
        }

        if (clearFilters) {
            clearFilters.addEventListener('click', () => {
                filterText.value = '';
                filterSexo.value = '';
                this.applyFilters();
            });
        }
    }

    applyFilters() {
        const filterText = document.getElementById('filter-text')?.value.toLowerCase() || '';
        const filterSexo = document.getElementById('filter-sexo')?.value || '';
        const rows = document.querySelectorAll('#clientes-table tbody tr');

        rows.forEach(row => {
            const nome = row.children[0]?.textContent.toLowerCase() || '';
            const email = row.children[1]?.textContent.toLowerCase() || '';
            const sexo = row.children[4]?.textContent || '';

            const matchText = nome.includes(filterText) || email.includes(filterText);
            const matchSexo = !filterSexo || sexo.includes(filterSexo);

            row.style.display = (matchText && matchSexo) ? '' : 'none';
        });
    }

    initCadastroPage() {
        this.setupFormSubmission();
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

            console.log('📤 Enviando dados do cliente:', formData);

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                this.showSuccess('Cliente cadastrado com sucesso!');
                setTimeout(() => {
                    window.location.href = 'clientes-consulta.html';
                }, 2000);
            } else {
                throw new Error(result.message || 'Erro ao cadastrar cliente');
            }

        } catch (error) {
            console.error('❌ Erro ao cadastrar cliente:', error);
            this.showError(error.message || 'Erro ao cadastrar cliente');
        }
    }

    getFormData() {
        return {
            nome: document.getElementById('nome')?.value.trim() || '',
            email: document.getElementById('email')?.value.trim() || '',
            cpf: document.getElementById('cpf')?.value.trim() || '',
            telefone: document.getElementById('telefone')?.value.trim() || '',
            sexo: document.getElementById('sexo')?.value || '',
            endereco: document.getElementById('endereco')?.value.trim() || '',
            profissao: document.getElementById('profissao')?.value.trim() || '',
            dataDeNascimento: document.getElementById('data-nascimento')?.value || ''
        };
    }

    validateForm(data) {
        
        const requiredFields = ['nome', 'email', 'cpf', 'telefone', 'sexo', 'endereco', 'profissao', 'dataDeNascimento'];
        
        for (const field of requiredFields) {
            if (!data[field]) {
                this.showError(`O campo ${this.getFieldLabel(field)} é obrigatório`);
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

        if (!this.validateDataNascimento(data.dataDeNascimento)) {
            this.showError('Data de nascimento inválida');
            return false;
        }

        return true;
    }

    getFieldLabel(field) {
        const labels = {
            nome: 'Nome',
            email: 'Email',
            cpf: 'CPF',
            telefone: 'Telefone',
            sexo: 'Sexo',
            endereco: 'Endereço',
            profissao: 'Profissão',
            dataDeNascimento: 'Data de Nascimento'
        };
        return labels[field] || field;
    }

    validateCPF(cpf) {
        const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
        return cpfRegex.test(cpf);
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    validateDataNascimento(data) {
        if (!data) return false;
        
        const hoje = new Date();
        const nascimento = new Date(data);

        if (isNaN(nascimento.getTime())) return false;

        if (nascimento > hoje) return false;

        const idade = hoje.getFullYear() - nascimento.getFullYear();
        return idade >= 16 && idade <= 120;
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

    async editarCliente(cpf) {
        try {
            console.log(`✏️ Editando cliente: ${cpf}`);

            const response = await fetch(`${this.apiUrl}/${cpf}`);
            
            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const result = await response.json();

            if (result.success && result.data) {
                this.showEditModal(result.data);
            } else {
                throw new Error(result.message || 'Cliente não encontrado');
            }

        } catch (error) {
            console.error('❌ Erro ao buscar dados do cliente para edição:', error);
            this.showError(error.message || 'Erro ao carregar dados do cliente');
        }
    }

    showEditModal(cliente) {
        const modalHtml = `
            <div class="modal-overlay" id="editClienteModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Editar Cliente</h3>
                        <button class="modal-close" onclick="clienteController.closeEditModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="editClienteForm" class="edit-form">
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="edit-nome">Nome Completo</label>
                                    <input type="text" id="edit-nome" name="nome" value="${cliente.nome}" required>
                                </div>
                                <div class="form-group">
                                    <label for="edit-email">E-mail</label>
                                    <input type="email" id="edit-email" name="email" value="${cliente.email}" required>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="edit-cpf">CPF</label>
                                    <input type="text" id="edit-cpf" name="cpf" value="${cliente.cpf}" readonly>
                                </div>
                                <div class="form-group">
                                    <label for="edit-telefone">Telefone</label>
                                    <input type="text" id="edit-telefone" name="telefone" value="${cliente.telefone}" required>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="edit-sexo">Sexo</label>
                                    <select id="edit-sexo" name="sexo" required>
                                        <option value="">Selecione...</option>
                                        <option value="Masculino" ${cliente.sexo === 'Masculino' ? 'selected' : ''}>Masculino</option>
                                        <option value="Feminino" ${cliente.sexo === 'Feminino' ? 'selected' : ''}>Feminino</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="edit-profissao">Profissão</label>
                                    <input type="text" id="edit-profissao" name="profissao" value="${cliente.profissao}" required>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="edit-endereco">Endereço</label>
                                    <textarea id="edit-endereco" name="endereco" rows="2" required>${cliente.endereco}</textarea>
                                </div>
                                <div class="form-group">
                                    <label for="edit-data-nascimento">Data de Nascimento</label>
                                    <input type="date" id="edit-data-nascimento" name="dataDeNascimento" value="${cliente.data_de_nascimento}" required>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-secondary" onclick="clienteController.closeEditModal()">Cancelar</button>
                        <button class="btn-primary" onclick="clienteController.salvarEdicao('${cliente.cpf}')">Salvar Alterações</button>
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

            console.log('📤 Atualizando cliente:', cpf, formData);

            const response = await fetch(`${this.apiUrl}/${cpf}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                this.showSuccess('Cliente atualizado com sucesso!');
                this.closeEditModal();
                this.loadClientes();
            } else {
                throw new Error(result.message || 'Erro ao atualizar cliente');
            }

        } catch (error) {
            console.error('❌ Erro ao atualizar cliente:', error);
            this.showError(error.message || 'Erro ao atualizar cliente');
        }
    }

    getEditFormData() {
        return {
            nome: document.getElementById('edit-nome')?.value.trim() || '',
            email: document.getElementById('edit-email')?.value.trim() || '',
            telefone: document.getElementById('edit-telefone')?.value.trim() || '',
            sexo: document.getElementById('edit-sexo')?.value || '',
            profissao: document.getElementById('edit-profissao')?.value.trim() || '',
            endereco: document.getElementById('edit-endereco')?.value.trim() || '',
            dataDeNascimento: document.getElementById('edit-data-nascimento')?.value || ''
        };
    }

    validateEditForm(data) {
        const requiredFields = ['nome', 'email', 'telefone', 'sexo', 'profissao', 'endereco', 'dataDeNascimento'];
        
        for (const field of requiredFields) {
            if (!data[field]) {
                this.showError(`O campo ${this.getFieldLabel(field)} é obrigatório`);
                return false;
            }
        }

        if (!this.validateEmail(data.email)) {
            this.showError('Email inválido');
            return false;
        }

        if (!this.validateDataNascimento(data.dataDeNascimento)) {
            this.showError('Data de nascimento inválida');
            return false;
        }

        return true;
    }

    closeEditModal() {
        const modal = document.getElementById('editClienteModal');
        if (modal) {
            modal.remove();
        }
    }

    async confirmarExclusao(cpf, nome) {
        if (confirm(`Tem certeza que deseja excluir o cliente "${nome}"?\n\nEsta ação não pode ser desfeita.`)) {
            await this.excluirCliente(cpf);
        }
    }

    async excluirCliente(cpf) {
        try {
            console.log(`🗑️ Excluindo cliente: ${cpf}`);

            const response = await fetch(`${this.apiUrl}/${cpf}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (response.ok && result.success) {
                this.showSuccess('Cliente excluído com sucesso!');
                this.loadClientes();
            } else {
                throw new Error(result.message || 'Erro ao excluir cliente');
            }

        } catch (error) {
            console.error('❌ Erro ao excluir cliente:', error);
            this.showError(error.message || 'Erro ao excluir cliente');
        }
    }

    async visualizarCliente(cpf) {
        try {
            console.log(`👁️ Visualizando cliente: ${cpf}`);

            const response = await fetch(`${this.apiUrl}/${cpf}`);
            
            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const result = await response.json();

            if (result.success && result.data) {
                this.showClienteModal(result.data);
            } else {
                throw new Error(result.message || 'Cliente não encontrado');
            }

        } catch (error) {
            console.error('❌ Erro ao visualizar cliente:', error);
            this.showError(error.message || 'Erro ao carregar dados do cliente');
        }
    }

    showClienteModal(cliente) {
        const modalHtml = `
            <div class="modal-overlay" id="clienteModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Detalhes do Cliente</h3>
                        <button class="modal-close" onclick="clienteController.closeModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="user-details">
                            <div class="detail-row">
                                <label>Nome:</label>
                                <span>${cliente.nome}</span>
                            </div>
                            <div class="detail-row">
                                <label>Email:</label>
                                <span>${cliente.email}</span>
                            </div>
                            <div class="detail-row">
                                <label>CPF:</label>
                                <span>${cliente.cpf}</span>
                            </div>
                            <div class="detail-row">
                                <label>Telefone:</label>
                                <span>${cliente.telefone}</span>
                            </div>
                            <div class="detail-row">
                                <label>Sexo:</label>
                                <span class="badge ${this.getSexoBadgeClass(cliente.sexo)}">${cliente.sexo}</span>
                            </div>
                            <div class="detail-row">
                                <label>Profissão:</label>
                                <span>${cliente.profissao}</span>
                            </div>
                            <div class="detail-row">
                                <label>Endereço:</label>
                                <span>${cliente.endereco}</span>
                            </div>
                            <div class="detail-row">
                                <label>Data de Nascimento:</label>
                                <span>${new Date(cliente.data_de_nascimento).toLocaleDateString('pt-BR')}</span>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-secondary" onclick="clienteController.closeModal()">Fechar</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    closeModal() {
        const modal = document.getElementById('clienteModal');
        if (modal) {
            modal.remove();
        }
    }

    showSuccess(message) {
        Controller.showNotification(message, 'success');
    }

    showError(message) {
        Controller.showNotification(message, 'error');
    }

    showInfo(message) {
        Controller.showNotification(message, 'info');
    }

    showNotification(message, type = 'info') {
        BasePageController.showNotification(message, type);
    }

    ajustarCliente(cpf) {
        
        const cpfFormatted = cpf.replace(/\D/g, '');
        window.location.href = `clientes-ajustar.html?cpf=${cpfFormatted}`;
    }
}

let clienteController;
document.addEventListener('DOMContentLoaded', () => {
    clienteController = new ClienteController();
});

window.clienteController = clienteController;
