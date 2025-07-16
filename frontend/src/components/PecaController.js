class PecaController {
  constructor() {
    this.apiUrl = 'http://localhost:3000/api/pecas';
    this.tableBody = document.querySelector('#pecas-table tbody');
    this.filterText = document.getElementById('filter-text');
    this.filterFornecedor = document.getElementById('filter-fornecedor');
    this.clearFiltersBtn = document.getElementById('clear-filters');
    this.novoBtn = document.querySelector('.btn-primary[href="pecas-cadastro.html"]');
    this.pecas = [];
    this.sortColumn = 'nome';
    this.sortDirection = 'asc';
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
    this.initSortableHeaders();
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

    // Ordenação
    const sorted = [...filtered].sort((a, b) => {
      let valA, valB;
      if (this.sortColumn === 'valor') {
        valA = parseFloat(a.valor) || 0;
        valB = parseFloat(b.valor) || 0;
      } else {
        valA = (a[this.sortColumn] || '').toString().toLowerCase();
        valB = (b[this.sortColumn] || '').toString().toLowerCase();
      }
      if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    // Renderizar mensagem de nenhum resultado
    if (filtered.length === 0) {
      this.tableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 20px;">
            <i class='bx bx-info-circle'></i>
            Nenhuma peça encontrada
          </td>
        </tr>
      `;
      document.querySelector('#pecas-cards').innerHTML = `
        <div class="empty-state">
          <i class='bx bx-info-circle'></i>
          <p>Nenhuma peça encontrada</p>
        </div>
      `;
      return;
    }

    // Renderizar tabela
    this.tableBody.innerHTML = sorted.map(p => `
      <tr>
        <td>PEC-${String(p.id).padStart(3, '0')}</td>
        <td>${p.nome}</td>
        <td>${p.descricao || ''}</td>
        <td>${p.fornecedor || ''}</td>
        <td>R$ ${(parseFloat(p.valor) || 0).toLocaleString('pt-BR', {minimumFractionDigits:2})}</td>
        <td>
          <div class="actions">
            <button class="action-btn" onclick="pecaController.visualizarPeca(${p.id})" title="Visualizar">
              <i class='bx bx-show'></i>
            </button>
            <button class="action-btn" onclick="window.location.href='pecas-ajustar.html?id=${p.id}'" title="Editar">
              <i class='bx bx-edit'></i>
            </button>
            <button class="action-btn" onclick="pecaController.confirmarExclusao(${p.id}, '${p.nome}')" title="Excluir">
              <i class='bx bx-trash'></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    // Renderizar cards
    const cardsContainer = document.querySelector('#pecas-cards');
    if (cardsContainer) {
      cardsContainer.innerHTML = sorted.map(p => `
        <div class="peca-card">
          <div class="card-header">
            <h3 class="peca-nome">${p.nome}</h3>
            <span class="peca-codigo">PEC-${String(p.id).padStart(3, '0')}</span>
          </div>
          <div class="peca-info">
            <p><i class='bx bx-detail'></i> ${p.descricao || 'Sem descrição'}</p>
            <p><i class='bx bx-store'></i> ${p.fornecedor || 'Sem fornecedor'}</p>
            <p><i class='bx bx-money'></i> R$ ${(parseFloat(p.valor) || 0).toLocaleString('pt-BR', {minimumFractionDigits:2})}</p>
          </div>
          <div class="card-actions">
            <button class="action-btn" onclick="pecaController.visualizarPeca(${p.id})" title="Visualizar">
              <i class='bx bx-show'></i>
            </button>
            <button class="action-btn" onclick="window.location.href='pecas-ajustar.html?id=${p.id}'" title="Editar">
              <i class='bx bx-edit'></i>
            </button>
            <button class="action-btn" onclick="pecaController.confirmarExclusao(${p.id}, '${p.nome}')" title="Excluir">
              <i class='bx bx-trash'></i>
            </button>
          </div>
        </div>
      `).join('');
    }

    this.updateSortIcons();
  }

  clearFilters() {
    if (this.filterText) this.filterText.value = '';
    if (this.filterFornecedor) this.filterFornecedor.value = '';
    this.renderTable();
  }

  addActionListeners() {
    // Botões de excluir na tabela e nos cards
    document.querySelectorAll('.excluir-peca').forEach(btn => {
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
      console.log(`[PecaController] Iniciando visualização da peça ID: ${id}`);
      const token = localStorage.getItem('token');
      
      console.log(`[PecaController] Fazendo requisição para: ${this.apiUrl}/${id}`);
      const res = await fetch(`${this.apiUrl}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log(`[PecaController] Status da resposta: ${res.status}`);
      if (!res.ok) {
        console.error('[PecaController] Erro na resposta:', await res.text());
        throw new Error('Erro ao buscar peça');
      }

      const json = await res.json();
      console.log('[PecaController] Dados recebidos:', json);

      const p = json.data;

      // Remove modal anterior se existir
      const modalExistente = document.getElementById('modal-visualizar-peca');
      if (modalExistente) {
        console.log('[PecaController] Removendo modal existente');
        modalExistente.remove();
      }

      // Formatar o valor como moeda brasileira
      const valorFormatado = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(parseFloat(p.valor) || 0);

      const modalHtml = `
        <div id="modal-visualizar-peca" class="modal-overlay">
          <div class="modal-content">
            <div class="modal-header">
              <h3>Detalhes da Peça</h3>
              <button class="modal-close" id="close-modal-peca">&times;</button>
            </div>
            <div class="modal-body">
              <div class="basic-info" style="background: white;">
                <p><strong>Código:</strong> <span>PEC-${String(p.id).padStart(3, '0')}</span></p>
                <p><strong>Nome:</strong> <span>${p.nome || 'N/A'}</span></p>
                <p><strong>Descrição:</strong> <span>${p.descricao || 'N/A'}</span></p>
                <p><strong>Valor:</strong> <span>${valorFormatado}</span></p>
                <p><strong>Fornecedor:</strong> <span>${p.fornecedor || 'N/A'}</span></p>
              </div>
            </div>
          </div>
        </div>
      `;

      console.log('[PecaController] Inserindo novo modal no DOM');
      document.body.insertAdjacentHTML('beforeend', modalHtml);

      // Fechar ao clicar fora do modal ou no botão de fechar
      document.getElementById('modal-visualizar-peca').addEventListener('click', function(e) {
        if (e.target === this) {
          console.log('[PecaController] Fechando modal (clique fora)');
          this.remove();
        }
      });

      document.getElementById('close-modal-peca').onclick = function() {
        console.log('[PecaController] Fechando modal (botão fechar)');
        document.getElementById('modal-visualizar-peca').remove();
      };

      console.log('[PecaController] Modal criado e exibido com sucesso');
    } catch (e) {
      console.error('[PecaController] Erro ao visualizar peça:', e);
      console.error('[PecaController] Stack trace:', e.stack);
      this.showNotification('Erro ao visualizar peça: ' + e.message, 'error');
    }
  }

  async confirmarExclusao(id, nome) {
    const confirmar = confirm(`Deseja realmente excluir a peça "${nome}"?`);
    if (confirmar) {
      await this.excluirPeca(id);
    }
  }

  async excluirPeca(id) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${this.apiUrl}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Erro ao excluir peça');

      const result = await response.json();
      if (result.success) {
        this.showNotification('Peça excluída com sucesso!', 'success');
        this.loadPecas();
      } else {
        throw new Error(result.message || 'Erro ao excluir peça');
      }
    } catch (error) {
      console.error('❌ Erro ao excluir peça:', error);
      this.showNotification('Erro ao excluir peça', 'error');
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

  initSortableHeaders() {
    const table = document.getElementById('pecas-table');
    if (!table) return;
    const headers = table.querySelectorAll('th');
    headers.forEach((th, idx) => {
      // Nome, Fornecedor, Valor
      if ([1,3,4].includes(idx)) {
        th.classList.add('sortable');
        th.style.cursor = 'pointer';
        th.addEventListener('click', () => {
          const columns = ['nome', 'fornecedor', 'valor'];
          const column = columns[[1,3,4].indexOf(idx)];
          if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
          } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
          }
          this.renderTable();
          this.updateSortIcons();
        });
      }
    });
    this.updateSortIcons();
  }

  updateSortIcons() {
    const table = document.getElementById('pecas-table');
    if (!table) return;
    const headers = table.querySelectorAll('th');
    headers.forEach((th, idx) => {
      th.classList.remove('sorted-asc','sorted-desc');
      const icon = th.querySelector('.sort-icon');
      if (icon) {
        icon.className = 'bx bx-sort-alt-2 sort-icon';
      }
      if ([1,3,4].includes(idx)) {
        const columns = ['nome', 'fornecedor', 'valor'];
        if (this.sortColumn === columns[[1,3,4].indexOf(idx)]) {
          th.classList.add(this.sortDirection === 'asc' ? 'sorted-asc' : 'sorted-desc');
          if (icon) {
            if (this.sortDirection === 'asc') {
              icon.className = 'bx bx-sort-up sort-icon active';
            } else {
              icon.className = 'bx bx-sort-down sort-icon active';
            }
          }
        }
      }
    });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('pecas-table')) {
    window.pecaController = new PecaController();
  }
}); 