class OrdemCadastroController {
    constructor() {
        this.apiUrl = 'http://localhost:3000/api/ordens';
        this.clientesApiUrl = 'http://localhost:3000/api/clientes';
        this.motocicletasApiUrl = 'http://localhost:3000/api/motocicletas';
        this.usuariosApiUrl = 'http://localhost:3000/api/usuarios';
        this.form = document.getElementById('os-form');
        this.clienteSelect = document.getElementById('cliente');
        this.motocicletaSelect = document.getElementById('motocicleta');
        this.dataInput = document.getElementById('data');
        this.formOverlay = document.getElementById('form-overlay');
        this.mecanicoResponsavel = null; 
        this.init();
    }

    init() {
        
        if (this.dataInput) {
            const hoje = new Date().toISOString().split('T')[0];
            this.dataInput.value = hoje;
        }

        if (this.motocicletaSelect) {
            this.motocicletaSelect.disabled = true;
        }

        this.loadClientes();
        this.loadMecanico(); 
        
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        }
        
        if (this.clienteSelect) {
            this.clienteSelect.addEventListener('change', () => this.loadMotocicletasByCliente());
        }

        if (this.dataInput) {
            this.dataInput.addEventListener('change', () => this.validateDate());
            
            const hoje = new Date().toISOString().split('T')[0];
            this.dataInput.setAttribute('max', hoje);
        }

