const express = require('express');
const router = express.Router();
const UsuarioApiController = require('../controllers/usuarioApiController');
const { authorizeRoles } = require('../controllers/usuarioApiController');

// Rotas para usuários
router.post('/', authorizeRoles('Administrador'), UsuarioApiController.create);           
router.get('/', authorizeRoles('Administrador'), UsuarioApiController.findAll);           
router.get('/:cpf', authorizeRoles('Administrador'), UsuarioApiController.findOne);      
router.put('/:cpf', authorizeRoles('Administrador'), UsuarioApiController.update);       
router.delete('/:cpf', authorizeRoles('Administrador'), UsuarioApiController.delete);    
router.get('/mecanicos', authorizeRoles('Administrador', 'Secretária'), UsuarioApiController.findMecanicos);

// Rota de login
router.post('/login', (req, res) => UsuarioApiController.login(req, res));

module.exports = router; 