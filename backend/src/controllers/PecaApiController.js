const db = require('../config/database');

console.log('[PecaApiController] Iniciando definição do controller');

class PecaApiController {
  constructor() {
    console.log('[PecaApiController] Construtor iniciado');
    
    // Bind all methods to the instance
    const methods = ['create', 'findAll', 'findOne', 'update', 'delete', 'findByFornecedor'];
    methods.forEach(method => {
      if (typeof this[method] === 'function') {
        console.log(`[PecaApiController] Vinculando método ${method}`);
        this[method] = this[method].bind(this);
        console.log(`[PecaApiController] Método ${method} vinculado com sucesso`);
      } else {
        console.error(`[PecaApiController] ERRO: Método ${method} não encontrado na classe`);
      }
    });
  }

  async create(req, res) {
    try {
      const { descricao, nome, valor, fornecedor } = req.body;

      if (!descricao || !nome || !valor || !fornecedor) {
        return res.status(400).json({
          success: false,
          message: 'Descrição, nome, valor e fornecedor são obrigatórios'
        });
      }

      const query = `
        INSERT INTO Peca (descricao, nome, valor, forn_id)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;

      const novaPeca = await db.one(query, [descricao, nome, valor, fornecedor]);

      res.status(201).json({
        success: true,
        message: 'Peça criada com sucesso',
        data: novaPeca
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  async findAll(req, res) {
    try {
      const pecas = await db.any(`
        SELECT 
          p.id, 
          p.nome, 
          p.descricao, 
          p.valor, 
          f.nome AS fornecedor
        FROM Peca p
        LEFT JOIN Fornecedor f ON p.forn_id = f.id
        ORDER BY p.nome ASC
      `);

      res.json({
        success: true,
        data: pecas,
        count: pecas.length
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  async findOne(req, res) {
    try {
      const { id } = req.params;

      const query = `
        SELECT 
          p.id, 
          p.nome, 
          p.descricao, 
          p.valor, 
          f.nome AS fornecedor
        FROM Peca p
        LEFT JOIN Fornecedor f ON p.forn_id = f.id
        WHERE p.id = $1
      `;

      const peca = await db.oneOrNone(query, [id]);

      if (!peca) {
        return res.status(404).json({
          success: false,
          message: 'Peça não encontrada'
        });
      }

      res.json({
        success: true,
        data: peca
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const { descricao, nome, valor, fornecedor } = req.body;

      const existingPeca = await db.oneOrNone('SELECT * FROM Peca WHERE id = $1', [id]);
      if (!existingPeca) {
        return res.status(404).json({
          success: false,
          message: 'Peça não encontrada'
        });
      }

      const query = `
        UPDATE Peca 
        SET descricao = $1, nome = $2, valor = $3, forn_id = $4
        WHERE id = $5
        RETURNING *
      `;

      const pecaAtualizada = await db.one(query, [descricao, nome, valor, fornecedor, id]);

      res.json({
        success: true,
        message: 'Peça atualizada com sucesso',
        data: pecaAtualizada
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;

      const existingPeca = await db.oneOrNone('SELECT * FROM Peca WHERE id = $1', [id]);
      if (!existingPeca) {
        return res.status(404).json({
          success: false,
          message: 'Peça não encontrada'
        });
      }

      await db.none('DELETE FROM Peca WHERE id = $1', [id]);

      res.json({
        success: true,
        message: 'Peça removida com sucesso'
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  async findByFornecedor(req, res) {
    console.log('[PecaApiController] Iniciando findByFornecedor');
    try {
      const { fornecedorId } = req.params;
      console.log(`[PecaApiController] Buscando peças do fornecedor ${fornecedorId}`);

      if (!fornecedorId) {
        console.error('[PecaApiController] ID do fornecedor não fornecido');
        return res.status(400).json({
          success: false,
          message: 'ID do fornecedor é obrigatório'
        });
      }

      const query = `
        SELECT 
          p.id, 
          p.nome, 
          p.descricao, 
          CAST(p.valor AS FLOAT) as valor,
          f.nome AS fornecedor,
          f.id AS fornecedor_id
        FROM Peca p
        LEFT JOIN Fornecedor f ON p.forn_id = f.id
        WHERE p.forn_id = $1
        ORDER BY p.nome ASC
      `;

      console.log('[PecaApiController] Executando query:', query);
      console.log('[PecaApiController] Parâmetros:', [fornecedorId]);
      
      const pecas = await db.any(query, [fornecedorId]);
      console.log(`[PecaApiController] Encontradas ${pecas.length} peças`);

      // Garantir que o valor é um número
      const pecasProcessadas = pecas.map(p => ({
        ...p,
        valor: parseFloat(p.valor) || 0
      }));

      res.json({
        success: true,
        data: pecasProcessadas,
        count: pecasProcessadas.length
      });

    } catch (error) {
      console.error('[PecaApiController] Erro em findByFornecedor:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }
}

// Criar e exportar uma única instância
console.log('[PecaApiController] Criando instância do controller');
const controller = new PecaApiController();

// Verificar se todos os métodos estão presentes na instância
const methods = ['create', 'findAll', 'findOne', 'update', 'delete', 'findByFornecedor'];
console.log('[PecaApiController] Verificando métodos da instância:');
methods.forEach(method => {
  console.log(`[PecaApiController] - ${method}: ${typeof controller[method]}`);
  if (typeof controller[method] !== 'function') {
    console.error(`[PecaApiController] ERRO: Método ${method} não está disponível na instância`);
  }
});

module.exports = controller; 