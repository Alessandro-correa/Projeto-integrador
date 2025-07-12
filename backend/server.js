require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const db = require('./config/db'); 

// Importar rotas
const usuariosRoutes = require('./routes/usuarios.routes');
const clientesRoutes = require('./routes/clientes.routes');
const ordensRoutes = require('./routes/ordens.routes');
const orcamentosRoutes = require('./routes/orcamentos.routes');
const motocicletasRoutes = require('./routes/motocicletas.routes');
const marcasRoutes = require('./routes/marcas.routes');
const pecasRoutes = require('./routes/pecas.routes');
const fornecedoresRoutes = require('./routes/fornecedores.routes');
const aquisicoesRoutes = require('./routes/aquisicoes.routes');

const app = express();
const PORT = process.env.PORT || 3000;

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100 
});


// Middlewares
app.use(helmet());
app.use(limiter);
app.use(cors({
  origin: [
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:3000',
    'http://localhost:5501',
    'http://127.0.0.1:5501'
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get('/', (req, res) => {
  res.json({
    message: 'API da Oficina de Motocicletas',
    version: '1.0.0',
    status: 'online'
  });
});

// Rotas da API
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/ordens', ordensRoutes);
app.use('/api/orcamentos', orcamentosRoutes);
app.use('/api/motocicletas', motocicletasRoutes);
app.use('/api/marcas', marcasRoutes);
app.use('/api/pecas', pecasRoutes);
app.use('/api/fornecedores', fornecedoresRoutes);
app.use('/api/aquisicoes', aquisicoesRoutes);

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada'
  });
});

// Testa conexão com o banco antes de iniciar o servidor
db.one('SELECT 1')
  .then(() => {
    console.log('Conexão com banco de dados bem sucedida');
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
      console.log('Ambiente:', process.env.NODE_ENV || 'não definido');
      console.log('✅ Nodemon funcionando - alterações detectadas automaticamente!');
    });
  })
  .catch(error => {
    console.error('Falha na conexão com o banco:', error);
    process.exit(1); 
  });
