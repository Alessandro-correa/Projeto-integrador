const express = require('express');
const router = express.Router();
const FornecedorController = require('../controllers/fornecedor.controller');

// Rotas para fornecedores
router.post('/', FornecedorController.create);        // Criar fornecedor
router.get('/', FornecedorController.findAll);        // Listar todos os fornecedores
router.get('/:id', FornecedorController.findOne);     // Buscar fornecedor por ID
router.put('/:id', FornecedorController.update);      // Atualizar fornecedor
router.delete('/:id', FornecedorController.delete);   // Remover fornecedor

module.exports = router; 