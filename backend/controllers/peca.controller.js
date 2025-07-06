const db = require('../config/db');

class PecaController {
  async create(req, res) {
    try {
      const { descricao, nome, valor, aquisicaoId, precoDaCompra, vencimento, quantidade } = req.body;

      if (!descricao || !nome || !valor || !aquisicaoId || !precoDaCompra || !quantidade) {
        return res.status(400).json({
          success: false,
          message: 'Descrição, nome, valor, ID da aquisição, preço da compra e quantidade são obrigatórios'
        });
      }

      // Verificar se aquisição existe
      const aquisicao = await db.oneOrNone('SELECT id FROM Aquisicao WHERE id = $1', [aquisicaoId]);
      if (!aquisicao) {
        return res.status(404).json({
          success: false,
          message: 'Aquisição não encontrada'
        });
      }

      const query = `
        INSERT INTO Peca (descricao, nome, valor, aquisicao_id, preco_da_compra, vencimento, quantidade)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const novaPeca = await db.one(query, [descricao, nome, valor, aquisicaoId, precoDaCompra, vencimento || null, quantidade]);

      res.status(201).json({
        success: true,
        message: 'Peça criada com sucesso',
        data: novaPeca
      });

    } catch (error) {
      console.error('Erro ao criar peça:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  async findAll(req, res) {
    try {
      const pecas = await db.any(`
        SELECT 
          p.id, 
          p.nome, 
          p.descricao, 
          p.valor, 
          COALESCE(string_agg(f.nome, ', '), '') AS fornecedor
        FROM Peca p
        LEFT JOIN Fornece fnc ON p.id = fnc.peca_id
        LEFT JOIN Fornecedor f ON fnc.fornecedor_id = f.id
        GROUP BY p.id, p.nome, p.descricao, p.valor
        ORDER BY p.nome
      `);

      res.json({
        success: true,
        data: pecas,
        count: pecas.length
      });

    } catch (error) {
      console.error('Erro ao listar peças:', error);
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

      const peca = await db.oneOrNone('SELECT * FROM Peca WHERE id = $1', [id]);

      if (!peca) {
        return res.status(404).json({
          success: false,
          message: 'Peça não encontrada'
        });
      }

      res.json({
        success: true,
        data: peca
      });

    } catch (error) {
      console.error('Erro ao buscar peça:', error);
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
      const { descricao, nome, valor, aquisicaoId, precoDaCompra, vencimento, quantidade } = req.body;

      const existingPeca = await db.oneOrNone('SELECT * FROM Peca WHERE id = $1', [id]);
      if (!existingPeca) {
        return res.status(404).json({
          success: false,
          message: 'Peça não encontrada'
        });
      }

      const query = `
        UPDATE Peca 
        SET descricao = $1, nome = $2, valor = $3, aquisicao_id = $4, preco_da_compra = $5, vencimento = $6, quantidade = $7
        WHERE id = $8
        RETURNING *
      `;

      const pecaAtualizada = await db.one(query, [descricao, nome, valor, aquisicaoId, precoDaCompra, vencimento || null, quantidade, id]);

      res.json({
        success: true,
        message: 'Peça atualizada com sucesso',
        data: pecaAtualizada
      });

    } catch (error) {
      console.error('Erro ao atualizar peça:', error);
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

      const existingPeca = await db.oneOrNone('SELECT * FROM Peca WHERE id = $1', [id]);
      if (!existingPeca) {
        return res.status(404).json({
          success: false,
          message: 'Peça não encontrada'
        });
      }

      await db.none('DELETE FROM Peca WHERE id = $1', [id]);

      res.json({
        success: true,
        message: 'Peça removida com sucesso'
      });

    } catch (error) {
      console.error('Erro ao remover peça:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }
}

module.exports = new PecaController(); 