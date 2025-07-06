const db = require('../config/db');

class FornecedorController {
  async create(req, res) {
    try {
      const { cnpj, email, endereco, nome } = req.body;

      if (!cnpj || !email || !endereco || !nome) {
        return res.status(400).json({
          success: false,
          message: 'Todos os campos são obrigatórios'
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

      const query = `
        INSERT INTO Fornecedor (cnpj, email, endereco, nome)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;

      const novoFornecedor = await db.one(query, [cnpj, email, endereco, nome]);

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

module.exports = new FornecedorController(); 