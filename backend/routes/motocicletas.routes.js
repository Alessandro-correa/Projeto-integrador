const express = require('express');
const router = express.Router();
const MotocicletaController = require('../controllers/motocicleta.controller');

// Rotas para motocicletas
router.post('/', MotocicletaController.create);                    // Criar motocicleta
router.get('/', MotocicletaController.findAll);                    // Listar todas as motocicletas
router.get('/cliente/:clienteCpf', MotocicletaController.findByCliente); // Buscar motocicletas por cliente
router.get('/:placa', MotocicletaController.findOne);              // Buscar motocicleta por placa
router.put('/:placa', MotocicletaController.update);               // Atualizar motocicleta
router.delete('/:placa', MotocicletaController.delete);            // Remover motocicleta

module.exports = router; 