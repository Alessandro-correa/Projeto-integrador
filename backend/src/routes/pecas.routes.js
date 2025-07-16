const express = require('express');
const router = express.Router();

console.log('[pecas.routes] Iniciando configuração das rotas');

console.log('[pecas.routes] Importando controller');
const controller = require('../controllers/PecaApiController');

console.log('[pecas.routes] Controller importado:', {
  controller: typeof controller,
  methods: {
    create: typeof controller.create,
    findAll: typeof controller.findAll,
    findOne: typeof controller.findOne,
    update: typeof controller.update,
    delete: typeof controller.delete,
    findByFornecedor: typeof controller.findByFornecedor
  }
});

// Middleware para verificar se os métodos existem
const verifyMethod = (methodName) => (req, res, next) => {
  console.log(`[pecas.routes] Verificando método ${methodName}`);
  if (typeof controller[methodName] !== 'function') {
    console.error(`[pecas.routes] ERRO: Método ${methodName} não encontrado no controller`);
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
 * tags:
 *   name: Peças
 *   description: Gerenciamento de peças
 */

console.log('[pecas.routes] Configurando rotas');

/**
 * @swagger
 * /pecas:
 *   post:
 *     summary: Criar nova peça
 *     tags: [Peças]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - descricao
 *               - nome
 *               - valor
 *             properties:
 *               descricao:
 *                 type: string
 *                 description: Descrição detalhada da peça
 *               nome:
 *                 type: string
 *                 description: Nome da peça
 *               valor:
 *                 type: number
 *                 format: float
 *                 description: Valor unitário da peça
 *               forn_id:
 *                 type: integer
 *                 description: ID do fornecedor da peça
 *     responses:
 *       201:
 *         description: Peça criada com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post('/', verifyMethod('create'), (req, res, next) => {
  console.log('[pecas.routes] Chamada POST /');
  return controller.create(req, res, next);
});

/**
 * @swagger
 * /pecas:
 *   get:
 *     summary: Listar todas as peças
 *     tags: [Peças]
 *     responses:
 *       200:
 *         description: Lista de peças
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   descricao:
 *                     type: string
 *                   nome:
 *                     type: string
 *                   valor:
 *                     type: number
 *                   forn_id:
 *                     type: integer
 */
router.get('/', verifyMethod('findAll'), (req, res, next) => {
  console.log('[pecas.routes] Chamada GET /');
  return controller.findAll(req, res, next);
});

/**
 * @swagger
 * /pecas/{id}:
 *   get:
 *     summary: Buscar peça por ID
 *     tags: [Peças]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da peça
 *     responses:
 *       200:
 *         description: Peça encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 descricao:
 *                   type: string
 *                 nome:
 *                   type: string
 *                 valor:
 *                   type: number
 *                 forn_id:
 *                   type: integer
 *       404:
 *         description: Peça não encontrada
 */
router.get('/:id', verifyMethod('findOne'), (req, res, next) => {
  console.log('[pecas.routes] Chamada GET /:id');
  return controller.findOne(req, res, next);
});

/**
 * @swagger
 * /pecas/{id}:
 *   put:
 *     summary: Atualizar peça
 *     tags: [Peças]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da peça
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               descricao:
 *                 type: string
 *               nome:
 *                 type: string
 *               valor:
 *                 type: number
 *                 format: float
 *               forn_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Peça atualizada com sucesso
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Peça não encontrada
 */
router.put('/:id', verifyMethod('update'), (req, res, next) => {
  console.log('[pecas.routes] Chamada PUT /:id');
  return controller.update(req, res, next);
});

/**
 * @swagger
 * /pecas/{id}:
 *   delete:
 *     summary: Excluir peça
 *     tags: [Peças]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da peça
 *     responses:
 *       200:
 *         description: Peça excluída com sucesso
 *       404:
 *         description: Peça não encontrada
 */
router.delete('/:id', verifyMethod('delete'), (req, res, next) => {
  console.log('[pecas.routes] Chamada DELETE /:id');
  return controller.delete(req, res, next);
});

console.log('[pecas.routes] Rotas configuradas');

module.exports = router; 
