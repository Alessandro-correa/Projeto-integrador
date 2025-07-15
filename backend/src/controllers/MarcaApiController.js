const db = require('../config/database');

class MarcaApiController {
  async create(req, res) {
    try {
      const { nome } = req.body;

      if (!nome) {
        return res.status(400).json({
          success: false,
          message: 'Nome da marca é obrigatório'
        });
      }

      const query = `
        INSERT INTO Marca (nome)
        VALUES ($1)
        RETURNING *
      `;

      const novaMarca = await db.one(query, [nome]);

      res.status(201).json({
        success: true,
        message: 'Marca criada com sucesso',
        data: novaMarca
      });

    } catch (error) {
      console.error('Erro ao criar marca:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  async listarMarcas(req, res) {
    try {
      const marcas = await db.any(`
        SELECT m.id, m.nome
        FROM Marca m
        ORDER BY m.nome
      `);
      res.json({ success: true, data: marcas });
    } catch (error) {
      console.error('Erro ao listar marcas:', error);
      res.status(500).json({ success: false, message: 'Erro ao listar marcas' });
    }
  }

  async findOne(req, res) {
    try {
      const { id } = req.params;

      const marca = await db.oneOrNone('SELECT * FROM Marca WHERE id = $1', [id]);

      if (!marca) {
        return res.status(404).json({
          success: false,
          message: 'Marca não encontrada'
        });
      }

      res.json({
        success: true,
        data: marca
      });

    } catch (error) {
      console.error('Erro ao buscar marca:', error);
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
      const { nome } = req.body;

      const query = `
        UPDATE Marca 
        SET nome = $1
        WHERE id = $2
        RETURNING *
      `;

      const marcaAtualizada = await db.one(query, [nome, id]);

      res.json({
        success: true,
        message: 'Marca atualizada com sucesso',
        data: marcaAtualizada
      });

    } catch (error) {
      console.error('Erro ao atualizar marca:', error);
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

      const existingMarca = await db.oneOrNone('SELECT * FROM Marca WHERE id = $1', [id]);
      if (!existingMarca) {
        return res.status(404).json({
          success: false,
          message: 'Marca não encontrada'
        });
      }

      await db.none('DELETE FROM Marca WHERE id = $1', [id]);

      res.json({
        success: true,
        message: 'Marca removida com sucesso'
      });

    } catch (error) {
      console.error('Erro ao remover marca:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }
}

module.exports = new MarcaApiController(); 