        this.addFormEnhancements();
    }

    addFormEnhancements() {
        
        const requiredFields = this.form.querySelectorAll('input[required], select[required], textarea[required]');
        requiredFields.forEach(field => {
            field.addEventListener('blur', () => {
                
                if (field.disabled) return;
                
                if (field.value.trim() === '') {
                    field.classList.add('field-error');
                } else {
                    field.classList.remove('field-error');
                }
            });

            field.addEventListener('input', () => {
                
                if (field.disabled) return;
                
                if (field.value.trim() !== '') {
                    field.classList.remove('field-error');
                }
            });
        });
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notification-container');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close">&times;</button>
            </div>
            <div class="notification-progress"></div>
        `;

        container.appendChild(notification);

        const timeout = setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);

        notification.querySelector('.notification-close').addEventListener('click', () => {
            clearTimeout(timeout);
            notification.remove();
        });

        return notification;
    }

    async loadClientes() {
        
        return await Controller.loadClientesIntoSelect(
            this.clienteSelect, 
            this.clientesApiUrl, 
            this.showNotification.bind(this)
        );
    }

    async loadMecanico() {
        try {
            const res = await fetch(this.usuariosApiUrl);
            if (!res.ok) throw new Error('Erro ao carregar usuários');
            
            const json = await res.json();
            const usuarios = json.data || [];

            const mecanico = usuarios.find(usuario => 
                usuario.funcao && (
                    usuario.funcao.toLowerCase().includes('mecânico') ||
                    usuario.tipo && usuario.tipo.toLowerCase().includes('mecânico')
                )
            );
            
            if (mecanico) {
                this.mecanicoResponsavel = mecanico.cpf;
                console.log('Mecânico responsável definido automaticamente:', mecanico.nome, '-', mecanico.cpf);
            } else {
                
                this.mecanicoResponsavel = usuarios[0]?.cpf || null;
                console.log('Usando primeiro usuário como responsável:', usuarios[0]?.nome);
            }
            
        } catch (e) {
            console.error('Erro ao carregar mecânico:', e);
            this.showNotification('Erro ao definir mecânico responsável. Verifique a conexão.', 'error');
        }
    }

    async loadMotocicletasByCliente() {
        if (!this.clienteSelect || !this.clienteSelect.value) {
            if (this.motocicletaSelect) {
                this.motocicletaSelect.innerHTML = '<option value="">Selecione primeiro um cliente</option>';
                this.motocicletaSelect.disabled = true;
            }
            return;
        }

        if (this.motocicletaSelect) {
            this.motocicletaSelect.innerHTML = '<option value="">Carregando motocicletas...</option>';
            this.motocicletaSelect.disabled = true;
        }

        try {
            console.log('Carregando motocicletas para cliente:', this.clienteSelect.value);
            const res = await fetch(`${this.motocicletasApiUrl}/cliente/${this.clienteSelect.value}`);
            
            if (!res.ok) {
                throw new Error(`Erro ${res.status}: ${res.statusText}`);
            }
            
            const json = await res.json();
            console.log('Resposta da API:', json);
            
            const motocicletas = json.data || [];
            
            if (this.motocicletaSelect) {
                this.motocicletaSelect.disabled = false;
                
                if (motocicletas.length === 0) {
                    this.motocicletaSelect.innerHTML = '<option value="">Cliente não possui motocicletas cadastradas</option>';
                    this.showNotification('Este cliente não possui motocicletas cadastradas. Cadastre uma motocicleta primeiro.', 'warning');
                } else {
                    this.motocicletaSelect.innerHTML = '<option value="">Selecione uma motocicleta</option>';
                    motocicletas.forEach(moto => {
                        this.motocicletaSelect.innerHTML += `<option value="${moto.placa}">${moto.modelo} - ${moto.placa} (${moto.ano})</option>`;
                    });
                    this.showNotification(`${motocicletas.length} motocicleta(s) encontrada(s) para este cliente.`, 'success');
                }
            }
            
        } catch (e) {
            console.error('Erro ao carregar motocicletas:', e);
            if (this.motocicletaSelect) {
                this.motocicletaSelect.innerHTML = '<option value="">Erro ao carregar motocicletas</option>';
                this.motocicletaSelect.disabled = false;
            }
            this.showNotification('Erro ao carregar motocicletas do cliente. Tente novamente.', 'error');
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        const submitButton = this.form.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;

        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="bx bx-loader bx-spin"></i> Salvando...';
        
        const formData = new FormData(this.form);
        const data = {
            titulo: formData.get('titulo')?.trim(),
            data: formData.get('data'),
            descricao: formData.get('descricao')?.trim(),
            status: 'Em Andamento', 
            observacao: formData.get('observacao')?.trim() || null,
            validada: false,
            clienteCpf: formData.get('cliente'), 
            usuarioCpf: this.mecanicoResponsavel, 
            motocicletaPlaca: formData.get('motocicleta')
        };

        const errors = [];

        if (data.data) {
            const selectedDate = new Date(data.data);
            const today = new Date();
            today.setHours(23, 59, 59, 999); 
            
            if (selectedDate > today) {
                errors.push('Não é possível criar ordem de serviço para data futura');
            }
        }
        
        if (!data.titulo) errors.push('Título do serviço é obrigatório');
        if (!data.data) errors.push('Data é obrigatória');
        if (!data.descricao) errors.push('Descrição dos serviços é obrigatória');
        if (!data.clienteCpf) errors.push('Cliente deve ser selecionado');
        if (!data.usuarioCpf) errors.push('Erro interno: mecânico responsável não foi definido');
        if (!data.motocicletaPlaca) errors.push('Motocicleta deve ser selecionada');
        
        if (data.titulo && data.titulo.length < 5) {
            errors.push('Título deve ter pelo menos 5 caracteres');
        }
        
        if (data.descricao && data.descricao.length < 10) {
            errors.push('Descrição deve ter pelo menos 10 caracteres');
        }

        if (errors.length > 0) {
            this.showNotification(errors.join('<br>'), 'error');
            submitButton.disabled = false;
            submitButton.innerHTML = originalText;
            return;
        }

        try {
            console.log('Enviando dados:', data);
            
            const res = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await res.json();
            console.log('Resposta do servidor:', result);

            if (!res.ok) {
                throw new Error(result.message || `Erro ${res.status}: ${res.statusText}`);
            }

            this.showNotification('Ordem de serviço criada com sucesso!', 'success');

            setTimeout(() => {
                window.location.href = 'os-consulta.html';
            }, 1500);

        } catch (e) {
            console.error('Erro ao criar ordem de serviço:', e);
            this.showNotification(`Erro ao criar ordem de serviço: ${e.message}`, 'error');
            
            submitButton.disabled = false;
            submitButton.innerHTML = originalText;
        }
    }

    showNotification(message, type = 'info', duration = 5000) {
        
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.className = 'notification-container';
            document.body.appendChild(container);
        }

        const existingNotifications = container.querySelectorAll('.notification');
        for (let notification of existingNotifications) {
            const existingMessage = notification.querySelector('.notification-message')?.textContent;
            if (existingMessage === message.replace(/<br>/g, '\n')) {
                
                notification.style.transform = 'scale(1.02)';
                setTimeout(() => {
                    notification.style.transform = 'scale(1)';
                }, 200);
                return;
            }
        }

        const icons = {
            success: 'bx-check-circle',
            error: 'bx-error-circle',
            warning: 'bx-error',
            info: 'bx-info-circle'
        };

        const notificationId = 'notification-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.id = notificationId;

        notification.innerHTML = `
            <i class='bx ${icons[type]} notification-icon'></i>
            <div class="notification-content">
                <div class="notification-title">${this.getNotificationTitle(type)}</div>
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close" onclick="window.closeNotification('${notificationId}')">
                <i class='bx bx-x'></i>
            </button>
            <div class="notification-progress" style="width: 100%;"></div>
        `;

        container.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

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

        if (!window.closeNotification) {
            window.closeNotification = (id) => this.removeNotification(id);
        }

        return notificationId;
    }

    getNotificationTitle(type) {
        const titles = {
            success: 'Sucesso',
            error: 'Erro',
            warning: 'Atenção',
            info: 'Informação'
        };
        return titles[type] || 'Notificação';
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

    clearAllNotifications() {
        const container = document.getElementById('notification-container');
        if (container) {
            const notifications = container.querySelectorAll('.notification');
            notifications.forEach(notification => {
                this.removeNotification(notification.id);
            });
        }
    }

    validateDate() {
        if (!this.dataInput || !this.formOverlay) return;

        const selectedDate = new Date(this.dataInput.value);
        const today = new Date();

        today.setHours(23, 59, 59, 999); 
        
        if (selectedDate > today) {
            
            this.formOverlay.classList.add('active');
            this.showNotification('Data inválida! Não é possível criar ordem de serviço para data futura.', 'error');
        } else {
            
            this.formOverlay.classList.remove('active');
        }
    }
}

window.addEventListener('DOMContentLoaded', () => new OrdemCadastroController());
