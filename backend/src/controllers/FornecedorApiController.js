const db = require('../config/database');

class FornecedorApiController {
  async create(req, res) {
    try {
      const { cnpj, email, endereco, nome, telefone: telefoneOriginal } = req.body;

      if (!cnpj || !email || !endereco || !nome || !telefoneOriginal) {
        return res.status(400).json({
          success: false,
          message: 'Todos os campos são obrigatórios'
        });
      }

      // Padronizar telefone para só números
      let telefone = telefoneOriginal.replace(/\D/g, '');
      if (!/^\d{11}$/.test(telefone)) {
        return res.status(400).json({
          success: false,
          message: 'Telefone inválido. Use apenas celulares no formato (99) 99999-9999'
        });
      }

      // Verificar se telefone já existe
      const existingTel = await db.oneOrNone('SELECT telefone FROM Fornecedor WHERE telefone = $1', [telefone]);
      if (existingTel) {
        return res.status(409).json({
          success: false,
          message: 'Telefone já cadastrado'
        });
      }

      // Verificar se CNPJ já existe
      const existingCnpj = await db.oneOrNone('SELECT cnpj FROM Fornecedor WHERE cnpj = $1', [cnpj]);
      if (existingCnpj) {
        return res.status(409).json({
          success: false,
          message: 'CNPJ já cadastrado'
        });
      }

      // Verificar se email já existe
      const existingEmail = await db.oneOrNone('SELECT email FROM Fornecedor WHERE email = $1', [email]);
      if (existingEmail) {
        return res.status(409).json({
          success: false,
          message: 'Email já cadastrado'
        });
      }

      // formato do email
      const emailRegex = /^[^\s@]+@[^-\s@]+\.[a-zA-Z.]{2,}$/;
      const validTlds = [
        'com', 'net', 'org', 'edu', 'gov', 'mil', 'br',
        'com.br', 'net.br', 'org.br', 'gov.br', 'edu.br'
     
      ];
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Formato de email inválido'
        });
      }
      const domain = email.split('@')[1].toLowerCase();
      const tld = domain.split('.').slice(-2).join('.');
      const tldSimple = domain.split('.').pop();
      if (!validTlds.includes(tld) && !validTlds.includes(tldSimple)) {
        return res.status(400).json({
          success: false,
          message: 'Domínio de e-mail inválido'
        });
      }

      const query = `
        INSERT INTO Fornecedor (cnpj, email, endereco, nome, telefone)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;

      const novoFornecedor = await db.one(query, [cnpj, email, endereco, nome, telefone]);

      res.status(201).json({
        success: true,
        message: 'Fornecedor criado com sucesso',
        data: novoFornecedor
      });

    } catch (error) {
      console.error('Erro ao criar fornecedor:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  async findAll(req, res) {
    try {
      const fornecedores = await db.any('SELECT * FROM Fornecedor ORDER BY nome');
      res.json({
        success: true,
        data: fornecedores,
        count: fornecedores.length
      });
    } catch (error) {
      console.error('Erro ao listar fornecedores:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  async findOne(req, res) {
    try {
      const { id } = req.params;

      const fornecedor = await db.oneOrNone('SELECT * FROM Fornecedor WHERE id = $1', [id]);

      if (!fornecedor) {
        return res.status(404).json({
          success: false,
          message: 'Fornecedor não encontrado'
        });
      }

      res.json({
        success: true,
        data: fornecedor
      });

    } catch (error) {
      console.error('Erro ao buscar fornecedor:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const { cnpj, email, endereco, nome } = req.body;

      const existingFornecedor = await db.oneOrNone('SELECT * FROM Fornecedor WHERE id = $1', [id]);
      if (!existingFornecedor) {
        return res.status(404).json({
          success: false,
          message: 'Fornecedor não encontrado'
        });
      }

      const query = `
        UPDATE Fornecedor 
        SET cnpj = $1, email = $2, endereco = $3, nome = $4
        WHERE id = $5
        RETURNING *
      `;

      const fornecedorAtualizado = await db.one(query, [cnpj, email, endereco, nome, id]);

      res.json({
        success: true,
        message: 'Fornecedor atualizado com sucesso',
        data: fornecedorAtualizado
      });

    } catch (error) {
      console.error('Erro ao atualizar fornecedor:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;

      const existingFornecedor = await db.oneOrNone('SELECT * FROM Fornecedor WHERE id = $1', [id]);
      if (!existingFornecedor) {
        return res.status(404).json({
          success: false,
          message: 'Fornecedor não encontrado'
        });
      }

      await db.none('DELETE FROM Fornecedor WHERE id = $1', [id]);

      res.json({
        success: true,
        message: 'Fornecedor removido com sucesso'
      });

    } catch (error) {
      console.error('Erro ao remover fornecedor:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }
}

module.exports = new FornecedorApiController(); 
