const db = require('../config/database');

class PecaApiController {
  async create(req, res) {
    try {
      const { descricao, nome, valor, fornecedor } = req.body;

      if (!descricao || !nome || !valor || !fornecedor) {
        return res.status(400).json({
          success: false,
          message: 'Descrição, nome, valor e fornecedor são obrigatórios'
        });
      }

      const query = `
        INSERT INTO Peca (descricao, nome, valor, forn_id)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;

      const novaPeca = await db.one(query, [descricao, nome, valor, fornecedor]);

      res.status(201).json({
        success: true,
        message: 'Peça criada com sucesso',
        data: novaPeca
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  async findAll(req, res) {
    try {
      // Ordenação dinâmica
      const allowedSort = ['nome', 'valor', 'fornecedor'];
      const allowedOrder = ['asc', 'desc'];
      let { sortBy, order } = req.query;
      sortBy = allowedSort.includes(sortBy) ? sortBy : 'nome';
      order = allowedOrder.includes((order || '').toLowerCase()) ? order.toUpperCase() : 'ASC';

      // Ajuste para o nome correto da coluna fornecedor
      const sortColumn = sortBy === 'fornecedor' ? 'f.nome' : `p.${sortBy}`;

      const pecas = await db.any(`
        SELECT 
          p.id, 
          p.nome, 
          p.descricao, 
          p.valor, 
          f.nome AS fornecedor
        FROM Peca p
        LEFT JOIN Fornecedor f ON p.forn_id = f.id
        ORDER BY ${sortColumn} ${order}
      `);

      res.json({
        success: true,
        data: pecas,
        count: pecas.length
      });

    } catch (error) {
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

      const query = `
        SELECT 
          p.id, 
          p.nome, 
          p.descricao, 
          p.valor, 
          f.nome AS fornecedor
        FROM Peca p
        LEFT JOIN Fornecedor f ON p.forn_id = f.id
        WHERE p.id = $1
      `;

      const peca = await db.oneOrNone(query, [id]);

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
        SET descricao = $1, nome = $2, valor = $3, forn_id = $4
        WHERE id = $5
        RETURNING *
      `;

      const pecaAtualizada = await db.one(query, [descricao, nome, valor, fornecedor, id]);

      res.json({
        success: true,
        message: 'Peça atualizada com sucesso',
        data: pecaAtualizada
      });

    } catch (error) {
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
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }
}

module.exports = new PecaApiController(); 