const express = require('express');
const router = express.Router();
const UsuarioApiController = require('../controllers/UsuarioApiController');

// Rotas para usuários
router.post('/', UsuarioApiController.create);           
router.get('/', UsuarioApiController.findAll);           
router.get('/:cpf', UsuarioApiController.findOne);      
router.put('/:cpf', UsuarioApiController.update);       
router.delete('/:cpf', UsuarioApiController.delete);    

module.exports = router; 