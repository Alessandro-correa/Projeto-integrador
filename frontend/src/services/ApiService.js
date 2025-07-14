class ApiService {
    constructor() {
        this.baseURL = 'http://localhost:3000/api';
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const requestOptions = { ...defaultOptions, ...options };

        try {
            const response = await fetch(url, requestOptions);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `Erro HTTP: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error(`Erro na requisição para ${endpoint}:`, error);
            throw error;
        }
    }

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

    async getOrcamentos() {
        return this.request('/orcamentos');
    }

    async getOrcamento(id) {
        return this.request(`/orcamentos/${id}`);
    }

    async getMotocicletas() {
        return this.request('/motocicletas');
    }

    async getMotocicletasByCliente(cpf) {
        return this.request(`/motocicletas?cliente=${cpf}`);
    }

    async getDashboardStats() {
        return this.request('/dashboard/stats');
    }

    async getDashboardCharts() {
        return this.request('/dashboard/charts');
    }

    async getPecas() {
        return this.request('/pecas');
    }

    async getAquisicoes() {
        return this.request('/aquisicoes');
    }
}

window.apiService = new ApiService();
