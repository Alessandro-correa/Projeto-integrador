/**
 * CLIENTE CADASTRO CONTROLLER
 * Responsável pelo cadastro de novos clientes
 */

class ClienteCadastroController extends BasePageController {
    constructor() {
        super();
        this.apiUrl = `${this.baseURL}/clientes`;
        this.blockFurtherProcessing = false;
        this.init();
    }

    init() {
        // Sobrescrever init do BasePageController para evitar conflitos
        this.setupFormSubmission();
        this.setupFormValidation();
        this.setupFieldMasks();
        
        // Garantir que o método de notificação correto seja usado
        this.ensureCorrectNotificationMethod();
        
        console.log('✅ ClienteCadastroController inicializado');
    }

    ensureCorrectNotificationMethod() {
        // Garantir que usamos o método de notificação avançado, não o do BasePageController
        // Criar uma versão interceptada do showNotification
        this.originalShowAdvancedNotification = this.showAdvancedNotification.bind(this);
        this.showNotification = (message, type, title, duration) => {
            if (this.blockFurtherProcessing && (type === 'error' || type === 'warning')) {
                console.log(`[${type.toUpperCase()}] Notificação bloqueada: "${message}"`);
                return;
            }
            console.log(`[${type.toUpperCase()}] Notificação: "${message}"`);
            return this.originalShowAdvancedNotification(message, type, title, duration);
        };
        
        // Interceptar chamadas do BasePageController
        const originalShowNotification = BasePageController.showNotification;
        BasePageController.showNotification = (message, type) => {
            console.log('🔄 Interceptando chamada do BasePageController, redirecionando para método avançado...');
            
            // Aplicar o mesmo bloqueio
            if (this.blockFurtherProcessing && (type === 'error' || type === 'warning')) {
                console.log(`🚫 BLOQUEANDO BasePageController notificação ${type}: "${message}"`);
                return;
            }
            
            return this.showAdvancedNotification(message, type);
        };
        
        // Verificar se o CSS de notificações está carregado
        this.ensureNotificationStyles();
    }

    ensureNotificationStyles() {
        // Verificar se o CSS de ajuste está carregado
        const ajusteCss = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
            .find(link => link.href.includes('ajuste.css'));
        
        if (!ajusteCss) {
            console.warn('⚠️ CSS de ajuste não encontrado, carregando dinamicamente...');
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = '../../assets/css/ajuste.css';
            document.head.appendChild(link);
        }
        
        // Limpar qualquer notificação do BasePageController que possa estar presente
        const oldNotifications = document.querySelectorAll('.notification:not([id^="notification-"])');
        oldNotifications.forEach(notification => notification.remove());
    }

