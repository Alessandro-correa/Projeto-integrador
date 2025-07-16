const express = require('express');
const router = express.Router();
const OrcamentoApiController = require('../controllers/orcamentoApiController');
const { authorizeRoles } = require('../controllers/usuarioApiController');

/**
 * @swagger
 * tags:
 *   name: Orçamentos
 *   description: Gerenciamento de orçamentos
 */

/**
 * @swagger
 * /orcamentos:
 *   post:
 *     summary: Criar novo orçamento
 *     tags: [Orçamentos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - valor
 *               - validade
 *               - cliente_cpf
 *             properties:
 *               valor:
 *                 type: number
 *                 format: float
 *                 description: Valor total do orçamento
 *               validade:
 *                 type: string
 *                 format: date
 *                 description: Data de validade do orçamento (DD/MM/YYYY)
 *               status:
 *                 type: string
 *                 enum: [P, A, R]
 *                 description: Status do orçamento (P=Pendente, A=Aprovado, R=Rejeitado)
 *               descricao:
 *                 type: string
 *                 description: Descrição detalhada do orçamento
 *               ordem_servico_cod:
 *                 type: integer
 *                 description: Código da ordem de serviço relacionada
 *               cliente_cpf:
 *                 type: string
 *                 description: CPF do cliente
 *     responses:
 *       201:
 *         description: Orçamento criado com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 */
router.post('/', authorizeRoles('Administrador', 'Secretária', 'Mecânico'), OrcamentoApiController.create);

/**
 * @swagger
 * /orcamentos:
 *   get:
 *     summary: Listar todos os orçamentos
 *     tags: [Orçamentos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de orçamentos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   valor:
 *                     type: number
 *                   validade:
 *                     type: string
 *                     format: date
 *                   status:
 *                     type: string
 *                   descricao:
 *                     type: string
 *                   ordem_servico_cod:
 *                     type: integer
 *                   cliente_cpf:
 *                     type: string
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 */
router.get('/', authorizeRoles('Administrador', 'Secretária', 'Mecânico'), OrcamentoApiController.findAll);

/**
 * @swagger
 * /orcamentos/{id}:
 *   get:
 *     summary: Buscar orçamento por ID
 *     tags: [Orçamentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do orçamento
 *     responses:
 *       200:
 *         description: Orçamento encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 valor:
 *                   type: number
 *                 validade:
 *                   type: string
 *                   format: date
 *                 status:
 *                   type: string
 *                 descricao:
 *                   type: string
 *                 ordem_servico_cod:
 *                   type: integer
 *                 cliente_cpf:
 *                   type: string
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 *       404:
 *         description: Orçamento não encontrado
 */
router.get('/:id', authorizeRoles('Administrador', 'Secretária', 'Mecânico'), OrcamentoApiController.findOne);

/**
 * @swagger
 * /orcamentos/{id}:
 *   put:
 *     summary: Atualizar orçamento
 *     tags: [Orçamentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do orçamento
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               valor:
 *                 type: number
 *                 format: float
 *               validade:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *                 enum: [P, A, R]
 *               descricao:
 *                 type: string
 *               ordem_servico_cod:
 *                 type: integer
 *               cliente_cpf:
 *                 type: string
 *     responses:
 *       200:
 *         description: Orçamento atualizado com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 *       404:
 *         description: Orçamento não encontrado
 */
router.put('/:id', authorizeRoles('Administrador', 'Secretária', 'Mecânico'), OrcamentoApiController.update);

/**
 * @swagger
 * /orcamentos/{id}:
 *   delete:
 *     summary: Excluir orçamento
 *     tags: [Orçamentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do orçamento
 *     responses:
 *       200:
 *         description: Orçamento excluído com sucesso
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 *       404:
 *         description: Orçamento não encontrado
 */
router.delete('/:id', authorizeRoles('Administrador', 'Secretária', 'Mecânico'), OrcamentoApiController.delete);

module.exports = router; 