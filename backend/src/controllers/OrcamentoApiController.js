const db = require('../config/database');

class OrcamentoApiController {
  // Função auxiliar para processar itens do orçamento
  static processarItensOrcamento(itens) {
    if (!itens || !Array.isArray(itens)) {
      return { pecas: [], servicos: [] };
    }

    const pecas = itens.filter(item => item.tipo === 'peca').map(item => ({
      id: item.id || null,
      nome: item.nome,
      quantidade: item.quantidade || 1,
      valor_unitario: parseFloat(item.valor_unitario || 0),
      valor_total: parseFloat((item.quantidade || 1) * parseFloat(item.valor_unitario || 0))
    }));

    const servicos = itens.filter(item => item.tipo === 'servico').map(item => {
      // Para serviços, verificar tanto 'valor' quanto 'valor_unitario' para compatibilidade
      const valorServico = parseFloat(item.valor || item.valor_unitario || 0);
      return {
        descricao: item.descricao || item.nome,
        valor: valorServico
      };
    });

    return { pecas, servicos };
  }

  // Função auxiliar para calcular valor total do orçamento
  static calcularValorTotal(pecas, servicos) {
    const valorPecas = pecas.reduce((total, peca) => total + peca.valor_total, 0);
    const valorServicos = servicos.reduce((total, servico) => total + servico.valor, 0);
    return valorPecas + valorServicos;
  }

  // Função auxiliar para processar descrição concatenada (formato antigo)
  static processarDescricaoConcatenada(descricao) {
    if (!descricao || typeof descricao !== 'string') {
      return { pecas: [], servicos: [] };
    }

    const servicos = [];
    const pecas = [];

    // Regex para capturar serviços: "SERVIÇO: ... - R$ valor"
    const servicoRegex = /SERVI[ÇC]O:\s*([^-]+?)\s*-\s*R\$\s*([\d,]+\.?\d*)/g;
    let servicoMatch;
    while ((servicoMatch = servicoRegex.exec(descricao)) !== null) {
      const descricaoServico = servicoMatch[1].trim();
      const valor = parseFloat(servicoMatch[2].replace(',', '.')) || 0;
      servicos.push({
        descricao: descricaoServico,
        valor: valor
      });
    }

    // Regex para capturar peças: "PEÇA: nome - Qtd: qty - Valor unit: R$ valor"
    const pecaRegex = /PE[ÇC]A:\s*([^-]+?)\s*-\s*Qtd:\s*(\d+)\s*-\s*Valor\s+unit:\s*R\$\s*([\d,]+\.?\d*)/g;
    let pecaMatch;
    while ((pecaMatch = pecaRegex.exec(descricao)) !== null) {
      const nome = pecaMatch[1].trim();
      const quantidade = parseInt(pecaMatch[2]) || 1;
      const valorUnitario = parseFloat(pecaMatch[3].replace(',', '.')) || 0;
      pecas.push({
        nome: nome,
        quantidade: quantidade,
        valor_unitario: valorUnitario,
        valor_total: quantidade * valorUnitario
      });
    }

    return { pecas, servicos };
  }

