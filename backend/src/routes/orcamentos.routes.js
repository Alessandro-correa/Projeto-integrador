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
// Rotas principais
router.post('/', authorizeRoles('Administrador', 'Secretária', 'Mecânico'), (req, res) => OrcamentoApiController.create(req, res));
router.get('/', authorizeRoles('Administrador', 'Secretária', 'Mecânico'), (req, res) => OrcamentoApiController.findAll(req, res));
router.get('/:id', authorizeRoles('Administrador', 'Secretária', 'Mecânico'), (req, res) => OrcamentoApiController.findOne(req, res));
router.put('/:id', authorizeRoles('Administrador', 'Secretária', 'Mecânico'), (req, res) => OrcamentoApiController.update(req, res));
router.delete('/:id', authorizeRoles('Administrador', 'Secretária', 'Mecânico'), (req, res) => OrcamentoApiController.delete(req, res));

/**
 * @swagger
 * /orcamentos/{id}/validar:
 *   post:
 *     summary: Validar orçamento e criar ordem de serviço
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
 *         description: Orçamento validado com sucesso
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 *       404:
 *         description: Orçamento não encontrado
 */
// Rotas de validação e rejeição
router.post('/:id/validar', authorizeRoles('Administrador', 'Secretária'), (req, res) => OrcamentoApiController.validar(req, res));

/**
 * @swagger
 * /orcamentos/{id}/rejeitar:
 *   post:
 *     summary: Rejeitar orçamento
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
 *             required:
 *               - motivo
 *             properties:
 *               motivo:
 *                 type: string
 *                 description: Motivo da rejeição
 *               observacao:
 *                 type: string
 *                 description: Observações adicionais
 *     responses:
 *       200:
 *         description: Orçamento rejeitado com sucesso
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 *       404:
 *         description: Orçamento não encontrado
 */
router.post('/:id/rejeitar', authorizeRoles('Administrador', 'Secretária'), (req, res) => OrcamentoApiController.rejeitar(req, res));

module.exports = router; 