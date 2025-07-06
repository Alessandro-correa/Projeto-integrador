const express = require('express');
const router = express.Router();
const PecaController = require('../controllers/peca.controller');

// Rotas para peças
router.post('/', PecaController.create);        // Criar peça
router.get('/', PecaController.findAll);        // Listar todas as peças
router.get('/:id', PecaController.findOne);     // Buscar peça por ID
router.put('/:id', PecaController.update);      // Atualizar peça
router.delete('/:id', PecaController.delete);   // Remover peça

module.exports = router; 