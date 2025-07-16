const express = require('express');
const router = express.Router();
const MarcaApiController = require('../controllers/marcaApiController');

/**
 * @swagger
 * tags:
 *   name: Marcas
 *   description: Gerenciamento de marcas de motocicletas
 */

/**
 * @swagger
 * /marcas:
 *   post:
 *     summary: Criar nova marca
 *     tags: [Marcas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *             properties:
 *               nome:
 *                 type: string
 *                 description: Nome da marca
 *     responses:
 *       201:
 *         description: Marca criada com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post('/', MarcaApiController.create);

/**
 * @swagger
 * /marcas:
 *   get:
 *     summary: Listar todas as marcas
 *     tags: [Marcas]
 *     responses:
 *       200:
 *         description: Lista de marcas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   nome:
 *                     type: string
 */
router.get('/', MarcaApiController.listarMarcas);

/**
 * @swagger
 * /marcas/{id}:
 *   get:
 *     summary: Buscar marca por ID
 *     tags: [Marcas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da marca
 *     responses:
 *       200:
 *         description: Marca encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 nome:
 *                   type: string
 *       404:
 *         description: Marca não encontrada
 */
router.get('/:id', MarcaApiController.findOne);

/**
 * @swagger
 * /marcas/{id}:
 *   put:
 *     summary: Atualizar marca
 *     tags: [Marcas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da marca
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *             properties:
 *               nome:
 *                 type: string
 *                 description: Nome da marca
 *     responses:
 *       200:
 *         description: Marca atualizada com sucesso
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Marca não encontrada
 */
router.put('/:id', MarcaApiController.update);

/**
 * @swagger
 * /marcas/{id}:
 *   delete:
 *     summary: Excluir marca
 *     tags: [Marcas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da marca
 *     responses:
 *       200:
 *         description: Marca excluída com sucesso
 *       404:
 *         description: Marca não encontrada
 */
router.delete('/:id', MarcaApiController.delete);

module.exports = router; 
