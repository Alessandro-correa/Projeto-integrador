const express = require('express');
const router = express.Router();
const ClienteController = require('../controllers/cliente.controller');

// Rotas para clientes
router.post('/', ClienteController.create);         
router.get('/', ClienteController.findAll);          
router.get('/:cpf', ClienteController.findOne);      
router.put('/:cpf', ClienteController.update);        
router.delete('/:cpf', ClienteController.delete);    

module.exports = router; 