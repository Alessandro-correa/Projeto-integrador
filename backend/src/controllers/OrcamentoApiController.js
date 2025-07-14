const db = require('../config/database');

class OrcamentoApiController {
  // Criar orçamento
  async create(req, res) {
    try {
      const { valor, validade, clienteCpf, status, itens, motocicletaPlaca } = req.body;

      if (!valor || !validade || !clienteCpf) {
        return res.status(400).json({
          success: false,
          message: 'Valor, validade e cliente são obrigatórios'
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

      // Verificar se motocicleta existe (se fornecida)
      if (motocicletaPlaca) {
        const moto = await db.oneOrNone('SELECT placa FROM Motocicleta WHERE placa = $1', [motocicletaPlaca]);
        if (!moto) {
          return res.status(404).json({
            success: false,
            message: 'Motocicleta não encontrada'
          });
        }
      }

      // Preparar descrição com itens (se fornecidos)
      let descricaoItens = '';
      if (itens && itens.length > 0) {
        descricaoItens = JSON.stringify(itens);
      }

      const query = `
        INSERT INTO Orcamento (valor, validade, cliente_cpf, status, descricao)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;

      const novoOrcamento = await db.one(query, [
        valor, 
        validade, 
        clienteCpf, 
        status || 'P',
        descricaoItens
      ]);

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
          o.status,
          c.nome AS cliente_nome,
          m.placa AS placa,
          os.status AS ordem_status,
          os.data AS data
        FROM Orcamento o
        JOIN Cliente c ON o.cliente_cpf = c.cpf
        JOIN Ordem_de_servico os ON o.ordem_servico_cod = os.cod
        LEFT JOIN Motocicleta m ON os.motocicleta_placa = m.placa
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

      const orcamento = await db.oneOrNone(`
        SELECT 
          o.id,
          o.valor,
          o.validade,
          o.ordem_servico_cod,
          o.status,
          c.nome AS cliente_nome,
          c.cpf AS cliente_cpf,
          m.placa AS placa,
          os.status AS ordem_status,
          os.data AS data
        FROM Orcamento o
        JOIN Cliente c ON o.cliente_cpf = c.cpf
        JOIN Ordem_de_servico os ON o.ordem_servico_cod = os.cod
        LEFT JOIN Motocicleta m ON os.motocicleta_placa = m.placa
        WHERE o.id = $1
      `, [id]);

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
      const { valor, validade, ordemServicoCod, clienteCpf, status } = req.body;

      const existingOrcamento = await db.oneOrNone('SELECT * FROM Orcamento WHERE id = $1', [id]);
      if (!existingOrcamento) {
        return res.status(404).json({
          success: false,
          message: 'Orçamento não encontrado'
        });
      }

      const query = `
        UPDATE Orcamento 
        SET valor = $1, validade = $2, ordem_servico_cod = $3, cliente_cpf = $4, status = $5
        WHERE id = $6
        RETURNING *
      `;

      const orcamentoAtualizado = await db.one(query, [valor, validade, ordemServicoCod, clienteCpf, status || 'P', id]);

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

  // Validar orçamento (aprovar e gerar OS automaticamente)
  async validarOrcamento(req, res) {
    try {
      const { id } = req.params;
      const { motocicletaPlaca } = req.body; // Placa da motocicleta para a OS

      // Buscar orçamento
      const orcamento = await db.oneOrNone(`
        SELECT 
          o.id,
          o.valor,
          o.validade,
          o.ordem_servico_cod,
          o.cliente_cpf,
          o.status,
          o.descricao,
          c.nome AS cliente_nome
        FROM Orcamento o
        JOIN Cliente c ON o.cliente_cpf = c.cpf
        WHERE o.id = $1
      `, [id]);

      if (!orcamento) {
        return res.status(404).json({
          success: false,
          message: 'Orçamento não encontrado'
        });
      }

      // Verificar se já foi validado
      if (orcamento.status === 'V') {
        return res.status(400).json({
          success: false,
          message: 'Orçamento já foi validado anteriormente'
        });
      }

      // Se orçamento já tem ordem de serviço, apenas atualizar status
      if (orcamento.ordem_servico_cod) {
        await db.none('UPDATE Orcamento SET status = $1 WHERE id = $2', ['V', id]);
        return res.json({
          success: true,
          message: 'Orçamento validado com sucesso!'
        });
      }

      // Validar motocicleta (obrigatória para criar OS)
      if (!motocicletaPlaca) {
        return res.status(400).json({
          success: false,
          message: 'Placa da motocicleta é obrigatória para validar o orçamento'
        });
      }

      const motocicleta = await db.oneOrNone('SELECT placa FROM Motocicleta WHERE placa = $1', [motocicletaPlaca]);
      if (!motocicleta) {
        return res.status(404).json({
          success: false,
          message: 'Motocicleta não encontrada'
        });
      }

      // Extrair itens da descrição
      let itens = [];
      if (orcamento.descricao) {
        try {
          itens = JSON.parse(orcamento.descricao);
        } catch (e) {
          console.log('Descrição não é JSON válido, tratando como texto');
        }
      }

      // Iniciar transação para criar OS e transferir itens
      await db.tx(async t => {
        // 1. Criar ordem de serviço
        const novaOrdem = await t.one(`
          INSERT INTO Ordem_de_servico (
            titulo, 
            data, 
            descricao, 
            status, 
            observacao, 
            validada, 
            cliente_cpf, 
            motocicleta_placa
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *
        `, [
          `Orçamento #${orcamento.id} - ${orcamento.cliente_nome}`,
          new Date(),
          `Ordem de serviço gerada a partir do orçamento #${orcamento.id}\n\nValor orçado: R$ ${parseFloat(orcamento.valor).toFixed(2)}\nValidade: ${new Date(orcamento.validade).toLocaleDateString('pt-BR')}`,
          'Em Andamento',
          `OS criada automaticamente a partir da validação do orçamento #${orcamento.id}`,
          true,
          orcamento.cliente_cpf,
          motocicletaPlaca
        ]);

        // 2. Transferir itens para Possui_peca (se houver)
        if (itens && itens.length > 0) {
          for (const item of itens) {
            if (item.tipo === 'peca' && item.pecaId) {
              await t.none(`
                INSERT INTO Possui_peca (ordem_de_servico_cod, peca_id, qtd_pecas)
                VALUES ($1, $2, $3)
                ON CONFLICT (ordem_de_servico_cod, peca_id) 
                DO UPDATE SET qtd_pecas = $3
              `, [novaOrdem.cod, item.pecaId, item.quantidade || 1]);
            }
          }
        }

        // 3. Atualizar orçamento com a nova ordem de serviço
        await t.none(`
          UPDATE Orcamento 
          SET status = $1, ordem_servico_cod = $2 
          WHERE id = $3
        `, ['V', novaOrdem.cod, id]);

        return novaOrdem;
      });

      res.json({
        success: true,
        message: 'Orçamento validado e ordem de serviço criada com sucesso!',
        data: {
          orcamento_id: id,
          message: `Orçamento validado! Nova ordem de serviço criada automaticamente.`
        }
      });

    } catch (error) {
      console.error('Erro ao validar orçamento:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  // Rejeitar orçamento
  async rejeitarOrcamento(req, res) {
    try {
      const { id } = req.params;

      // Verificar se orçamento existe
      const orcamento = await db.oneOrNone('SELECT * FROM Orcamento WHERE id = $1', [id]);
      if (!orcamento) {
        return res.status(404).json({
          success: false,
          message: 'Orçamento não encontrado'
        });
      }

      // Verificar se já foi processado
      if (orcamento.status === 'R') {
        return res.status(400).json({
          success: false,
          message: 'Orçamento já foi rejeitado anteriormente'
        });
      }

      if (orcamento.status === 'V') {
        return res.status(400).json({
          success: false,
          message: 'Não é possível rejeitar um orçamento já validado'
        });
      }

      // Atualizar status para rejeitado (não cria ordem de serviço)
      const orcamentoAtualizado = await db.one(
        'UPDATE Orcamento SET status = $1 WHERE id = $2 RETURNING *',
        ['R', id]
      );

      res.json({
        success: true,
        message: 'Orçamento rejeitado com sucesso',
        data: orcamentoAtualizado
      });

    } catch (error) {
      console.error('Erro ao rejeitar orçamento:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }
}

module.exports = new OrcamentoApiController(); 