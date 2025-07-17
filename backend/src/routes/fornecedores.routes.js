const express = require('express');
const router = express.Router();
const fornecedorController = require('../controllers/fornecedorApiController');
const pecaController = require('../controllers/PecaApiController');

/**
 * @swagger
 * tags:
 *   name: Fornecedores
 *   description: Gerenciamento de fornecedores
 */

// Middleware para verificar se os métodos existem
const verifyMethod = (controller, methodName) => (req, res, next) => {
  if (typeof controller[methodName] !== 'function') {
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: `Método ${methodName} não implementado`
    });
  }
  next();
};

/**
 * @swagger
 * /fornecedores:
 *   post:
 *     summary: Criar novo fornecedor
 *     tags: [Fornecedores]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cnpj
 *               - email
 *               - endereco
 *               - telefone
 *               - nome
 *             properties:
 *               cnpj:
 *                 type: string
 *                 description: CNPJ do fornecedor
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email do fornecedor
 *               endereco:
 *                 type: string
 *                 description: Endereço do fornecedor
 *               telefone:
 *                 type: string
 *                 description: Telefone do fornecedor
 *               nome:
 *                 type: string
 *                 description: Nome do fornecedor
 *     responses:
 *       201:
 *         description: Fornecedor criado com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post('/', verifyMethod(fornecedorController, 'create'), (req, res) => {
  return fornecedorController.create(req, res);
});

/**
 * @swagger
 * /fornecedores:
 *   get:
 *     summary: Listar todos os fornecedores
 *     tags: [Fornecedores]
 *     responses:
 *       200:
 *         description: Lista de fornecedores
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   cnpj:
 *                     type: string
 *                   email:
 *                     type: string
 *                   endereco:
 *                     type: string
 *                   telefone:
 *                     type: string
 *                   nome:
 *                     type: string
 */
router.get('/', verifyMethod(fornecedorController, 'findAll'), (req, res) => {
  return fornecedorController.findAll(req, res);
});

/**
 * @swagger
 * /fornecedores/{id}:
 *   get:
 *     summary: Buscar fornecedor por ID
 *     tags: [Fornecedores]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do fornecedor
 *     responses:
 *       200:
 *         description: Fornecedor encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 cnpj:
 *                   type: string
 *                 email:
 *                   type: string
 *                 endereco:
 *                   type: string
 *                 telefone:
 *                   type: string
 *                 nome:
 *                   type: string
 *       404:
 *         description: Fornecedor não encontrado
 */
router.get('/:id', verifyMethod(fornecedorController, 'findOne'), (req, res) => {
  return fornecedorController.findOne(req, res);
});

/**
 * @swagger
 * /fornecedores/{id}:
 *   put:
 *     summary: Atualizar fornecedor
 *     tags: [Fornecedores]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do fornecedor
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cnpj:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               endereco:
 *                 type: string
 *               telefone:
 *                 type: string
 *               nome:
 *                 type: string
 *     responses:
 *       200:
 *         description: Fornecedor atualizado com sucesso
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Fornecedor não encontrado
 */
router.put('/:id', verifyMethod(fornecedorController, 'update'), (req, res) => {
  return fornecedorController.update(req, res);
});

/**
 * @swagger
 * /fornecedores/{id}:
 *   delete:
 *     summary: Excluir fornecedor
 *     tags: [Fornecedores]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do fornecedor
 *     responses:
 *       200:
 *         description: Fornecedor excluído com sucesso
 *       404:
 *         description: Fornecedor não encontrado
 */
router.delete('/:id', verifyMethod(fornecedorController, 'delete'), (req, res) => {
  return fornecedorController.delete(req, res);
});

// Rota para buscar peças por fornecedor
router.get('/:id/pecas', verifyMethod(pecaController, 'findByFornecedor'), (req, res) => {
  
  // Ajusta o parâmetro para corresponder ao esperado pelo controller
  req.params.fornecedorId = req.params.id;
  
  return pecaController.findByFornecedor(req, res);
});

module.exports = router; 
