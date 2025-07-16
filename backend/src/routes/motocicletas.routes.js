const express = require('express');
const router = express.Router();
const MotocicletaApiController = require('../controllers/motocicletaApiController');

/**
 * @swagger
 * tags:
 *   name: Motocicletas
 *   description: Gerenciamento de motocicletas
 */

/**
 * @swagger
 * /motocicletas:
 *   post:
 *     summary: Criar nova motocicleta
 *     tags: [Motocicletas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - placa
 *               - ano
 *               - cor
 *               - modelo
 *               - cilindrada
 *               - cliente_cpf
 *               - marca_id
 *             properties:
 *               placa:
 *                 type: string
 *                 description: Placa da motocicleta
 *               ano:
 *                 type: integer
 *                 description: Ano de fabricação
 *               cor:
 *                 type: string
 *                 description: Cor da motocicleta
 *               modelo:
 *                 type: string
 *                 description: Modelo da motocicleta
 *               cilindrada:
 *                 type: integer
 *                 description: Cilindrada da motocicleta
 *               cliente_cpf:
 *                 type: string
 *                 description: CPF do proprietário
 *               marca_id:
 *                 type: integer
 *                 description: ID da marca da motocicleta
 *     responses:
 *       201:
 *         description: Motocicleta criada com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post('/', MotocicletaApiController.create);

/**
 * @swagger
 * /motocicletas:
 *   get:
 *     summary: Listar todas as motocicletas
 *     tags: [Motocicletas]
 *     responses:
 *       200:
 *         description: Lista de motocicletas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   placa:
 *                     type: string
 *                   ano:
 *                     type: integer
 *                   cor:
 *                     type: string
 *                   modelo:
 *                     type: string
 *                   cilindrada:
 *                     type: integer
 *                   cliente_cpf:
 *                     type: string
 *                   marca_id:
 *                     type: integer
 */
router.get('/', MotocicletaApiController.findAll);

/**
 * @swagger
 * /motocicletas/{placa}:
 *   get:
 *     summary: Buscar motocicleta por placa
 *     tags: [Motocicletas]
 *     parameters:
 *       - in: path
 *         name: placa
 *         required: true
 *         schema:
 *           type: string
 *         description: Placa da motocicleta
 *     responses:
 *       200:
 *         description: Motocicleta encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 placa:
 *                   type: string
 *                 ano:
 *                   type: integer
 *                 cor:
 *                   type: string
 *                 modelo:
 *                   type: string
 *                 cilindrada:
 *                   type: integer
 *                 cliente_cpf:
 *                   type: string
 *                 marca_id:
 *                   type: integer
 *       404:
 *         description: Motocicleta não encontrada
 */
router.get('/:placa', MotocicletaApiController.findOne);

/**
 * @swagger
 * /motocicletas/{placa}:
 *   put:
 *     summary: Atualizar motocicleta
 *     tags: [Motocicletas]
 *     parameters:
 *       - in: path
 *         name: placa
 *         required: true
 *         schema:
 *           type: string
 *         description: Placa da motocicleta
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ano:
 *                 type: integer
 *               cor:
 *                 type: string
 *               modelo:
 *                 type: string
 *               cilindrada:
 *                 type: integer
 *               cliente_cpf:
 *                 type: string
 *               marca_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Motocicleta atualizada com sucesso
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Motocicleta não encontrada
 */
router.put('/:placa', MotocicletaApiController.update);

/**
 * @swagger
 * /motocicletas/{placa}:
 *   delete:
 *     summary: Excluir motocicleta
 *     tags: [Motocicletas]
 *     parameters:
 *       - in: path
 *         name: placa
 *         required: true
 *         schema:
 *           type: string
 *         description: Placa da motocicleta
 *     responses:
 *       200:
 *         description: Motocicleta excluída com sucesso
 *       404:
 *         description: Motocicleta não encontrada
 */
router.delete('/:placa', MotocicletaApiController.delete);

module.exports = router; 
