console.log('PecaApiController carregado');
const db = require('../config/database');

class PecaApiController {
  async create(req, res) {
    try {
      const { descricao, nome, valor, fornecedor } = req.body;
      console.log('[create] body recebido:', req.body);

      if (!descricao || !nome || !valor || !fornecedor) {
        return res.status(400).json({
          success: false,
          message: 'Descrição, nome, valor e fornecedor são obrigatórios'
        });
      }

      const query = `
        INSERT INTO Peca (descricao, nome, valor)
        VALUES ($1, $2, $3)
        RETURNING *
      `;

      const novaPeca = await db.one(query, [descricao, nome, valor]);
      console.log('[create] nova peça criada:', novaPeca);

      // Vincular fornecedor na tabela Fornece, sem duplicidade
      await db.none('INSERT INTO Fornece (peca_id, fornecedor_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [novaPeca.id, fornecedor]);
      console.log('[create] vínculo Fornece criado:', { peca_id: novaPeca.id, fornecedor_id: fornecedor });

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
      console.log('[findOne] id recebido:', id);

      const query = `
        SELECT 
          p.id, 
          p.nome, 
          p.descricao, 
          p.valor, 
          COALESCE(string_agg(f.nome, ', '), '') AS fornecedor
        FROM Peca p
        LEFT JOIN Fornece fnc ON p.id = fnc.peca_id
        LEFT JOIN Fornecedor f ON fnc.fornecedor_id = f.id
        WHERE p.id = $1
        GROUP BY p.id, p.nome, p.descricao, p.valor
      `;
      console.log('[findOne] query executada:', query);

      const peca = await db.oneOrNone(query, [id]);
      console.log('[findOne] resultado do banco:', peca);

      if (!peca) {
        console.log('[findOne] Peça não encontrada para id:', id);
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
      console.log('[update] id recebido:', id);
      console.log('[update] body recebido:', req.body);
      const { descricao, nome, valor, fornecedor } = req.body;

      const existingPeca = await db.oneOrNone('SELECT * FROM Peca WHERE id = $1', [id]);
      if (!existingPeca) {
        return res.status(404).json({
          success: false,
          message: 'Peça não encontrada'
        });
      }

      // Atualiza os dados da peça
      const query = `
        UPDATE Peca 
        SET descricao = $1, nome = $2, valor = $3
        WHERE id = $4
        RETURNING *
      `;
      console.log('[update] query executada:', query);
      console.log('[update] valores:', [descricao, nome, valor, id]);

      const pecaAtualizada = await db.one(query, [descricao, nome, valor, id]);

      // Atualiza o fornecedor vinculado (tabela Fornece)
      if (fornecedor) {
        // Remove qualquer vínculo antigo
        await db.none('DELETE FROM Fornece WHERE peca_id = $1', [id]);
        // Cria novo vínculo, ignorando duplicidade
        await db.none('INSERT INTO Fornece (peca_id, fornecedor_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [id, fornecedor]);
      }

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

module.exports = new PecaApiController(); 