    setupFormSubmission() {
        const form = document.getElementById('cadastroForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleFormSubmit();
            });
        }
    }

    async handleFormSubmit() {
        try {
            console.log('🚀 INICIANDO PROCESSO DE CADASTRO');
            console.log('🧹 Limpando notificações anteriores...');
            
            // Limpar TODAS as notificações antes de começar
            this.clearAllNotifications();
            this.removeOldNotifications();
            
            // Garantir que o método correto de notificação está sendo usado
            this.ensureCorrectNotificationMethod();
            
            const formData = this.getFormData();
            
            // VALIDAÇÃO BÁSICA APENAS - SEM NOTIFICAÇÕES DE DUPLICAÇÃO
            if (!this.validateFormBasic(formData)) {
                return;
            }

            // REMOVENDO QUALQUER validação prévia - deixar apenas o backend validar
            console.log('✅ Pulando validação prévia de campos únicos - backend será responsável');

            // Mostrar loading
            this.showLoading('Cadastrando cliente...');

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
            
            // Limpar todas as notificações anteriores antes de processar a resposta
            this.clearAllNotifications();
            this.removeOldNotifications();
            
            console.log('📡 Resposta da API:');
            console.log('Status:', response.status);
            console.log('OK:', response.ok);
            console.log('Result:', result);

            // PROCESSAR RESULTADO - APENAS UMA NOTIFICAÇÃO
            if (response.ok && result.success) {
                console.log('✅ SUCESSO: Cliente cadastrado corretamente!');
                this.showNotification('Cliente cadastrado com sucesso!', 'success', 'Sucesso!', 8000);
                
                // BLOQUEAR qualquer processamento adicional
                this.blockFurtherProcessing = true;
                
                this.clearForm();
                setTimeout(() => {
                    window.location.href = 'clientes-consulta.html';
                }, 2000);
                
                return; // PARAR AQUI - NÃO PROCESSAR MAIS NADA
                
            } else {
                console.log('❌ ERRO: Falha no cadastro');
                console.log('❌ Response.ok:', response.ok);
                console.log('❌ Result.success:', result.success);
                console.log('❌ Mensagem do servidor:', result.message);
                
                // Tratar erros específicos do servidor
                const errorMessage = result.message || 'Erro ao cadastrar cliente';
                console.log('❌ Mensagem processada:', errorMessage);
                
                if (errorMessage.toLowerCase().includes('cpf') && errorMessage.toLowerCase().includes('já')) {
                    console.log('❌ DETECTADO: Erro de CPF duplicado');
                    this.showNotification('Este CPF já está cadastrado no sistema', 'error', 'CPF Duplicado!', 8000);
                    this.focusField('cpf');
                } else if (errorMessage.toLowerCase().includes('email') && errorMessage.toLowerCase().includes('já')) {
                    console.log('❌ DETECTADO: Erro de email duplicado');
                    this.showNotification('Este email já está cadastrado no sistema', 'error', 'Email Duplicado!', 8000);
                    this.focusField('email');
                } else if (errorMessage.toLowerCase().includes('cpf') && errorMessage.toLowerCase().includes('inválido')) {
                    console.log('❌ DETECTADO: Erro de CPF inválido');
                    this.showNotification('CPF inválido', 'error', 'CPF Inválido!', 8000);
                    this.focusField('cpf');
                } else if (errorMessage.toLowerCase().includes('email') && errorMessage.toLowerCase().includes('inválido')) {
                    console.log('❌ DETECTADO: Erro de email inválido');
                    this.showNotification('Email inválido', 'error', 'Email Inválido!', 8000);
                    this.focusField('email');
                } else {
                    console.log('❌ DETECTADO: Erro genérico');
                    this.showNotification(errorMessage, 'error', 'Erro!', 8000);
                }
                
                console.log('❌ Erro do servidor COMPLETO:', result);
            }

        } catch (error) {
            console.error('Erro ao cadastrar cliente:', error);
            if (error.message.includes('Failed to fetch')) {
                this.showNotification('Erro de conexão. Verifique se o servidor está funcionando.', 'error', 'Conexão Falhou!', 8000);
            } else {
                this.showNotification(`${error.message || 'Erro inesperado ao cadastrar cliente'}`, 'error', 'Erro!', 8000);
            }
        } finally {
            this.hideLoading();
            
            // Verificar se alguma notificação foi adicionada após o processamento
            setTimeout(() => {
                if (!this.blockFurtherProcessing) {
                    const notificationsAfter = document.querySelectorAll('.notification');
                    console.log('🔍 Notificações após processamento:', notificationsAfter.length);
                    notificationsAfter.forEach((notif, index) => {
                        console.log(`🔍 Notificação ${index + 1}:`, notif.textContent);
                    });
                } else {
                    console.log('🔒 Processamento bloqueado - não verificando notificações adicionais');
                }
            }, 500);
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
            dataDeNascimento: document.getElementById('data_nascimento')?.value || ''
        };
    }

    validateFormBasic(data) {
        console.log('🔍 Validação básica de formulário (SEM verificação de duplicação)');
        
        // Validar campos obrigatórios
        const requiredFields = ['nome', 'email', 'cpf', 'telefone', 'sexo', 'endereco', 'profissao', 'dataDeNascimento'];
        
        for (const field of requiredFields) {
            if (!data[field]) {
                this.showNotification(`O campo ${this.getFieldLabel(field)} é obrigatório`, 'warning', 'Campo Obrigatório!', 8000);
                this.focusField(field);
                return false;
            }
        }

        // Validar CPF (formato apenas, NÃO duplicação)
        if (!this.validateCPF(data.cpf)) {
            this.showNotification('CPF inválido. Verifique o formato (000.000.000-00)', 'error', 'CPF Inválido!', 8000);
            this.focusField('cpf');
            return false;
        }

        // Validar email (formato apenas, NÃO duplicação)
        if (!this.validateEmail(data.email)) {
            this.showNotification('Email inválido. Verifique o formato (exemplo@dominio.com)', 'error', 'Email Inválido!', 8000);
            this.focusField('email');
            return false;
        }

        // Validar telefone
        if (!this.validateTelefone(data.telefone)) {
            this.showNotification('Telefone inválido. Use apenas números de celular (11 dígitos)', 'error', 'Telefone Inválido!', 8000);
            this.focusField('telefone');
            return false;
        }

        // Validar data de nascimento
        if (!this.validateDataNascimento(data.dataDeNascimento)) {
            this.showNotification('Data de nascimento inválida. Cliente deve ter entre 16 e 120 anos', 'error', 'Data Inválida!', 8000);
            this.focusField('data_nascimento');
            return false;
        }

        // Validar nome (mínimo 2 nomes)
        if (!this.validateNome(data.nome)) {
            this.showNotification('Nome deve conter pelo menos nome e sobrenome', 'error', 'Nome Inválido!', 8000);
            this.focusField('nome');
            return false;
        }

        console.log('✅ Validação básica concluída com sucesso');
        return true;
    }

    validateForm(data) {
        // Validar campos obrigatórios
        const requiredFields = ['nome', 'email', 'cpf', 'telefone', 'sexo', 'endereco', 'profissao', 'dataDeNascimento'];
        
        for (const field of requiredFields) {
            if (!data[field]) {
                this.showNotification(`O campo ${this.getFieldLabel(field)} é obrigatório`, 'warning', 'Campo Obrigatório!', 8000);
                this.focusField(field);
                return false;
            }
        }

        // Validar CPF
        if (!this.validateCPF(data.cpf)) {
            this.showNotification('CPF inválido. Verifique o formato (000.000.000-00)', 'error', 'CPF Inválido!', 8000);
            this.focusField('cpf');
            return false;
        }

        // Validar email
        if (!this.validateEmail(data.email)) {
            this.showNotification('Email inválido. Verifique o formato (exemplo@dominio.com)', 'error', 'Email Inválido!', 8000);
            this.focusField('email');
            return false;
        }

        // Validar telefone
        if (!this.validateTelefone(data.telefone)) {
            this.showNotification('Telefone inválido. Use apenas números de celular (11 dígitos)', 'error', 'Telefone Inválido!', 8000);
            this.focusField('telefone');
            return false;
        }

        // Validar data de nascimento
        if (!this.validateDataNascimento(data.dataDeNascimento)) {
            this.showNotification('Data de nascimento inválida. Cliente deve ter entre 16 e 120 anos', 'error', 'Data Inválida!', 8000);
            this.focusField('data_nascimento');
            return false;
        }

        // Validar nome (mínimo 2 nomes)
        if (!this.validateNome(data.nome)) {
            this.showNotification('Nome deve conter pelo menos nome e sobrenome', 'error', 'Nome Inválido!', 8000);
            this.focusField('nome');
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

    focusField(fieldName) {
        const field = document.getElementById(fieldName === 'dataDeNascimento' ? 'data_nascimento' : fieldName);
        if (field) {
            field.focus();
            field.style.borderColor = '#f44336';
        }
    }

    validateCPF(cpf) {
        if (!cpf) return false;
        
        // Remove formatação e espaços
        const cleanCPF = cpf.replace(/\D/g, '');
        
        // Verifica se tem exatamente 11 dígitos
        if (cleanCPF.length !== 11) return false;
        
        // Verifica se não são todos os dígitos iguais (ex: 111.111.111-11)
        if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
        
        // Lista de CPFs inválidos conhecidos
        const invalidCPFs = [
            '00000000000', '11111111111', '22222222222', '33333333333',
            '44444444444', '55555555555', '66666666666', '77777777777',
            '88888888888', '99999999999'
        ];
        
        if (invalidCPFs.includes(cleanCPF)) return false;
        
        // Validação do algoritmo dos dígitos verificadores
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
        }
        let digit1 = 11 - (sum % 11);
        if (digit1 > 9) digit1 = 0;
        
        sum = 0;
        for (let i = 0; i < 10; i++) {
            sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
        }
        let digit2 = 11 - (sum % 11);
        if (digit2 > 9) digit2 = 0;
        
        return (parseInt(cleanCPF.charAt(9)) === digit1 && parseInt(cleanCPF.charAt(10)) === digit2);
    }

    validateEmail(email) {
        if (!email) return false;
        
        // Remove espaços no início e fim
        const cleanEmail = email.trim();
        
        // Verifica tamanho mínimo e máximo
        if (cleanEmail.length < 5 || cleanEmail.length > 254) return false;
        
        // Regex mais rigoroso para validação de email
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(cleanEmail)) return false;
        
        // Verifica se não contém caracteres especiais inválidos
        const invalidChars = /[<>()[\]\\,;:\s@"]/;
        const localPart = cleanEmail.split('@')[0];
        const domainPart = cleanEmail.split('@')[1];
        
        // Validações da parte local (antes do @)
        if (localPart.length > 64) return false;
        if (localPart.startsWith('.') || localPart.endsWith('.')) return false;
        if (localPart.includes('..')) return false;
        
        // Validações do domínio
        if (domainPart.length > 253) return false;
        if (domainPart.startsWith('.') || domainPart.endsWith('.')) return false;
        if (domainPart.startsWith('-') || domainPart.endsWith('-')) return false;
        if (domainPart.includes('..')) return false;
        
        // Verifica se o domínio tem pelo menos um ponto
        if (!domainPart.includes('.')) return false;
        
        // Verifica se a extensão do domínio tem pelo menos 2 caracteres
        const domainParts = domainPart.split('.');
        const extension = domainParts[domainParts.length - 1];
        if (extension.length < 2) return false;
        
        return true;
    }

    validateTelefone(telefone) {
        if (!telefone) return false;
        
        // Remove formatação
        const cleanPhone = telefone.replace(/\D/g, '');
        
        // Verifica se tem exatamente 11 dígitos (padrão brasileiro para celular)
        if (cleanPhone.length !== 11) return false;
        
        // Verifica se o primeiro dígito é válido (1-9)
        const primeiroDigito = parseInt(cleanPhone.charAt(0));
        if (primeiroDigito < 1 || primeiroDigito > 9) return false;
        
        // Verifica se o segundo dígito é válido (DDD - 1-9)
        const segundoDigito = parseInt(cleanPhone.charAt(1));
        if (segundoDigito < 1 || segundoDigito > 9) return false;
        
        // Verifica se é celular (terceiro dígito deve ser 9)
        if (cleanPhone.charAt(2) !== '9') return false;
        
        // Verifica se não são todos os dígitos iguais
        if (/^(\d)\1{10}$/.test(cleanPhone)) return false;
        
        // Verifica DDDs válidos do Brasil (lista principais)
        const ddd = cleanPhone.substring(0, 2);
        const dddsValidos = [
            '11', '12', '13', '14', '15', '16', '17', '18', '19', // SP
            '21', '22', '24', // RJ
            '27', '28', // ES
            '31', '32', '33', '34', '35', '37', '38', // MG
            '41', '42', '43', '44', '45', '46', // PR
            '47', '48', '49', // SC
            '51', '53', '54', '55', // RS
            '61', // DF
            '62', '64', // GO
            '63', // TO
            '65', '66', // MT
            '67', // MS
            '68', // AC
            '69', // RO
            '71', '73', '74', '75', '77', // BA
            '79', // SE
            '81', '87', // PE
            '82', // AL
            '83', // PB
            '84', // RN
            '85', '88', // CE
            '86', '89', // PI
            '91', '93', '94', // PA
            '92', '97', // AM
            '95', // RR
            '96', // AP
            '98', '99' // MA
        ];
        
        if (!dddsValidos.includes(ddd)) return false;
        
        return true;
    }

    validateDataNascimento(data) {
        if (!data) return false;
        
        // Verifica se a data está no formato correto
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(data)) return false;
        
        const hoje = new Date();
        const nascimento = new Date(data);

        // Verifica se a data é válida
        if (isNaN(nascimento.getTime())) return false;
        
        // Verifica se a data não é anterior a 1900
        const dataMinima = new Date('1900-01-01');
        if (nascimento < dataMinima) return false;

        // Não pode ser no futuro
        if (nascimento > hoje) return false;
        
        // Não pode ser hoje
        if (nascimento.toDateString() === hoje.toDateString()) return false;

        // Calcula a idade de forma precisa
        const idade = hoje.getFullYear() - nascimento.getFullYear();
        const monthDiff = hoje.getMonth() - nascimento.getMonth();
        const dayDiff = hoje.getDate() - nascimento.getDate();
        
        let realAge = idade;
        if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
            realAge--;
        }
        
        // Idade entre 16 e 120 anos (para serviços bancários)
        if (realAge < 16 || realAge > 120) return false;
        
        // Verifica se não é uma data óbvia como 01/01/xxxx
        const day = nascimento.getDate();
        const month = nascimento.getMonth() + 1; // getMonth() retorna 0-11
        if (day === 1 && month === 1) return false;
        
        // Verifica se a data não é de datas comemorativas óbvias
        const datesInvalidas = [
            '12-25', // Natal
            '01-01', // Ano Novo
            '12-31', // Véspera de Ano Novo
        ];
        
        const monthDay = String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0');
        if (datesInvalidas.includes(monthDay)) return false;
        
        return true;
    }

    validateNome(nome) {
        if (!nome) return false;
        
        // Remove espaços extras e converte para lowercase para verificação
        const cleanNome = nome.trim().replace(/\s+/g, ' ');
        
        // Verifica se tem pelo menos 2 caracteres
        if (cleanNome.length < 2) return false;
        
        // Verifica se contém pelo menos nome e sobrenome (2 palavras)
        const palavras = cleanNome.split(' ').filter(palavra => palavra.length > 0);
        if (palavras.length < 2) return false;
        
        // Verifica se cada palavra tem pelo menos 2 caracteres
        for (const palavra of palavras) {
            if (palavra.length < 2) return false;
        }
        
        // Verifica se contém apenas letras, espaços, acentos e alguns caracteres especiais válidos
        const regexNome = /^[a-zA-ZÀ-ÿ\u00C0-\u017F\s'-]+$/;
        if (!regexNome.test(cleanNome)) return false;
        
        // Verifica se não contém números
        if (/\d/.test(cleanNome)) return false;
        
        // Verifica se não são apenas espaços ou caracteres especiais
        if (!/[a-zA-ZÀ-ÿ\u00C0-\u017F]/.test(cleanNome)) return false;
        
        // Verifica se o nome não é muito longo (máximo 100 caracteres)
        if (cleanNome.length > 100) return false;
        
        return true;
    }

    setupFieldMasks() {
        // Máscara CPF - Aceita apenas números e formata automaticamente
        const cpfInput = document.getElementById('cpf');
        if (cpfInput) {
            // Bloquear entrada de caracteres não numéricos
            cpfInput.addEventListener('keypress', (e) => {
                // Permitir teclas especiais (backspace, delete, tab, etc.)
                if ([8, 9, 27, 13, 46, 37, 38, 39, 40].indexOf(e.keyCode) !== -1 ||
                    // Permitir Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                    (e.keyCode === 65 && e.ctrlKey === true) ||
                    (e.keyCode === 67 && e.ctrlKey === true) ||
                    (e.keyCode === 86 && e.ctrlKey === true) ||
                    (e.keyCode === 88 && e.ctrlKey === true)) {
                    return;
                }
                // Bloquear se não for número (0-9)
                if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                    e.preventDefault();
                    return false;
                }
            });

            cpfInput.addEventListener('input', (e) => {
                // Remove tudo que não for número
                let value = e.target.value.replace(/\D/g, '');
                
                // Limita a 11 dígitos
                if (value.length > 11) value = value.slice(0, 11);
                
                // Aplica a formatação do CPF
                if (value.length <= 3) {
                    value = value;
                } else if (value.length <= 6) {
                    value = value.replace(/(\d{3})(\d+)/, '$1.$2');
                } else if (value.length <= 9) {
                    value = value.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3');
                } else {
                    value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
                }
                
                e.target.value = value;
                
                // Reset border color on valid input
                if (this.validateCPF(value) || value.length === 0) {
                    e.target.style.borderColor = '';
                }
            });

            // Bloquear colar texto não numérico
            cpfInput.addEventListener('paste', (e) => {
                setTimeout(() => {
                    let value = e.target.value.replace(/\D/g, '');
                    if (value.length > 11) value = value.slice(0, 11);
                    
                    if (value.length <= 3) {
                        value = value;
                    } else if (value.length <= 6) {
                        value = value.replace(/(\d{3})(\d+)/, '$1.$2');
                    } else if (value.length <= 9) {
                        value = value.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3');
                    } else {
                        value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
                    }
                    
                    e.target.value = value;
                }, 10);
            });
        }

        // Máscara Telefone - Aceita apenas números e formata automaticamente para celular brasileiro
        const telefoneInput = document.getElementById('telefone');
        if (telefoneInput) {
            // Bloquear entrada de caracteres não numéricos
            telefoneInput.addEventListener('keypress', (e) => {
                // Permitir teclas especiais (backspace, delete, tab, etc.)
                if ([8, 9, 27, 13, 46, 37, 38, 39, 40].indexOf(e.keyCode) !== -1 ||
                    // Permitir Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                    (e.keyCode === 65 && e.ctrlKey === true) ||
                    (e.keyCode === 67 && e.ctrlKey === true) ||
                    (e.keyCode === 86 && e.ctrlKey === true) ||
                    (e.keyCode === 88 && e.ctrlKey === true)) {
                    return;
                }
                // Bloquear se não for número (0-9)
                if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                    e.preventDefault();
                    return false;
                }
            });

            telefoneInput.addEventListener('input', (e) => {
                // Remove tudo que não for número
                let value = e.target.value.replace(/\D/g, '');
                
                // Limita a 11 dígitos (padrão brasileiro para celular)
                if (value.length > 11) value = value.slice(0, 11);
                
                // Aplica a formatação do telefone brasileiro (XX) 9XXXX-XXXX
                if (value.length <= 2) {
                    value = value.length > 0 ? `(${value}` : value;
                } else if (value.length <= 7) {
                    value = `(${value.substring(0, 2)}) ${value.substring(2)}`;
                } else {
                    value = `(${value.substring(0, 2)}) ${value.substring(2, 7)}-${value.substring(7, 11)}`;
                }
                
                e.target.value = value;
                
                // Reset border color on valid input
                if (this.validateTelefone(value) || value.length === 0) {
                    e.target.style.borderColor = '';
                }
            });

            // Bloquear colar texto não numérico
            telefoneInput.addEventListener('paste', (e) => {
                setTimeout(() => {
                    let value = e.target.value.replace(/\D/g, '');
                    if (value.length > 11) value = value.slice(0, 11);
                    
                    if (value.length <= 2) {
                        value = value.length > 0 ? `(${value}` : value;
                    } else if (value.length <= 7) {
                        value = `(${value.substring(0, 2)}) ${value.substring(2)}`;
                    } else {
                        value = `(${value.substring(0, 2)}) ${value.substring(2, 7)}-${value.substring(7, 11)}`;
                    }
                    
                    e.target.value = value;
                }, 10);
            });
        }

        // Configurar data de nascimento
        const dataInput = document.getElementById('data_nascimento');
        if (dataInput) {
            // Definir limites de data
            const hoje = new Date();
            const anoMin = hoje.getFullYear() - 120;
            const anoMax = hoje.getFullYear() - 16;
            
            dataInput.setAttribute('min', `${anoMin}-01-01`);
            dataInput.setAttribute('max', `${anoMax}-12-31`);
        }
    }

    setupFormValidation() {
        // Validação em tempo real
        const inputs = document.querySelectorAll('#cadastroForm input, #cadastroForm select, #cadastroForm textarea');
        
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateField(input);
            });
            
            input.addEventListener('input', () => {
                // Remove error styling on input
                if (input.style.borderColor === 'rgb(244, 67, 54)') {
                    input.style.borderColor = '';
                }
            });
        });
    }

    validateField(field) {
        const value = field.value.trim();
        const isRequired = field.hasAttribute('required');
        
        // Debug log
        console.log('🔍 Validando campo:', field.id, 'Valor:', value);
        
        if (isRequired && !value) {
            field.style.borderColor = '#f44336';
            return false;
        }
        
        // Validações específicas - SEM NOTIFICAÇÕES, apenas bordes visuais
        switch (field.id) {
            case 'cpf':
                if (value && !this.validateCPF(value)) {
                    field.style.borderColor = '#f44336';
                    return false;
                }
                break;
            case 'email':
                if (value && !this.validateEmail(value)) {
                    field.style.borderColor = '#f44336';
                    return false;
                }
                break;
            case 'telefone':
                if (value && !this.validateTelefone(value)) {
                    field.style.borderColor = '#f44336';
                    return false;
                }
                break;
            case 'data_nascimento':
                if (value && !this.validateDataNascimento(value)) {
                    field.style.borderColor = '#f44336';
                    return false;
                }
                break;
        }
        
        field.style.borderColor = '';
        return true;
    }

    async validateUniqueFields(data) {
        console.log('� MÉTODO validateUniqueFields BLOQUEADO - não executará validação prévia');
        console.log('� Backend será responsável por toda validação de duplicação');
        return true; // SEMPRE retorna true para não bloquear o cadastro
    }

    clearForm() {
        const form = document.getElementById('cadastroForm');
        if (form) {
            form.reset();
            // Remover estilos de erro
            const inputs = form.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                input.style.borderColor = '';
            });
        }
    }

    showLoading(message = 'Carregando...') {
        // Criar overlay de loading se não existir
        let loadingOverlay = document.getElementById('loading-overlay');
        if (!loadingOverlay) {
            loadingOverlay = document.createElement('div');
            loadingOverlay.id = 'loading-overlay';
            loadingOverlay.innerHTML = `
                <div class="loading-content">
                    <div class="spinner"></div>
                    <p>${message}</p>
                </div>
            `;
            loadingOverlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
                color: white;
                font-size: 16px;
            `;
            document.body.appendChild(loadingOverlay);
        }
        loadingOverlay.style.display = 'flex';
        console.log('🔄', message);
    }

    hideLoading() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
        console.log('✅ Loading removido');
    }

    // === SISTEMA DE NOTIFICAÇÃO PERSONALIZADO (PADRÃO IGUAL AO AJUSTE) ===
    showNotification(message, type = 'info', title = null, duration = 8000) {
        return this.showAdvancedNotification(message, type, title, duration);
    }

    showAdvancedNotification(message, type = 'info', title = null, duration = 8000) {
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.className = 'notification-container';
            document.body.appendChild(container);
        }

        const existingNotifications = container.querySelectorAll('.notification');
        for (let existing of existingNotifications) {
            const existingMessage = existing.querySelector('.notification-message')?.textContent;
            const existingType = existing.classList.contains(`notification-${type}`);
            if (existingMessage === message && existingType) {
                return existing.id;
            }
        }

        if (!title) {
            const titles = {
                success: 'Sucesso!',
                error: 'Erro!',
                warning: 'Atenção!',
                info: 'Informação'
            };
            title = titles[type] || 'Notificação';
        }

        const icons = {
            success: 'bx-check-circle',
            error: 'bx-error-circle',
            warning: 'bx-error',
            info: 'bx-info-circle'
        };

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;

        const notificationId = 'notification-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        notification.id = notificationId;

        notification.innerHTML = `
            <i class='bx ${icons[type]} notification-icon'></i>
            <div class="notification-content">
                <div class="notification-title">${title}</div>
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close" onclick="window.closeNotification('${notificationId}')">
                <i class='bx bx-x'></i>
            </button>
            <div class="notification-progress" style="width: 100%;"></div>
        `;

        container.appendChild(notification);

        // Mostrar notificação com animação
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        // Configurar progress bar e auto-dismiss
        if (duration > 0) {
            const progressBar = notification.querySelector('.notification-progress');

            setTimeout(() => {
                progressBar.style.transition = `width ${duration}ms linear`;
                progressBar.style.width = '0%';
            }, 200);

            setTimeout(() => {
                this.removeNotification(notificationId);
            }, duration + 200);
        }

        // Registrar função global de fechamento
        if (!window.closeNotification) {
            window.closeNotification = (id) => this.removeNotification(id);
        }

        return notificationId;
    }

    removeNotification(notificationId) {
        const notification = document.getElementById(notificationId);
        if (notification) {
            notification.classList.add('hide');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }

    hideNotification() {
        const container = document.getElementById('notification-container');
        if (container) {
            const notifications = container.querySelectorAll('.notification');
            if (notifications.length > 0) {
                const lastNotification = notifications[notifications.length - 1];
                this.removeNotification(lastNotification.id);
            }
        }
    }

    clearAllNotifications() {
        const container = document.getElementById('notification-container');
        if (container) {
            const notifications = container.querySelectorAll('.notification');
            notifications.forEach(notification => {
                this.removeNotification(notification.id);
            });
        }
    }

    removeOldNotifications() {
        // Remove notificações do BasePageController (que não têm ID específico)
        const oldNotifications = document.querySelectorAll('.notification:not([id^="notification-"])');
        oldNotifications.forEach(notification => {
            notification.remove();
        });
    }

    // Métodos auxiliares para facilitar o uso
    showSuccess(message) {
        return this.showAdvancedNotification(message, 'success');
    }

    showError(message) {
        return this.showAdvancedNotification(message, 'error');
    }

    showInfo(message) {
        return this.showAdvancedNotification(message, 'info');
    }

    showAlert(message, type = 'info', title = null, duration = 5000) {
        return this.showAdvancedNotification(message, type, title, duration);
    }

    // === FIM DO SISTEMA DE NOTIFICAÇÃO ===

    // Método para testar notificações
    testarNotificacoes() {
        console.log('🧪 Testando sistema de notificações...');
        
        setTimeout(() => {
            this.showNotification('Teste de notificação de sucesso!', 'success', 'Sucesso!', 3000);
        }, 500);
        
        setTimeout(() => {
            this.showNotification('Teste de notificação de erro!', 'error', 'Erro!', 3000);
        }, 1500);
        
        setTimeout(() => {
            this.showNotification('Teste de notificação de aviso!', 'warning', 'Atenção!', 3000);
        }, 2500);
        
        setTimeout(() => {
            this.showNotification('Teste de notificação de informação!', 'info', 'Informação!', 3000);
        }, 3500);
    }

    // Método para testar o cadastro
    async testarCadastro() {
        console.log('🧪 Testando sistema de cadastro de cliente...');
        
        // Dados de teste
        const dadosTeste = {
            nome: 'João Silva Santos',
            email: 'joao.teste@exemplo.com',
            cpf: '123.456.789-00',
            telefone: '(11) 99999-9999',
            sexo: 'Masculino',
            endereco: 'Rua Teste, 123, Centro, São Paulo, SP',
            profissao: 'Desenvolvedor',
            dataDeNascimento: '1990-01-01'
        };

        try {
            console.log('📤 Enviando dados de teste:', dadosTeste);
            
            const token = localStorage.getItem('token');
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(dadosTeste)
            });

            const result = await response.json();
            
            if (response.ok && result.success) {
                console.log('✅ Teste de cadastro bem-sucedido:', result);
                this.showNotification('Teste de cadastro realizado com sucesso!', 'success', 'Teste Concluído!', 3000);
                return true;
            } else {
                console.log('❌ Teste falhou:', result);
                this.showNotification(`Teste falhou: ${result.message}`, 'error', 'Teste Falhou!', 8000);
                return false;
            }
        } catch (error) {
            console.error('❌ Erro no teste:', error);
            this.showNotification(`Erro no teste: ${error.message}`, 'error', 'Erro no Teste!', 8000);
            return false;
        }
    }
}

// Inicializar controller quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    if (typeof BasePageController !== 'undefined') {
        // Criar uma instância global acessível
        window.clienteCadastroController = new ClienteCadastroController();
        
        // Garantir que o método correto de notificação seja usado globalmente
        setTimeout(() => {
            if (window.clienteCadastroController) {
                console.log('🔧 Garantindo método de notificação correto...');
                window.clienteCadastroController.ensureCorrectNotificationMethod();
            }
        }, 100);
    } else {
        console.error('❌ BasePageController não encontrado');
    }
});
