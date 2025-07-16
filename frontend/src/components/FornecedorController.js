class FornecedorController {
  constructor() {
    this.apiUrl = 'http://localhost:3000/api/fornecedores';
    this.tableBody = document.querySelector('#fornecedores-table tbody');
    this.filterText = document.getElementById('filter-text');
    this.clearFiltersBtn = document.getElementById('clear-filters');
    this.novoBtn = document.querySelector('.btn-primary[href="fornecedores-cadastro.html"]');
    this.fornecedores = [];
    this.sortColumn = 'nome';
    this.sortDirection = 'asc';
    this.init();
  }

  init() {
    this.loadFornecedores();
    if (this.filterText) {
      this.filterText.addEventListener('input', () => this.renderTable());
    }
    if (this.clearFiltersBtn) {
      this.clearFiltersBtn.addEventListener('click', () => this.clearFilters());
    }
    if (this.novoBtn) {
      this.novoBtn.addEventListener('click', () => {
        window.location.href = 'fornecedores-cadastro.html';
      });
    }
    this.initSortableHeaders();
  }

  async loadFornecedores() {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(this.apiUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Erro ao buscar fornecedores');
      const json = await res.json();
      this.fornecedores = json.data || [];
      this.renderTable();
    } catch (e) {
      alert('Erro ao carregar fornecedores: ' + e.message);
      this.tableBody.innerHTML = '<tr><td colspan="6">Erro ao carregar fornecedores</td></tr>';
    }
  }

  renderTable() {
    const text = this.filterText.value.toLowerCase();
    let filtered = this.fornecedores.filter(f => {
      return (
        (f.nome && f.nome.toLowerCase().includes(text)) ||
        (f.cnpj && f.cnpj.toLowerCase().includes(text)) ||
        (f.email && f.email.toLowerCase().includes(text))
      );
    });
    if (filtered.length === 0) {
      this.tableBody.innerHTML = '<tr><td colspan="6">Nenhum fornecedor encontrado</td></tr>';
      return;
    }
    // Ordenação
    const sorted = [...filtered].sort((a, b) => {
      let valA = a[this.sortColumn] || '';
      let valB = b[this.sortColumn] || '';
      valA = valA.toString().toLowerCase();
      valB = valB.toString().toLowerCase();
      if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    this.tableBody.innerHTML = sorted.map(f => `
      <tr>
        <td>${f.nome}</td>
        <td>${f.cnpj}</td>
        <td>${f.email}</td>
        <td>${f.telefone}</td>
        <td>${f.endereco}</td>
        <td>
          <a href="#" class="action-icon visualizar-fornecedor" data-id="${f.id}" title="Visualizar"><i class='bx bx-show'></i></a>
          <a href="fornecedores-ajustar.html?id=${f.id}" class="action-icon" title="Editar"><i class='bx bx-edit'></i></a>
          <a href="#" class="action-icon excluir-fornecedor" data-id="${f.id}" title="Excluir"><i class='bx bx-trash'></i></a>
        </td>
      </tr>
    `).join('');
    this.addActionListeners();
  }

  clearFilters() {
    this.filterText.value = '';
    this.renderTable();
  }

  addActionListeners() {
    this.tableBody.querySelectorAll('.visualizar-fornecedor').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const id = btn.getAttribute('data-id');
        await this.visualizarFornecedor(id);
      });
    });
    this.tableBody.querySelectorAll('.excluir-fornecedor').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const id = btn.getAttribute('data-id');
        const confirmar = confirm('Tem certeza que deseja excluir este fornecedor? Esta ação não pode ser desfeita.');
        if (confirmar) {
          await this.excluirFornecedor(id);
        }
      });
    });
  }

  initSortableHeaders() {
    const table = document.getElementById('fornecedores-table');
    if (!table) return;
    const headers = table.querySelectorAll('th');
    headers.forEach((th, idx) => {
      if ([0,1,2].includes(idx)) { // Nome, CNPJ, Email
        th.classList.add('sortable');
        th.style.cursor = 'pointer';
        th.addEventListener('click', () => {
          const columns = ['nome','cnpj','email'];
          const column = columns[idx];
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
    const table = document.getElementById('fornecedores-table');
    if (!table) return;
    const headers = table.querySelectorAll('th');
    headers.forEach((th, idx) => {
      th.classList.remove('sorted-asc','sorted-desc');
      const icon = th.querySelector('.sort-icon');
      if (icon) {
        icon.className = 'bx bx-sort-alt-2 sort-icon';
      }
      if ([0,1,2].includes(idx)) {
        const columns = ['nome','cnpj','email'];
        if (this.sortColumn === columns[idx]) {
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

  async visualizarFornecedor(id) {
    try {
      console.log(`[FornecedorController] Iniciando visualização do fornecedor ID: ${id}`);
      const token = localStorage.getItem('token');
      
      console.log(`[FornecedorController] Fazendo requisições para:
        - Fornecedor: ${this.apiUrl}/${id}
        - Peças: ${this.apiUrl}/${id}/pecas`);

      const [fornecedorRes, pecasRes] = await Promise.all([
        fetch(`${this.apiUrl}/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${this.apiUrl}/${id}/pecas`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      console.log(`[FornecedorController] Status das respostas:
        - Fornecedor: ${fornecedorRes.status}
        - Peças: ${pecasRes.status}`);

      if (!fornecedorRes.ok) {
        console.error('[FornecedorController] Erro na resposta do fornecedor:', await fornecedorRes.text());
        throw new Error('Erro ao buscar fornecedor');
      }
      if (!pecasRes.ok) {
        console.error('[FornecedorController] Erro na resposta das peças:', await pecasRes.text());
        throw new Error('Erro ao buscar peças do fornecedor');
      }

      const [fornecedorJson, pecasJson] = await Promise.all([
        fornecedorRes.json(),
        pecasRes.json()
      ]);

      console.log('[FornecedorController] Dados recebidos:', {
        fornecedor: fornecedorJson,
        pecas: pecasJson
      });

      const f = fornecedorJson.data;
      const pecas = pecasJson.data || [];

      console.log(`[FornecedorController] Processando dados:
        - Fornecedor: ${f.nome}
        - Quantidade de peças: ${pecas.length}`);

      // Remove modal anterior se existir
      const modalExistente = document.getElementById('modal-visualizar-fornecedor');
      if (modalExistente) {
        console.log('[FornecedorController] Removendo modal existente');
        modalExistente.remove();
      }

      const modalHtml = `
        <div id="modal-visualizar-fornecedor" class="modal-overlay">
          <div class="modal-content">
            <div class="modal-header">
              <h3>Detalhes do Fornecedor</h3>
              <button class="modal-close" id="close-modal-fornecedor">&times;</button>
            </div>
            <div class="modal-body">
              <div class="basic-info">
                <p><strong>Nome:</strong> <span>${f.nome || 'N/A'}</span></p>
                <p><strong>CNPJ:</strong> <span>${f.cnpj || 'N/A'}</span></p>
                <p><strong>Email:</strong> <span>${f.email || 'N/A'}</span></p>
                <p><strong>Telefone:</strong> <span>${f.telefone || 'N/A'}</span></p>
                <p><strong>Endereço:</strong> <span>${f.endereco || 'N/A'}</span></p>
              </div>
              <div class="pecas-list">
                <h4>Peças Fornecidas</h4>
                ${pecas.length > 0 
                  ? `<ul>${pecas.map(p => {
                      const valor = typeof p.valor === 'number' ? p.valor : parseFloat(p.valor) || 0;
                      return `<li>
                        <span class="peca-nome">${p.nome}</span>
                        <span class="peca-valor">R$ ${valor.toFixed(2)}</span>
                      </li>`;
                    }).join('')}</ul>`
                  : '<p>Nenhuma peça cadastrada para este fornecedor.</p>'
                }
              </div>
            </div>
          </div>
        </div>
      `;

      console.log('[FornecedorController] Inserindo novo modal no DOM');
      document.body.insertAdjacentHTML('beforeend', modalHtml);

      // Fechar ao clicar fora do modal ou no botão de fechar
      document.getElementById('modal-visualizar-fornecedor').addEventListener('click', function(e) {
        if (e.target === this) {
          console.log('[FornecedorController] Fechando modal (clique fora)');
          this.remove();
        }
      });
      document.getElementById('close-modal-fornecedor').onclick = function() {
        console.log('[FornecedorController] Fechando modal (botão fechar)');
        document.getElementById('modal-visualizar-fornecedor').remove();
      };

      console.log('[FornecedorController] Modal criado e exibido com sucesso');
    } catch (e) {
      console.error('[FornecedorController] Erro ao visualizar fornecedor:', e);
      console.error('[FornecedorController] Stack trace:', e.stack);
      this.showNotification('Erro ao visualizar fornecedor: ' + e.message, 'error');
    }
  }

  async excluirFornecedor(id) {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${this.apiUrl}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Erro ao excluir fornecedor');
      const json = await res.json();
      if (json.success) {
        this.showNotification('Fornecedor excluído com sucesso!', 'success');
        this.loadFornecedores();
      } else {
        // Se a mensagem indicar peças vinculadas, mostrar notificação específica
        if (json.message && json.message.toLowerCase().includes('peça') && json.message.toLowerCase().includes('vinculad')) {
          this.showNotification('Não é possível excluir fornecedores que possuem peças vinculadas.', 'error');
        } else {
          this.showNotification(json.message || 'Erro desconhecido ao excluir fornecedor.', 'error');
        }
      }
    } catch (e) {
      // Se a mensagem indicar peças vinculadas, mostrar notificação específica
      if (e.message && e.message.toLowerCase().includes('peça') && e.message.toLowerCase().includes('vinculad')) {
        this.showNotification('Não é possível excluir fornecedores que possuem peças vinculadas.', 'error');
      } else {
        this.showNotification('Erro ao excluir fornecedor: ' + e.message, 'error');
      }
    }
  }

  showNotification(message, type = 'info') {
    // Notificação global padrão do sistema (canto superior direito)
    if (window.BasePageController && typeof window.BasePageController.showNotification === 'function') {
      window.BasePageController.showNotification(message, type);
    } else {
      // Fallback simples
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
  window.fornecedorController = new FornecedorController();
}); 