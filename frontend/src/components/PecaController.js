class PecaController {
  constructor() {
    this.apiUrl = 'http://localhost:3000/api/pecas';
    this.tableBody = document.querySelector('#pecas-table tbody');
    this.filterText = document.getElementById('filter-text');
    this.filterFornecedor = document.getElementById('filter-fornecedor');
    this.clearFiltersBtn = document.getElementById('clear-filters');
    this.novoBtn = document.querySelector('.btn-primary[href="pecas-cadastro.html"]');
    this.pecas = [];
    this.init();
  }

  init() {
    this.loadPecas();
    if (this.filterText) {
      this.filterText.addEventListener('input', () => this.renderTable());
    }
    if (this.filterFornecedor) {
      this.filterFornecedor.addEventListener('change', () => this.renderTable());
    }
    if (this.clearFiltersBtn) {
      this.clearFiltersBtn.addEventListener('click', () => this.clearFilters());
    }
    if (this.novoBtn) {
      this.novoBtn.addEventListener('click', () => {
        window.location.href = 'pecas-cadastro.html';
      });
    }
  }

  async loadPecas() {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(this.apiUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Erro ao buscar peças');
      const json = await res.json();
      this.pecas = json.data || [];
      this.renderTable();
    } catch (e) {
      this.showNotification('Erro ao carregar peças: ' + e.message, 'error');
      this.tableBody.innerHTML = '<tr><td colspan="6">Erro ao carregar peças</td></tr>';
    }
  }

  renderTable() {
    const text = this.filterText?.value.toLowerCase() || '';
    const fornecedor = this.filterFornecedor?.value.toLowerCase() || '';
    let filtered = this.pecas.filter(p => {
      const matchText =
        (p.nome && p.nome.toLowerCase().includes(text)) ||
        (p.id && String(p.id).toLowerCase().includes(text)) ||
        (p.fornecedor && p.fornecedor.toLowerCase().includes(text));
      const matchFornecedor = !fornecedor || (p.fornecedor && p.fornecedor.toLowerCase() === fornecedor);
      return matchText && matchFornecedor;
    });
    if (filtered.length === 0) {
      this.tableBody.innerHTML = '<tr><td colspan="6">Nenhuma peça encontrada</td></tr>';
      return;
    }
    this.tableBody.innerHTML = filtered.map(p => `
      <tr>
        <td>PEC-${String(p.id).padStart(3, '0')}</td>
        <td>${p.nome}</td>
        <td>${p.descricao || ''}</td>
        <td>${p.fornecedor || ''}</td>
        <td>R$ ${(parseFloat(p.valor) || 0).toLocaleString('pt-BR', {minimumFractionDigits:2})}</td>
        <td>
          <a href="#" class="action-icon visualizar-peca" data-id="${p.id}" title="Visualizar"><i class='bx bx-show'></i></a>
          <a href="pecas-ajustar.html?id=${p.id}" class="action-icon" title="Editar"><i class='bx bx-edit'></i></a>
          <a href="#" class="action-icon excluir-peca" data-id="${p.id}" title="Excluir"><i class='bx bx-trash'></i></a>
        </td>
      </tr>
    `).join('');
    this.addActionListeners();
  }

  clearFilters() {
    if (this.filterText) this.filterText.value = '';
    if (this.filterFornecedor) this.filterFornecedor.value = '';
    this.renderTable();
  }

  addActionListeners() {
    this.tableBody.querySelectorAll('.visualizar-peca').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const id = btn.getAttribute('data-id');
        await this.visualizarPeca(id);
      });
    });
    this.tableBody.querySelectorAll('.excluir-peca').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const id = btn.getAttribute('data-id');
        if (confirm('Tem certeza que deseja excluir esta peça? Esta ação não pode ser desfeita.')) {
          await this.excluirPeca(id);
        }
      });
    });
  }

  async visualizarPeca(id) {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${this.apiUrl}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Erro ao buscar peça');
      const json = await res.json();
      const p = json.data;
      // Remove modal anterior se existir
      const modalExistente = document.getElementById('modal-visualizar-peca');
      if (modalExistente) modalExistente.remove();
      const modalHtml = `
        <div id="modal-visualizar-peca" class="modal-overlay">
          <div class="modal-content">
            <div class="modal-header">
              <h3>Detalhes da Peça</h3>
              <button class="modal-close" id="close-modal-peca">&times;</button>
            </div>
            <div class="modal-body">
              <div class="basic-info">
                <p><strong>Nome:</strong> <span>${p.nome || 'N/A'}</span></p>
                <p><strong>Descrição:</strong> <span>${p.descricao || 'N/A'}</span></p>
                <p><strong>Fornecedor:</strong> <span>${p.fornecedor || 'N/A'}</span></p>
                <p><strong>Valor:</strong> <span>R$ ${(parseFloat(p.valor) || 0).toLocaleString('pt-BR', {minimumFractionDigits:2})}</span></p>
                <p><strong>Quantidade em Estoque:</strong> <span>${p.quantidade || 'N/A'}</span></p>
                <p><strong>Categoria:</strong> <span>${p.categoria || 'N/A'}</span></p>
                <p><strong>Marca:</strong> <span>${p.marca || 'N/A'}</span></p>
                <p><strong>ID da Aquisição:</strong> <span>${p.aquisicaoId || 'N/A'}</span></p>
              </div>
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHtml);
      document.getElementById('modal-visualizar-peca').addEventListener('click', function(e) {
        if (e.target === this) this.remove();
      });
      document.getElementById('close-modal-peca').onclick = function() {
        document.getElementById('modal-visualizar-peca').remove();
      };
    } catch (e) {
      this.showNotification('Erro ao visualizar peça: ' + e.message, 'error');
    }
  }

  async excluirPeca(id) {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${this.apiUrl}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Erro ao excluir peça');
      const json = await res.json();
      if (json.success) {
        this.showNotification('Peça excluída com sucesso!', 'success');
        this.loadPecas();
      } else {
        this.showNotification(json.message || 'Erro desconhecido ao excluir peça.', 'error');
      }
    } catch (e) {
      this.showNotification('Erro ao excluir peça: ' + e.message, 'error');
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
  if (document.getElementById('pecas-table')) {
    window.pecaController = new PecaController();
  }
}); 