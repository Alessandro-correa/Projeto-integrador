/**
 * SERVIDOR PRINCIPAL - OFICINA MOTOCICLETAS
 * Estrutura MVC organizada com separação clara entre backend e frontend
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Importar rotas com novos nomes
const clienteRoutes = require('./src/routes/clientes.routes');
const usuarioRoutes = require('./src/routes/usuarios.routes');
const ordemRoutes = require('./src/routes/ordens.routes');
const orcamentoRoutes = require('./src/routes/orcamentos.routes');
const motocicletaRoutes = require('./src/routes/motocicletas.routes');
const aquisicaoRoutes = require('./src/routes/aquisicoes.routes');
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
app.use('/api/aquisicoes', aquisicaoRoutes);
app.use('/api/pecas', pecaRoutes);
app.use('/api/fornecedores', fornecedorRoutes);
app.use('/api/marcas', marcaRoutes);
app.use('/api/dashboard', dashboardRoutes);

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
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📱 Frontend disponível em: http://localhost:${PORT}`);
    console.log(`🔌 API disponível em: http://localhost:${PORT}/api`);
    console.log(`📊 Dashboard: http://localhost:${PORT}/views/dashboard/index.html`);
});

module.exports = app;
