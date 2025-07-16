class FornecedorCadastroController {
  constructor() {
    this.form = document.getElementById('cadastroFornecedorForm');
    this.cancelBtn = document.getElementById('cancelBtn');
    this.apiUrl = 'http://localhost:3000/api/fornecedores';
    this.isSubmitting = false;
    this.init();
  }

  init() {
    if (this.form) {
      this.form.addEventListener('submit', (e) => this.handleSubmit(e));
      // Máscara para CNPJ
      const cnpjInput = this.form.cnpj;
      if (cnpjInput) {
        cnpjInput.addEventListener('input', (e) => {
          let v = e.target.value.replace(/\D/g, '');
          v = v.replace(/(\d{2})(\d)/, '$1.$2');
          v = v.replace(/(\d{3})(\d)/, '$1.$2');
          v = v.replace(/(\d{3})(\d)/, '$1/$2');
          v = v.replace(/(\d{4})(\d{1,2})$/, '$1-$2');
          e.target.value = v;
        });
      }
      // Máscara para telefone
      const telInput = this.form.telefone;
      if (telInput) {
        telInput.addEventListener('input', (e) => {
          let v = e.target.value.replace(/\D/g, '').slice(0, 11);
          if (v.length <= 10) {
            // Fixo: (99) 9999-9999
            v = v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
          } else {
            // Celular: (99) 99999-9999
            v = v.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
          }
          e.target.value = v.trim();
        });
      }
    }
    if (this.cancelBtn) {
      this.cancelBtn.addEventListener('click', () => {
        window.location.href = 'fornecedores-consulta.html';
      });
    }
  }

  async handleSubmit(e) {
    e.preventDefault();
    if (this.isSubmitting) return;
    this.isSubmitting = true;
    const nome = this.form.nome.value.trim();
    const cnpj = this.form.cnpj.value.trim();
    const email = this.form.email.value.trim();
    const telefone = this.form.telefone.value.trim();
    const endereco = this.form.endereco.value.trim();
    if (!nome || !cnpj || !email || !telefone || !endereco) {
      alert('Preencha todos os campos obrigatórios!');
      this.isSubmitting = false;
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ nome, cnpj, email, telefone, endereco })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        alert('Fornecedor cadastrado com sucesso!');
        window.location.href = 'fornecedores-consulta.html';
      } else {
        alert(json.message || 'Erro ao cadastrar fornecedor');
      }
    } catch (e) {
      alert('Erro ao cadastrar fornecedor: ' + e.message);
    } finally {
      this.isSubmitting = false;
    }
  }
}
window.addEventListener('DOMContentLoaded', () => {
  window.fornecedorCadastroController = new FornecedorCadastroController();
}); 