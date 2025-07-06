const express = require('express');
const router = express.Router();
const UsuarioController = require('../controllers/usuario.controller');

// Rotas para usuários
router.post('/', UsuarioController.create);           // Criar usuário
router.get('/', UsuarioController.findAll);           // Listar todos os usuários
router.get('/:cpf', UsuarioController.findOne);       // Buscar usuário por CPF
router.put('/:cpf', UsuarioController.update);        // Atualizar usuário
router.delete('/:cpf', UsuarioController.delete);     // Remover usuário

module.exports = router; 