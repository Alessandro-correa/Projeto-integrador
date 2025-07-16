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
 *     summary: Criar novo cliente
 *     tags: [Clientes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cpf
 *               - nome
 *               - sexo
 *               - endereco
 *               - telefone
 *               - email
 *               - profissao
 *               - data_de_nascimento
 *             properties:
 *               cpf:
 *                 type: string
 *                 description: CPF do cliente
 *               nome:
 *                 type: string
 *                 description: Nome completo do cliente
 *               sexo:
 *                 type: string
 *                 enum: [Masculino, Feminino]
 *                 description: Sexo do cliente
 *               endereco:
 *                 type: string
 *                 description: Endereço completo do cliente
 *               telefone:
 *                 type: string
 *                 description: Telefone do cliente
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email do cliente
 *               profissao:
 *                 type: string
 *                 description: Profissão do cliente
 *               data_de_nascimento:
 *                 type: string
 *                 format: date
 *                 description: Data de nascimento do cliente (DD/MM/YYYY)
 *     responses:
 *       201:
 *         description: Cliente criado com sucesso
 *       400:
 *         description: Dados inválidos
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
 *     summary: Listar todos os clientes
 *     tags: [Clientes]
 *     responses:
 *       200:
 *         description: Lista de clientes
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
 *                   sexo:
 *                     type: string
 *                   endereco:
 *                     type: string
 *                   telefone:
 *                     type: string
 *                   email:
 *                     type: string
 *                   profissao:
 *                     type: string
 *                   data_de_nascimento:
 *                     type: string
 *                     format: date
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
 *         description: CPF do cliente
 *     responses:
 *       200:
 *         description: Cliente encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cpf:
 *                   type: string
 *                 nome:
 *                   type: string
 *                 sexo:
 *                   type: string
 *                 endereco:
 *                   type: string
 *                 telefone:
 *                   type: string
 *                 email:
 *                   type: string
 *                 profissao:
 *                   type: string
 *                 data_de_nascimento:
 *                   type: string
 *                   format: date
 *       404:
 *         description: Cliente não encontrado
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
 *         description: CPF do cliente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               sexo:
 *                 type: string
 *                 enum: [Masculino, Feminino]
 *               endereco:
 *                 type: string
 *               telefone:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               profissao:
 *                 type: string
 *               data_de_nascimento:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Cliente atualizado com sucesso
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Cliente não encontrado
 */
router.put('/:cpf', ClienteApiController.update);

/**
 * @swagger
 * /clientes/{cpf}:
 *   delete:
 *     summary: Excluir cliente
 *     tags: [Clientes]
 *     parameters:
 *       - in: path
 *         name: cpf
 *         required: true
 *         schema:
 *           type: string
 *         description: CPF do cliente
 *     responses:
 *       200:
 *         description: Cliente excluído com sucesso
 *       404:
 *         description: Cliente não encontrado
 */
router.delete('/:cpf', ClienteApiController.delete);

module.exports = router;