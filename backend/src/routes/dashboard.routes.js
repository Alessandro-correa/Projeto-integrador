const express = require('express');
const router = express.Router();
const DashboardApiController = require('../controllers/dashboardApiController');
const { authorizeRoles } = require('../controllers/usuarioApiController');

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Estatísticas e métricas do sistema
 */

/**
 * @swagger
 * /dashboard/stats:
 *   get:
 *     summary: Obter estatísticas gerais
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estatísticas obtidas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalClientes:
 *                   type: integer
 *                   description: Total de clientes cadastrados
 *                 totalMotocicletas:
 *                   type: integer
 *                   description: Total de motocicletas cadastradas
 *                 totalOrdensServico:
 *                   type: integer
 *                   description: Total de ordens de serviço
 *                 totalOrcamentos:
 *                   type: integer
 *                   description: Total de orçamentos
 *                 faturamentoMensal:
 *                   type: number
 *                   format: float
 *                   description: Faturamento do mês atual
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 */
router.get('/stats', authorizeRoles('Administrador'), DashboardApiController.getStats);

// Rotas para gráficos específicos
router.get('/servicos-mes', authorizeRoles('Administrador'), DashboardApiController.getServicosChart);
router.get('/tipos-servicos', authorizeRoles('Administrador'), DashboardApiController.getTiposServicosChart);
router.get('/servicos-moto', authorizeRoles('Administrador'), DashboardApiController.getServicosPorMotoChart);
router.get('/taxa-retorno', authorizeRoles('Administrador'), DashboardApiController.getTaxaRetornoChart);

// Rota para todos os dados consolidados
router.get('/charts', authorizeRoles('Administrador'), DashboardApiController.getAllChartData);

module.exports = router;
