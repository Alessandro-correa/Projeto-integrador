const express = require('express');
const router = express.Router();
const OrcamentoApiController = require('../controllers/OrcamentoApiController');
const { authorizeRoles } = require('../controllers/UsuarioApiController');

// Rotas para orçamentos
router.post('/', authorizeRoles('Administrador', 'Secretária', 'Mecânico'), OrcamentoApiController.create);        
router.get('/', authorizeRoles('Administrador', 'Secretária', 'Mecânico'), OrcamentoApiController.findAll);      
router.get('/:id', authorizeRoles('Administrador', 'Secretária', 'Mecânico'), OrcamentoApiController.findOne);   
router.put('/:id', authorizeRoles('Administrador', 'Secretária', 'Mecânico'), OrcamentoApiController.update);     
router.delete('/:id', authorizeRoles('Administrador', 'Secretária', 'Mecânico'), OrcamentoApiController.delete);   

// Rotas específicas para ações
router.post('/:id/validar', authorizeRoles('Administrador', 'Secretária', 'Mecânico'), OrcamentoApiController.validarOrcamento);
router.post('/:id/rejeitar', authorizeRoles('Administrador', 'Secretária', 'Mecânico'), OrcamentoApiController.rejeitarOrcamento);
router.post('/:id/converter-os', authorizeRoles('Administrador', 'Secretária', 'Mecânico'), OrcamentoApiController.converterParaOrdemServico);

module.exports = router; 