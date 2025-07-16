/**
 * CLIENTE PAGE CONTROLLER
 * Responsável pela interface e interações da página de clientes
 */

const API_BASE_URL = 'http://localhost:3000/api';

class ClienteController {
    constructor() {
        this.apiUrl = `${API_BASE_URL}/clientes`;
        this.currentSort = {
            column: 'nome',
            direction: 'asc'
        };
        this.clientes = [];
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
        this.initSortableHeaders();
    }

    async loadClientes() {
        try {
            console.log('🔄 Carregando clientes...');
            
            const token = localStorage.getItem('token');
            const response = await fetch(this.apiUrl, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success && result.data) {
                this.clientes = result.data;
                this.renderClientes(this.clientes);
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
                    <td colspan="5" style="text-align: center; padding: 20px;">
                        <i class='bx bx-info-circle'></i>
                        Nenhum cliente encontrado
                    </td>
                </tr>
            `;
            return;
        }

        // Aplicar ordenação
        const sortedClientes = this.sortClientes(clientes);

        tbody.innerHTML = sortedClientes.map(cliente => `
            <tr data-cpf="${cliente.cpf}">
                <td>${cliente.nome}</td>
                <td>${cliente.email}</td>
                <td>${cliente.telefone}</td>
                <td>${cliente.cpf}</td>
                <td>
                    <div class="actions">
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

    setupFilters() {
        const filterText = document.getElementById('filter-text');
        const clearFilters = document.getElementById('clear-filters');

        if (filterText) {
            filterText.addEventListener('input', () => this.applyFilters());
        }

        if (clearFilters) {
            clearFilters.addEventListener('click', () => {
                filterText.value = '';
                this.applyFilters();
            });
        }
    }

    applyFilters() {
        const filterText = document.getElementById('filter-text')?.value.toLowerCase() || '';
        const rows = document.querySelectorAll('#clientes-table tbody tr');

        rows.forEach(row => {
            const nome = row.children[0]?.textContent.toLowerCase() || '';
            const email = row.children[1]?.textContent.toLowerCase() || '';
            const telefone = row.children[2]?.textContent.toLowerCase() || '';
            const cpf = row.children[3]?.textContent.toLowerCase() || '';

            const matchText = nome.includes(filterText) || 
                            email.includes(filterText) || 
                            telefone.includes(filterText) || 
                            cpf.includes(filterText);

            row.style.display = matchText ? '' : 'none';
        });
    }

    initCadastroPage() {
        // Verificar se ClienteCadastroController já está ativo
        if (window.clienteCadastroController) {
            console.log('✅ ClienteCadastroController já está ativo');
            return;
        }
        
        // Fallback para funcionalidade básica
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

            const token = localStorage.getItem('token');
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
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

    editarCliente(cpf) {
        // Redirecionar para a página de ajuste de cliente
        const cpfFormatted = cpf.replace(/\D/g, '');
        window.location.href = `clientes-ajustar.html?cpf=${cpfFormatted}`;
    }

    async confirmarExclusao(cpf, nome) {
        if (confirm(`Tem certeza que deseja excluir o cliente "${nome}"?\n\nEsta ação não pode ser desfeita.`)) {
            await this.excluirCliente(cpf);
        }
    }

    async excluirCliente(cpf) {
        try {
            console.log(`🗑️ Excluindo cliente: ${cpf}`);

            const token = localStorage.getItem('token');
            const response = await fetch(`${this.apiUrl}/${cpf}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
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

    getSexoBadgeClass(sexo) {
        switch (sexo) {
            case 'Masculino':
                return 'badge-primary';
            case 'Feminino':
                return 'badge-secondary';
            default:
                return 'badge-info';
        }
    }

    closeModal() {
        const modal = document.getElementById('clienteModal');
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

    ajustarCliente(cpf) {
        
        const cpfFormatted = cpf.replace(/\D/g, '');
        window.location.href = `clientes-ajustar.html?cpf=${cpfFormatted}`;
    }

    initSortableHeaders() {
        const sortableHeaders = document.querySelectorAll('.sortable');
        sortableHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const column = header.getAttribute('data-column');
                this.sortBy(column);
            });
        });
    }

    sortBy(column) {
        if (this.currentSort.column === column) {
            this.currentSort.direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            const header = document.querySelector(`[data-column="${column}"]`);
            const defaultSort = header.getAttribute('data-default-sort') || 'asc';
            this.currentSort.column = column;
            this.currentSort.direction = defaultSort;
        }

        this.updateSortIcons();
        this.renderClientes(this.clientes);
    }

    updateSortIcons() {
        // Remove classes ativas de todos os ícones
        document.querySelectorAll('.sort-icon').forEach(icon => {
            icon.classList.remove('active');
            icon.className = 'bx bx-sort-alt-2 sort-icon';
        });
        
        document.querySelectorAll('.sortable').forEach(header => {
            header.classList.remove('sorted');
        });

        const currentHeader = document.querySelector(`[data-column="${this.currentSort.column}"]`);
        if (currentHeader) {
            const icon = currentHeader.querySelector('.sort-icon');
            if (icon) {
                icon.classList.add('active');
                currentHeader.classList.add('sorted');

                if (this.currentSort.direction === 'asc') {
                    icon.className = 'bx bx-sort-up sort-icon active';
                } else {
                    icon.className = 'bx bx-sort-down sort-icon active';
                }
            }
        }
    }

    sortClientes(clientes) {
        return [...clientes].sort((a, b) => {
            const column = this.currentSort.column;
            const direction = this.currentSort.direction;
            
            let valueA = a[column] || '';
            let valueB = b[column] || '';

            // Normalizar strings para comparação
            if (typeof valueA === 'string') {
                valueA = valueA.toLowerCase();
            }
            if (typeof valueB === 'string') {
                valueB = valueB.toLowerCase();
            }

            let comparison = 0;
            if (valueA > valueB) {
                comparison = 1;
            } else if (valueA < valueB) {
                comparison = -1;
            }

            return direction === 'desc' ? comparison * -1 : comparison;
        });
    }
}

let clienteController;
document.addEventListener('DOMContentLoaded', () => {
    clienteController = new ClienteController();
});

window.clienteController = clienteController;
