const express = require('express');
const router = express.Router();
const OrcamentoController = require('../controllers/orcamento.controller');

// Rotas para orçamentos
router.post('/', OrcamentoController.create);        
router.get('/', OrcamentoController.findAll);      
router.get('/:id', OrcamentoController.findOne);   
router.put('/:id', OrcamentoController.update);     
router.delete('/:id', OrcamentoController.delete);   

module.exports = router; 