const db = require('../config/db');

class AquisicaoController {
  async create(req, res) {
    try {
      const { diaDaCompra } = req.body;

      if (!diaDaCompra) {
        return res.status(400).json({
          success: false,
          message: 'Data da compra é obrigatória'
        });
      }

      const query = `
        INSERT INTO Aquisicao (dia_da_compra)
        VALUES ($1)
        RETURNING *
      `;

      const novaAquisicao = await db.one(query, [diaDaCompra]);

      res.status(201).json({
        success: true,
        message: 'Aquisição criada com sucesso',
        data: novaAquisicao
      });

    } catch (error) {
      console.error('Erro ao criar aquisição:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  async findAll(req, res) {
    try {
      const aquisicoes = await db.any('SELECT * FROM Aquisicao ORDER BY dia_da_compra DESC');
      
      res.json({
        success: true,
        data: aquisicoes,
        count: aquisicoes.length
      });

    } catch (error) {
      console.error('Erro ao listar aquisições:', error);
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

      const aquisicao = await db.oneOrNone('SELECT * FROM Aquisicao WHERE id = $1', [id]);

      if (!aquisicao) {
        return res.status(404).json({
          success: false,
          message: 'Aquisição não encontrada'
        });
      }

      res.json({
        success: true,
        data: aquisicao
      });

    } catch (error) {
      console.error('Erro ao buscar aquisição:', error);
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
      const { diaDaCompra } = req.body;

      const existingAquisicao = await db.oneOrNone('SELECT * FROM Aquisicao WHERE id = $1', [id]);
      if (!existingAquisicao) {
        return res.status(404).json({
          success: false,
          message: 'Aquisição não encontrada'
        });
      }

      const query = `
        UPDATE Aquisicao 
        SET dia_da_compra = $1
        WHERE id = $2
        RETURNING *
      `;

      const aquisicaoAtualizada = await db.one(query, [diaDaCompra, id]);

      res.json({
        success: true,
        message: 'Aquisição atualizada com sucesso',
        data: aquisicaoAtualizada
      });

    } catch (error) {
      console.error('Erro ao atualizar aquisição:', error);
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

      const existingAquisicao = await db.oneOrNone('SELECT * FROM Aquisicao WHERE id = $1', [id]);
      if (!existingAquisicao) {
        return res.status(404).json({
          success: false,
          message: 'Aquisição não encontrada'
        });
      }

      // Verificar se há peças vinculadas
      const pecasVinculadas = await db.oneOrNone('SELECT id FROM Peca WHERE aquisicao_id = $1', [id]);
      if (pecasVinculadas) {
        return res.status(400).json({
          success: false,
          message: 'Não é possível remover aquisição que possui peças vinculadas'
        });
      }

      await db.none('DELETE FROM Aquisicao WHERE id = $1', [id]);

      res.json({
        success: true,
        message: 'Aquisição removida com sucesso'
      });

    } catch (error) {
      console.error('Erro ao remover aquisição:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }
}

module.exports = new AquisicaoController(); 