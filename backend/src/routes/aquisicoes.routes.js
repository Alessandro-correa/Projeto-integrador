const express = require('express');
const router = express.Router();
const AquisicaoApiController = require('../controllers/AquisicaoApiController');

// Rotas para aquisições
router.post('/', AquisicaoApiController.create);       
router.get('/', AquisicaoApiController.findAll);        
router.get('/:id', AquisicaoApiController.findOne);   
router.put('/:id', AquisicaoApiController.update);      
router.delete('/:id', AquisicaoApiController.delete);  

module.exports = router; 
