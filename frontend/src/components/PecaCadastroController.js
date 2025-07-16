class PecaCadastroController {
  constructor() {
    console.log('PecaCadastroController instanciado');
    this.apiUrl = 'http://localhost:3000/api/pecas';
    this.form = document.querySelector('form.os-form');
    this.id = this.getIdFromUrl();
    this.init();
  }

  getIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
  }

  async init() {
    await this.carregarFornecedores();
    if (this.id) {
      await this.carregarPeca();
    }
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
  }

  async carregarFornecedores() {
    try {
      const select = document.getElementById('fornecedor');
      select.innerHTML = '<option value="">Carregando fornecedores...</option>';
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3000/api/fornecedores', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        select.innerHTML = '<option value="">Selecione o fornecedor</option>';
        json.data.forEach(f => {
          const opt = document.createElement('option');
          opt.value = f.id;
          opt.textContent = f.nome;
          select.appendChild(opt);
        });
      } else {
        select.innerHTML = '<option value="">Nenhum fornecedor cadastrado</option>';
      }
    } catch (e) {
      document.getElementById('fornecedor').innerHTML = '<option value="">Erro ao carregar fornecedores</option>';
    }
  }

  async carregarPeca() {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${this.apiUrl}/${this.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Erro ao buscar peça');
      const json = await res.json();
      const p = json.data;
      document.getElementById('codigo').value = 'PEC-' + String(p.id).padStart(3, '0');
      document.getElementById('nome').value = p.nome || '';
      document.getElementById('descricao').value = p.descricao || '';
      document.getElementById('valor').value = p.valor || '';
      // Selecionar fornecedor no select pelo nome (join) -> buscar pelo nome e setar o value correspondente
      const select = document.getElementById('fornecedor');
      for (let i = 0; i < select.options.length; i++) {
        if (select.options[i].textContent === ((typeof p.fornecedor === 'object' ? p.fornecedor?.nome : p.fornecedor) || '')) {
          select.selectedIndex = i;
          break;
        }
      }
    } catch (e) {
      this.showNotification('Erro ao carregar peça: ' + e.message, 'error');
    }
  }

  async handleSubmit(e) {
    e.preventDefault();
    if (this.isSubmitting) return; // Evita duplo envio
    this.isSubmitting = true;
    const data = {
      nome: document.getElementById('nome').value,
      descricao: document.getElementById('descricao').value,
      valor: document.getElementById('valor').value,
      fornecedor: document.getElementById('fornecedor').value
    };
    try {
      let res, json;
      const token = localStorage.getItem('token');
      if (this.id) {
        res = await fetch(`${this.apiUrl}/${this.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(data)
        });
      } else {
        res = await fetch(this.apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(data)
        });
      }
      json = await res.json();
      if (res.ok && json.success) {
        this.showNotification('Peça salva com sucesso!', 'success');
        setTimeout(() => window.location.href = 'pecas-consulta.html', 1200);
      } else {
        this.showNotification(json.message || 'Erro ao salvar peça.', 'error');
      }
    } catch (e) {
      this.showNotification('Erro ao salvar peça: ' + e.message, 'error');
    } finally {
      this.isSubmitting = false;
    }
  }

  showNotification(message, type = 'info') {
    if (window.BasePageController && typeof window.BasePageController.showNotification === 'function') {
      window.BasePageController.showNotification(message, type);
    } else {
      const existingNotifications = document.querySelectorAll('.notification');
      existingNotifications.forEach(notification => notification.remove());
      const notification = document.createElement('div');
      notification.className = `notification notification-${type}`;
      notification.style.cssText = `
        position: fixed; top: 32px; right: 32px; z-index: 99999; max-width: 400px; color: #fff; border-radius: 8px; padding: 15px 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'}; display: flex; align-items: center; gap: 10px; font-size: 1.1rem;`;
      notification.innerHTML = `<i class='bx bx-${type === 'success' ? 'check-circle' : type === 'error' ? 'x-circle' : 'info-circle'}'></i><span>${message}</span>`;
      document.body.appendChild(notification);
      setTimeout(() => { if (notification && notification.parentElement) notification.remove(); }, 5000);
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('form.os-form')) {
    if (!window.pecaCadastroController) { // Evita múltiplas instâncias
      window.pecaCadastroController = new PecaCadastroController();
      // Ajustar título do formulário se estiver na página de edição
      const params = new URLSearchParams(window.location.search);
      if (window.location.pathname.includes('pecas-ajustar.html')) {
        document.getElementById('form-title').textContent = 'Editar Peça';
        const btn = document.querySelector('.form-actions .btn-primary');
        if (btn) btn.textContent = 'Salvar Alterações';
      }
    }
  }
}); 