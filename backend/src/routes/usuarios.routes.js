const express = require('express');
const router = express.Router();
const UsuarioApiController = require('../controllers/UsuarioApiController');
const { authorizeRoles } = require('../controllers/UsuarioApiController');

/**
 * @swagger
 * tags:
 *   name: Usuários
 *   description: Gerenciamento de usuários do sistema
 */

/**
 * @swagger
 * /usuarios:
 *   post:
 *     summary: Criar novo usuário
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cpf
 *               - nome
 *               - funcao
 *               - senha
 *               - email
 *               - telefone
 *               - codigo
 *             properties:
 *               cpf:
 *                 type: string
 *                 description: CPF do usuário
 *               nome:
 *                 type: string
 *                 description: Nome completo do usuário
 *               funcao:
 *                 type: string
 *                 enum: [Administrador, Secretária, Mecânico]
 *                 description: Função do usuário no sistema
 *               senha:
 *                 type: string
 *                 description: Senha do usuário
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email do usuário
 *               telefone:
 *                 type: string
 *                 description: Telefone do usuário
 *               codigo:
 *                 type: string
 *                 description: Código único do usuário
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 */
router.post('/', authorizeRoles('Administrador'), UsuarioApiController.create);

/**
 * @swagger
 * /usuarios:
 *   get:
 *     summary: Listar todos os usuários
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuários
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   cpf:
 *                     type: string
 *                   nome:
 *                     type: string
 *                   funcao:
 *                     type: string
 *                   email:
 *                     type: string
 *                   telefone:
 *                     type: string
 *                   codigo:
 *                     type: string
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 */
router.get('/', authorizeRoles('Administrador'), UsuarioApiController.findAll);

/**
 * @swagger
 * /usuarios/mecanicos:
 *   get:
 *     summary: Listar todos os mecânicos
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de mecânicos
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 */
router.get('/mecanicos/list', authorizeRoles('Administrador', 'Secretária'), UsuarioApiController.findMecanicos);

// Rota de debug (temporária)
router.get('/debug/:cpf', UsuarioApiController.debugUser);

/**
 * @swagger
 * /usuarios/{cpf}:
 *   get:
 *     summary: Buscar usuário por CPF
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cpf
 *         required: true
 *         schema:
 *           type: string
 *         description: CPF do usuário
 *     responses:
 *       200:
 *         description: Dados do usuário
 *       404:
 *         description: Usuário não encontrado
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 */
router.get('/:cpf', authorizeRoles('Administrador'), UsuarioApiController.findOne);

/**
 * @swagger
 * /usuarios/{cpf}:
 *   put:
 *     summary: Atualizar usuário
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cpf
 *         required: true
 *         schema:
 *           type: string
 *         description: CPF do usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *               - funcao
 *               - email
 *               - telefone
 *               - codigo
 *             properties:
 *               nome:
 *                 type: string
 *               funcao:
 *                 type: string
 *                 enum: [Administrador, Secretária, Mecânico]
 *               email:
 *                 type: string
 *                 format: email
 *               telefone:
 *                 type: string
 *               codigo:
 *                 type: string
 *               senha:
 *                 type: string
 *                 description: Nova senha (opcional)
 *     responses:
 *       200:
 *         description: Usuário atualizado com sucesso
 *       404:
 *         description: Usuário não encontrado
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 */
router.put('/:cpf', authorizeRoles('Administrador'), UsuarioApiController.update);

/**
 * @swagger
 * /usuarios/{cpf}:
 *   delete:
 *     summary: Remover usuário
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cpf
 *         required: true
 *         schema:
 *           type: string
 *         description: CPF do usuário
 *     responses:
 *       200:
 *         description: Usuário removido com sucesso
 *       404:
 *         description: Usuário não encontrado
 *       400:
 *         description: Não é possível remover usuário com ordens vinculadas
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 */
router.delete('/:cpf', authorizeRoles('Administrador'), UsuarioApiController.delete);

/**
 * @swagger
 * /usuarios/login:
 *   post:
 *     summary: Autenticar usuário
 *     tags: [Usuários]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - senha
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email do usuário
 *               senha:
 *                 type: string
 *                 description: Senha do usuário
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: Token JWT para autenticação
 *                 user:
 *                   type: object
 *                   properties:
 *                     nome:
 *                       type: string
 *                     funcao:
 *                       type: string
 *       401:
 *         description: Credenciais inválidas
 *       400:
 *         description: Dados inválidos
 */
router.post('/login', (req, res) => UsuarioApiController.login(req, res));

module.exports = router; 