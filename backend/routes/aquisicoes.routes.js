const express = require('express');
const router = express.Router();
const AquisicaoController = require('../controllers/aquisicao.controller');

// Rotas para aquisições
router.post('/', AquisicaoController.create);       
router.get('/', AquisicaoController.findAll);        
router.get('/:id', AquisicaoController.findOne);   
router.put('/:id', AquisicaoController.update);      
router.delete('/:id', AquisicaoController.delete);  

module.exports = router; 