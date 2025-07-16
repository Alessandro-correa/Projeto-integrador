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
        
        const dataInput = document.getElementById('data');
        if (dataInput && !dataInput.value && (window.location.pathname.includes('-cadastro.html') || window.location.pathname.includes('os-efetivar'))) {
            const hoje = new Date().toISOString().split('T')[0];
            dataInput.value = hoje;
        }

        const codigoInput = document.getElementById('codigo');
        if (codigoInput && !codigoInput.value && window.location.pathname.includes('usuarios-cadastro')) {

            const random = Math.floor(Math.random() * 1000); 
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
        
        if (path.includes('usuarios-cadastro')) {
            
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
            
            const telInput = document.getElementById('telefone');
            const telError = document.getElementById('telefoneError');
            if (telInput) {
                telInput.addEventListener('input', (e) => {
                    let v = e.target.value.replace(/\D/g, '');
                    if (v.length > 11) v = v.slice(0, 11);
                    
                    if (v.length > 10) {
                        v = v.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
                    } else if (v.length > 6) {
                        v = v.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
                    } else if (v.length > 2) {
                        v = v.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
                    }
                    e.target.value = v;

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

            const entity = this.identifyEntity(pageName);
            
            if (!entity) {
                this.showError('Não foi possível identificar o tipo de formulário');
                return;
            }

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

            if (entity === 'usuarios') {
                
                let cpf = formData['cpf'];
                const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
                if (!cpfRegex.test(cpf)) {
                    this.showError('CPF inválido. Use o formato XXX.XXX.XXX-XX');
                    return;
                }
                
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
                
                let telefone = formData['telefone'].replace(/\D/g, '');
                if (!/^\d{10,11}$/.test(telefone)) {
                    this.showError('Telefone inválido. Use o formato (99) 99999-9999');
                    return;
                }
                formData['telefone'] = telefone;
            }

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
        // Notificação visual verde no canto direito
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());
        const notification = document.createElement('div');
        notification.className = 'notification notification-success';
        notification.style.cssText = `
            position: fixed !important;
            top: 32px !important;
            right: 32px !important;
            left: auto !important;
            transform: none !important;
            background: #10b981 !important;
            color: #fff !important;
            padding: 15px 24px !important;
            border-radius: 8px !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
            z-index: 99999 !important;
            max-width: 400px !important;
            display: flex !important;
            align-items: center !important;
            gap: 10px !important;
            font-size: 1.1rem !important;
            opacity: 1 !important;
            visibility: visible !important;
        `;
        notification.innerHTML = `
            <i class='bx bx-check-circle'></i>
            <span>${message}</span>
        `;
        document.body.appendChild(notification);
        setTimeout(() => {
            if (notification && notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    showError(message) {
        // Notificação visual vermelha no canto direito
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());
        const notification = document.createElement('div');
        notification.className = 'notification notification-error';
        notification.style.cssText = `
            position: fixed !important;
            top: 32px !important;
            right: 32px !important;
            left: auto !important;
            transform: none !important;
            background: #ef4444 !important;
            color: #fff !important;
            padding: 15px 24px !important;
            border-radius: 8px !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
            z-index: 99999 !important;
            max-width: 400px !important;
            display: flex !important;
            align-items: center !important;
            gap: 10px !important;
            font-size: 1.1rem !important;
            opacity: 1 !important;
            visibility: visible !important;
        `;
        notification.innerHTML = `
            <i class='bx bx-x-circle'></i>
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
