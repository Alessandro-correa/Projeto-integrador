const express = require('express');
const router = express.Router();
const ClienteApiController = require('../controllers/clienteApiController');

/**
 * @swagger
 * tags:
 *   name: Clientes
 *   description: Gerenciamento de clientes
 */

/**
 * @swagger
 * /clientes:
 *   post:
 *     summary: Cadastrar cliente
 *     tags: [Clientes]
 *     responses:
 *       201:
 *         description: Cliente criado
 */
router.post('/', ClienteApiController.create);

/**
 * @swagger
 * /clientes/check-email:
 *   post:
 *     summary: Verifica se email já existe
 *     tags: [Clientes]
 *     responses:
 *       200:
 *         description: Resultado da verificação
 */
router.post('/check-email', ClienteApiController.checkEmail);

/**
 * @swagger
 * /clientes:
 *   get:
 *     summary: Listar clientes
 *     tags: [Clientes]
 *     responses:
 *       200:
 *         description: Lista de clientes
 */
router.get('/', ClienteApiController.findAll);

/**
 * @swagger
 * /clientes/{cpf}:
 *   get:
 *     summary: Buscar cliente por CPF
 *     tags: [Clientes]
 *     parameters:
 *       - in: path
 *         name: cpf
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cliente encontrado
 *       404:
 *         description: Não encontrado
 */
router.get('/:cpf', ClienteApiController.findOne);

/**
 * @swagger
 * /clientes/{cpf}:
 *   put:
 *     summary: Atualizar cliente
 *     tags: [Clientes]
 *     parameters:
 *       - in: path
 *         name: cpf
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cliente atualizado
 *       404:
 *         description: Não encontrado
 */
router.put('/:cpf', ClienteApiController.update);

/**
 * @swagger
 * /clientes/{cpf}:
 *   delete:
 *     summary: Remover cliente
 *     tags: [Clientes]
 *     parameters:
 *       - in: path
 *         name: cpf
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cliente removido
 *       404:
 *         description: Não encontrado
 */
router.delete('/:cpf', ClienteApiController.delete);

module.exports = router;