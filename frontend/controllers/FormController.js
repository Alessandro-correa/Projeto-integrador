class FormController {
    constructor() {
        this.osForm = document.querySelector('.os-form');
        this.baseURL = 'http://localhost:3000/api';
        this.init();
    }

    init() {
        if (this.osForm) {
            this.setDefaultValues();
            this.setupFormSubmission();
            this.setupInputMasks();
        }
    }

    setDefaultValues() {
        // Definir data atual por padrão em formulários de cadastro
        const dataInput = document.getElementById('data');
        if (dataInput && !dataInput.value && (window.location.pathname.includes('-cadastro.html') || window.location.pathname.includes('os-efetivar'))) {
            const hoje = new Date().toISOString().split('T')[0];
            dataInput.value = hoje;
        }

        // Gerar código curto para usuários
        const codigoInput = document.getElementById('codigo');
        if (codigoInput && !codigoInput.value && window.location.pathname.includes('usuarios-cadastro')) {
            // Buscar o maior código já existente via backend (opcional, mas aqui vamos só gerar um aleatório curto)
            // Para garantir unicidade real, o ideal seria consultar o backend, mas para simplicidade, vamos gerar um código com timestamp
            const random = Math.floor(Math.random() * 1000); // 0-999
            const codigo = `USR${String(random).padStart(3, '0')}`;
            codigoInput.value = codigo;
        }
    }

    setupFormSubmission() {
        this.osForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleFormSubmit();
        });
    }

    setupInputMasks() {
        const path = window.location.pathname;
        // Máscara de CNPJ para fornecedores
        if (path.includes('fornecedores-cadastro')) {
            const cnpjInput = document.getElementById('cnpj');
            if (cnpjInput) {
                cnpjInput.addEventListener('input', (e) => {
                    let v = e.target.value.replace(/\D/g, '');
                    if (v.length > 14) v = v.slice(0, 14);
                    v = v.replace(/(\d{2})(\d)/, '$1.$2');
                    v = v.replace(/(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
                    v = v.replace(/(\d{2})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3/$4');
                    v = v.replace(/(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d{1,2})/, '$1.$2.$3/$4-$5');
                    e.target.value = v;
                });
            }
            // Máscara de telefone celular (11 dígitos)
            const telInput = document.getElementById('telefone');
            if (telInput) {
                telInput.addEventListener('input', (e) => {
                    let v = e.target.value.replace(/\D/g, '');
                    if (v.length > 11) v = v.slice(0, 11);
                    if (v.length > 2) v = `(${v.slice(0,2)}) ${v.slice(2)}`;
                    if (v.length > 9) v = v.replace(/(\d{5})(\d{4})$/, '$1-$2');
                    e.target.value = v;
                });
            }
        }
        // Máscara de CPF e telefone para usuários
        if (path.includes('usuarios-cadastro')) {
            // Máscara de CPF
            const cpfInput = document.getElementById('cpf');
            if (cpfInput) {
                cpfInput.addEventListener('input', (e) => {
                    let v = e.target.value.replace(/\D/g, '');
                    if (v.length > 11) v = v.slice(0, 11);
                    v = v.replace(/(\d{3})(\d)/, '$1.$2');
                    v = v.replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3');
                    v = v.replace(/(\d{3})\.(\d{3})\.(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
                    e.target.value = v;
                });
            }
            // Máscara de telefone celular (11 dígitos) + mensagem de erro visual igual cliente
            const telInput = document.getElementById('telefone');
            const telError = document.getElementById('telefoneError');
            if (telInput) {
                telInput.addEventListener('input', (e) => {
                    let v = e.target.value.replace(/\D/g, '');
                    if (v.length > 11) v = v.slice(0, 11);
                    // Máscara: (99) 99999-9999 ou (99) 9999-9999
                    if (v.length > 10) {
                        v = v.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
                    } else if (v.length > 6) {
                        v = v.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
                    } else if (v.length > 2) {
                        v = v.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
                    }
                    e.target.value = v;

                    // Validação visual: só aceita celular (11 dígitos)
                    const isValid = /^\(\d{2}\) 9\d{4}-\d{4}$/.test(v);
                    if (v.length > 0) {
                        if (isValid) {
                            e.target.style.borderColor = 'green';
                            telError.innerHTML = '✅ <b>Número válido</b>';
                            telError.style.color = 'green';
                        } else {
                            e.target.style.borderColor = 'red';
                            telError.innerHTML = '❌ <b>Número inválido (apenas celular)</b>';
                            telError.style.color = 'red';
                        }
                    } else {
                        e.target.style.borderColor = '';
                        telError.innerHTML = '';
                    }
                });
            }
        }
    }

    async handleFormSubmit() {
        try {
            const path = window.location.pathname;
            const pageName = path.substring(path.lastIndexOf('/') + 1);
            
            // Identificar qual entidade está sendo cadastrada
            const entity = this.identifyEntity(pageName);
            
            if (!entity) {
                this.showError('Não foi possível identificar o tipo de formulário');
                return;
            }

            // Capturar dados do formulário
            const formData = this.captureFormData();
            
            if (entity === 'motocicletas') {
                let cpf = formData['clienteCpf'];
                const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
                if (!cpfRegex.test(cpf)) {
                    this.showError('CPF inválido. Use o formato XXX.XXX.XXX-XX');
                    return;
                }
            }

            if (entity === 'clientes') {
                let cpf = formData['cpf'];
                const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
                if (!cpfRegex.test(cpf)) {
                    this.showError('CPF inválido. Use o formato XXX.XXX.XXX-XX');
                    return;
                }
            }

            // Validação de CNPJ e telefone para fornecedores
            if (entity === 'fornecedores') {
                let cnpj = formData['cnpj'];
                let telefone = formData['telefone'];
                const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;
                if (!cnpjRegex.test(cnpj)) {
                    this.showError('CNPJ inválido. Use o formato XX.XXX.XXX/0001-XX');
                    return;
                }
                telefone = telefone.replace(/\D/g, '');
                if (!/^\d{11}$/.test(telefone)) {
                    this.showError('Telefone inválido. Use apenas celulares no formato (99) 99999-9999');
                    return;
                }
                formData['telefone'] = telefone;
            }

            // Validação para usuários (igual clientes)
            if (entity === 'usuarios') {
                // CPF
                let cpf = formData['cpf'];
                const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
                if (!cpfRegex.test(cpf)) {
                    this.showError('CPF inválido. Use o formato XXX.XXX.XXX-XX');
                    return;
                }
                // E-mail
                let email = formData['email'];
                const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z.]{2,}$/;
                const validTlds = [
                    'com', 'net', 'org', 'edu', 'gov', 'mil', 'br',
                    'com.br', 'net.br', 'org.br', 'gov.br', 'edu.br'
                ];
                if (!emailRegex.test(email)) {
                    this.showError('Formato de email inválido');
                    return;
                }
                const domain = email.split('@')[1].toLowerCase();
                const tld = domain.split('.').slice(-2).join('.');
                const tldSimple = domain.split('.').pop();
                if (!validTlds.includes(tld) && !validTlds.includes(tldSimple)) {
                    this.showError('Domínio de e-mail inválido');
                    return;
                }
                // Telefone
                let telefone = formData['telefone'].replace(/\D/g, '');
                if (!/^\d{10,11}$/.test(telefone)) {
                    this.showError('Telefone inválido. Use o formato (99) 99999-9999');
                    return;
                }
                formData['telefone'] = telefone;
            }

            // Enviar dados para o backend
            const response = await this.sendToBackend(entity, formData);
            
            if (response.success) {
                this.showSuccess(response.message || 'Dados salvos com sucesso!');
                this.redirectToConsulta(entity);
            } else {
                this.showError(response.message || 'Erro ao salvar dados');
            }
            
        } catch (error) {
            console.error('Erro ao processar formulário:', error);
            this.showError('Erro ao processar formulário: ' + error.message);
        }
    }

    identifyEntity(pageName) {
        if (pageName.includes('usuarios-cadastro')) return 'usuarios';
        if (pageName.includes('clientes-cadastro')) return 'clientes';
        if (pageName.includes('fornecedores-cadastro')) return 'fornecedores';
        if (pageName.includes('marcas-cadastro')) return 'marcas';
        if (pageName.includes('motos-cadastro')) return 'motocicletas';
        if (pageName.includes('pecas-cadastro')) return 'pecas';
        if (pageName.includes('orcamentos-cadastro')) return 'orcamentos';
        if (pageName.includes('os-cadastro')) return 'ordens';
        if (pageName.includes('aquisicoes-cadastro')) return 'aquisicoes';
        
        return null;
    }

    captureFormData() {
        const formData = {};
        const inputs = this.osForm.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            if (input.name || input.id) {
                const key = input.name || input.id;
                formData[key] = input.value;
            }
        });
        
        return formData;
    }

    async sendToBackend(entity, data) {
        const url = `${this.baseURL}/${entity}`;
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || `Erro ${response.status}`);
            }
            
            return result;
        } catch (error) {
            throw error;
        }
    }

    redirectToConsulta(entity) {
        const path = window.location.pathname;
        const basePath = path.substring(0, path.lastIndexOf('/'));
        
        if (entity === 'ordens') {
            window.location.href = `${basePath}/os-consulta.html`;
        } else if (entity === 'motocicletas') {
            window.location.href = `${basePath}/motos-consulta.html`;
        } else {
            window.location.href = `${basePath}/${entity}-consulta.html`;
        }
    }

    showSuccess(message) {
        alert(message);
    }

    showError(message) {
        alert('Erro: ' + message);
    }
}

export default FormController; 