const express = require('express');
const router = express.Router();
const DashboardApiController = require('../controllers/dashboardApiController');
const { authorizeRoles } = require('../controllers/usuarioApiController');

// Rota para estatísticas gerais
router.get('/stats', authorizeRoles('Administrador'), DashboardApiController.getStats);

// Rotas para gráficos específicos
router.get('/servicos-mes', authorizeRoles('Administrador'), DashboardApiController.getServicosChart);
router.get('/tipos-servicos', authorizeRoles('Administrador'), DashboardApiController.getTiposServicosChart);
router.get('/servicos-moto', authorizeRoles('Administrador'), DashboardApiController.getServicosPorMotoChart);
router.get('/taxa-retorno', authorizeRoles('Administrador'), DashboardApiController.getTaxaRetornoChart);

// Rota para todos os dados consolidados
router.get('/charts', authorizeRoles('Administrador'), DashboardApiController.getAllChartData);

module.exports = router;
