const express = require('express');
const router = express.Router();
const FornecedorController = require('../controllers/fornecedor.controller');

// Rotas para fornecedores
router.post('/', FornecedorController.create);        
router.get('/', FornecedorController.findAll);        
router.get('/:id', FornecedorController.findOne);     
router.put('/:id', FornecedorController.update);     
router.delete('/:id', FornecedorController.delete); 

module.exports = router; 