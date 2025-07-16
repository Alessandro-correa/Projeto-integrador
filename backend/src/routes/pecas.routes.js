const express = require('express');
const router = express.Router();
const PecaApiController = require('../controllers/pecaApiController');

/**
 * @swagger
 * tags:
 *   name: Peças
 *   description: Gerenciamento de peças
 */

/**
 * @swagger
 * /pecas:
 *   post:
 *     summary: Cria uma nova peça
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
 *               - fornecedor
 *             properties:
 *               descricao:
 *                 type: string
 *               nome:
 *                 type: string
 *               valor:
 *                 type: number
 *               fornecedor:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Peça criada com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post('/', PecaApiController.create);

/**
 * @swagger
 * /pecas:
 *   get:
 *     summary: Lista todas as peças
 *     tags: [Peças]
 *     responses:
 *       200:
 *         description: Lista de peças
 */
router.get('/', PecaApiController.findAll);

/**
 * @swagger
 * /pecas/{id}:
 *   get:
 *     summary: Busca uma peça pelo ID
 *     tags: [Peças]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Peça encontrada
 *       404:
 *         description: Peça não encontrada
 */
router.get('/:id', PecaApiController.findOne);

/**
 * @swagger
 * /pecas/{id}:
 *   put:
 *     summary: Atualiza uma peça existente
 *     tags: [Peças]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
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
 *               fornecedor:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Peça atualizada com sucesso
 *       404:
 *         description: Peça não encontrada
 */
router.put('/:id', PecaApiController.update);

/**
 * @swagger
 * /pecas/{id}:
 *   delete:
 *     summary: Remove uma peça pelo ID
 *     tags: [Peças]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Peça removida com sucesso
 *       404:
 *         description: Peça não encontrada
 */
router.delete('/:id', PecaApiController.delete);

module.exports = router; 
