const express = require('express');
const router = express.Router();
const OrcamentoController = require('../controllers/orcamento.controller');

// Rotas para orçamentos
router.post('/', OrcamentoController.create);        // Criar orçamento
router.get('/', OrcamentoController.findAll);        // Listar todos os orçamentos
router.get('/:id', OrcamentoController.findOne);     // Buscar orçamento por ID
router.put('/:id', OrcamentoController.update);      // Atualizar orçamento
router.delete('/:id', OrcamentoController.delete);   // Remover orçamento

module.exports = router; 