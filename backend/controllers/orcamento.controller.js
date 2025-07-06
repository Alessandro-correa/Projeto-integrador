const db = require('../config/db');

class OrcamentoController {
  // Criar orçamento
  async create(req, res) {
    try {
      const { valor, validade, ordemServicoCod, clienteCpf } = req.body;

      if (!valor || !validade || !ordemServicoCod || !clienteCpf) {
        return res.status(400).json({
          success: false,
          message: 'Todos os campos são obrigatórios'
        });
      }

      // Verificar se ordem de serviço existe
      const ordem = await db.oneOrNone('SELECT cod FROM Ordem_de_servico WHERE cod = $1', [ordemServicoCod]);
      if (!ordem) {
        return res.status(404).json({
          success: false,
          message: 'Ordem de serviço não encontrada'
        });
      }

      // Verificar se cliente existe
      const cliente = await db.oneOrNone('SELECT cpf FROM Cliente WHERE cpf = $1', [clienteCpf]);
      if (!cliente) {
        return res.status(404).json({
          success: false,
          message: 'Cliente não encontrado'
        });
      }

      const query = `
        INSERT INTO Orcamento (valor, validade, ordem_servico_cod, cliente_cpf)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;

      const novoOrcamento = await db.one(query, [valor, validade, ordemServicoCod, clienteCpf]);

      res.status(201).json({
        success: true,
        message: 'Orçamento criado com sucesso',
        data: novoOrcamento
      });

    } catch (error) {
      console.error('Erro ao criar orçamento:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  // Listar todos os orçamentos
  async findAll(req, res) {
    try {
      const orcamentos = await db.any(`
        SELECT 
          o.id,
          o.valor,
          o.validade,
          o.ordem_servico_cod,
          c.nome AS cliente_nome,
          m.placa AS placa,
          os.status,
          os.data AS data
        FROM Orcamento o
        JOIN Cliente c ON o.cliente_cpf = c.cpf
        JOIN Ordem_de_servico os ON o.ordem_servico_cod = os.cod
        LEFT JOIN Motocicleta m ON m.ordem_de_servico_cod = os.cod
        ORDER BY o.validade
      `);
      
      res.json({
        success: true,
        data: orcamentos,
        count: orcamentos.length
      });

    } catch (error) {
      console.error('Erro ao listar orçamentos:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  // Buscar orçamento por ID
  async findOne(req, res) {
    try {
      const { id } = req.params;

      const orcamento = await db.oneOrNone('SELECT * FROM Orcamento WHERE id = $1', [id]);

      if (!orcamento) {
        return res.status(404).json({
          success: false,
          message: 'Orçamento não encontrado'
        });
      }

      res.json({
        success: true,
        data: orcamento
      });

    } catch (error) {
      console.error('Erro ao buscar orçamento:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  // Atualizar orçamento
  async update(req, res) {
    try {
      const { id } = req.params;
      const { valor, validade, ordemServicoCod, clienteCpf } = req.body;

      const existingOrcamento = await db.oneOrNone('SELECT * FROM Orcamento WHERE id = $1', [id]);
      if (!existingOrcamento) {
        return res.status(404).json({
          success: false,
          message: 'Orçamento não encontrado'
        });
      }

      const query = `
        UPDATE Orcamento 
        SET valor = $1, validade = $2, ordem_servico_cod = $3, cliente_cpf = $4
        WHERE id = $5
        RETURNING *
      `;

      const orcamentoAtualizado = await db.one(query, [valor, validade, ordemServicoCod, clienteCpf, id]);

      res.json({
        success: true,
        message: 'Orçamento atualizado com sucesso',
        data: orcamentoAtualizado
      });

    } catch (error) {
      console.error('Erro ao atualizar orçamento:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  // Remover orçamento
  async delete(req, res) {
    try {
      const { id } = req.params;

      const existingOrcamento = await db.oneOrNone('SELECT * FROM Orcamento WHERE id = $1', [id]);
      if (!existingOrcamento) {
        return res.status(404).json({
          success: false,
          message: 'Orçamento não encontrado'
        });
      }

      await db.none('DELETE FROM Orcamento WHERE id = $1', [id]);

      res.json({
        success: true,
        message: 'Orçamento removido com sucesso'
      });

    } catch (error) {
      console.error('Erro ao remover orçamento:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }
}

module.exports = new OrcamentoController(); 