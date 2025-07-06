const express = require('express');
const router = express.Router();
const ClienteController = require('../controllers/cliente.controller');

// Rotas para clientes
router.post('/', ClienteController.create);           // Criar cliente
router.get('/', ClienteController.findAll);           // Listar todos os clientes
router.get('/:cpf', ClienteController.findOne);       // Buscar cliente por CPF
router.put('/:cpf', ClienteController.update);        // Atualizar cliente
router.delete('/:cpf', ClienteController.delete);     // Remover cliente

module.exports = router; 