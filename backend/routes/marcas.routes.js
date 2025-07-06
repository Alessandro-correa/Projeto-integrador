const express = require('express');
const router = express.Router();
const MarcaController = require('../controllers/marca.controller');

// Rotas para marcas
router.post('/', MarcaController.create);        
router.get('/', MarcaController.findAll);       
router.get('/:id', MarcaController.findOne);    
router.put('/:id', MarcaController.update);    
router.delete('/:id', MarcaController.delete);   

module.exports = router; 