const express = require('express');
const router = express.Router();
const DashboardApiController = require('../controllers/DashboardApiController');

// Rota para estatísticas gerais
router.get('/stats', DashboardApiController.getStats);

// Rotas para gráficos específicos
router.get('/servicos-mes', DashboardApiController.getServicosChart);
router.get('/tipos-servicos', DashboardApiController.getTiposServicosChart);
router.get('/servicos-moto', DashboardApiController.getServicosPorMotoChart);
router.get('/taxa-retorno', DashboardApiController.getTaxaRetornoChart);

// Rota para todos os dados consolidados
router.get('/charts', DashboardApiController.getAllChartData);

module.exports = router;
