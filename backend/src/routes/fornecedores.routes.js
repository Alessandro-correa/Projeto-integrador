const express = require('express');
const router = express.Router();
const FornecedorApiController = require('../controllers/FornecedorApiController');

// Rotas para fornecedores
router.post('/', FornecedorApiController.create);        
router.get('/', FornecedorApiController.findAll);        
router.get('/:id', FornecedorApiController.findOne);     
router.put('/:id', FornecedorApiController.update);     
router.delete('/:id', FornecedorApiController.delete); 

module.exports = router; 
