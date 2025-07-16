const express = require('express');
const router = express.Router();
const OrdemServicoApiController = require('../controllers/ordemServicoApiController');
const { authorizeRoles } = require('../controllers/usuarioApiController');

/**
 * @swagger
 * tags:
 *   name: Ordens de Serviço
 *   description: Gerenciamento de ordens de serviço
 */

/**
 * @swagger
 * /ordens:
 *   post:
 *     summary: Criar nova ordem de serviço
 *     tags: [Ordens de Serviço]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - titulo
 *               - data
 *               - descricao
 *               - status
 *               - cliente_cpf
 *               - motocicleta_placa
 *             properties:
 *               titulo:
 *                 type: string
 *                 description: Título da ordem de serviço
 *               data:
 *                 type: string
 *                 format: date
 *                 description: Data da ordem de serviço (DD/MM/YYYY)
 *               descricao:
 *                 type: string
 *                 description: Descrição detalhada do serviço
 *               status:
 *                 type: string
 *                 description: Status atual da ordem de serviço
 *               observacao:
 *                 type: string
 *                 description: Observações adicionais
 *               valor:
 *                 type: number
 *                 format: float
 *                 description: Valor total da ordem de serviço
 *               valor_mao_de_obra:
 *                 type: number
 *                 format: float
 *                 description: Valor da mão de obra
 *               cliente_cpf:
 *                 type: string
 *                 description: CPF do cliente
 *               motocicleta_placa:
 *                 type: string
 *                 description: Placa da motocicleta
 *     responses:
 *       201:
 *         description: Ordem de serviço criada com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 */
router.post('/', authorizeRoles('Administrador', 'Secretária', 'Mecânico'), OrdemServicoApiController.create);

/**
 * @swagger
 * /ordens:
 *   get:
 *     summary: Listar todas as ordens de serviço
 *     tags: [Ordens de Serviço]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de ordens de serviço
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   cod:
 *                     type: integer
 *                   titulo:
 *                     type: string
 *                   data:
 *                     type: string
 *                     format: date
 *                   descricao:
 *                     type: string
 *                   status:
 *                     type: string
 *                   observacao:
 *                     type: string
 *                   valor:
 *                     type: number
 *                   valor_mao_de_obra:
 *                     type: number
 *                   validada:
 *                     type: boolean
 *                   cliente_cpf:
 *                     type: string
 *                   motocicleta_placa:
 *                     type: string
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 */
router.get('/', authorizeRoles('Administrador', 'Secretária', 'Mecânico'), OrdemServicoApiController.findAll);

/**
 * @swagger
 * /ordens/{cod}:
 *   get:
 *     summary: Buscar ordem de serviço por código
 *     tags: [Ordens de Serviço]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cod
 *         required: true
 *         schema:
 *           type: integer
 *         description: Código da ordem de serviço
 *     responses:
 *       200:
 *         description: Ordem de serviço encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cod:
 *                   type: integer
 *                 titulo:
 *                   type: string
 *                 data:
 *                   type: string
 *                   format: date
 *                 descricao:
 *                   type: string
 *                 status:
 *                   type: string
 *                 observacao:
 *                   type: string
 *                 valor:
 *                   type: number
 *                 valor_mao_de_obra:
 *                   type: number
 *                 validada:
 *                   type: boolean
 *                 cliente_cpf:
 *                   type: string
 *                 motocicleta_placa:
 *                   type: string
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 *       404:
 *         description: Ordem de serviço não encontrada
 */
router.get('/:cod', authorizeRoles('Administrador', 'Secretária', 'Mecânico'), OrdemServicoApiController.findOne);

/**
 * @swagger
 * /ordens/{cod}:
 *   put:
 *     summary: Atualizar ordem de serviço
 *     tags: [Ordens de Serviço]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cod
 *         required: true
 *         schema:
 *           type: integer
 *         description: Código da ordem de serviço
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               titulo:
 *                 type: string
 *               data:
 *                 type: string
 *                 format: date
 *               descricao:
 *                 type: string
 *               status:
 *                 type: string
 *               observacao:
 *                 type: string
 *               valor:
 *                 type: number
 *               valor_mao_de_obra:
 *                 type: number
 *               validada:
 *                 type: boolean
 *               cliente_cpf:
 *                 type: string
 *               motocicleta_placa:
 *                 type: string
 *     responses:
 *       200:
 *         description: Ordem de serviço atualizada com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 *       404:
 *         description: Ordem de serviço não encontrada
 */
router.put('/:cod', authorizeRoles('Administrador', 'Secretária', 'Mecânico'), OrdemServicoApiController.update);

/**
 * @swagger
 * /ordens/{cod}:
 *   delete:
 *     summary: Excluir ordem de serviço
 *     tags: [Ordens de Serviço]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cod
 *         required: true
 *         schema:
 *           type: integer
 *         description: Código da ordem de serviço
 *     responses:
 *       200:
 *         description: Ordem de serviço excluída com sucesso
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 *       404:
 *         description: Ordem de serviço não encontrada
 */
router.delete('/:cod', authorizeRoles('Administrador', 'Secretária', 'Mecânico'), OrdemServicoApiController.delete);

module.exports = router; 