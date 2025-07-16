/**
 * SERVIDOR PRINCIPAL - OFICINA MOTOCICLETAS
 * Estrutura MVC organizada com separação clara entre backend e frontend
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Log para debug da configuração
console.log('JWT_SECRET configurado:', process.env.JWT_SECRET ? 'Sim' : 'Não');

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const swaggerUi = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');

// Configuração do Swagger
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Oficina Motocicletas API',
    version: '1.0.0',
    description: 'Documentação da API do sistema Oficina Motocicletas',
  },
  servers: [
    {
      url: 'http://localhost:3000/api',
      description: 'Servidor local',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [{ bearerAuth: [] }],
};

const options = {
  swaggerDefinition,
  apis: ['./src/routes/*.js', './src/controllers/*.js'],
};
const swaggerSpec = swaggerJSDoc(options);

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Middleware global de autenticação JWT para rotas /api (exceto login)
app.use('/api', (req, res, next) => {
    console.log(`[AUTH] Rota acessada: ${req.method} ${req.path}`);
    
    if (req.path === '/usuarios/login') {
        console.log('[AUTH] Rota de login - pulando autenticação');
        return next();
    }

    const authHeader = req.headers.authorization;
    console.log('[AUTH] Header de autorização:', authHeader ? 'Presente' : 'Ausente');

    if (!authHeader) {
        console.log('[AUTH] Token não fornecido');
        return res.status(401).json({ message: 'Token não fornecido' });
    }

    const token = authHeader.split(' ')[1];
    console.log('[AUTH] Token extraído:', token ? 'Presente' : 'Ausente');

    try {
        console.log('[AUTH] Tentando verificar token com JWT_SECRET:', process.env.JWT_SECRET ? 'Configurado' : 'Não configurado');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('[AUTH] Token decodificado:', decoded);
        req.user = decoded;
        next();
    } catch (err) {
        console.error('[AUTH] Erro ao verificar token:', err.message);
        return res.status(401).json({ message: 'Token inválido', error: err.message });
    }
});

// Importar rotas com novos nomes
const clienteRoutes = require('./src/routes/clientes.routes');
const usuarioRoutes = require('./src/routes/usuarios.routes');
const ordemRoutes = require('./src/routes/ordens.routes');
const orcamentoRoutes = require('./src/routes/orcamentos.routes');
const motocicletaRoutes = require('./src/routes/motocicletas.routes');
const pecaRoutes = require('./src/routes/pecas.routes');
const fornecedorRoutes = require('./src/routes/fornecedores.routes');
const marcaRoutes = require('./src/routes/marcas.routes');
const dashboardRoutes = require('./src/routes/dashboard.routes');

// Configurar rotas da API
app.use('/api/clientes', clienteRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/ordens', ordemRoutes);
app.use('/api/orcamentos', orcamentoRoutes);
app.use('/api/motocicletas', motocicletaRoutes);
app.use('/api/pecas', pecaRoutes);
app.use('/api/fornecedores', fornecedorRoutes);
app.use('/api/marcas', marcaRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rota para servir a página principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/views/dashboard/index.html'));
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
    console.error('Erro não tratado:', err);
    res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado'
    });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Rota não encontrada'
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Login disponível em: http://localhost:${PORT}/views/login/login.html`);
});

module.exports = app;
