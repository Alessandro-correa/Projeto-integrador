const express = require('express');
const router = express.Router();
const MotocicletaController = require('../controllers/motocicleta.controller');

// Rotas para motocicletas
router.post('/', MotocicletaController.create);                    
router.get('/', MotocicletaController.findAll);                    
router.get('/cliente/:clienteCpf', MotocicletaController.findByCliente); 
router.get('/:placa', MotocicletaController.findOne);             
router.put('/:placa', MotocicletaController.update);               
router.delete('/:placa', MotocicletaController.delete);         
   
module.exports = router; 