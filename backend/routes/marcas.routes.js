const express = require('express');
const router = express.Router();
const MarcaController = require('../controllers/marca.controller');

// Rotas para marcas
router.post('/', MarcaController.create);        // Criar marca
router.get('/', MarcaController.findAll);        // Listar todas as marcas
router.get('/:id', MarcaController.findOne);     // Buscar marca por ID
router.put('/:id', MarcaController.update);      // Atualizar marca
router.delete('/:id', MarcaController.delete);   // Remover marca

module.exports = router; 