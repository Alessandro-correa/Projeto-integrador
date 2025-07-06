const express = require('express');
const router = express.Router();
const UsuarioController = require('../controllers/usuario.controller');

// Rotas para usuários
router.post('/', UsuarioController.create);           
router.get('/', UsuarioController.findAll);           
router.get('/:cpf', UsuarioController.findOne);      
router.put('/:cpf', UsuarioController.update);       
router.delete('/:cpf', UsuarioController.delete);    

module.exports = router; 