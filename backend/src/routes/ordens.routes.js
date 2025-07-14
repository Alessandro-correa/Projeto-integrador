const express = require('express');
const router = express.Router();
const OrdemServicoApiController = require('../controllers/OrdemServicoApiController');

// Rotas para ordens de serviço
router.post('/', OrdemServicoApiController.create);                  
router.get('/', OrdemServicoApiController.findAll);                  
router.get('/status/:status', OrdemServicoApiController.findByStatus);
router.get('/:id', OrdemServicoApiController.findOne);
router.post('/pecas', OrdemServicoApiController.addPeca);
router.get('/:id/pecas', OrdemServicoApiController.findPecas);
router.get('/:id/valor-total', OrdemServicoApiController.calcularValorTotal);
router.put('/:id', OrdemServicoApiController.update);
router.patch('/:id/status', OrdemServicoApiController.updateStatus);               
router.delete('/:id', OrdemServicoApiController.delete);               

module.exports = router; 