const express = require('express');
const router = express.Router();
const PecaApiController = require('../controllers/PecaApiController');

// Rotas para peças
router.post('/', PecaApiController.create);       
router.get('/', PecaApiController.findAll);      
router.get('/:id', PecaApiController.findOne);    
router.put('/:id', PecaApiController.update);      
router.delete('/:id', PecaApiController.delete); 

module.exports = router; 