  // Criar orçamento
  async create(req, res) {
    try {

      const { validade, clienteCpf, status, descricao } = req.body;

      if (!validade || !clienteCpf) {
        return res.status(400).json({
          success: false,
          message: 'Validade e cliente são obrigatórios'
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

      // Se veio descricao estruturada do frontend, usar direto
      let descricaoEstruturada;
      if (descricao) {
        descricaoEstruturada = typeof descricao === 'string' ? JSON.parse(descricao) : descricao;
      } else {
        descricaoEstruturada = {
          pecas: [],
          servicos: [],
          observacoes: '',
          motocicleta_placa: null
        };
      }

      // Calcular valor total automaticamente
      const valorTotal = (descricaoEstruturada.pecas || []).reduce((acc, p) => acc + (p.valor_total || 0), 0)
        + (descricaoEstruturada.servicos || []).reduce((acc, s) => acc + (s.valor || 0), 0);

      const query = `
        INSERT INTO Orcamento (valor, validade, cliente_cpf, status, descricao)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;

      const novoOrcamento = await db.one(query, [
        valorTotal, 
        validade, 
        clienteCpf, 
        status || 'P',
        JSON.stringify(descricaoEstruturada)
      ]);

      // Retornar com dados estruturados
      const orcamentoResponse = {
        ...novoOrcamento,
        itens_estruturados: descricaoEstruturada
      };

      res.status(201).json({
        success: true,
        message: 'Orçamento criado com sucesso',
        data: orcamentoResponse
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
          o.descricao,
          c.nome AS cliente_nome,
          c.cpf AS cliente_cpf,
          COALESCE(m_os.placa, m_possui.placa) AS placa,
          CASE 
            WHEN o.ordem_servico_cod IS NOT NULL THEN os.status 
            ELSE NULL 
          END AS ordem_status,
          CASE 
            WHEN o.ordem_servico_cod IS NOT NULL AND o.status = 'A' THEN os.data 
            ELSE NULL 
          END AS data,
          CASE 
            WHEN o.ordem_servico_cod IS NOT NULL THEN os.titulo 
            ELSE NULL 
          END AS ordem_titulo
        FROM Orcamento o
        JOIN Cliente c ON o.cliente_cpf = c.cpf
        LEFT JOIN Ordem_de_servico os ON o.ordem_servico_cod = os.cod
        LEFT JOIN Motocicleta m_os ON os.motocicleta_placa = m_os.placa
        LEFT JOIN Possui p ON c.cpf = p.cliente_cpf
        LEFT JOIN Motocicleta m_possui ON p.motocicleta_placa = m_possui.placa
        ORDER BY o.validade
      `);

      // Processar descrições estruturadas
      // Função auxiliar para status
      const getStatusDescricao = (status) => {
        const statusMap = {
          'P': 'Pendente',
          'A': 'Aprovado',
          'R': 'Rejeitado'
        };
        return statusMap[status] || 'Desconhecido';
      };

      const orcamentosProcessados = orcamentos.map(orcamento => {
        let itensEstruturados = { pecas: [], servicos: [], observacoes: '', motocicleta_placa: null };
        
        try {
          if (orcamento.descricao) {
            itensEstruturados = JSON.parse(orcamento.descricao);
          }
        } catch (e) {
          // Se não for JSON válido, tentar processar como descrição concatenada
          if (orcamento.descricao) {
            const { pecas, servicos } = OrcamentoApiController.processarDescricaoConcatenada(orcamento.descricao);
            itensEstruturados = {
              pecas: pecas,
              servicos: servicos,
              observacoes: orcamento.descricao,
              motocicleta_placa: null
            };
          }
        }

        return {
          ...orcamento,
          itens_estruturados: itensEstruturados,
          status_descricao: getStatusDescricao(orcamento.status)
        };
      });
      
      res.json({
        success: true,
        data: orcamentosProcessados,
        count: orcamentosProcessados.length
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
          o.descricao,
          c.nome AS cliente_nome,
          c.cpf AS cliente_cpf,
          COALESCE(m_os.placa, m_possui.placa) AS placa,
          COALESCE(m_os.modelo, m_possui.modelo) AS modelo,
          COALESCE(m_os.ano, m_possui.ano) AS ano,
          COALESCE(m_os.cor, m_possui.cor) AS cor,
          COALESCE(marca_os.nome, marca_possui.nome) AS marca_nome,
          CASE 
            WHEN o.ordem_servico_cod IS NOT NULL THEN os.status 
            ELSE NULL 
          END AS ordem_status,
          CASE 
            WHEN o.ordem_servico_cod IS NOT NULL AND o.status = 'A' THEN os.data 
            ELSE NULL 
          END AS data
        FROM Orcamento o
        JOIN Cliente c ON o.cliente_cpf = c.cpf
        LEFT JOIN Ordem_de_servico os ON o.ordem_servico_cod = os.cod
        LEFT JOIN Motocicleta m_os ON os.motocicleta_placa = m_os.placa
        LEFT JOIN Marca marca_os ON m_os.marca_id = marca_os.id
        LEFT JOIN Possui p ON c.cpf = p.cliente_cpf
        LEFT JOIN Motocicleta m_possui ON p.motocicleta_placa = m_possui.placa
        LEFT JOIN Marca marca_possui ON m_possui.marca_id = marca_possui.id
        WHERE o.id = $1
      `, [id]);

      if (!orcamento) {
        return res.status(404).json({
          success: false,
          message: 'Orçamento não encontrado'
        });
      }

      // Processar descrição estruturada
      let itensEstruturados = { pecas: [], servicos: [], observacoes: '', motocicleta_placa: null };
      
      try {
        if (orcamento.descricao) {
          itensEstruturados = JSON.parse(orcamento.descricao);
        }
      } catch (e) {
        // Se não for JSON válido, tentar processar como descrição concatenada
        if (orcamento.descricao) {
          const { pecas, servicos } = OrcamentoApiController.processarDescricaoConcatenada(orcamento.descricao);
          itensEstruturados = {
            pecas: pecas,
            servicos: servicos,
            observacoes: orcamento.descricao,
            motocicleta_placa: null
          };
        }
      }

      // Função auxiliar para status
      const getStatusDescricao = (status) => {
        const statusMap = {
          'P': 'Pendente',
          'A': 'Aprovado',
          'R': 'Rejeitado'
        };
        return statusMap[status] || 'Desconhecido';
      };

      const response = {
        ...orcamento,
        itens_estruturados: itensEstruturados,
        status_descricao: getStatusDescricao(orcamento.status)
      };

      res.json({
        success: true,
        data: response
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
      const { validade, status, valor, itens, observacoes, motocicletaPlaca } = req.body;

      console.log('=== ORÇAMENTO UPDATE DEBUG ===');
      console.log('ID:', id);
      console.log('Body completo:', JSON.stringify(req.body, null, 2));
      console.log('Campos extraídos:', { 
        validade, 
        status, 
        valor: { valor, tipo: typeof valor }, 
        itens: { existe: !!itens, length: itens?.length, dados: itens }, 
        observacoes, 
        motocicletaPlaca 
      });

      // Verificar se orçamento existe
      const orcamentoExistente = await db.oneOrNone('SELECT * FROM Orcamento WHERE id = $1', [id]);
      if (!orcamentoExistente) {
        console.log('❌ Orçamento não encontrado');
        return res.status(404).json({
          success: false,
          message: 'Orçamento não encontrado'
        });
      }

      console.log('✅ Orçamento existente:', orcamentoExistente);

      // Verificar se pode ser editado (não pode editar se já foi aprovado e tem OS)
      if (orcamentoExistente.status === 'A' && orcamentoExistente.ordem_servico_cod) {
        console.log('❌ Orçamento já convertido em OS');
        return res.status(400).json({
          success: false,
          message: 'Não é possível editar orçamento que já foi convertido em ordem de serviço'
        });
      }

      // Processar itens se fornecidos, caso contrário preservar os existentes
      let descricaoEstruturada = null;
      let valorCalculado = null;

      if (itens) {
        console.log('🔧 Processando itens recebidos:', JSON.stringify(itens, null, 2));
        const { pecas, servicos } = OrcamentoApiController.processarItensOrcamento(itens);
        console.log('🔧 Peças processadas:', JSON.stringify(pecas, null, 2));
        console.log('🔧 Serviços processados:', JSON.stringify(servicos, null, 2));
        
        valorCalculado = OrcamentoApiController.calcularValorTotal(pecas, servicos);
        console.log('🔧 Valor calculado:', valorCalculado);
        
        descricaoEstruturada = {
          pecas,
          servicos,
          observacoes: observacoes || '',
          motocicleta_placa: motocicletaPlaca || null
        };
        console.log('🔧 Descrição estruturada criada:', JSON.stringify(descricaoEstruturada, null, 2));
      } else {
        // Se não foram fornecidos itens, preservar os existentes (se houver)
        console.log('🔧 Nenhum item fornecido, tentando preservar existentes...');
        try {
          if (orcamentoExistente.descricao) {
            const itensExistentes = JSON.parse(orcamentoExistente.descricao);
            if (itensExistentes.pecas || itensExistentes.servicos) {
              // Se apenas observacoes ou motocicletaPlaca foram alterados, preservar itens
              if (observacoes !== undefined || motocicletaPlaca !== undefined) {
                descricaoEstruturada = {
                  pecas: itensExistentes.pecas || [],
                  servicos: itensExistentes.servicos || [],
                  observacoes: observacoes !== undefined ? observacoes : (itensExistentes.observacoes || ''),
                  motocicleta_placa: motocicletaPlaca !== undefined ? motocicletaPlaca : (itensExistentes.motocicleta_placa || null)
                };
                console.log('🔧 Preservando itens existentes com alterações:', JSON.stringify(descricaoEstruturada, null, 2));
              }
            }

          }
        } catch (parseError) {
          console.log('🔧 Erro ao fazer parse dos itens existentes:', parseError.message);
        }
      }

      // Construir query de atualização dinamicamente
      const updates = [];
      const values = [];
      let paramCount = 1;

      console.log('🔨 Construindo query de atualização...');

      if (validade) {
        updates.push(`validade = $${paramCount++}`);
        values.push(validade);
        console.log('✅ Adicionando validade:', validade);
      }

      if (status) {
        updates.push(`status = $${paramCount++}`);
        values.push(status);
        console.log('✅ Adicionando status:', status);
      }

      // Usar valor direto se fornecido, ou valor calculado dos itens apenas se itens foram fornecidos
      if (valor !== undefined && valor !== null) {
        const valorNumerico = parseFloat(valor);
        updates.push(`valor = $${paramCount++}`);
        values.push(valorNumerico);
        console.log('✅ Adicionando valor direto:', { original: valor, convertido: valorNumerico });
      } else if (valorCalculado !== null && itens) {
        // Só usar valor calculado se itens foram explicitamente fornecidos
        updates.push(`valor = $${paramCount++}`);
        values.push(valorCalculado);
        console.log('✅ Adicionando valor calculado (com itens fornecidos):', valorCalculado);
      }

      if (descricaoEstruturada) {
        updates.push(`descricao = $${paramCount++}`);
        values.push(JSON.stringify(descricaoEstruturada));
        console.log('✅ Adicionando descrição estruturada');
      }

      console.log('📝 Query updates:', updates);
      console.log('📦 Values:', values);

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Nenhum campo para atualizar foi fornecido'
        });
      }

      // Adicionar ID no final
      values.push(id);

      const query = `
        UPDATE Orcamento 
        SET ${updates.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      console.log('🚀 Executando query:', query);
      console.log('📦 Com valores:', values);

      const orcamentoAtualizado = await db.one(query, values);

      console.log('✅ Orçamento atualizado com sucesso:', orcamentoAtualizado);

      // Processar resposta
      let itensEstruturados = { pecas: [], servicos: [], observacoes: '', motocicleta_placa: null };
      try {
        if (orcamentoAtualizado.descricao) {
          itensEstruturados = JSON.parse(orcamentoAtualizado.descricao);
        }
      } catch (e) {
        itensEstruturados.observacoes = orcamentoAtualizado.descricao || '';
      }

      // Função auxiliar para status
      const getStatusDescricao = (status) => {
        const statusMap = {
          'P': 'Pendente',
          'A': 'Aprovado', 
          'R': 'Rejeitado'
        };
        return statusMap[status] || 'Desconhecido';
      };

      const response = {
        ...orcamentoAtualizado,
        itens_estruturados: itensEstruturados,
        status_descricao: getStatusDescricao(orcamentoAtualizado.status)
      };

      res.json({
        success: true,
        message: 'Orçamento atualizado com sucesso',
        data: response
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

  // Aprovar orçamento (validar e gerar OS automaticamente)
  async validarOrcamento(req, res) {
    try {
      const { id } = req.params;

      console.log(`Iniciando aprovação do orçamento ${id}`);

      // Buscar orçamento completo
      const orcamento = await db.oneOrNone(`
        SELECT 
          o.id,
          o.valor,
          o.validade,
          o.ordem_servico_cod,
          o.cliente_cpf,
          o.status,
          o.descricao,
          c.nome AS cliente_nome,
          c.telefone AS cliente_telefone,
          c.email AS cliente_email
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

      console.log(`Orçamento encontrado:`, orcamento);

      // Verificar se já foi validado/aprovado
      if (orcamento.status === 'A') {
        return res.status(400).json({
          success: false,
          message: 'Orçamento já foi aprovado anteriormente'
        });
      }

      // Se orçamento já tem ordem de serviço, apenas atualizar status
      if (orcamento.ordem_servico_cod) {
        await db.none('UPDATE Orcamento SET status = $1 WHERE id = $2', ['A', id]);
        console.log(`Orçamento ${id} já possuía OS, apenas atualizou status`);
        
        return res.json({
          success: true,
          message: 'Orçamento aprovado com sucesso!',
          data: {
            orcamento_id: id,
            ordem_servico_cod: orcamento.ordem_servico_cod,
            message: 'Orçamento aprovado! Ordem de serviço já existente foi mantida.'
          }
        });
      }

      // Buscar primeira motocicleta do cliente
      const motocicleta = await db.oneOrNone(`
        SELECT placa, modelo, ano, cor 
        FROM Motocicleta 
        WHERE cliente_cpf = $1 
        ORDER BY placa 
        LIMIT 1
      `, [orcamento.cliente_cpf]);

      if (!motocicleta) {
        return res.status(400).json({
          success: false,
          message: 'Cliente não possui motocicleta cadastrada. Cadastre uma motocicleta antes de validar o orçamento.'
        });
      }

      console.log(`Motocicleta selecionada: ${motocicleta.placa}`);

      // Iniciar transação para criar OS
      const resultado = await db.tx(async t => {
        // Usuário padrão (secretária) para criar a OS
        const usuarioPadrao = '111.111.111-11'; // Maria Fernanda - Secretária
        
        // Preparar descrição simplificada com itens do orçamento
        let descricaoCompleta = `ORDEM DE SERVICO GERADA AUTOMATICAMENTE\n`;
        descricaoCompleta += `===============================================\n\n`;
        
        // Adicionar itens do orçamento à descrição (formatados)
        if (orcamento.descricao) {
          try {
            const dadosOrcamento = JSON.parse(orcamento.descricao);
            
            // Adicionar peças
            if (dadosOrcamento.pecas && dadosOrcamento.pecas.length > 0) {
              descricaoCompleta += `PECAS ORCADAS:\n`;
              dadosOrcamento.pecas.forEach((peca, index) => {
                const valorUnitario = parseFloat(peca.valor_unitario || 0).toFixed(2);
                const valorTotal = parseFloat(peca.valor_total || 0).toFixed(2);
                descricaoCompleta += `${index + 1}. ${peca.nome}\n`;
                descricaoCompleta += `   • Quantidade: ${peca.quantidade || 1}\n`;
                descricaoCompleta += `   • Valor Unitario: R$ ${valorUnitario}\n`;
                descricaoCompleta += `   • Valor Total: R$ ${valorTotal}\n\n`;
              });
            }
            
            // Adicionar serviços
            if (dadosOrcamento.servicos && dadosOrcamento.servicos.length > 0) {
              descricaoCompleta += `SERVICOS ORCADOS:\n`;
              dadosOrcamento.servicos.forEach((servico, index) => {
                const valorServico = parseFloat(servico.valor || 0).toFixed(2);
                descricaoCompleta += `${index + 1}. ${servico.descricao}\n`;
                if (servico.valor && servico.valor > 0) {
                  descricaoCompleta += `   • Valor: R$ ${valorServico}\n`;
                }
                descricaoCompleta += `\n`;
              });
            }
            
            // Adicionar observações se houver
            if (dadosOrcamento.observacoes && dadosOrcamento.observacoes.trim()) {
              descricaoCompleta += `OBSERVACOES DO ORCAMENTO:\n`;
              descricaoCompleta += `${dadosOrcamento.observacoes}\n\n`;
            }
            
          } catch (parseError) {
            // Se não conseguir fazer parse do JSON, mostrar como texto simples
            descricaoCompleta += `DADOS DO ORCAMENTO:\n`;
            descricaoCompleta += `${orcamento.descricao}\n\n`;
          }
        }
        
        descricaoCompleta += `OBSERVACOES:\n`;
        descricaoCompleta += `Data de criacao: ${new Date().toLocaleDateString('pt-BR')} as ${new Date().toLocaleTimeString('pt-BR')}\n`;

        // Criar ordem de serviço
        const novaOrdem = await t.one(`
          INSERT INTO Ordem_de_servico (
            titulo, 
            data, 
            descricao, 
            status, 
            observacao, 
            valor,
            validada,
            cliente_cpf, 
            motocicleta_placa
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING *
        `, [
          `OS-ORC-${orcamento.id} - ${orcamento.cliente_nome}`,
          new Date(),
          descricaoCompleta,
          'Em Andamento',
          `Ordem de serviço criada a partir da aprovação do orçamento #${orcamento.id}`,
          parseFloat(orcamento.valor),
          true,
          orcamento.cliente_cpf,
          motocicleta.placa
        ]);

        console.log(`� Nova OS criada com código ${novaOrdem.cod}`);

        // Atualizar orçamento com a nova ordem de serviço e status aprovado
        await t.none(`
          UPDATE Orcamento 
          SET status = $1, ordem_servico_cod = $2 
          WHERE id = $3
        `, ['A', novaOrdem.cod, id]);

        console.log(`Orçamento ${id} aprovado e vinculado à OS ${novaOrdem.cod}`);

        return novaOrdem;
      });

      res.json({
        success: true,
        message: 'Orçamento aprovado e ordem de serviço criada com sucesso!',
        data: {
          orcamento_id: id,
          ordem_servico_cod: resultado.cod,
          motocicleta_placa: motocicleta.placa,
          message: `Ordem de serviço #${resultado.cod} criada automaticamente`
        }
      });

    } catch (error) {
      console.error('Erro ao aprovar orçamento:', error);
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
      const { motivo, observacao } = req.body;

      console.log(`🚫 Iniciando rejeição do orçamento ${id}`);
      console.log('Parâmetros recebidos:', { motivo, observacao });

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

      // Preparar dados da rejeição
      const dadosRejeicao = {
        motivo_rejeicao: motivo || 'Não especificado',
        observacao_rejeicao: observacao || '',
        data_rejeicao: new Date()
      };

      // Atualizar status para rejeitado (não cria ordem de serviço)
      const orcamentoAtualizado = await db.one(`
        UPDATE Orcamento 
        SET 
          status = $1,
          motivo_rejeicao = $2,
          observacao_rejeicao = $3,
          data_rejeicao = $4
        WHERE id = $5 
        RETURNING *
      `, [
        'R', // Status rejeitado
        dadosRejeicao.motivo_rejeicao,
        dadosRejeicao.observacao_rejeicao,
        dadosRejeicao.data_rejeicao,
        id
      ]);

      console.log(`✅ Orçamento ${id} rejeitado com sucesso`);

      res.json({
        success: true,
        message: 'Orçamento rejeitado com sucesso!',
        data: {
          orcamento_id: id,
          motivo: dadosRejeicao.motivo_rejeicao,
          data_rejeicao: dadosRejeicao.data_rejeicao,
          orcamento: orcamentoAtualizado
        }
      });

    } catch (error) {
      console.error('❌ Erro ao rejeitar orçamento:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  // Converter orçamento em ordem de serviço
  async converterParaOrdemServico(req, res) {
    try {
      const { id } = req.params;
      const { usuarioCpf, titulo, observacoesAdicionais } = req.body;

      if (!usuarioCpf) {
        return res.status(400).json({
          success: false,
          message: 'CPF do usuário é obrigatório'
        });
      }

      // Buscar o orçamento
      const orcamento = await db.oneOrNone(`
        SELECT * FROM Orcamento WHERE id = $1 AND status = 'P'
      `, [id]);

      if (!orcamento) {
        return res.status(404).json({
          success: false,
          message: 'Orçamento não encontrado ou não está pendente'
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

      // Parse da descrição estruturada
      let descricaoEstruturada = { pecas: [], servicos: [], observacoes: '', motocicleta_placa: null };
      try {
        if (orcamento.descricao) {
          descricaoEstruturada = JSON.parse(orcamento.descricao);
        }
      } catch (e) {
        console.log('Descrição não é JSON válido, usando valor como texto');
        descricaoEstruturada.observacoes = orcamento.descricao || '';
      }

      // Buscar motocicleta do cliente (se não especificada no orçamento)
      let motocicletaPlaca = descricaoEstruturada.motocicleta_placa;
      if (!motocicletaPlaca) {
        const motoCliente = await db.oneOrNone(`
          SELECT placa FROM Motocicleta WHERE cliente_cpf = $1 LIMIT 1
        `, [orcamento.cliente_cpf]);
        
        if (!motoCliente) {
          return res.status(400).json({
            success: false,
            message: 'Nenhuma motocicleta encontrada para este cliente'
          });
        }
        motocicletaPlaca = motoCliente.placa;
      }

      // Criar descrição da ordem de serviço
      let descricaoOS = '';
      
      // Adicionar serviços à descrição
      if (descricaoEstruturada.servicos && descricaoEstruturada.servicos.length > 0) {
        descricaoOS += 'SERVIÇOS:\n';
        descricaoEstruturada.servicos.forEach(servico => {
          descricaoOS += `- ${servico.descricao} (R$ ${servico.valor.toFixed(2)})\n`;
        });
        descricaoOS += '\n';
      }

      // Adicionar peças à descrição (para referência)
      if (descricaoEstruturada.pecas && descricaoEstruturada.pecas.length > 0) {
        descricaoOS += 'PEÇAS ORÇADAS:\n';
        descricaoEstruturada.pecas.forEach(peca => {
          descricaoOS += `- ${peca.nome} (Qtd: ${peca.quantidade}, Valor: R$ ${peca.valor_unitario.toFixed(2)})\n`;
        });
        descricaoOS += '\n';
      }

      // Adicionar observações
      if (descricaoEstruturada.observacoes) {
        descricaoOS += `OBSERVAÇÕES DO ORÇAMENTO:\n${descricaoEstruturada.observacoes}\n\n`;
      }

      if (observacoesAdicionais) {
        descricaoOS += `OBSERVAÇÕES ADICIONAIS:\n${observacoesAdicionais}`;
      }

      // Criar a ordem de serviço
      const novaOS = await db.one(`
        INSERT INTO Ordem_de_servico (titulo, data, descricao, status, observacao, validada, usuario_cpf, cliente_cpf, motocicleta_placa)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [
        titulo || 'Ordem de Serviço gerada do Orçamento',
        new Date(),
        descricaoOS,
        'Em andamento',
        `Gerado do orçamento #${orcamento.id} - Valor: R$ ${orcamento.valor}`,
        false,
        usuarioCpf,
        orcamento.cliente_cpf,
        motocicletaPlaca
      ]);

      // Atualizar o orçamento com a ordem de serviço gerada
      await db.none(`
        UPDATE Orcamento 
        SET ordem_servico_cod = $1, status = 'A'
        WHERE id = $2
      `, [novaOS.cod, orcamento.id]);

      // Adicionar peças à ordem de serviço (se houver)
      if (descricaoEstruturada.pecas && descricaoEstruturada.pecas.length > 0) {
        for (const peca of descricaoEstruturada.pecas) {
          if (peca.id) {
            // Verificar se a peça existe
            const pecaExiste = await db.oneOrNone('SELECT id FROM Peca WHERE id = $1', [peca.id]);
            if (pecaExiste) {
              await db.none(`
                INSERT INTO Possui_peca (ordem_de_servico_cod, peca_id, qtd_pecas)
                VALUES ($1, $2, $3)
                ON CONFLICT (ordem_de_servico_cod, peca_id) DO UPDATE SET qtd_pecas = $3
              `, [novaOS.cod, peca.id, peca.quantidade]);
            }
          }
        }
      }

      res.json({
        success: true,
        message: 'Orçamento convertido em ordem de serviço com sucesso',
        data: {
          ordem_servico: novaOS,
          orcamento_atualizado: {
            id: orcamento.id,
            status: 'A',
            ordem_servico_cod: novaOS.cod
          }
        }
      });

    } catch (error) {
      console.error('Erro ao converter orçamento para ordem de serviço:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }
}

module.exports = new OrcamentoApiController();