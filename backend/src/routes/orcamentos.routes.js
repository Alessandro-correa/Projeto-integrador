const express = require('express');
const router = express.Router();
const OrcamentoApiController = require('../controllers/OrcamentoApiController');

// Rotas para orçamentos
router.post('/', OrcamentoApiController.create);        
router.get('/', OrcamentoApiController.findAll);      
router.get('/:id', OrcamentoApiController.findOne);   
router.put('/:id', OrcamentoApiController.update);     
router.delete('/:id', OrcamentoApiController.delete);   

// Rotas específicas para ações
router.post('/:id/validar', OrcamentoApiController.validarOrcamento);
router.post('/:id/rejeitar', OrcamentoApiController.rejeitarOrcamento);
router.post('/:id/converter-os', OrcamentoApiController.converterParaOrdemServico);

module.exports = router; 