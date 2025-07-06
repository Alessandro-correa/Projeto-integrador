const express = require('express');
const router = express.Router();
const OrdemController = require('../controllers/ordem.controller');

// Rotas para ordens de serviço
router.post('/', OrdemController.create);                  
router.get('/', OrdemController.findAll);                  
router.get('/status/:status', OrdemController.findByStatus);
router.get('/:id', OrdemController.findOne);                 
router.put('/:id', OrdemController.update);                
router.delete('/:id', OrdemController.delete);               

module.exports = router; 