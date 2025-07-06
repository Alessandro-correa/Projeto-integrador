const express = require('express');
const router = express.Router();
const PecaController = require('../controllers/peca.controller');

// Rotas para peças
router.post('/', PecaController.create);       
router.get('/', PecaController.findAll);      
router.get('/:id', PecaController.findOne);    
router.put('/:id', PecaController.update);      
router.delete('/:id', PecaController.delete); 

module.exports = router; 