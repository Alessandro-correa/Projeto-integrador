const express = require('express');
const router = express.Router();
const MotocicletaApiController = require('../controllers/motocicletaApiController');

// Rotas para motocicletas
router.post('/', MotocicletaApiController.create);                    
router.get('/', MotocicletaApiController.findAll);                    
router.get('/cliente/:clienteCpf', MotocicletaApiController.findByCliente); 
router.get('/:placa', MotocicletaApiController.findOne);             
router.put('/:placa', MotocicletaApiController.update);               
router.delete('/:placa', MotocicletaApiController.delete);         
   
module.exports = router; 
