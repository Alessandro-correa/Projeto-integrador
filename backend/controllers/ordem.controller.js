const db = require('../config/db');

class OrdemController {
  // Criar ordem de serviço
  async create(req, res) {
    try {
      const { titulo, data, descricao, status, observacao, validada, usuarioCpf } = req.body;

      // Validações
      if (!titulo || !data || !descricao || !status || !usuarioCpf) {
        return res.status(400).json({
          success: false,
          message: 'Título, data, descrição, status e CPF do usuário são obrigatórios'
        });
      }

      // Validar formato da data
      const dataOrdem = new Date(data);
      if (isNaN(dataOrdem.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Data inválida'
        });
      }

      // Validar status
      const statusValidos = ['Pendente', 'Em andamento', 'Concluída', 'Cancelada'];
      if (!statusValidos.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Status deve ser: Pendente, Em andamento, Concluída ou Cancelada'
        });
      }

      // Verificar se usuário existe
      const usuario = await db.oneOrNone('SELECT cpf FROM Usuario WHERE cpf = $1', [usuarioCpf]);
      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      const query = `
        INSERT INTO Ordem_de_servico (titulo, data, descricao, status, observacao, validada, usuario_cpf)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const novaOrdem = await db.one(query, [titulo, data, descricao, status, observacao || null, validada || false, usuarioCpf]);

      res.status(201).json({
        success: true,
        message: 'Ordem de serviço criada com sucesso',
        data: novaOrdem
      });

    } catch (error) {
      console.error('Erro ao criar ordem de serviço:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  // Listar todas as ordens de serviço
  async findAll(req, res) {
    try {
      const ordens = await db.any(`
        SELECT 
          os.cod,
          os.titulo,
          c.nome AS cliente,
          m.placa AS motocicleta,
          os.data,
          os.status
        FROM Ordem_de_servico os
        LEFT JOIN Motocicleta m ON os.cod = m.ordem_de_servico_cod
        LEFT JOIN Cliente c ON m.cliente_cpf = c.cpf
        ORDER BY os.data DESC
      `);

      res.json({
        success: true,
        data: ordens,
        count: ordens.length
      });

    } catch (error) {
      console.error('Erro ao listar ordens de serviço:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  // Buscar ordem de serviço por ID
  async findOne(req, res) {
    try {
      const { id } = req.params;

      const ordem = await db.oneOrNone(`
        SELECT os.*, u.nome as nome_usuario 
        FROM Ordem_de_servico os 
        LEFT JOIN Usuario u ON os.usuario_cpf = u.cpf 
        WHERE os.cod = $1
      `, [id]);

      if (!ordem) {
        return res.status(404).json({
          success: false,
          message: 'Ordem de serviço não encontrada'
        });
      }

      res.json({
        success: true,
        data: ordem
      });

    } catch (error) {
      console.error('Erro ao buscar ordem de serviço:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  // Atualizar ordem de serviço
  async update(req, res) {
    try {
      const { id } = req.params;
      const { titulo, data, descricao, status, observacao, validada, usuarioCpf } = req.body;

      // Verificar se ordem existe
      const existingOrdem = await db.oneOrNone('SELECT * FROM Ordem_de_servico WHERE cod = $1', [id]);
      if (!existingOrdem) {
        return res.status(404).json({
          success: false,
          message: 'Ordem de serviço não encontrada'
        });
      }

      // Validações
      if (!titulo || !data || !descricao || !status || !usuarioCpf) {
        return res.status(400).json({
          success: false,
          message: 'Título, data, descrição, status e CPF do usuário são obrigatórios'
        });
      }

      // Validar formato da data
      const dataOrdem = new Date(data);
      if (isNaN(dataOrdem.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Data inválida'
        });
      }

      // Validar status
      const statusValidos = ['Pendente', 'Em andamento', 'Concluída', 'Cancelada'];
      if (!statusValidos.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Status deve ser: Pendente, Em andamento, Concluída ou Cancelada'
        });
      }

      // Verificar se usuário existe
      const usuario = await db.oneOrNone('SELECT cpf FROM Usuario WHERE cpf = $1', [usuarioCpf]);
      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      const query = `
        UPDATE Ordem_de_servico 
        SET titulo = $1, data = $2, descricao = $3, status = $4, observacao = $5, validada = $6, usuario_cpf = $7
        WHERE cod = $8
        RETURNING *
      `;

      const ordemAtualizada = await db.one(query, [titulo, data, descricao, status, observacao || null, validada || false, usuarioCpf, id]);

      res.json({
        success: true,
        message: 'Ordem de serviço atualizada com sucesso',
        data: ordemAtualizada
      });

    } catch (error) {
      console.error('Erro ao atualizar ordem de serviço:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  // Remover ordem de serviço
  async delete(req, res) {
    try {
      const { id } = req.params;

      // Verificar se ordem existe
      const existingOrdem = await db.oneOrNone('SELECT * FROM Ordem_de_servico WHERE cod = $1', [id]);
      if (!existingOrdem) {
        return res.status(404).json({
          success: false,
          message: 'Ordem de serviço não encontrada'
        });
      }

      // Verificar se há orçamentos vinculados
      const orcamentosVinculados = await db.oneOrNone('SELECT id FROM Orcamento WHERE ordem_servico_cod = $1', [id]);
      if (orcamentosVinculados) {
        return res.status(400).json({
          success: false,
          message: 'Não é possível remover ordem de serviço que possui orçamentos vinculados'
        });
      }

      // Verificar se há motocicletas vinculadas
      const motosVinculadas = await db.oneOrNone('SELECT placa FROM Motocicleta WHERE ordem_de_servico_cod = $1', [id]);
      if (motosVinculadas) {
        return res.status(400).json({
          success: false,
          message: 'Não é possível remover ordem de serviço que possui motocicletas vinculadas'
        });
      }

      // Verificar se há peças vinculadas
      const pecasVinculadas = await db.oneOrNone('SELECT peca_id FROM Possui_peca WHERE ordem_de_servico_cod = $1', [id]);
      if (pecasVinculadas) {
        return res.status(400).json({
          success: false,
          message: 'Não é possível remover ordem de serviço que possui peças vinculadas'
        });
      }

      await db.none('DELETE FROM Ordem_de_servico WHERE cod = $1', [id]);

      res.json({
        success: true,
        message: 'Ordem de serviço removida com sucesso'
      });

    } catch (error) {
      console.error('Erro ao remover ordem de serviço:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  // Buscar ordens por status
  async findByStatus(req, res) {
    try {
      const { status } = req.params;

      const statusValidos = ['Pendente', 'Em andamento', 'Concluída', 'Cancelada'];
      if (!statusValidos.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Status inválido'
        });
      }

      const ordens = await db.any(`
        SELECT os.*, u.nome as nome_usuario 
        FROM Ordem_de_servico os 
        LEFT JOIN Usuario u ON os.usuario_cpf = u.cpf 
        WHERE os.status = $1
        ORDER BY os.data DESC
      `, [status]);

      res.json({
        success: true,
        data: ordens,
        count: ordens.length
      });

    } catch (error) {
      console.error('Erro ao buscar ordens por status:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }
}

module.exports = new OrdemController(); 