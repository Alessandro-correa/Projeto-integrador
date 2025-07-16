const express = require('express');
const router = express.Router();
const OrdemServicoApiController = require('../controllers/ordemServicoApiController');
const { authorizeRoles } = require('../controllers/UsuarioApiController');

// Rotas para ordens de serviço
router.post('/', authorizeRoles('Administrador', 'Secretária', 'Mecânico'), OrdemServicoApiController.create);                  
router.get('/', authorizeRoles('Administrador', 'Secretária', 'Mecânico'), OrdemServicoApiController.findAll);                  
router.get('/status/:status', authorizeRoles('Administrador', 'Secretária', 'Mecânico'), OrdemServicoApiController.findByStatus);
router.get('/:id', authorizeRoles('Administrador', 'Secretária', 'Mecânico'), OrdemServicoApiController.findOne);
router.post('/pecas', authorizeRoles('Administrador', 'Secretária', 'Mecânico'), OrdemServicoApiController.addPeca);
router.get('/:id/pecas', authorizeRoles('Administrador', 'Secretária', 'Mecânico'), OrdemServicoApiController.findPecas);
router.get('/:id/valor-total', authorizeRoles('Administrador', 'Secretária', 'Mecânico'), OrdemServicoApiController.calcularValorTotal);
router.put('/:id', authorizeRoles('Administrador', 'Secretária', 'Mecânico'), OrdemServicoApiController.update);
router.patch('/:id/status', authorizeRoles('Administrador', 'Secretária', 'Mecânico'), OrdemServicoApiController.updateStatus);               
router.delete('/:id', authorizeRoles('Administrador', 'Secretária', 'Mecânico'), OrdemServicoApiController.delete);               

module.exports = router; 