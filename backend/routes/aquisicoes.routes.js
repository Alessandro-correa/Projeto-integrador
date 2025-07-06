const express = require('express');
const router = express.Router();
const AquisicaoController = require('../controllers/aquisicao.controller');

// Rotas para aquisições
router.post('/', AquisicaoController.create);        // Criar aquisição
router.get('/', AquisicaoController.findAll);        // Listar todas as aquisições
router.get('/:id', AquisicaoController.findOne);     // Buscar aquisição por ID
router.put('/:id', AquisicaoController.update);      // Atualizar aquisição
router.delete('/:id', AquisicaoController.delete);   // Remover aquisição

module.exports = router; 