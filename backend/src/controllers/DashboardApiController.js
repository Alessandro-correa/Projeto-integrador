const db = require('../config/database');

// Obter estatísticas gerais do dashboard
async function getStats(req, res) {
  try {
    // Total de serviços no mês atual
    const servicosNoMes = await db.one(`
      SELECT COUNT(*) as total
      FROM Ordem_de_servico 
      WHERE EXTRACT(MONTH FROM data) = EXTRACT(MONTH FROM CURRENT_DATE)
      AND EXTRACT(YEAR FROM data) = EXTRACT(YEAR FROM CURRENT_DATE)
    `);

    // Total geral de serviços
    const totalServicos = await db.one(`
      SELECT COUNT(*) as total FROM Ordem_de_servico
    `);

    // Orçamentos pendentes (status P)
    const orcamentosPendentes = await db.one(`
      SELECT COUNT(*) as total 
      FROM Orcamento 
      WHERE status = 'P'
    `);

    // Motos em manutenção/atendimento (todos os status não finalizados)
    const motosEmManutencao = await db.one(`
      SELECT COUNT(*) as total 
      FROM Ordem_de_servico 
      WHERE status IN ('Em Andamento', 'Ajuste Pendente', 'Validação Pendente')
    `);

    // Taxa de retorno (serviços que foram para ajuste)
    const servicosComAjuste = await db.one(`
      SELECT COUNT(*) as total
      FROM Ordem_de_servico 
      WHERE status = 'Ajuste Pendente'
      AND EXTRACT(MONTH FROM data) = EXTRACT(MONTH FROM CURRENT_DATE)
      AND EXTRACT(YEAR FROM data) = EXTRACT(YEAR FROM CURRENT_DATE)
    `);

    const taxaRetorno = servicosNoMes.total > 0 
      ? Math.round((servicosComAjuste.total / servicosNoMes.total) * 100)
      : 0;

    const stats = {
      totalServicos: parseInt(totalServicos.total),
      servicosNoMes: parseInt(servicosNoMes.total),
      crescimentoMensal: 5, // Valor de exemplo
      orcamentosPendentes: parseInt(orcamentosPendentes.total),
      motosEmManutencao: parseInt(motosEmManutencao.total),
      taxaRetorno
    };
    
    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Erro ao obter estatísticas do dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
}

// Gráfico de serviços por mês
async function getServicosChart(req, res) {
  try {
    const data = await db.any(`
      SELECT 
        TO_CHAR(data, 'MM/YYYY') as mes,
        COUNT(*) as total
      FROM Ordem_de_servico 
      WHERE data >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY TO_CHAR(data, 'MM/YYYY'), TO_CHAR(data, 'YYYY-MM')
      ORDER BY TO_CHAR(data, 'YYYY-MM')
    `);

    res.json({
      success: true,
      data: data.map(item => ({
        mes: item.mes,
        total: parseInt(item.total)
      }))
    });

  } catch (error) {
    console.error('Erro ao obter dados do gráfico de serviços:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
}

// Gráfico de tipos de serviços
async function getTiposServicosChart(req, res) {
  try {
    const data = await db.any(`
      SELECT 
        CASE 
          WHEN LOWER(descricao) LIKE '%oleo%' THEN 'Troca de Óleo'
          WHEN LOWER(descricao) LIKE '%revisao%' THEN 'Revisão'
          WHEN LOWER(descricao) LIKE '%freio%' THEN 'Sistema de Freios'
          WHEN LOWER(descricao) LIKE '%pneu%' THEN 'Pneus/Rodas'
          ELSE 'Outros'
        END as tipo,
        COUNT(*) as total
      FROM Ordem_de_servico 
      WHERE data >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY 
        CASE 
          WHEN LOWER(descricao) LIKE '%oleo%' THEN 'Troca de Óleo'
          WHEN LOWER(descricao) LIKE '%revisao%' THEN 'Revisão'
          WHEN LOWER(descricao) LIKE '%freio%' THEN 'Sistema de Freios'
          WHEN LOWER(descricao) LIKE '%pneu%' THEN 'Pneus/Rodas'
          ELSE 'Outros'
        END
      ORDER BY COUNT(*) DESC
    `);

    res.json({
      success: true,
      data: data.map(item => ({
        tipo: item.tipo,
        total: parseInt(item.total)
      }))
    });

  } catch (error) {
    console.error('Erro ao obter dados do gráfico de tipos de serviços:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
}

// Gráfico de serviços por marca de motocicleta
async function getServicosPorMotoChart(req, res) {
  try {
    const data = await db.any(`
      SELECT 
        m.nome as marca,
        COUNT(os.*) as total
      FROM Ordem_de_servico os
      JOIN Motocicleta moto ON os.motocicleta_placa = moto.placa
      JOIN Marca m ON moto.placa = m.motocicleta_placa
      WHERE os.data >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY m.nome
      ORDER BY COUNT(os.*) DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      data: data.map(item => ({
        marca: item.marca,
        total: parseInt(item.total)
      }))
    });

  } catch (error) {
    console.error('Erro ao obter dados do gráfico de serviços por moto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
}

// Gráfico de taxa de retorno por mês
async function getTaxaRetornoChart(req, res) {
  try {
    const data = await db.any(`
      SELECT 
        TO_CHAR(data, 'MM/YYYY') as mes,
        COUNT(*) as total_servicos,
        COUNT(CASE WHEN status = 'Ajuste Pendente' THEN 1 END) as servicos_retorno,
        CASE 
          WHEN COUNT(*) > 0 THEN 
            ROUND((COUNT(CASE WHEN status = 'Ajuste Pendente' THEN 1 END)::NUMERIC / COUNT(*)) * 100, 1)
          ELSE 0 
        END as taxa_retorno
      FROM Ordem_de_servico 
      WHERE data >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY TO_CHAR(data, 'MM/YYYY'), TO_CHAR(data, 'YYYY-MM')
      ORDER BY TO_CHAR(data, 'YYYY-MM')
    `);

    res.json({
      success: true,
      data: data.map(item => ({
        mes: item.mes,
        taxa_retorno: parseFloat(item.taxa_retorno)
      }))
    });

  } catch (error) {
    console.error('Erro ao obter dados do gráfico de taxa de retorno:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
}

// Obter todos os dados dos gráficos
async function getAllChartData(req, res) {
  try {
    // Serviços por mês
    const servicosPorMes = await db.any(`
      SELECT 
        TO_CHAR(data, 'MM/YYYY') as mes,
        COUNT(*) as total
      FROM Ordem_de_servico 
      WHERE data >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY TO_CHAR(data, 'MM/YYYY'), TO_CHAR(data, 'YYYY-MM')
      ORDER BY TO_CHAR(data, 'YYYY-MM')
    `);
    
    // Tipos de serviços
    const tiposServicos = await db.any(`
      SELECT 
        CASE 
          WHEN LOWER(descricao) LIKE '%oleo%' THEN 'Troca de Óleo'
          WHEN LOWER(descricao) LIKE '%revisao%' THEN 'Revisão'
          WHEN LOWER(descricao) LIKE '%freio%' THEN 'Sistema de Freios'
          WHEN LOWER(descricao) LIKE '%pneu%' THEN 'Pneus/Rodas'
          ELSE 'Outros'
        END as tipo,
        COUNT(*) as total
      FROM Ordem_de_servico 
      WHERE data >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY 
        CASE 
          WHEN LOWER(descricao) LIKE '%oleo%' THEN 'Troca de Óleo'
          WHEN LOWER(descricao) LIKE '%revisao%' THEN 'Revisão'
          WHEN LOWER(descricao) LIKE '%freio%' THEN 'Sistema de Freios'
          WHEN LOWER(descricao) LIKE '%pneu%' THEN 'Pneus/Rodas'
          ELSE 'Outros'
        END
      ORDER BY COUNT(*) DESC
    `);
    
    // Serviços por marca de moto
    const servicosPorMoto = await db.any(`
      SELECT 
        m.nome as marca,
        COUNT(os.*) as total
      FROM Ordem_de_servico os
      JOIN Motocicleta moto ON os.motocicleta_placa = moto.placa
      JOIN Marca m ON moto.placa = m.motocicleta_placa
      WHERE os.data >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY m.nome
      ORDER BY COUNT(os.*) DESC
      LIMIT 10
    `);
    
    // Taxa de retorno
    const taxaRetorno = await db.any(`
      SELECT 
        TO_CHAR(data, 'MM/YYYY') as mes,
        COUNT(*) as total_servicos,
        COUNT(CASE WHEN status = 'Ajuste Pendente' THEN 1 END) as servicos_retorno,
        CASE 
          WHEN COUNT(*) > 0 THEN 
            ROUND((COUNT(CASE WHEN status = 'Ajuste Pendente' THEN 1 END)::NUMERIC / COUNT(*)) * 100, 1)
          ELSE 0 
        END as taxa_retorno
      FROM Ordem_de_servico 
      WHERE data >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY TO_CHAR(data, 'MM/YYYY'), TO_CHAR(data, 'YYYY-MM')
      ORDER BY TO_CHAR(data, 'YYYY-MM')
    `);

    res.json({
      success: true,
      data: {
        servicosPorMes: servicosPorMes.map(item => ({
          mes: item.mes,
          total: parseInt(item.total)
        })),
        tiposServicos: tiposServicos.map(item => ({
          tipo: item.tipo,
          total: parseInt(item.total)
        })),
        servicosPorMoto: servicosPorMoto.map(item => ({
          marca: item.marca,
          total: parseInt(item.total)
        })),
        taxaRetorno: taxaRetorno.map(item => ({
          mes: item.mes,
          taxa_retorno: parseFloat(item.taxa_retorno)
        }))
      }
    });

  } catch (error) {
    console.error('Erro ao obter todos os dados dos gráficos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
}

module.exports = {
  getStats,
  getServicosChart,
  getTiposServicosChart,
  getServicosPorMotoChart,
  getTaxaRetornoChart,
  getAllChartData
};
