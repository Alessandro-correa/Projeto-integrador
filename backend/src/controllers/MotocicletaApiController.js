
const db = require('../config/database');

class MotocicletaApiController {
  // Criar motocicleta
  async create(req, res) {
    try {
      let { placa, ano, cor, modelo, cilindrada, clienteCpf, marca_id } = req.body;
      placa = placa.toUpperCase().replace(/[^A-Z0-9]/g, '');

      if (!placa || !ano || !cor || !modelo || !cilindrada || !clienteCpf || !marca_id) {
        return res.status(400).json({
          success: false,
          message: 'Todos os campos são obrigatórios'
        });
      }

      // Validar formato do CPF
      const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
      if (!cpfRegex.test(clienteCpf)) {
        return res.status(400).json({
          success: false,
          message: 'Formato de CPF inválido. Use o formato: XXX.XXX.XXX-XX'
        });
      }

      // Validar ano
      const anoAtual = new Date().getFullYear();
      if (ano < 1900 || ano > (anoAtual + 1)) {
        return res.status(400).json({
          success: false,
          message: 'Ano inválido. Use um ano entre 1900 e ' + (anoAtual + 1)
        });
      }

      // Verificar se cliente existe
      const cliente = await db.oneOrNone('SELECT cpf FROM Cliente WHERE cpf = $1', [clienteCpf]);
      if (!cliente) {
        return res.status(404).json({
          success: false,
          message: 'Cliente não encontrado'
        });
      }

      const query = `
        INSERT INTO Motocicleta (placa, ano, cor, modelo, cilindrada, cliente_cpf, marca_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const novaMotocicleta = await db.one(query, [placa, ano, cor, modelo, cilindrada, clienteCpf, marca_id]);

      res.status(201).json({
        success: true,
        message: 'Motocicleta criada com sucesso',
        data: novaMotocicleta
      });

    } catch (error) {
      console.error('Erro ao criar motocicleta:', error, JSON.stringify(error));
      if (error.code === '23505' || (error.message && error.message.includes('duplicate key'))) {
        return res.status(409).json({
          success: false,
          message: 'Já existe uma motocicleta cadastrada com esta placa.'
        });
      }
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  // Listar todas as motocicletas
  async findAll(req, res) {
    try {
      const { cliente_cpf } = req.query;
      
      let query = `
        SELECT 
          m.placa,
          m.ano,
          m.cor,
          m.modelo,
          m.cilindrada,
          m.cliente_cpf,
          m.marca_id,
          c.nome AS cliente_nome,
          ma.nome AS marca_nome
        FROM Motocicleta m
        LEFT JOIN Cliente c ON m.cliente_cpf = c.cpf
        LEFT JOIN Marca ma ON m.marca_id = ma.id
      `;
      
      let queryParams = [];
      
      if (cliente_cpf) {
        query += ` WHERE m.cliente_cpf = $1`;
        queryParams.push(cliente_cpf);
      }
      
      query += ` ORDER BY m.placa`;
      
      const motocicletas = await db.any(query, queryParams);
      
      res.json({
        success: true,
        data: motocicletas,
        count: motocicletas.length
      });

    } catch (error) {
      console.error('Erro ao listar motocicletas:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  // Buscar motocicleta por placa
  async findOne(req, res) {
    try {
      const { placa } = req.params;

      const motocicleta = await db.oneOrNone(`
        SELECT 
          m.*,
          ma.nome as marca_nome,
          ma.id as marca_id
        FROM Motocicleta m
        LEFT JOIN Marca ma ON m.marca_id = ma.id
        WHERE m.placa = $1
      `, [placa]);

      if (!motocicleta) {
        return res.status(404).json({
          success: false,
          message: 'Motocicleta não encontrada'
        });
      }

      res.json({
        success: true,
        data: motocicleta
      });

    } catch (error) {
      console.error('Erro ao buscar motocicleta:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  // Atualizar motocicleta
  async update(req, res) {
    try {
      const { placa } = req.params;
      const { ano, cor, modelo, cilindrada, clienteCpf, marca_id } = req.body;

      const existingMotocicleta = await db.oneOrNone('SELECT * FROM Motocicleta WHERE placa = $1', [placa]);
      if (!existingMotocicleta) {
        return res.status(404).json({
          success: false,
          message: 'Motocicleta não encontrada'
        });
      }

      const query = `
        UPDATE Motocicleta 
        SET ano = $1, cor = $2, modelo = $3, cilindrada = $4, cliente_cpf = $5, marca_id = $6
        WHERE placa = $7
        RETURNING *
      `;

      const motocicletaAtualizada = await db.one(query, [ano, cor, modelo, cilindrada, clienteCpf, marca_id, placa]);

      res.json({
        success: true,
        message: 'Motocicleta atualizada com sucesso',
        data: motocicletaAtualizada
      });

    } catch (error) {
      console.error('Erro ao atualizar motocicleta:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  // Remover motocicleta
  async delete(req, res) {
    try {
      let { placa } = req.params;
      placa = placa.toUpperCase().replace(/[^A-Z0-9]/g, '');

      const motocicletas = await db.any('SELECT * FROM Motocicleta');
      const existingMotocicleta = motocicletas.find(m => m.placa.toUpperCase().replace(/[^A-Z0-9]/g, '') === placa);
      if (!existingMotocicleta) {
        return res.status(404).json({
          success: false,
          message: 'Motocicleta não encontrada'
        });
      }

      await db.none('DELETE FROM Motocicleta WHERE placa = $1', [existingMotocicleta.placa]);

      res.json({
        success: true,
        message: 'Motocicleta removida com sucesso'
      });

    } catch (error) {
      console.error('Erro ao remover motocicleta:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  // Buscar motocicletas por cliente
  async findByCliente(req, res) {
    try {
      const { cpf } = req.params;

      // Verificar se cliente existe
      const cliente = await db.oneOrNone('SELECT cpf FROM Cliente WHERE cpf = $1', [cpf]);
      if (!cliente) {
        return res.status(404).json({
          success: false,
          message: 'Cliente não encontrado'
        });
      }

      // Buscar todas as motocicletas do cliente
      const motocicletas = await db.any(`
        SELECT 
          m.placa,
          m.ano,
          m.cor,
          m.modelo,
          m.cilindrada,
          m.cliente_cpf,
          ma.nome as marca_nome,
          ma.id as marca_id
        FROM Motocicleta m
        LEFT JOIN Marca ma ON m.marca_id = ma.id
        WHERE m.cliente_cpf = $1
        ORDER BY m.placa
      `, [cpf]);

      res.json({
        success: true,
        data: motocicletas,
        count: motocicletas.length
      });

    } catch (error) {
      console.error('Erro ao buscar motocicletas do cliente:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  // Exemplo de método corrigido para listar marcas e modelo de exemplo
  async listarMarcasComModelo(req, res) {
    try {
      const marcas = await db.any(`
        SELECT m.id, m.nome, MIN(moto.modelo) AS modelo_exemplo
        FROM Marca m
        LEFT JOIN Motocicleta moto ON moto.marca_id = m.id
        GROUP BY m.id, m.nome
        ORDER BY m.nome
      `);
      res.json({ success: true, data: marcas });
    } catch (error) {
      console.error('Erro ao listar marcas com modelo:', error);
      res.status(500).json({ success: false, message: 'Erro ao listar marcas com modelo' });
    }
  }
}

module.exports = new MotocicletaApiController(); 