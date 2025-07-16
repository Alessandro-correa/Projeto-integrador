const express = require('express');
const router = express.Router();
const MarcaApiController = require('../controllers/marcaApiController');

// Rotas para marcas
router.post('/', MarcaApiController.create);        
router.get('/', MarcaApiController.listarMarcas);       
router.get('/:id', MarcaApiController.findOne);    
router.put('/:id', MarcaApiController.update);    
router.delete('/:id', MarcaApiController.delete);   

module.exports = router; 
