const express = require('express');
const router = express.Router();
const ClienteApiController = require('../controllers/ClienteApiController');

// Rotas para clientes
router.post('/', ClienteApiController.create);
router.get('/', ClienteApiController.findAll);
router.get('/:cpf', ClienteApiController.findOne);
router.put('/:cpf', ClienteApiController.update);
router.delete('/:cpf', ClienteApiController.delete);

module.exports = router; 