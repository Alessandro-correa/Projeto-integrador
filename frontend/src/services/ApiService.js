
// Serviço de API centralizado para requisições HTTP
class ApiService {
    constructor() {
        this.baseUrl = 'http://localhost:3000/api';
    }

    // Realiza uma requisição genérica para a API
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const token = localStorage.getItem('token');
        
        console.log('[API] Fazendo requisição para:', endpoint);
        console.log('[API] Token no localStorage:', token ? 'Presente' : 'Ausente');
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
        };
        
        const requestOptions = { ...defaultOptions, ...options };
        
        // Merge headers if they exist in options
        if (options.headers) {
            requestOptions.headers = { ...defaultOptions.headers, ...options.headers };
        }
        
        console.log('[API] Headers da requisição:', requestOptions.headers);
        
        try {
            const response = await fetch(url, requestOptions);
            console.log('[API] Status da resposta:', response.status);
            
            const data = await response.json();
            console.log('[API] Dados da resposta:', data);
            
            if (!response.ok) {
                throw new Error(data.message || `Erro HTTP: ${response.status}`);
            }
            return data;
        } catch (error) {
            console.error(`[API] Erro na requisição para ${endpoint}:`, error);
            throw error;
        }
    }

    // Clientes
    async getClientes() {
        return this.request('/clientes');
    }
    async getCliente(cpf) {
        return this.request(`/clientes/${cpf}`);
    }
    async createCliente(clienteData) {
        return this.request('/clientes', {
            method: 'POST',
            body: JSON.stringify(clienteData)
        });
    }
    async updateCliente(cpf, clienteData) {
        return this.request(`/clientes/${cpf}`, {
            method: 'PUT',
            body: JSON.stringify(clienteData)
        });
    }
    async deleteCliente(cpf) {
        return this.request(`/clientes/${cpf}`, {
            method: 'DELETE'
        });
    }

    // Usuários
    async getUsuarios() {
        return this.request('/usuarios');
    }
    async getUsuario(email) {
        return this.request(`/usuarios/${email}`);
    }
    async createUsuario(usuarioData) {
        return this.request('/usuarios', {
            method: 'POST',
            body: JSON.stringify(usuarioData)
        });
    }

    // Ordens de Serviço
    async getOrdens() {
        return this.request('/ordens');
    }
    async getOrdem(id) {
        return this.request(`/ordens/${id}`);
    }
    async createOrdem(ordemData) {
        return this.request('/ordens', {
            method: 'POST',
            body: JSON.stringify(ordemData)
        });
    }

    // Orçamentos
    async getOrcamentos() {
        return this.request('/orcamentos');
    }
    async getOrcamento(id) {
        return this.request(`/orcamentos/${id}`);
    }

    // Motocicletas
    async getMotocicletas() {
        return this.request('/motocicletas');
    }
    async getMotocicletasByCliente(cpf) {
        return this.request(`/motocicletas?cliente=${cpf}`);
    }

    // Dashboard
    async getDashboardStats() {
        return this.request('/dashboard/stats');
    }
    async getDashboardCharts() {
        return this.request('/dashboard/charts');
    }

    // Peças
    async getPecas() {
        return this.request('/pecas');
    }

    static async validateCPF(cpf) {
        try {
            // Remove caracteres não numéricos
            cpf = cpf.replace(/\D/g, '');

            // Verifica se tem 11 dígitos
            if (cpf.length !== 11) {
                return false;
            }

            // Verifica se todos os dígitos são iguais
            if (/^(\d)\1{10}$/.test(cpf)) {
                return false;
            }

            // Validação do primeiro dígito verificador
            let soma = 0;
            for (let i = 0; i < 9; i++) {
                soma += parseInt(cpf.charAt(i)) * (10 - i);
            }
            let resto = 11 - (soma % 11);
            let digitoVerificador1 = resto > 9 ? 0 : resto;
            if (digitoVerificador1 !== parseInt(cpf.charAt(9))) {
                return false;
            }

            // Validação do segundo dígito verificador
            soma = 0;
            for (let i = 0; i < 10; i++) {
                soma += parseInt(cpf.charAt(i)) * (11 - i);
            }
            resto = 11 - (soma % 11);
            let digitoVerificador2 = resto > 9 ? 0 : resto;
            if (digitoVerificador2 !== parseInt(cpf.charAt(10))) {
                return false;
            }

            return true;
        } catch (error) {
            console.error('Erro ao validar CPF:', error);
            throw new Error('Erro ao validar CPF. Por favor, verifique o número informado.');
        }
    }
}

// Instancia global para uso em toda a aplicação
window.apiService = new ApiService();
