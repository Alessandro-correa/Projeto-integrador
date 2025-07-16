const db = require('../config/database');

class OrdemServicoApiController {
  // Status válidos para ordem de serviço
  getStatusValidos() {
    return ['Em Andamento', 'Ajuste Pendente', 'Validado', 'Validada', 'Rejeitado', 'Rejeitada', 'Validação Pendente'];
  }

  // Criar ordem de serviço
  async create(req, res) {
    try {
      const { titulo, data, descricao, status, observacao, valor, valor_mao_de_obra, valorMaoDeObra, validada, clienteCpf, motocicletaPlaca } = req.body;

      // Validações
      if (!titulo || !data || !descricao || !status || !clienteCpf || !motocicletaPlaca) {
        return res.status(400).json({
          success: false,
          message: 'Título, data, descrição, status, CPF do cliente e placa da motocicleta são obrigatórios'
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
      const statusValidos = ['Em Andamento', 'Ajuste Pendente', 'Validado', 'Validada', 'Rejeitado', 'Rejeitada', 'Validação Pendente'];
      if (!statusValidos.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Status inválido. Status válidos: ' + statusValidos.join(', ')
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

      // Verificar se motocicleta existe
      const motocicleta = await db.oneOrNone('SELECT placa FROM Motocicleta WHERE placa = $1', [motocicletaPlaca]);
      if (!motocicleta) {
        return res.status(404).json({
          success: false,
          message: 'Motocicleta não encontrada'
        });
      }

      const query = `
        INSERT INTO Ordem_de_servico (titulo, data, descricao, status, observacao, valor, valor_mao_de_obra, validada, cliente_cpf, motocicleta_placa)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;

      const valorFinal = valor ? parseFloat(valor) : 0.00;
      const valorMaoDeObraFinal = valor_mao_de_obra ? parseFloat(valor_mao_de_obra) : 
                                  valorMaoDeObra ? parseFloat(valorMaoDeObra) : 0.00;

      const novaOrdem = await db.one(query, [titulo, data, descricao, status, observacao || null, valorFinal, valorMaoDeObraFinal, validada || false, clienteCpf, motocicletaPlaca]);

      // Inserir peças na Possui_peca
      if (req.body.pecas && Array.isArray(req.body.pecas)) {
        for (const peca of req.body.pecas) {
          if (peca.id && peca.quantidade > 0) {
            await db.none(
              'INSERT INTO Possui_peca (ordem_de_servico_cod, peca_id, qtd_pecas) VALUES ($1, $2, $3)',
              [novaOrdem.cod, peca.id, peca.quantidade]
            );
          }
        }
      }

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
          os.data,
          os.descricao,
          os.status,
          os.observacao,
          os.valor,
          os.valor_mao_de_obra,
          os.validada,
          c.nome AS cliente_nome,
          c.cpf AS cliente_cpf,
          c.telefone AS cliente_telefone,
          c.email AS cliente_email,
          m.placa AS motocicleta_placa,
          m.modelo AS motocicleta_modelo,
          m.ano AS motocicleta_ano,
          m.cor AS motocicleta_cor
        FROM Ordem_de_servico os
        JOIN Cliente c ON os.cliente_cpf = c.cpf
        JOIN Motocicleta m ON os.motocicleta_placa = m.placa
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
      const { cod } = req.params;

      // Buscar dados principais da ordem
      const ordem = await db.oneOrNone(`
        SELECT 
          os.cod,
          os.titulo,
          os.data,
          os.descricao,
          os.status,
          os.observacao,
          os.valor,
          os.valor_mao_de_obra,
          os.validada,
          os.cliente_cpf,
          os.motocicleta_placa,
          c.nome AS cliente_nome,
          c.telefone AS cliente_telefone,
          c.email AS cliente_email,
          m.modelo AS motocicleta_modelo,
          m.ano AS motocicleta_ano,
          m.cor AS motocicleta_cor,
          m.cilindrada AS motocicleta_cilindrada
        FROM Ordem_de_servico os
        JOIN Cliente c ON os.cliente_cpf = c.cpf
        JOIN Motocicleta m ON os.motocicleta_placa = m.placa
        WHERE os.cod = $1
      `, [cod]);

      if (!ordem) {
        return res.status(404).json({
          success: false,
          message: 'Ordem de serviço não encontrada'
        });
      }

      // Buscar peças relacionadas à ordem
      const pecas = await db.any(`
        SELECT 
          p.id,
          p.nome,
          p.descricao,
          p.valor,
          pp.qtd_pecas,
          (p.valor * pp.qtd_pecas) AS valor_total
        FROM Possui_peca pp
        JOIN Peca p ON pp.peca_id = p.id
        WHERE pp.ordem_de_servico_cod = $1
        ORDER BY p.nome
      `, [cod]);

      // Buscar orçamento relacionado
      const orcamento = await db.oneOrNone(`
        SELECT 
          id,
          valor,
          validade,
          status,
          descricao
        FROM Orcamento
        WHERE ordem_servico_cod = $1
        ORDER BY id DESC
        LIMIT 1
      `, [cod]);

      // Processar descrição do orçamento se existir e estiver aprovado
      let servicosProcessados = [];
      let pecasProcessadas = [];
      let valorTotalServicos = 0;
      let valorTotalPecasOrcamento = 0;
      let descricaoFormatada = '';
      
      if (orcamento && orcamento.status === 'A' && orcamento.descricao) {
        const itens = orcamento.descricao.split(';');
        
        itens.forEach(item => {
          if (item.trim().startsWith('SERVIÇO:')) {
            const match = item.match(/SERVIÇO:\s*(.+?)\s*-\s*R\$\s*([\d,]+\.?\d*)/);
            if (match) {
              const descricao = match[1].trim();
              const valor = parseFloat(match[2].replace(',', '.'));
              servicosProcessados.push({ descricao, valor });
              valorTotalServicos += valor;
            }
          } else if (item.trim().startsWith('PEÇA:')) {
            const match = item.match(/PEÇA:\s*(.+?)\s*-\s*Qtd:\s*(\d+)\s*-\s*Valor unit:\s*R\$\s*([\d,]+\.?\d*)/);
            if (match) {
              const nome = match[1].trim();
              const quantidade = parseInt(match[2]);
              const valorUnit = parseFloat(match[3].replace(',', '.'));
              const valorTotal = quantidade * valorUnit;
              pecasProcessadas.push({ nome, quantidade, valor_unitario: valorUnit, valor_total: valorTotal });
              valorTotalPecasOrcamento += valorTotal;
            }
          }
        });

        // Formatar descrição para exibição na OS
        const servicosText = servicosProcessados.map(s => `• ${s.descricao} - R$ ${s.valor.toFixed(2)}`).join('\n');
        const pecasText = pecasProcessadas.map(p => `• ${p.nome} (Qtd: ${p.quantidade}) - R$ ${p.valor_unitario.toFixed(2)} cada`).join('\n');
        
        descricaoFormatada = 'SERVIÇOS DO ORÇAMENTO:\n' + servicosText;
        if (pecasText) {
          descricaoFormatada += '\n\nPEÇAS DO ORÇAMENTO:\n' + pecasText;
        }
      }

      // Calcular valor total das peças
      let pecasFinais = pecas;
      let valorTotalPecas = pecas.reduce((total, peca) => total + parseFloat(peca.valor_total || 0), 0);

      // Montar resposta completa
      const ordemCompleta = {
        cod: ordem.cod,
        titulo: ordem.titulo,
        data: ordem.data,
        descricao: ordem.descricao,
        status: ordem.status,
        observacao: ordem.observacao,
        validada: ordem.validada,
        cliente_cpf: ordem.cliente_cpf,
        motocicleta_placa: ordem.motocicleta_placa,
        valor: ordem.valor || 0, // Valor total das peças
        valor_mao_de_obra: ordem.valor_mao_de_obra || 0, // Valor de mão de obra
        
        // Dados do cliente
        cliente_nome: ordem.cliente_nome,
        cliente_telefone: ordem.cliente_telefone,
        cliente_email: ordem.cliente_email,
        
        // Dados da motocicleta
        motocicleta_modelo: ordem.motocicleta_modelo,
        motocicleta_ano: ordem.motocicleta_ano,
        motocicleta_cor: ordem.motocicleta_cor,
        motocicleta_cilindrada: ordem.motocicleta_cilindrada,
        
        // Peças e valores
        pecas: pecasFinais,
        valor_total_pecas: valorTotalPecas,
        
        // Dados do orçamento processados
        orcamento: orcamento,
        servicos_orcamento: servicosProcessados,
        pecas_orcamento: pecasProcessadas,
        valor_total_servicos: valorTotalServicos,
        valor_total_pecas_orcamento: valorTotalPecasOrcamento,
        descricao_orcamento_formatada: descricaoFormatada,
        
        // Valor total da OS
        valor_total_os: (ordem.valor || 0) + (ordem.valor_mao_de_obra || 0)
      };

      res.json({
        success: true,
        data: ordemCompleta
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
      const { cod } = req.params;
      // Permitir tanto camelCase quanto snake_case no body
      const {
        titulo,
        data,
        descricao,
        status,
        observacao,
        validada,
        clienteCpf,
        cliente_cpf,
        valor, // Valor total das peças
        valor_mao_de_obra, // Novo campo para valor de mão de obra
        valorMaoDeObra, // Aceitar também em camelCase
        pecas
      } = req.body;

      // Verificar se ordem existe
      const existingOrdem = await db.oneOrNone('SELECT * FROM Ordem_de_servico WHERE cod = $1', [cod]);
      if (!existingOrdem) {
        return res.status(404).json({
          success: false,
          message: 'Ordem de serviço não encontrada'
        });
      }

      // Validação dos campos obrigatórios
      if (!descricao || !status) {
        return res.status(400).json({
          success: false,
          message: 'Descrição e status são obrigatórios'
        });
      }

      // Usar dados existentes para campos não enviados
      const tituloFinal = titulo !== undefined ? titulo : existingOrdem.titulo;
      const dataFinal = data !== undefined ? data : existingOrdem.data;
      const clienteCpfFinal = clienteCpf || cliente_cpf || existingOrdem.cliente_cpf;

      // Validar formato da data se fornecida
      if (data !== undefined) {
        const dataOrdem = new Date(data);
        if (isNaN(dataOrdem.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Data inválida'
          });
        }
      }

      // Validar status com a mesma lista do sistema
      const statusValidos = ['Em Andamento', 'Ajuste Pendente', 'Validado', 'Validada', 'Rejeitado', 'Rejeitada', 'Validação Pendente'];
      if (!statusValidos.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Status inválido. Status válidos: ' + statusValidos.join(', ')
        });
      }

      // Verificar se cliente existe (apenas se CPF foi fornecido)
      if (clienteCpf || cliente_cpf) {
        const cpfBusca = clienteCpf || cliente_cpf;
        const cliente = await db.oneOrNone('SELECT cpf FROM Cliente WHERE cpf = $1', [cpfBusca]);
        if (!cliente) {
          return res.status(404).json({
            success: false,
            message: 'Cliente não encontrado'
          });
        }
      }

      const query = `
        UPDATE Ordem_de_servico 
        SET titulo = $1, data = $2, descricao = $3, status = $4, observacao = $5, validada = $6, cliente_cpf = $7, valor = $8, valor_mao_de_obra = $9
        WHERE cod = $10
        RETURNING *
      `;

      const valorFinal = valor !== undefined ? parseFloat(valor) || 0 : existingOrdem.valor || 0;
      const valorMaoDeObraFinal = valor_mao_de_obra !== undefined ? parseFloat(valor_mao_de_obra) || 0 : 
                                  valorMaoDeObra !== undefined ? parseFloat(valorMaoDeObra) || 0 : 
                                  existingOrdem.valor_mao_de_obra || 0;

      const ordemAtualizada = await db.one(query, [
        tituloFinal,
        dataFinal,
        descricao,
        status,
        observacao !== undefined ? observacao : existingOrdem.observacao,
        validada !== undefined ? validada : existingOrdem.validada,
        clienteCpfFinal,
        valorFinal,
        valorMaoDeObraFinal,
        cod
      ]);

      // Se peças foram enviadas, atualizá-las
      if (pecas && Array.isArray(pecas)) {
        // Primeiro, remover todas as peças existentes desta ordem
        await db.none('DELETE FROM Possui_peca WHERE Ordem_de_servico_COD = $1', [cod]);

        // Depois, inserir as novas peças
        for (const peca of pecas) {
          if (peca.nome && peca.quantidade > 0 && peca.valor > 0) {
            // Verificar se a peça já existe no sistema
            let pecaExistente = await db.oneOrNone('SELECT id FROM Peca WHERE nome = $1', [peca.nome]);
            
            let pecaId;
            if (!pecaExistente) {
              // Criar nova peça se não existir
              pecaExistente = await db.one(
                'INSERT INTO Peca (nome, descricao, valor) VALUES ($1, $2, $3) RETURNING id',
                [peca.nome, peca.nome, peca.valor]
              );
              pecaId = pecaExistente.id;
            } else {
              pecaId = pecaExistente.id;
              // Atualizar o valor da peça se necessário
              await db.none('UPDATE Peca SET valor = $1 WHERE id = $2', [peca.valor, pecaId]);
            }

            // Inserir na tabela de relacionamento
            await db.none(
              'INSERT INTO Possui_peca (Ordem_de_servico_COD, Peca_ID, Qtd_pecas) VALUES ($1, $2, $3)',
              [cod, pecaId, peca.quantidade]
            );
          }
        }
      }

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
      const { cod } = req.params;

      // Verificar se ordem existe
      const existingOrdem = await db.oneOrNone('SELECT * FROM Ordem_de_servico WHERE cod = $1', [cod]);
      if (!existingOrdem) {
        return res.status(404).json({
          success: false,
          message: 'Ordem de serviço não encontrada'
        });
      }

      // Se houver orçamento vinculado, desvincular e voltar para pendente
      const orcamentoVinculado = await db.oneOrNone('SELECT id FROM Orcamento WHERE ordem_servico_cod = $1', [cod]);
      if (orcamentoVinculado) {
        await db.none('UPDATE Orcamento SET ordem_servico_cod = NULL, status = $1 WHERE id = $2', ['P', orcamentoVinculado.id]);
      }

      // Remover todas as peças vinculadas antes de excluir a ordem
      await db.none('DELETE FROM Possui_peca WHERE Ordem_de_servico_COD = $1', [cod]);

      await db.none('DELETE FROM Ordem_de_servico WHERE cod = $1', [cod]);

      res.json({
        success: true,
        message: 'Ordem de serviço removida com sucesso'
      });

    } catch (error) {
      console.error('Erro ao remover ordem de serviço:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message,
        stack: error.stack
      });
    }
  }

  // Buscar ordens por status
  async findByStatus(req, res) {
    try {
      const { status } = req.params;

      const statusValidos = ['Em Andamento', 'Ajuste Pendente', 'Validado', 'Validada', 'Rejeitado', 'Rejeitada', 'Validação Pendente'];
      if (!statusValidos.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Status inválido. Status válidos: ' + statusValidos.join(', ')
        });
      }

      const ordens = await db.any(`
        SELECT 
          os.*,
          c.nome as cliente_nome,
          c.cpf as cliente_cpf,
          m.modelo as motocicleta_modelo,
          m.placa as motocicleta_placa
        FROM Ordem_de_servico os 
        JOIN Cliente c ON os.cliente_cpf = c.cpf 
        JOIN Motocicleta m ON os.motocicleta_placa = m.placa
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

  // Atualizar apenas status da ordem de serviço
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, validada } = req.body;

      // Verificar se ordem existe
      const existingOrdem = await db.oneOrNone('SELECT * FROM Ordem_de_servico WHERE cod = $1', [id]);
      if (!existingOrdem) {
        return res.status(404).json({
          success: false,
          message: 'Ordem de serviço não encontrada'
        });
      }

      // Validar status se fornecido
      if (status) {
        const statusValidos = ['Em Andamento', 'Ajuste Pendente', 'Validado', 'Validada', 'Rejeitado', 'Rejeitada', 'Validação Pendente'];
        if (!statusValidos.includes(status)) {
          return res.status(400).json({
            success: false,
            message: 'Status inválido. Status válidos: ' + statusValidos.join(', ')
          });
        }
      }

      // Construir query dinâmica baseada nos campos fornecidos
      const updates = [];
      const values = [];
      let paramIndex = 1;

      if (status !== undefined) {
        updates.push(`status = $${paramIndex}`);
        values.push(status);
        paramIndex++;
      }

      if (validada !== undefined) {
        updates.push(`validada = $${paramIndex}`);
        values.push(validada);
        paramIndex++;
      }

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Nenhum campo para atualizar fornecido'
        });
      }

      values.push(id);
      const query = `
        UPDATE Ordem_de_servico 
        SET ${updates.join(', ')}
        WHERE cod = $${paramIndex}
        RETURNING *
      `;

      const ordemAtualizada = await db.one(query, values);

      res.json({
        success: true,
        message: 'Status da ordem de serviço atualizado com sucesso',
        data: ordemAtualizada
      });

    } catch (error) {
      console.error('Erro ao atualizar status da ordem de serviço:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  // Buscar peças de uma ordem de serviço
  async findPecas(req, res) {
    try {
      const { id } = req.params;

      // Verificar se ordem existe
      const ordem = await db.oneOrNone('SELECT cod FROM Ordem_de_servico WHERE cod = $1', [id]);
      if (!ordem) {
        return res.status(404).json({
          success: false,
          message: 'Ordem de serviço não encontrada'
        });
      }

      // Buscar peças relacionadas à ordem
      const pecas = await db.any(`
        SELECT 
          p.id,
          p.nome,
          p.descricao,
          p.valor,
          pp.qtd_pecas as quantidade,
          (p.valor * pp.qtd_pecas) AS valor_total,
          'peca' as tipo
        FROM Possui_peca pp
        JOIN Peca p ON pp.peca_id = p.id
        WHERE pp.ordem_de_servico_cod = $1
        ORDER BY p.nome
      `, [id]);

      res.json({
        success: true,
        data: pecas,
        count: pecas.length
      });

    } catch (error) {
      console.error('Erro ao buscar peças da ordem:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  // Adicionar peça a uma ordem de serviço
  async addPeca(req, res) {
    try {
      console.log('Dados recebidos para adicionar peça:', req.body);
      
      const { ordemDeServicoCod, pecaId, qtdPecas } = req.body;

      if (!ordemDeServicoCod || !pecaId || !qtdPecas) {
        console.log('Validação falhou:', { ordemDeServicoCod, pecaId, qtdPecas });
        return res.status(400).json({
          success: false,
          message: 'Ordem de serviço, peça e quantidade são obrigatórios'
        });
      }

      // Verificar se ordem existe
      const ordem = await db.oneOrNone('SELECT cod FROM Ordem_de_servico WHERE cod = $1', [ordemDeServicoCod]);
      if (!ordem) {
        return res.status(404).json({
          success: false,
          message: 'Ordem de serviço não encontrada'
        });
      }

      // Verificar se peça existe
      const peca = await db.oneOrNone('SELECT id FROM Peca WHERE id = $1', [pecaId]);
      if (!peca) {
        return res.status(404).json({
          success: false,
          message: 'Peça não encontrada'
        });
      }

      // Verificar se já existe relacionamento
      const relacaoExistente = await db.oneOrNone(
        'SELECT * FROM Possui_peca WHERE ordem_de_servico_cod = $1 AND peca_id = $2',
        [ordemDeServicoCod, pecaId]
      );

      if (relacaoExistente) {
        // Atualizar quantidade se já existe
        const pecaAtualizada = await db.one(
          'UPDATE Possui_peca SET qtd_pecas = $1 WHERE ordem_de_servico_cod = $2 AND peca_id = $3 RETURNING *',
          [qtdPecas, ordemDeServicoCod, pecaId]
        );

        res.json({
          success: true,
          message: 'Quantidade da peça atualizada com sucesso',
          data: pecaAtualizada
        });
      } else {
        // Inserir nova relação
        const novaPeca = await db.one(
          'INSERT INTO Possui_peca (ordem_de_servico_cod, peca_id, qtd_pecas) VALUES ($1, $2, $3) RETURNING *',
          [ordemDeServicoCod, pecaId, qtdPecas]
        );

        res.json({
          success: true,
          message: 'Peça adicionada à ordem de serviço com sucesso',
          data: novaPeca
        });
      }

    } catch (error) {
      console.error('Erro ao adicionar peça à ordem:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  // Calcular valor total de uma ordem de serviço
  async calcularValorTotal(req, res) {
    try {
      const { id } = req.params;

      // Verificar se ordem existe
      const ordem = await db.oneOrNone('SELECT cod FROM Ordem_de_servico WHERE cod = $1', [id]);
      if (!ordem) {
        return res.status(404).json({
          success: false,
          message: 'Ordem de serviço não encontrada'
        });
      }

      // Calcular valor total usando SUM
      const resultado = await db.oneOrNone(`
        SELECT 
          COALESCE(SUM(p.valor * pp.qtd_pecas), 0) AS valor_total,
          COUNT(pp.peca_id) AS total_itens
        FROM Possui_peca pp
        JOIN Peca p ON pp.peca_id = p.id
        WHERE pp.ordem_de_servico_cod = $1
      `, [id]);

      const valorTotal = parseFloat(resultado?.valor_total || 0);
      const totalItens = parseInt(resultado?.total_itens || 0);

      res.json({
        success: true,
        data: {
          ordem_id: id,
          valor_total: valorTotal,
          total_itens: totalItens,
          valor_formatado: `R$ ${valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        }
      });

    } catch (error) {
      console.error('Erro ao calcular valor total da ordem:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }
}

module.exports = new OrdemServicoApiController();