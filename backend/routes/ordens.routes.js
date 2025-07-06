const express = require('express');
const router = express.Router();
const OrdemController = require('../controllers/ordem.controller');

// Rotas para ordens de serviço
router.post('/', OrdemController.create);                    // Criar ordem de serviço
router.get('/', OrdemController.findAll);                    // Listar todas as ordens
router.get('/status/:status', OrdemController.findByStatus); // Buscar ordens por status
router.get('/:id', OrdemController.findOne);                 // Buscar ordem por ID
router.put('/:id', OrdemController.update);                  // Atualizar ordem
router.delete('/:id', OrdemController.delete);               // Remover ordem

module.exports = router; 